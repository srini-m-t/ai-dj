import { NextResponse } from "next/server";

import type { ApiResponse, GetPlaybackResponse } from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";
import { mapSpotifyPlayback } from "@/lib/spotify/mappers";

export async function GET() {
  const response = await spotifyRequest("/me/player");

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to view live playback.",
          },
        } satisfies ApiResponse<GetPlaybackResponse>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to fetch Spotify playback state.",
          details: response.error,
        },
      } satisfies ApiResponse<GetPlaybackResponse>,
      { status: response.status },
    );
  }

  const playback = mapSpotifyPlayback(response.data);

  return NextResponse.json({
    ok: true,
    data: {
      playback,
      authenticated: true,
      hasActiveDevice: Boolean(playback?.deviceId),
    },
  } satisfies ApiResponse<GetPlaybackResponse>);
}
