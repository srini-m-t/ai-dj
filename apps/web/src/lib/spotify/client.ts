import { cookies } from "next/headers";

import { SPOTIFY_API_BASE_URL } from "@ai-dj/shared";

import { refreshSpotifyAccessToken } from "@/lib/spotify/auth";
import { clearSpotifyAuthCookies, setSpotifyAuthCookies } from "@/lib/spotify/cookies";

type SpotifyRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | null;
  headers?: HeadersInit;
};

export async function getSpotifyAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("spotify_access_token")?.value ?? null;
}

export async function resolveSpotifyAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (accessToken) {
    return accessToken;
  }

  return tryRefreshSpotifyAccessToken(cookieStore);
}

/**
 * Shared server-side Spotify request helper.
 * Token refresh will plug in here next, so routes can stay small.
 */
export async function spotifyRequest(
  path: string,
  options: SpotifyRequestOptions = {},
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: "missing_access_token",
    };
  }

  let response = await fetchSpotifyWithToken(path, accessToken, options);

  if (response.status === 401) {
    const refreshedAccessToken = await tryRefreshSpotifyAccessToken(cookieStore);

    if (refreshedAccessToken) {
      response = await fetchSpotifyWithToken(path, refreshedAccessToken, options);
    }
  }

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: await response.text(),
    };
  }

  return {
    ok: true as const,
    status: response.status,
    data: await parseSpotifyResponseData(response),
  };
}

export async function spotifyRequestReadOnly(
  path: string,
  options: SpotifyRequestOptions = {},
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("spotify_access_token")?.value;

  if (!accessToken) {
    return {
      ok: false as const,
      status: 401,
      error: "missing_access_token",
    };
  }

  const response = await fetchSpotifyWithToken(path, accessToken, options);

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: await response.text(),
    };
  }

  return {
    ok: true as const,
    status: response.status,
    data: await parseSpotifyResponseData(response),
  };
}

async function fetchSpotifyWithToken(
  path: string,
  accessToken: string,
  options: SpotifyRequestOptions,
) {
  return fetch(`${SPOTIFY_API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
    body: options.body,
    cache: "no-store",
  });
}

async function parseSpotifyResponseData(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    // Some Spotify success responses are empty or non-JSON; callers that need
    // structured data should rely on content-type-aware endpoints.
    return text;
  }
}

async function tryRefreshSpotifyAccessToken(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const refreshToken = cookieStore.get("spotify_refresh_token")?.value;
  const existingScope = cookieStore.get("spotify_token_scope")?.value ?? "";

  if (!refreshToken) {
    return null;
  }

  try {
    const refreshedTokenSet = await refreshSpotifyAccessToken({
      refreshToken,
    });

    setSpotifyAuthCookies(cookieStore, {
      accessToken: refreshedTokenSet.accessToken,
      refreshToken: refreshedTokenSet.refreshToken ?? refreshToken,
      scope: refreshedTokenSet.scope || existingScope,
      expiresIn: refreshedTokenSet.expiresIn,
    });

    return refreshedTokenSet.accessToken;
  } catch {
    clearSpotifyAuthCookies(cookieStore);
    return null;
  }
}
