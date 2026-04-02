import crypto from "node:crypto";

import {
  SPOTIFY_AUTH_BASE_URL,
  SPOTIFY_SCOPES,
  SPOTIFY_TOKEN_URL,
} from "@ai-dj/shared";

import { getServerEnv } from "@/lib/env/server";

type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyTokenSet = {
  accessToken: string;
  tokenType: string;
  scope: string;
  expiresIn: number;
  refreshToken?: string;
};

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates a high-entropy PKCE verifier and matching challenge.
 */
export function generatePkcePair() {
  const verifier = base64UrlEncode(crypto.randomBytes(64));
  const challenge = base64UrlEncode(
    crypto.createHash("sha256").update(verifier).digest(),
  );

  return { verifier, challenge };
}

/**
 * Generates a CSRF protection state token.
 */
export function generateState() {
  return base64UrlEncode(crypto.randomBytes(24));
}

/**
 * Builds the Spotify authorization URL for the initial redirect.
 */
export function buildSpotifyAuthorizeUrl({
  state,
  codeChallenge,
}: {
  state: string;
  codeChallenge: string;
}) {
  const env = getServerEnv();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.spotifyClientId,
    scope: SPOTIFY_SCOPES.join(" "),
    redirect_uri: env.spotifyRedirectUri,
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  return `${SPOTIFY_AUTH_BASE_URL}?${params.toString()}`;
}

/**
 * Exchanges the Spotify authorization code for tokens.
 */
export async function exchangeSpotifyCodeForToken({
  code,
  codeVerifier,
}: {
  code: string;
  codeVerifier: string;
}): Promise<SpotifyTokenSet> {
  const env = getServerEnv();

  const body = new URLSearchParams({
    client_id: env.spotifyClientId,
    client_secret: env.spotifyClientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.spotifyRedirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token exchange failed: ${errorText}`);
  }

  return mapSpotifyTokenResponse((await response.json()) as SpotifyTokenResponse);
}

/**
 * Exchanges a refresh token for a new access token.
 */
export async function refreshSpotifyAccessToken({
  refreshToken,
}: {
  refreshToken: string;
}): Promise<SpotifyTokenSet> {
  const env = getServerEnv();

  const body = new URLSearchParams({
    client_id: env.spotifyClientId,
    client_secret: env.spotifyClientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Spotify token refresh failed: ${errorText}`);
  }

  return mapSpotifyTokenResponse((await response.json()) as SpotifyTokenResponse);
}

function mapSpotifyTokenResponse(tokenResponse: SpotifyTokenResponse): SpotifyTokenSet {
  return {
    accessToken: tokenResponse.access_token,
    tokenType: tokenResponse.token_type,
    scope: tokenResponse.scope,
    expiresIn: tokenResponse.expires_in,
    refreshToken: tokenResponse.refresh_token,
  };
}
