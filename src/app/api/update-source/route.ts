import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { CFPService } from '@/services/cfp/cfp.service';

export const maxDuration = 60; // This function can run for a maximum of 30 seconds

async function processSource(source: string, cfpService: CFPService) {
  try {
    // Get the source data
    const sourceInstance = cfpService.getSourceByName(source);
    
    if (!sourceInstance) {
      throw new Error(`Source ${source} not found`);
    }

    // Fetch and transform the data
    console.log(`Fetching data for source: ${source}`);
    const rawData = await sourceInstance.fetchRawData();
    if (!rawData) {
      throw new Error(`No data returned from source: ${source}`);
    }

    console.log(`Transforming ${rawData.length} items from source: ${source}`);
    const cfps = sourceInstance.transformRawDataToCFPs(rawData);
    console.log(`Transformed to ${cfps.length} CFPs from source: ${source}`);

    // Create or update cache entry
    await prisma.cFPCache.upsert({
      where: { source },
      create: {
        source,
        rawData: rawData as unknown as Prisma.JsonObject,
        fetchedAt: new Date(),
      },
      update: {
        rawData: rawData as unknown as Prisma.JsonObject,
        fetchedAt: new Date(),
      },
    });

    let successCount = 0;
    let skipCount = 0;

    // Update the events table
    for (const cfp of cfps) {
      try {
        // Skip events with missing required dates
        if (!cfp.cfpEndDate || !cfp.eventStartDate) {
          console.warn('Skipping event with missing required dates:', {
            name: cfp.name,
            source,
            dates: {
              cfpEndDate: cfp.cfpEndDate,
              eventStartDate: cfp.eventStartDate,
            }
          });
          skipCount++;
          continue;
        }

        // Convert timestamps to Date objects
        const dates = {
          cfpEnd: new Date(cfp.cfpEndDate),
          eventStart: new Date(cfp.eventStartDate),
          eventEnd: cfp.eventEndDate ? new Date(cfp.eventEndDate) : new Date(cfp.eventStartDate)
        };

        // Validate dates
        if (isNaN(dates.cfpEnd.getTime()) || isNaN(dates.eventStart.getTime())) {
          console.warn('Skipping event with invalid required dates:', {
            name: cfp.name,
            source,
            dates: {
              cfpEndDate: cfp.cfpEndDate,
              eventStartDate: cfp.eventStartDate,
            }
          });
          skipCount++;
          continue;
        }

        // If eventEnd is invalid, use eventStart (one-day event)
        if (isNaN(dates.eventEnd.getTime())) {
          console.log('Using eventStartDate as eventEndDate for one-day event:', {
            name: cfp.name,
            source,
            eventStartDate: dates.eventStart
          });
          dates.eventEnd = dates.eventStart;
        }

        await prisma.event.upsert({
          where: {
            source_sourceId: {
              source,
              sourceId: cfp.id,
            },
          },
          update: {
            name: cfp.name,
            cfpUrl: cfp.cfpUrl,
            eventUrl: cfp.eventUrl,
            cfpEndDate: dates.cfpEnd,
            eventStartDate: dates.eventStart,
            eventEndDate: dates.eventEnd,
            location: cfp.location,
            status: cfp.status,
            tags: cfp.tags || [],
            updatedAt: new Date(),
          },
          create: {
            sourceId: cfp.id,
            source,
            name: cfp.name,
            cfpUrl: cfp.cfpUrl,
            eventUrl: cfp.eventUrl,
            cfpEndDate: dates.cfpEnd,
            eventStartDate: dates.eventStart,
            eventEndDate: dates.eventEnd,
            location: cfp.location,
            status: cfp.status,
            tags: cfp.tags || [],
          },
        });
        successCount++;
      } catch (error) {
        console.error('Error processing event:', {
          name: cfp.name,
          source,
          error: error instanceof Error ? error.message : 'Unknown error',
          cfp: cfp
        });
        skipCount++;
      }
    }

    return { source, successCount, skipCount };
  } catch (error) {
    console.error('Error in processSource:', {
      source,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export async function GET() {
  try {
    const cfpService = CFPService.getInstance();

    // Get all configured sources
    const allSources = cfpService.sources.map(s => s.getName());

    // Get all cached sources
    const cachedSources = await prisma.cFPCache.findMany({
      select: { source: true }
    });
    const cachedSourceNames = new Set(cachedSources.map(c => c.source));

    // Find uncached sources
    const uncachedSources = allSources.filter(s => !cachedSourceNames.has(s));

    // If there are uncached sources, process the first one
    if (uncachedSources.length > 0) {
      const source = uncachedSources[0];
      console.log(`Processing uncached source: ${source}`);
      const result = await processSource(source, cfpService);
      return NextResponse.json({
        message: `Added new source ${result.source} (${result.successCount} events, ${result.skipCount} skipped)`,
        ...result
      });
    }

    // Otherwise, find a cache entry that needs updating (older than 1 hour)
    const staleCache = await prisma.cFPCache.findFirst({
      where: {
        fetchedAt: {
          lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        },
      },
      orderBy: {
        fetchedAt: 'asc', // Update oldest first
      },
    });

    if (!staleCache) {
      return NextResponse.json({ message: 'No sources need updating' });
    }

    const result = await processSource(staleCache.source, cfpService);
    return NextResponse.json({
      message: `Updated ${result.source} (${result.successCount} events, ${result.skipCount} skipped)`,
      ...result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating source:', { error: errorMessage });
    return NextResponse.json(
      { 
        error: 'Failed to update source', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
