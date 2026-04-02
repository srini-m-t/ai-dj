import { NextResponse } from "next/server";

import type { ApiResponse } from "@ai-dj/shared";

import { resolveSpotifyAccessToken, spotifyRequest } from "@/lib/spotify/client";

type SpotifySdkTokenResponse = {
  token: string;
  premium: boolean | null;
};

export async function GET() {
  const accessToken = await resolveSpotifyAccessToken();

  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_AUTH_REQUIRED",
          message: "Connect Spotify to initialize browser playback.",
        },
      } satisfies ApiResponse<SpotifySdkTokenResponse>,
      { status: 401 },
    );
  }

  const profileResponse = await spotifyRequest("/me");

  if (!profileResponse.ok) {
    return NextResponse.json({
      ok: true,
      data: {
        token: accessToken,
        premium: null,
      },
    } satisfies ApiResponse<SpotifySdkTokenResponse>);
  }

  return NextResponse.json({
    ok: true,
    data: {
      token: accessToken,
      premium: profileResponse.data?.product === "premium",
    },
  } satisfies ApiResponse<SpotifySdkTokenResponse>);
}
