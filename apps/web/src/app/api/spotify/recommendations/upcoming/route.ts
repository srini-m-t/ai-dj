import { NextRequest, NextResponse } from "next/server";

import type { ApiResponse, TrackCandidate } from "@ai-dj/shared";

import { spotifyRequest } from "@/lib/spotify/client";

type UpcomingRecommendationsResponse = {
  tracks: TrackCandidate[];
};

const DEFAULT_RECOMMENDATION_COUNT = 11;
const MAX_RECOMMENDATION_COUNT = 25;
const FALLBACK_SEARCH_TERMS = ["love", "night", "drive", "dance", "summer"];
const LIKED_TOTAL_CACHE_TTL_MS = 5 * 60 * 1000;

let likedTotalCache:
  | {
      total: number;
      expiresAt: number;
    }
  | null = null;

export async function GET(request: NextRequest) {
  const count = parseRecommendationCount(request);
  const randomLikedTracks = await loadRandomLikedTracks(count);

  if (randomLikedTracks === null) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_AUTH_REQUIRED",
          message: "Connect Spotify to load recommended songs.",
        },
      } satisfies ApiResponse<UpcomingRecommendationsResponse>,
      { status: 401 },
    );
  }

  const tracks =
    randomLikedTracks.length > 0 ? randomLikedTracks : await loadFallbackTracks(count);

  if (tracks.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "SPOTIFY_API_ERROR",
          message: "Failed to build a recommendation pool from Spotify.",
        },
      } satisfies ApiResponse<UpcomingRecommendationsResponse>,
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      tracks,
    },
  } satisfies ApiResponse<UpcomingRecommendationsResponse>);
}

async function loadRandomLikedTracks(count: number) {
  const total = await resolveLikedSongsTotal();

  if (total === null) {
    return null;
  }

  if (total <= 0) {
    return loadFallbackTracks(count);
  }

  const offsets = pickRandomOffsets(total, count);
  const responses = await Promise.all(
    offsets.map((offset) => spotifyRequest(`/me/tracks?limit=1&offset=${offset}`)),
  );

  const randomTracks = dedupeTracks(
    responses.flatMap((response) => {
      if (!response.ok) {
        return [];
      }

      const items = Array.isArray(response.data?.items) ? response.data.items : [];

      return items
        .map((item: { track?: unknown }) => mapSavedTrack(item.track))
        .filter((track: TrackCandidate | null): track is TrackCandidate => track !== null);
    }),
  );

  return randomTracks.length > 0 ? randomTracks : loadFallbackTracks(count);
}

async function loadFallbackTracks(count: number) {
  const responses = await Promise.all(
    shuffle(FALLBACK_SEARCH_TERMS).map((query) =>
      spotifyRequest(`/search?type=track&limit=10&q=${encodeURIComponent(query)}`),
    ),
  );

  return shuffle(
    dedupeTracks(
      responses.flatMap((response) => {
        if (!response.ok) {
          return [];
        }

        const items = Array.isArray(response.data?.tracks?.items)
          ? response.data.tracks.items
          : [];

        return items
          .map((item: unknown) => mapSavedTrack(item))
          .filter((track: TrackCandidate | null): track is TrackCandidate => track !== null);
      }),
    ),
  ).slice(0, count);
}

function parseRecommendationCount(request: NextRequest) {
  const count = Number(request.nextUrl.searchParams.get("count"));

  if (!Number.isFinite(count) || count <= 0) {
    return DEFAULT_RECOMMENDATION_COUNT;
  }

  return Math.min(Math.floor(count), MAX_RECOMMENDATION_COUNT);
}

function pickRandomOffsets(total: number, count: number) {
  const offsets = new Set<number>();

  while (offsets.size < Math.min(total, count)) {
    offsets.add(Math.floor(Math.random() * total));
  }

  return [...offsets];
}

async function resolveLikedSongsTotal() {
  const now = Date.now();

  if (likedTotalCache && likedTotalCache.expiresAt > now) {
    return likedTotalCache.total;
  }

  const totalResponse = await spotifyRequest("/me/tracks?limit=1");

  if (!totalResponse.ok) {
    if (totalResponse.status === 401) {
      return null;
    }

    if (totalResponse.status === 429 && likedTotalCache) {
      return likedTotalCache.total;
    }

    return 0;
  }

  const total =
    typeof totalResponse.data?.total === "number" ? totalResponse.data.total : 0;

  likedTotalCache = {
    total,
    expiresAt: now + LIKED_TOTAL_CACHE_TTL_MS,
  };

  return total;
}

function mapSavedTrack(track: unknown): TrackCandidate | null {
  if (!track || typeof track !== "object") {
    return null;
  }

  const candidate = track as {
    id?: string;
    name?: string;
    artists?: Array<{ name?: string }>;
    album?: {
      name?: string;
      images?: Array<{ url?: string }>;
    };
  };

  if (!candidate.id) {
    return null;
  }

  return {
    spotifyTrackId: candidate.id,
    title: candidate.name ?? "Unknown track",
    artistNames: Array.isArray(candidate.artists)
      ? candidate.artists
          .map((artist) => artist.name)
          .filter((name): name is string => Boolean(name))
      : [],
    albumName: candidate.album?.name ?? null,
    imageUrl: Array.isArray(candidate.album?.images)
      ? candidate.album.images[0]?.url ?? null
      : null,
  };
}

function dedupeTracks(tracks: TrackCandidate[]) {
  const seenTrackIds = new Set<string>();

  return tracks.filter((track) => {
    if (seenTrackIds.has(track.spotifyTrackId)) {
      return false;
    }

    seenTrackIds.add(track.spotifyTrackId);
    return true;
  });
}

function shuffle<T>(items: T[]) {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentItem = nextItems[index];
    const swapItem = nextItems[swapIndex];

    if (currentItem === undefined || swapItem === undefined) {
      continue;
    }

    nextItems[index] = swapItem;
    nextItems[swapIndex] = currentItem;
  }

  return nextItems;
}
