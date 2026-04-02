"use client";

import { useState } from "react";

import type {
  ApiResponse,
  SpotifySearchTracksResponse,
  TrackCandidate,
} from "@ai-dj/shared";

import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { SectionCard } from "@/components/ui/section-card";
import { TextInput } from "@/components/ui/text-input";

/**
 * Lightweight Spotify search and queue UI for validating the new wrapper routes.
 */
type QueueSearchCardProps = {
  deviceId?: string | null;
  deviceName?: string | null;
  deviceStatusMessage?: string | null;
  onPlayTrack?: (track: TrackCandidate) => Promise<void>;
  onPlayNextTrack?: (track: TrackCandidate) => Promise<void>;
  onQueueTrack?: (track: TrackCandidate) => Promise<void>;
  onPreparePlayback?: () => Promise<void>;
};

export function QueueSearchCard({
  deviceId,
  onPlayTrack,
  onPlayNextTrack,
  onQueueTrack,
  onPreparePlayback,
}: QueueSearchCardProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrackCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isQueueingTrackId, setIsQueueingTrackId] = useState<string | null>(null);
  const [isPlayingNextTrackId, setIsPlayingNextTrackId] = useState<string | null>(null);
  const [isPlayingTrackId, setIsPlayingTrackId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Enter a track, artist, or vibe to search Spotify.");
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(trimmedQuery)}`,
        {
          cache: "no-store",
        },
      );

      const payload = (await response.json()) as ApiResponse<SpotifySearchTracksResponse>;

      if (!payload.ok) {
        throw new Error(payload.error.message);
      }

      setResults(payload.data.tracks);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Failed to search Spotify.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  async function handleQueueTrack(track: TrackCandidate) {
    setIsQueueingTrackId(track.spotifyTrackId);
    setError(null);
    setSuccessMessage(null);

    try {
      await onQueueTrack?.(track);

      setSuccessMessage(`Queued "${track.title}" on your Spotify player.`);
    } catch (queueError) {
      setError(
        queueError instanceof Error
          ? queueError.message
          : "Failed to add the track to your queue.",
      );
    } finally {
      setIsQueueingTrackId(null);
    }
  }

  async function handlePlayTrack(track: TrackCandidate) {
    setIsPlayingTrackId(track.spotifyTrackId);
    setError(null);
    setSuccessMessage(null);

    try {
      if (onPreparePlayback) {
        await onPreparePlayback();
      }

      await onPlayTrack?.(track);

      setSuccessMessage(`Playing "${track.title}" in this session.`);
    } catch (playError) {
      setError(
        playError instanceof Error
          ? playError.message
          : "Failed to start playback.",
      );
    } finally {
      setIsPlayingTrackId(null);
    }
  }

  async function handlePlayNextTrack(track: TrackCandidate) {
    setIsPlayingNextTrackId(track.spotifyTrackId);
    setError(null);
    setSuccessMessage(null);

    try {
      await onPlayNextTrack?.(track);

      setSuccessMessage(`"${track.title}" will play next in this session.`);
    } catch (playNextError) {
      setError(
        playNextError instanceof Error
          ? playNextError.message
          : "Failed to queue the track to play next.",
      );
    } finally {
      setIsPlayingNextTrackId(null);
    }
  }

  return (
    <SectionCard>
      <PanelHeader title="Search and queue" />

      <div className="search-panel">
        <div className="search-row">
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSearch();
              }
            }}
            placeholder="Search tracks, artists, or albums..."
            aria-label="Search Spotify tracks"
          />
          <Button
            variant="primary"
            onClick={handleSearch}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {successMessage ? <p className="success-text">{successMessage}</p> : null}

        {results.length > 0 ? (
          <div className="track-list">
            {results.map((track) => (
              <article key={track.spotifyTrackId} className="track-item">
                <div className="track-item__top">
                  <div className="search-result__content">
                    <h4 className="track-item__title marquee-text">
                      <span>{track.title}</span>
                    </h4>
                    <p className="track-item__artist marquee-text">
                      <span>{track.artistNames.join(", ")}</span>
                    </p>
                    <p className="track-item__reason marquee-text">
                      <span>{track.albumName ?? "Unknown album"}</span>
                    </p>
                  </div>

                  <div className="search-result__actions">
                    <Button
                      variant="ghost"
                      className="search-action-button"
                      onClick={() => handleQueueTrack(track)}
                      disabled={isQueueingTrackId === track.spotifyTrackId}
                    >
                      {isQueueingTrackId === track.spotifyTrackId
                        ? "Queueing..."
                        : "Add to queue"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="search-action-button"
                      onClick={() => handlePlayNextTrack(track)}
                      disabled={isPlayingNextTrackId === track.spotifyTrackId}
                    >
                      {isPlayingNextTrackId === track.spotifyTrackId
                        ? "Queuing next..."
                        : "Play next"}
                    </Button>
                    <Button
                      variant="ghost"
                      className="search-action-button"
                      onClick={() => handlePlayTrack(track)}
                      disabled={isPlayingTrackId === track.spotifyTrackId}
                    >
                      {isPlayingTrackId === track.spotifyTrackId
                        ? "Starting..."
                        : "Play now"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted-text">
            Search results will appear here once you query Spotify.
          </p>
        )}
      </div>
    </SectionCard>
  );
}
