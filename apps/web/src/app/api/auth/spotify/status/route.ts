import { NextResponse } from "next/server";

import { resolveSpotifyAccessToken, spotifyRequest } from "@/lib/spotify/client";

/**
 * Returns whether the current browser session is authenticated with Spotify.
 * If authenticated, also returns a minimal user profile payload.
 */
export async function GET() {
  const accessToken = await resolveSpotifyAccessToken();

  if (!accessToken) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      profile: null,
    });
  }

  const response = await spotifyRequest("/me");

  if (!response.ok) {
    return NextResponse.json({
      ok: true,
      authenticated: true,
      profile: null,
    });
  }
  const profile = response.data;

  return NextResponse.json({
    ok: true,
    authenticated: true,
    profile: {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      product: profile.product,
      images: profile.images ?? [],
    },
  });
}
