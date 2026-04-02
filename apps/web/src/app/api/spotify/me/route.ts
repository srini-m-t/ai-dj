import { NextResponse } from "next/server";

import { spotifyRequest } from "@/lib/spotify/client";

/**
 * Returns the authenticated Spotify user's profile using the access token
 * stored during the callback flow.
 */
export async function GET() {
  const response = await spotifyRequest("/me");

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: response.status === 401 ? "missing_access_token" : "spotify_me_failed",
        details: response.error,
      },
      { status: response.status },
    );
  }

  return NextResponse.json({
    ok: true,
    profile: response.data,
  });
}
