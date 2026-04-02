import { NextResponse } from "next/server";

import type {
  ApiResponse,
  StartPlaybackRequest,
  StartPlaybackResponse,
} from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";

export async function POST(request: Request) {
  let body: Partial<StartPlaybackRequest>;

  try {
    body = (await request.json()) as Partial<StartPlaybackRequest>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
      } satisfies ApiResponse<StartPlaybackResponse>,
      { status: 400 },
    );
  }

  const spotifyTrackIds = [
    ...(body.spotifyTrackId?.trim() ? [body.spotifyTrackId.trim()] : []),
    ...((Array.isArray(body.spotifyTrackIds) ? body.spotifyTrackIds : [])
      .map((trackId) => trackId.trim())
      .filter(Boolean)),
  ];

  if (spotifyTrackIds.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "spotifyTrackId or spotifyTrackIds is required.",
        },
      } satisfies ApiResponse<StartPlaybackResponse>,
      { status: 400 },
    );
  }

  const params = new URLSearchParams();

  if (body.deviceId?.trim()) {
    params.set("device_id", body.deviceId.trim());
  }

  const path = params.size > 0 ? `/me/player/play?${params.toString()}` : "/me/player/play";
  const positionMs =
    typeof body.positionMs === "number" && Number.isFinite(body.positionMs)
      ? Math.max(0, Math.floor(body.positionMs))
      : 0;

  const response = await spotifyRequest(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      uris: spotifyTrackIds.map((trackId) =>
        trackId.startsWith("spotify:track:") ? trackId : `spotify:track:${trackId}`,
      ),
      offset: {
        position: 0,
      },
      position_ms: positionMs,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to start playback.",
          },
        } satisfies ApiResponse<StartPlaybackResponse>,
        { status: 401 },
      );
    }

    if (response.status === 404) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_API_ERROR",
            message:
              "No active Spotify device is ready for playback yet. Enable browser playback or start Spotify on another device.",
            details: response.error,
          },
        } satisfies ApiResponse<StartPlaybackResponse>,
        { status: 404 },
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_PREMIUM_REQUIRED",
            message:
              "Spotify blocked this playback action. Make sure browser playback is enabled for a supported Premium account.",
            details: response.error,
          },
        } satisfies ApiResponse<StartPlaybackResponse>,
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to start Spotify playback.",
          details: response.error,
        },
      } satisfies ApiResponse<StartPlaybackResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      started: true,
    },
  } satisfies ApiResponse<StartPlaybackResponse>);
}
