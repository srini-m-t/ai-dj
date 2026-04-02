import type {
  PlaybackSnapshot,
  GetSpotifyQueueResponse,
  QueueTrackSnapshot,
  SpotifyDevice,
  SpotifySearchTracksResponse,
  TrackCandidate,
} from "@ai-dj/shared";

/**
 * Maps Spotify playback payloads into app-owned types so UI code never depends
 * on raw Spotify wire shapes.
 */
export function mapSpotifyPlayback(payload: any): PlaybackSnapshot | null {
  if (!payload || !payload.item) {
    return null;
  }

  return {
    source: "spotify",
    isPlaying: Boolean(payload.is_playing),
    deviceId: payload.device?.id ?? null,
    deviceName: payload.device?.name ?? null,
    trackId: payload.item?.id ?? null,
    trackTitle: payload.item?.name ?? null,
    artistNames: Array.isArray(payload.item?.artists)
      ? payload.item.artists
          .map((artist: { name?: string }) => artist.name)
          .filter((name: string | undefined): name is string => Boolean(name))
      : [],
    albumName: payload.item?.album?.name ?? null,
    imageUrl: Array.isArray(payload.item?.album?.images)
      ? payload.item.album.images[0]?.url ?? null
      : null,
    progressMs: typeof payload.progress_ms === "number" ? payload.progress_ms : null,
    durationMs:
      typeof payload.item?.duration_ms === "number"
        ? payload.item.duration_ms
        : null,
    fetchedAt: new Date().toISOString(),
  };
}

export function mapSpotifyDevices(payload: any): SpotifyDevice[] {
  if (!payload || !Array.isArray(payload.devices)) {
    return [];
  }

  return payload.devices.map((device: any) => ({
    id: device.id ?? "",
    name: device.name ?? "Unknown device",
    type: device.type ?? "Unknown",
    isActive: Boolean(device.is_active),
    isRestricted: Boolean(device.is_restricted),
  }));
}

export function mapSpotifySearchTracks(payload: any): SpotifySearchTracksResponse {
  const items = Array.isArray(payload?.tracks?.items) ? payload.tracks.items : [];

  return {
    tracks: items.map(mapSpotifyTrackCandidate),
  };
}

export function mapSpotifyQueue(payload: any): GetSpotifyQueueResponse {
  const currentlyPlaying = payload?.currently_playing
    ? mapSpotifyTrackSnapshot(payload.currently_playing)
    : null;
  const rawQueue = Array.isArray(payload?.queue) ? payload.queue : [];

  return {
    currentlyPlaying,
    queue: rawQueue
      .map(mapSpotifyTrackSnapshot)
      .filter(
        (track: QueueTrackSnapshot) =>
          track.spotifyTrackId !== currentlyPlaying?.spotifyTrackId,
      ),
  };
}

function mapSpotifyTrackCandidate(track: any): TrackCandidate {
  return {
    spotifyTrackId: track?.id ?? "",
    title: track?.name ?? "Unknown track",
    artistNames: Array.isArray(track?.artists)
      ? track.artists
          .map((artist: { name?: string }) => artist.name)
          .filter((name: string | undefined): name is string => Boolean(name))
      : [],
    albumName: track?.album?.name ?? null,
    imageUrl: Array.isArray(track?.album?.images) ? track.album.images[0]?.url ?? null : null,
  };
}

function mapSpotifyTrackSnapshot(track: any): QueueTrackSnapshot {
  return {
    spotifyTrackId: track?.id ?? "",
    title: track?.name ?? "Unknown track",
    artistNames: Array.isArray(track?.artists)
      ? track.artists
          .map((artist: { name?: string }) => artist.name)
          .filter((name: string | undefined): name is string => Boolean(name))
      : [],
    albumName: track?.album?.name ?? null,
    imageUrl: Array.isArray(track?.album?.images) ? track.album.images[0]?.url ?? null : null,
  };
}
