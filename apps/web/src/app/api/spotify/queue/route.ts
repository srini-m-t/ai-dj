import { NextResponse } from "next/server";

import type {
  AddToQueueRequest,
  AddToQueueResponse,
  ApiResponse,
  GetSpotifyQueueResponse,
} from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";
import { mapSpotifyQueue } from "@/lib/spotify/mappers";

export async function GET() {
  const response = await spotifyRequest("/me/player/queue");

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to view the live queue.",
          },
        } satisfies ApiResponse<GetSpotifyQueueResponse>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to fetch the Spotify queue.",
          details: response.error,
        },
      } satisfies ApiResponse<GetSpotifyQueueResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: mapSpotifyQueue(response.data),
  } satisfies ApiResponse<GetSpotifyQueueResponse>);
}

export async function POST(request: Request) {
  let body: Partial<AddToQueueRequest>;

  try {
    body = (await request.json()) as Partial<AddToQueueRequest>;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request body must be valid JSON.",
        },
      } satisfies ApiResponse<AddToQueueResponse>,
      { status: 400 },
    );
  }

  const spotifyTrackId = body.spotifyTrackId?.trim();

  if (!spotifyTrackId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "spotifyTrackId is required.",
        },
      } satisfies ApiResponse<AddToQueueResponse>,
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    uri: spotifyTrackId.startsWith("spotify:track:")
      ? spotifyTrackId
      : `spotify:track:${spotifyTrackId}`,
  });

  if (body.deviceId?.trim()) {
    params.set("device_id", body.deviceId.trim());
  }

  let response = await spotifyRequest(`/me/player/queue?${params.toString()}`, {
    method: "POST",
  });

  if (!response.ok && response.status === 404 && body.deviceId?.trim()) {
    const transferResponse = await spotifyRequest("/me/player", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        device_ids: [body.deviceId.trim()],
        play: false,
      }),
    });

    if (transferResponse.ok) {
      response = await spotifyRequest(`/me/player/queue?${params.toString()}`, {
        method: "POST",
      });
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to add tracks to the queue.",
          },
        } satisfies ApiResponse<AddToQueueResponse>,
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
              "No active Spotify device was found for queueing. Start playback on Spotify and try again.",
            details: response.error,
          },
        } satisfies ApiResponse<AddToQueueResponse>,
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
              "Spotify blocked this playback action. Make sure you are using a supported active device and account.",
            details: response.error,
          },
        } satisfies ApiResponse<AddToQueueResponse>,
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to add track to Spotify queue.",
          details: response.error,
        },
      } satisfies ApiResponse<AddToQueueResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      queued: true,
    },
  } satisfies ApiResponse<AddToQueueResponse>);
}
