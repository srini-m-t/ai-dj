import { NextResponse } from "next/server";

import { createSession } from "@ai-dj/database";
import type { ApiResponse, CreateSessionResponse } from "@ai-dj/shared";

import { buildSeedSessionInput } from "@/lib/session/seed";

/**
 * Minimal session endpoint.
 * This is still mock-backed, but it establishes the route contract
 * we will later replace with a real database-backed implementation.
 */
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Use POST /api/session to create a session or GET /api/session/:sessionId to fetch one.",
      },
    } satisfies ApiResponse<CreateSessionResponse>,
    { status: 400 },
  );
}

export async function POST() {
  try {
    const session = await createSession(buildSeedSessionInput());

    return NextResponse.json({
      ok: true,
      data: {
        session,
      },
    } satisfies ApiResponse<CreateSessionResponse>);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create session.",
          details: error instanceof Error ? error.message : "unknown_error",
        },
      } satisfies ApiResponse<CreateSessionResponse>,
      { status: 500 },
    );
  }
}
