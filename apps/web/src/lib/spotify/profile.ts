import { getSpotifyAccessToken, spotifyRequestReadOnly } from "@/lib/spotify/client";

export type SpotifyProfileSummary = {
  id: string;
  display_name: string | null;
  email?: string | null;
  product?: string | null;
  images?: Array<{ url: string }>;
};

export type SpotifyAuthStatus = {
  authenticated: boolean;
  profile: SpotifyProfileSummary | null;
};

/**
 * Reads the current Spotify auth state from request cookies and,
 * when available, fetches the current user's Spotify profile.
 */
export async function getSpotifyAuthStatus(): Promise<SpotifyAuthStatus> {
  const accessToken = await getSpotifyAccessToken();

  if (!accessToken) {
    return {
      authenticated: false,
      profile: null,
    };
  }

  const response = await spotifyRequestReadOnly("/me");

  if (!response.ok) {
    return {
      authenticated: true,
      profile: null,
    };
  }

  const profile = response.data;

  return {
    authenticated: true,
    profile: {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      product: profile.product,
      images: profile.images ?? [],
    },
  };
}
