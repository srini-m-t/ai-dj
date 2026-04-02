import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildSpotifyAuthorizeUrl,
  generatePkcePair,
  generateState,
} from "@/lib/spotify/auth";

/**
 * Starts Spotify auth by generating PKCE values, storing them in cookies,
 * and redirecting the user to Spotify's authorization screen.
 */
export async function GET() {
  const { verifier, challenge } = generatePkcePair();
  const state = generateState();
  const cookieStore = await cookies();

  cookieStore.set("spotify_pkce_verifier", verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  cookieStore.set("spotify_auth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  const authorizeUrl = buildSpotifyAuthorizeUrl({
    state,
    codeChallenge: challenge,
  });

  return NextResponse.redirect(authorizeUrl);
}