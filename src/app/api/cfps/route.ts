import { NextResponse } from "next/server";
import { CFPService } from "@/services/cfp/cfp.service";
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
    const cfpService = CFPService.getInstance();
    const cfps = await cfpService.fetchCFPs();
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
