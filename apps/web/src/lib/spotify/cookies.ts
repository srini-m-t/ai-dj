import type { ResponseCookies } from "next/dist/compiled/@edge-runtime/cookies";

type SpotifyTokenCookieInput = {
  accessToken: string;
  refreshToken?: string;
  scope: string;
  expiresIn: number;
};

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/**
 * Centralized Spotify auth cookie writes so login and refresh flows stay aligned.
 */
export function setSpotifyAuthCookies(
  cookies: ResponseCookies,
  input: SpotifyTokenCookieInput,
) {
  cookies.set(
    "spotify_access_token",
    input.accessToken,
    getCookieOptions(input.expiresIn),
  );

  if (input.refreshToken) {
    cookies.set(
      "spotify_refresh_token",
      input.refreshToken,
      getCookieOptions(60 * 60 * 24 * 30),
    );
  }

  cookies.set("spotify_token_scope", input.scope, getCookieOptions(input.expiresIn));
  cookies.set(
    "spotify_token_expires_at",
    new Date(Date.now() + input.expiresIn * 1000).toISOString(),
    getCookieOptions(input.expiresIn),
  );
}

export function clearSpotifyAuthCookies(cookies: ResponseCookies) {
  cookies.delete("spotify_access_token");
  cookies.delete("spotify_refresh_token");
  cookies.delete("spotify_token_scope");
  cookies.delete("spotify_token_expires_at");
  cookies.delete("spotify_auth_state");
  cookies.delete("spotify_pkce_verifier");
}
