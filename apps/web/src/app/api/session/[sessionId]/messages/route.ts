import { NextResponse } from "next/server";

import { applySessionUpdate, getSessionById } from "@ai-dj/database";
import type {
  ApiResponse,
  CreateSessionMessageRequest,
  CreateSessionMessageResponse,
} from "@ai-dj/shared";

import { deriveSessionUpdate } from "@/lib/session/session-updater";

type SessionMessageRouteContext = {
  params: Promise<{
    sessionId: string;
  }>;
};

export async function POST(
  request: Request,
  context: SessionMessageRouteContext,
) {
  const { sessionId } = await context.params;

  try {
    const body = (await request.json()) as Partial<CreateSessionMessageRequest>;
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Message text is required.",
          },
        } satisfies ApiResponse<CreateSessionMessageResponse>,
        { status: 400 },
      );
    }

    const existingSession = await getSessionById(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "NOT_FOUND",
            message: "Session not found.",
          },
        } satisfies ApiResponse<CreateSessionMessageResponse>,
        { status: 404 },
      );
    }

    const sessionUpdate = deriveSessionUpdate(existingSession, text);
    const session = await applySessionUpdate({
      sessionId,
      lastPrompt: sessionUpdate.lastPrompt,
      vibe: sessionUpdate.vibe,
      newMessages: sessionUpdate.newMessages.map((message) => ({
        role: message.role,
        text: message.text,
        createdAt: message.createdAt,
      })),
      queuePlan: sessionUpdate.queuePlan.map((track) => ({
        spotifyTrackId: track.spotifyTrackId,
        title: track.title,
        artistNames: track.artistNames,
        reason: track.reason,
        score: track.score,
        source: track.source,
        queuedAt: track.queuedAt,
      })),
    });

    return NextResponse.json({
      ok: true,
      data: {
        session,
        assistantMessage: sessionUpdate.newMessages[1],
        appliedIntent: sessionUpdate.appliedIntent,
      },
    } satisfies ApiResponse<CreateSessionMessageResponse>);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update session from message.",
          details: error instanceof Error ? error.message : "unknown_error",
        },
      } satisfies ApiResponse<CreateSessionMessageResponse>,
      { status: 500 },
    );
  }
}
