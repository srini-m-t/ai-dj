import { NextResponse } from "next/server";

import { getSessionById } from "@ai-dj/database";
import type { ApiResponse, GetSessionResponse } from "@ai-dj/shared";

type SessionRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: SessionRouteContext,
) {
  const { sessionId } = await context.params;

  try {
    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Session not found.",
          },
        } satisfies ApiResponse<GetSessionResponse>,
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        session,
      },
    } satisfies ApiResponse<GetSessionResponse>);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch session.",
          details: error instanceof Error ? error.message : "unknown_error",
        },
      } satisfies ApiResponse<GetSessionResponse>,
      { status: 500 },
    );
  }
}
