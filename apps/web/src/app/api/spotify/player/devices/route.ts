import { NextResponse } from "next/server";

import type { ApiResponse, SpotifyDevicesResponse } from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";
import { mapSpotifyDevices } from "@/lib/spotify/mappers";

export async function GET() {
  const response = await spotifyRequest("/me/player/devices");

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to view available devices.",
          },
        } satisfies ApiResponse<SpotifyDevicesResponse>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to fetch Spotify devices.",
          details: response.error,
        },
      } satisfies ApiResponse<SpotifyDevicesResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      devices: mapSpotifyDevices(response.data),
    },
  } satisfies ApiResponse<SpotifyDevicesResponse>);
}
