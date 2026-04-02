import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { exchangeSpotifyCodeForToken } from "@/lib/spotify/auth";
import { getServerEnv } from "@/lib/env/server";
import { setSpotifyAuthCookies } from "@/lib/spotify/cookies";

/**
 * Handles the Spotify callback, validates state/PKCE data,
 * exchanges the code for tokens, and stores them in cookies for now.
 */
export async function GET(request: Request) {
  const env = getServerEnv();
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${env.appUrl}/?spotify_error=${encodeURIComponent(error)}`,
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(`${env.appUrl}/?spotify_error=missing_params`);
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_auth_state")?.value;
  const codeVerifier = cookieStore.get("spotify_pkce_verifier")?.value;

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(`${env.appUrl}/?spotify_error=invalid_state`);
  }

  if (!codeVerifier) {
    return NextResponse.redirect(
      `${env.appUrl}/?spotify_error=missing_code_verifier`,
    );
  }

  try {
    const tokenResponse = await exchangeSpotifyCodeForToken({
      code,
      codeVerifier,
    });

    const response = NextResponse.redirect(`${env.appUrl}/session`);

    setSpotifyAuthCookies(response.cookies, {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      scope: tokenResponse.scope,
      expiresIn: tokenResponse.expiresIn,
    });

    response.cookies.delete("spotify_auth_state");
    response.cookies.delete("spotify_pkce_verifier");

    return response;
  } catch {
    return NextResponse.redirect(
      `${env.appUrl}/?spotify_error=token_exchange_failed`,
    );
  }
}
