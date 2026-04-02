import { NextResponse } from "next/server";

import type {
  ApiResponse,
  TransferPlaybackRequest,
  TransferPlaybackResponse,
} from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";

export async function POST(request: Request) {
  let body: Partial<TransferPlaybackRequest>;

  try {
    body = (await request.json()) as Partial<TransferPlaybackRequest>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
      } satisfies ApiResponse<TransferPlaybackResponse>,
      { status: 400 },
    );
  }

  const deviceId = body.deviceId?.trim();

  if (!deviceId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "deviceId is required.",
        },
      } satisfies ApiResponse<TransferPlaybackResponse>,
      { status: 400 },
    );
  }

  const response = await spotifyRequest("/me/player", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: body.play ?? false,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to transfer playback.",
          },
        } satisfies ApiResponse<TransferPlaybackResponse>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: response.status === 403 ? "SPOTIFY_PREMIUM_REQUIRED" : "SPOTIFY_API_ERROR",
          message:
            response.status === 403
              ? "Spotify blocked playback transfer for this account or device."
              : "Failed to transfer Spotify playback.",
          details: response.error,
        },
      } satisfies ApiResponse<TransferPlaybackResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      transferred: true,
    },
  } satisfies ApiResponse<TransferPlaybackResponse>);
}
