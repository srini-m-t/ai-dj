import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env/server";

/**
 * Basic health endpoint for local checks, uptime monitoring,
 * and confirming the server is reading env correctly.
 */
export async function GET() {
  const env = getServerEnv();

  return NextResponse.json({
    ok: true,
    service: "web",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
}