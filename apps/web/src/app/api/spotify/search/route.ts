import { NextResponse } from "next/server";

import type { ApiResponse, SpotifySearchTracksResponse } from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";
import { mapSpotifySearchTracks } from "@/lib/spotify/mappers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Search query is required.",
        },
      } satisfies ApiResponse<SpotifySearchTracksResponse>,
      { status: 400 },
    );
  }

  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: "10",
  });

  const response = await spotifyRequest(`/search?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 401) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "SPOTIFY_AUTH_REQUIRED",
            message: "Connect Spotify to search tracks.",
          },
        } satisfies ApiResponse<SpotifySearchTracksResponse>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to search Spotify tracks.",
          details: response.error,
        },
      } satisfies ApiResponse<SpotifySearchTracksResponse>,
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: mapSpotifySearchTracks(response.data),
  } satisfies ApiResponse<SpotifySearchTracksResponse>);
}
