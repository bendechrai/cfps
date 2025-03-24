import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import arcjet, { detectBot, tokenBucket } from "@arcjet/next";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .filter(Boolean);
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.join(", "),
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Allow-Credentials": "true",
};

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    detectBot({
      mode: "LIVE",
      allow: [],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 5,
    }),
  ],
});

export async function GET(req: Request) {
  const decision = await aj.protect(req, { requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return NextResponse.json(
        { error: "Too Many Requests", reason: decision.reason },
        { status: 429, headers: corsHeaders }
      );
    } else {
      return NextResponse.json(
        { error: "Forbidden", reason: decision.reason },
        { status: 403, headers: corsHeaders }
      );
    }
  }

  try {
    const prisma = new PrismaClient();

    // Get all open canonical events with future CFP end dates
    const canonicalEvents = await prisma.canonicalEvent.findMany({
      where: {
        AND: [
          { status: 'open' },
          { cfpEndDate: { gt: new Date() } }
        ]
      },
      orderBy: [
        { cfpEndDate: 'asc' },
        { eventStartDate: 'asc' }
      ]
    });

    // Transform to match existing API format
    const cfps = canonicalEvents.map(event => ({
      id: event.id, // Now using canonical ID
      name: event.name,
      cfpUrl: event.cfpUrl,
      eventUrl: event.eventUrl,
      cfpEndDate: event.cfpEndDate.getTime(),
      eventStartDate: event.eventStartDate.getTime(),
      eventEndDate: event.eventEndDate.getTime(),
      location: event.location,
      status: event.status,
      source: event.sources[0], // Use first source as primary
      references: event.sources.reduce((acc, source) => {
        acc[source] = event.id;
        return acc;
      }, {} as Record<string, string>),
      tags: event.tags
    }));

    return NextResponse.json(cfps, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching CFPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch CFPs" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
