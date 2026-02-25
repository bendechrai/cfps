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

    // Filter and prepare valid entries
    const validCfps = cfps.filter((cfp) => {
      if (!cfp.cfpEndDate || !cfp.eventStartDate) {
        skipCount++;
        return false;
      }
      const cfpEnd = new Date(cfp.cfpEndDate);
      const eventStart = new Date(cfp.eventStartDate);
      if (isNaN(cfpEnd.getTime()) || isNaN(eventStart.getTime())) {
        skipCount++;
        return false;
      }
      return true;
    });

    // Process in batches of 50 concurrent upserts
    const BATCH_SIZE = 50;
    for (let i = 0; i < validCfps.length; i += BATCH_SIZE) {
      const batch = validCfps.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map((cfp) => {
        const cfpEnd = new Date(cfp.cfpEndDate);
        const eventStart = new Date(cfp.eventStartDate);
        let eventEnd = cfp.eventEndDate ? new Date(cfp.eventEndDate) : eventStart;
        if (isNaN(eventEnd.getTime())) eventEnd = eventStart;

        return prisma.event.upsert({
          where: {
            source_sourceId: { source, sourceId: cfp.id },
          },
          update: {
            name: cfp.name,
            cfpUrl: cfp.cfpUrl,
            eventUrl: cfp.eventUrl,
            cfpEndDate: cfpEnd,
            eventStartDate: eventStart,
            eventEndDate: eventEnd,
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
            cfpEndDate: cfpEnd,
            eventStartDate: eventStart,
            eventEndDate: eventEnd,
            location: cfp.location,
            status: cfp.status,
            tags: cfp.tags || [],
          },
        });
      }));
      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          skipCount++;
        }
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
    // Only consider sources that are still configured
    const staleCache = await prisma.cFPCache.findFirst({
      where: {
        source: { in: allSources },
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
