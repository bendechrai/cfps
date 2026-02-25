import { NextResponse } from "next/server";
import { type Event, type CanonicalEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

  try {
    // Load all canonical events, ordered by duplicate check fields for deterministic processing
    const canonicalEvents = await prisma.canonicalEvent.findMany({
      orderBy: [{ cfpEndDate: "asc" }, { cfpUrl: "asc" }, { eventUrl: "asc" }],
    });

    // Load all source events, ordered by duplicate check fields for deterministic processing
    const events = await prisma.event.findMany({
      orderBy: [{ cfpEndDate: "asc" }, { cfpUrl: "asc" }, { eventUrl: "asc" }],
    });

    // Collect all DB operations to batch later
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonicalUpdates: { id: string; data: any }[] = [];
    const eventLinks: { eventId: string; canonicalEventId: string }[] = [];
    const newCanonicals: {
      event: Event;
      tempId: string;
    }[] = [];

    // Assign temp IDs for new canonical events created in-memory
    let tempIdCounter = 0;

    // Loop through each source event (comparisons in-memory only)
    for (const event of events) {
      let foundMatch = false;

      for (let ptr = 0; ptr < canonicalEvents.length; ptr++) {
        const canonicalEvent = canonicalEvents[ptr];

        if (compareEvents(event, canonicalEvent)) {
          foundMatch = true;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updates: any = {};

          if (event.cfpEndDate < canonicalEvent.cfpEndDate) {
            updates.cfpEndDate = event.cfpEndDate;
            canonicalEvents[ptr].cfpEndDate = event.cfpEndDate;
          }
          if (!canonicalEvent.cfpUrl && event.cfpUrl) {
            updates.cfpUrl = event.cfpUrl;
            canonicalEvents[ptr].cfpUrl = event.cfpUrl;
          }
          if (!canonicalEvent.eventUrl && event.eventUrl) {
            updates.eventUrl = event.eventUrl;
            canonicalEvents[ptr].eventUrl = event.eventUrl;
          }

          if (Object.keys(updates).length > 0) {
            canonicalUpdates.push({ id: canonicalEvent.id, data: updates });
          }

          eventLinks.push({
            eventId: event.id,
            canonicalEventId: canonicalEvent.id,
          });
          break;
        }
      }

      if (!foundMatch) {
        const tempId = `__temp_${tempIdCounter++}`;
        newCanonicals.push({ event, tempId });

        // Add to in-memory array for subsequent comparisons
        canonicalEvents.push({
          id: tempId,
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
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CanonicalEvent);

        canonicalEvents.sort((a, b) => {
          const dateA = new Date(a.cfpEndDate).getTime();
          const dateB = new Date(b.cfpEndDate).getTime();
          if (dateA !== dateB) return dateA - dateB;
          if (a.cfpUrl !== b.cfpUrl) return a.cfpUrl.localeCompare(b.cfpUrl);
          return a.eventUrl.localeCompare(b.eventUrl);
        });
      }
    }

    // Execute all DB operations in batches
    const BATCH_SIZE = 50;

    // 1. Create new canonical events and collect real IDs
    const tempIdToRealId = new Map<string, string>();
    for (let i = 0; i < newCanonicals.length; i += BATCH_SIZE) {
      const batch = newCanonicals.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(({ event }) =>
          prisma.canonicalEvent.create({
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
          })
        )
      );
      for (let j = 0; j < batch.length; j++) {
        tempIdToRealId.set(batch[j].tempId, results[j].id);
      }
    }

    // 2. Add event links for newly created canonical events
    for (const { event, tempId } of newCanonicals) {
      const realId = tempIdToRealId.get(tempId);
      if (realId) {
        eventLinks.push({ eventId: event.id, canonicalEventId: realId });
      }
    }

    // 3. Remap any temp IDs in event links and canonical updates to real IDs
    for (const link of eventLinks) {
      const realId = tempIdToRealId.get(link.canonicalEventId);
      if (realId) {
        link.canonicalEventId = realId;
      }
    }
    for (const update of canonicalUpdates) {
      const realId = tempIdToRealId.get(update.id);
      if (realId) {
        update.id = realId;
      }
    }

    // 4. Batch update canonical events
    for (let i = 0; i < canonicalUpdates.length; i += BATCH_SIZE) {
      const batch = canonicalUpdates.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ id, data }) =>
          prisma.canonicalEvent.update({ where: { id }, data })
        )
      );
    }

    // 5. Batch link source events to canonical events
    for (let i = 0; i < eventLinks.length; i += BATCH_SIZE) {
      const batch = eventLinks.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ eventId, canonicalEventId }) =>
          prisma.event.update({
            where: { id: eventId },
            data: { canonicalEventId },
          })
        )
      );
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
