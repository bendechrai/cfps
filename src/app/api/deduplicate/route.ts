import { NextResponse } from "next/server";
import { type Event, type CanonicalEvent, PrismaClient } from "@prisma/client";

export const maxDuration = 60; // This function can run for a maximum of 1 minute

function compareEvents(
  sourceEvent: Event,
  canonicalEvent: CanonicalEvent
): boolean {
  // Let's assume two events with the same URLs run more than a week apart
  if (sourceEvent.cfpEndDate && canonicalEvent.cfpEndDate) {
    const date1 = new Date(sourceEvent.cfpEndDate).getTime();
    const date2 = new Date(canonicalEvent.cfpEndDate).getTime();
    const diffDays = Math.abs(date1 - date2) / (24 * 60 * 60 * 1000);
    if (diffDays >= 7) return false;
  }

  // Compare URLs, treating blank as a match
  const cfpUrl1 = (sourceEvent.cfpUrl || "").toLowerCase().replace(/\/$/, "");
  const cfpUrl2 = (canonicalEvent.cfpUrl || "")
    .toLowerCase()
    .replace(/\/$/, "");
  const eventUrl1 = (sourceEvent.eventUrl || "")
    .toLowerCase()
    .replace(/\/$/, "");
  const eventUrl2 = (canonicalEvent.eventUrl || "")
    .toLowerCase()
    .replace(/\/$/, "");

  // URLs match if either they're the same or one is blank
  const cfpUrlsMatch = !cfpUrl1 || !cfpUrl2 || cfpUrl1 === cfpUrl2;
  const eventUrlsMatch = !eventUrl1 || !eventUrl2 || eventUrl1 === eventUrl2;

  return cfpUrlsMatch && eventUrlsMatch;
}

export async function GET() {
  const prisma = new PrismaClient();

  try {
    // Load all canonical events, ordered by duplicate check fields for deterministic processing
    const canonicalEvents = await prisma.canonicalEvent.findMany({
      orderBy: [{ cfpEndDate: "asc" }, { cfpUrl: "asc" }, { eventUrl: "asc" }],
    });

    // Load all source events, ordered by duplicate check fields for deterministic processing
    const events = await prisma.event.findMany({
      orderBy: [{ cfpEndDate: "asc" }, { cfpUrl: "asc" }, { eventUrl: "asc" }],
    });

    // Loop through each source event
    for (const event of events) {
      let foundMatch = false;

      // Try to find a matching canonical event

      // Loop through each canonical event
      for (let ptr = 0; ptr < canonicalEvents.length; ptr++) {
        const canonicalEvent = canonicalEvents[ptr];

        // Check if events are similar
        if (compareEvents(event, canonicalEvent)) {
          // We have a duplicate!
          foundMatch = true;

          // Update canonical event with any missing or better data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: any = {};

          // Use earliest CFP end date
          if (event.cfpEndDate < canonicalEvent.cfpEndDate) {
            updates.cfpEndDate = event.cfpEndDate;
            canonicalEvents[ptr].cfpEndDate = event.cfpEndDate;
          }

          // Use non-blank URLs if canonical has blanks
          if (!canonicalEvent.cfpUrl && event.cfpUrl) {
            updates.cfpUrl = event.cfpUrl;
            canonicalEvents[ptr].cfpUrl = event.cfpUrl;
          }
          if (!canonicalEvent.eventUrl && event.eventUrl) {
            updates.eventUrl = event.eventUrl;
            canonicalEvents[ptr].eventUrl = event.eventUrl;
          }

          // Update the database if we have any changes
          if (Object.keys(updates).length > 0) {
            await prisma.canonicalEvent.update({
              where: { id: canonicalEvent.id },
              data: updates,
            });
          }

          // Connect the source event to the canonical event
          await prisma.event.update({
            where: { id: event.id },
            data: { canonicalEventId: canonicalEvent.id },
          });

          // No need to keep checking for duplicates if we found one!
          break;
        }
      }

      // If no match found, this is a new canonical event
      if (!foundMatch) {
        // Add to database
        const newCanonicalEvent = await prisma.canonicalEvent.create({
          data: {
            name: event.name,
            normalisedName: event.name.toLowerCase().replace(/\s+/g, "").trim(),
            cfpUrl: event.cfpUrl,
            eventUrl: event.eventUrl,
            cfpEndDate: event.cfpEndDate,
            eventStartDate: event.eventStartDate,
            eventEndDate: event.eventEndDate,
            location: event.location || "",
            normalisedLocation: (event.location || "")
              .toLowerCase()
              .replace(/\s+/g, "")
              .trim(),
            status: event.status,
            tags: event.tags,
            sources: [event.source],
          },
        });

        // Connect the source event to the canonical event
        await prisma.event.update({
          where: { id: event.id },
          data: { canonicalEventId: newCanonicalEvent.id },
        });

        // Add to local array
        canonicalEvents.push(newCanonicalEvent);

        // Resort array for deterministic processing
        canonicalEvents.sort((a, b) => {
          // First sort by cfpEndDate
          const dateA = new Date(a.cfpEndDate).getTime();
          const dateB = new Date(b.cfpEndDate).getTime();
          if (dateA !== dateB) return dateA - dateB;

          // If dates are equal, sort by cfpUrl
          if (a.cfpUrl !== b.cfpUrl) {
            return a.cfpUrl.localeCompare(b.cfpUrl);
          }

          // If cfpUrls are equal, sort by eventUrl
          return a.eventUrl.localeCompare(b.eventUrl);
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalOriginalEvents: events.length,
      totalCanonicalEvents: canonicalEvents.length,
      duplicatesRemoved: events.length - canonicalEvents.length,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
