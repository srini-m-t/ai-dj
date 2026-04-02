"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ApiResponse,
  GetSpotifyQueueResponse,
  GetPlaybackResponse,
  PlaybackControlResponse,
  QueueTrackSnapshot,
  PlaybackSnapshot,
  StartPlaybackResponse,
  TrackCandidate,
  SpotifyDevice,
  SpotifyDevicesResponse,
} from "@ai-dj/shared";

import { Container } from "@/components/ui/container";
import { BrowserPlaybackCard } from "@/components/player/browser-playback-card";
import { HeroPanel } from "@/components/ui/hero-panel";
import { NowPlayingCard } from "@/components/player/now-playing-card";
import { QueueSearchCard } from "@/components/player/queue-search-card";
import { UpcomingQueueCard } from "@/components/queue/upcoming-queue-card";
import { useSession } from "@/features/session/session-context";

const PLAYBACK_HISTORY_LIMIT = 5;

type PlaybackHistoryEntry = {
  trackId: string;
  trackTitle: string;
  artistNames: string[];
  albumName: string | null;
};

type UpcomingTrack = QueueTrackSnapshot & {
  tag: "Queued" | "Recommended";
};

export default function PlayerPage() {
  const { session, isLoading } = useSession();
  const [livePlayback, setLivePlayback] = useState<PlaybackSnapshot | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaybackLoading, setIsPlaybackLoading] = useState(true);
  const [hasResolvedPlayback, setHasResolvedPlayback] = useState(false);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [browserDevice, setBrowserDevice] = useState<{
    deviceId: string | null;
    deviceName: string;
    isReady: boolean;
  }>({
    deviceId: null,
    deviceName: "AI DJ Browser Player",
    isReady: false,
  });
  const [browserPlayback, setBrowserPlayback] = useState<PlaybackSnapshot | null>(null);
  const [browserControls, setBrowserControls] = useState<{
    togglePlay: (() => Promise<void>) | null;
    nextTrack: (() => Promise<void>) | null;
    previousTrack: (() => Promise<void>) | null;
    restartTrack: (() => Promise<void>) | null;
    seekTo: ((positionMs: number) => Promise<void>) | null;
    activateBrowserPlayback: (() => Promise<void>) | null;
    isPaused: boolean;
    ready: boolean;
  }>({
    togglePlay: null,
    nextTrack: null,
    previousTrack: null,
    restartTrack: null,
    seekTo: null,
    activateBrowserPlayback: null,
    isPaused: true,
    ready: false,
  });
  const [liveQueue, setLiveQueue] = useState<QueueTrackSnapshot[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [playbackHistory, setPlaybackHistory] = useState<PlaybackHistoryEntry[]>([]);
  const [recommendedTracks, setRecommendedTracks] = useState<TrackCandidate[]>([]);
  const [upcomingTracks, setUpcomingTracks] = useState<UpcomingTrack[]>([]);
  const [queueNotice, setQueueNotice] = useState<string | null>(null);
  const [seedTrack, setSeedTrack] = useState<TrackCandidate | null>(null);
  const lastTrackedPlaybackRef = useRef<PlaybackSnapshot | null>(null);
  const hasSeededQueueRef = useRef(false);
  const suppressNextHistoryPushRef = useRef(false);

  const handleBrowserDeviceChange = useCallback(
    (device: { deviceId: string | null; deviceName: string; isReady: boolean }) => {
      setBrowserDevice(device);
    },
    [],
  );

  const handleBrowserPlaybackChange = useCallback(
    ({
      playback,
      controls,
    }: {
      playback: PlaybackSnapshot | null;
      controls: {
        togglePlay: (() => Promise<void>) | null;
        nextTrack: (() => Promise<void>) | null;
        previousTrack: (() => Promise<void>) | null;
        restartTrack: (() => Promise<void>) | null;
        seekTo: ((positionMs: number) => Promise<void>) | null;
        activateBrowserPlayback: (() => Promise<void>) | null;
        isPaused: boolean;
        ready: boolean;
      };
    }) => {
      setBrowserPlayback(playback);
      setBrowserControls(controls);
    },
    [],
  );

  const refreshPlayback = useCallback(async () => {
    if (!session) {
      setIsPlaybackLoading(false);
      setHasResolvedPlayback(false);
      setLivePlayback(null);
      return;
    }

    if (!hasResolvedPlayback) {
      setIsPlaybackLoading(true);
    }
    setPlaybackError(null);

    try {
      const response = await fetch("/api/spotify/playback", {
        cache: "no-store",
      });

      const payload = (await response.json()) as ApiResponse<GetPlaybackResponse>;

      if (!payload.ok) {
        throw new Error(payload.error.message);
      }

      setLivePlayback(payload.data.playback);
      setHasResolvedPlayback(true);
    } catch (error) {
      setPlaybackError(
        error instanceof Error ? error.message : "Failed to load live playback.",
      );
      setHasResolvedPlayback(true);
    } finally {
      setIsPlaybackLoading(false);
    }
  }, [hasResolvedPlayback, session]);

  const refreshDevices = useCallback(async () => {
    if (!session) {
      setDevices([]);
      return;
    }

    setDevicesError(null);

    try {
      const response = await fetch("/api/spotify/player/devices", {
        cache: "no-store",
      });

      const payload = (await response.json()) as ApiResponse<SpotifyDevicesResponse>;

      if (!payload.ok) {
        throw new Error(payload.error.message);
      }

      setDevices(payload.data.devices);
    } catch (error) {
      setDevices([]);
      setDevicesError(
        error instanceof Error ? error.message : "Failed to load Spotify devices.",
      );
    }
  }, [session]);

  const refreshQueue = useCallback(async () => {
    if (!session) {
      setLiveQueue([]);
      return;
    }

    try {
      const response = await fetch("/api/spotify/queue", {
        cache: "no-store",
      });

      const payload = (await response.json()) as ApiResponse<GetSpotifyQueueResponse>;

      if (!payload.ok) {
        throw new Error(payload.error.message);
      }

      setLiveQueue(payload.data.queue);
      setQueueError(null);
    } catch (error) {
      setLiveQueue([]);
      setQueueError(
        error instanceof Error ? error.message : "Failed to load live queue.",
      );
    }
  }, [session]);

  const fetchRecommendations = useCallback(
    async (count = 11, persist = false) => {
      if (!session) {
        if (persist) {
          setRecommendedTracks([]);
        }
        return [] as TrackCandidate[];
      }

      try {
        const response = await fetch(
          `/api/spotify/recommendations/upcoming?count=${count}`,
          {
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as ApiResponse<{
          tracks: TrackCandidate[];
        }>;

        if (!payload.ok) {
          throw new Error(payload.error.message);
        }

        if (persist) {
          setRecommendedTracks(payload.data.tracks);
        }

        return payload.data.tracks;
      } catch {
        if (persist) {
          setRecommendedTracks([]);
        }

        return [] as TrackCandidate[];
      }
    },
    [session],
  );

  const refreshRecommendations = useCallback(
    async (count = 11) => fetchRecommendations(count, true),
    [fetchRecommendations],
  );

  useEffect(() => {
    let cancelled = false;
    void refreshPlayback();
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void refreshPlayback();
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshPlayback]);

  useEffect(() => {
    let cancelled = false;
    void refreshDevices();
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void refreshDevices();
      }
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshDevices]);

  useEffect(() => {
    let cancelled = false;
    void refreshQueue();
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void refreshQueue();
      }
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshQueue]);

  useEffect(() => {
    if (!session) {
      setPlaybackHistory([]);
      setUpcomingTracks([]);
      setQueueNotice(null);
      setSeedTrack(null);
      setHasResolvedPlayback(false);
      lastTrackedPlaybackRef.current = null;
      hasSeededQueueRef.current = false;
      return;
    }

    const storedHistory = window.localStorage.getItem(
      getPlaybackHistoryStorageKey(session.id),
    );

    if (!storedHistory) {
      setPlaybackHistory([]);
    } else {
      try {
        const parsedHistory = JSON.parse(storedHistory) as PlaybackHistoryEntry[];
        setPlaybackHistory(Array.isArray(parsedHistory) ? parsedHistory : []);
      } catch {
        setPlaybackHistory([]);
      }
    }

    const storedUpcomingQueue = window.localStorage.getItem(
      getUpcomingQueueStorageKey(session.id),
    );

    if (!storedUpcomingQueue) {
      setUpcomingTracks([]);
    } else {
      try {
        const parsedUpcomingQueue = JSON.parse(storedUpcomingQueue) as UpcomingTrack[];
        setUpcomingTracks(Array.isArray(parsedUpcomingQueue) ? parsedUpcomingQueue : []);
      } catch {
        setUpcomingTracks([]);
      }
    }

    const storedSeedTrack = window.localStorage.getItem(
      getSeedTrackStorageKey(session.id),
    );

    if (!storedSeedTrack) {
      setSeedTrack(null);
    } else {
      try {
        const parsedSeedTrack = JSON.parse(storedSeedTrack) as TrackCandidate;
        setSeedTrack(parsedSeedTrack);
      } catch {
        setSeedTrack(null);
      }
    }
  }, [session]);

  const playback = browserPlayback ?? livePlayback;

  useEffect(() => {
    if (!session) {
      return;
    }

    if (recommendedTracks.length === 0) {
      return;
    }

    setUpcomingTracks((currentTracks) => {
      const nextTracks = buildUpcomingTracks({
        currentTracks,
        recommendedTracks,
        currentTrackId: playback?.trackId ?? null,
      });

      if (session) {
        window.localStorage.setItem(
          getUpcomingQueueStorageKey(session.id),
          JSON.stringify(nextTracks),
        );
      }

      return nextTracks;
    });
  }, [playback?.trackId, recommendedTracks, session]);

  useEffect(() => {
    if (!session || hasSeededQueueRef.current) {
      return;
    }

    if (upcomingTracks.length > 0 || seedTrack) {
      hasSeededQueueRef.current = true;
      return;
    }

    let cancelled = false;

    void (async () => {
      const initialRecommendations = await fetchRecommendations(11, true);
      const [firstTrack] = initialRecommendations;

      if (!firstTrack || cancelled) {
        return;
      }

      const seededUpcoming = buildUpcomingTracks({
        currentTracks: [],
        recommendedTracks: initialRecommendations,
        currentTrackId: firstTrack.spotifyTrackId,
      });

      setSeedTrack(firstTrack);
      setUpcomingTracks(seededUpcoming);
      window.localStorage.setItem(
        getSeedTrackStorageKey(session.id),
        JSON.stringify(firstTrack),
      );
      window.localStorage.setItem(
        getUpcomingQueueStorageKey(session.id),
        JSON.stringify(seededUpcoming),
      );
      hasSeededQueueRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchRecommendations, seedTrack, session, upcomingTracks.length]);

  useEffect(() => {
    if (!session || !seedTrack || playback?.trackId) {
      return;
    }

    const seedActiveDevice =
      devices.find((device) => device.isActive) ??
      devices.find((device) => !device.isRestricted) ??
      null;
    const seedBrowserDevice =
      devices.find((device) => device.name === browserDevice.deviceName) ?? null;
    const seedQueueDeviceId =
      browserDevice.deviceId ??
      seedBrowserDevice?.id ??
      livePlayback?.deviceId ??
      seedActiveDevice?.id ??
      null;

    if (!seedQueueDeviceId) {
      return;
    }

    void (async () => {
      try {
        await startManagedPlayback({
          spotifyTrackId: seedTrack.spotifyTrackId,
          deviceId: seedQueueDeviceId,
          upcoming: upcomingTracks,
        });
        await refreshPlayback();
      } catch {
        // Leave the app-managed queue seeded even if autoplay/start fails.
      }
    })();
  }, [
    browserDevice.deviceId,
    browserDevice.deviceName,
    devices,
    livePlayback?.deviceId,
    playback?.trackId,
    refreshPlayback,
    seedTrack,
    session,
    upcomingTracks,
  ]);

  useEffect(() => {
    if (!session) {
      lastTrackedPlaybackRef.current = null;
      return;
    }

    if (!playback?.trackId) {
      return;
    }

    const previousPlayback = lastTrackedPlaybackRef.current;

    if (previousPlayback?.trackId && previousPlayback.trackId !== playback.trackId) {
      if (suppressNextHistoryPushRef.current) {
        suppressNextHistoryPushRef.current = false;
        lastTrackedPlaybackRef.current = playback;
        return;
      }

      setPlaybackHistory((currentHistory) => {
        const lastHistoryTrackId =
          currentHistory.length > 0
            ? currentHistory[currentHistory.length - 1]?.trackId
            : null;

        if (lastHistoryTrackId === previousPlayback.trackId) {
          return currentHistory;
        }

        const nextHistory = [
          ...currentHistory,
          {
            trackId: previousPlayback.trackId as string,
            trackTitle: previousPlayback.trackTitle ?? "Previous track",
            artistNames: previousPlayback.artistNames,
            albumName: previousPlayback.albumName,
          },
        ].slice(-PLAYBACK_HISTORY_LIMIT);

        window.localStorage.setItem(
          getPlaybackHistoryStorageKey(session.id),
          JSON.stringify(nextHistory),
        );

        return nextHistory;
      });

      setUpcomingTracks((currentTracks) => {
        const nextTracks = buildUpcomingTracks({
          currentTracks,
          recommendedTracks,
          currentTrackId: playback.trackId,
        });

        window.localStorage.setItem(
          getUpcomingQueueStorageKey(session.id),
          JSON.stringify(nextTracks),
        );

        return nextTracks;
      });
    }

    lastTrackedPlaybackRef.current = playback;
  }, [playback, recommendedTracks, session]);

  useEffect(() => {
    if (!queueNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setQueueNotice(null);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queueNotice]);

  if (isLoading || !session) {
    return (
      <main className="page-section">
        <Container>
          <div className="stack-lg">
            <HeroPanel
              eyebrow="Player"
              title="Playback view"
              description="Track the current song, active device, and the next songs the AI DJ wants to play."
            />
            <SectionStateMessage message="Loading your persisted session..." />
          </div>
        </Container>
      </main>
    );
  }

  const progressLabel = formatProgressLabel(playback);
  const playbackStatusLabel =
    !hasResolvedPlayback
      ? "Checking playback"
      : playback?.isPlaying
        ? "Playback active"
        : playback
          ? "Playback paused"
          : "Playback unavailable";
  const playbackStatusTone =
    playbackStatusLabel === "Checking playback"
      ? "neutral"
      : playbackStatusLabel === "Playback unavailable"
        ? "danger"
        : "success";
  const activeDevice =
    devices.find((device) => device.isActive) ??
    devices.find((device) => !device.isRestricted) ??
    null;
  const browserDeviceFromSpotify =
    devices.find((device) => device.name === browserDevice.deviceName) ?? null;
  const effectiveBrowserDeviceId =
    browserDevice.deviceId ?? browserDeviceFromSpotify?.id ?? null;
  const queueDeviceId =
    effectiveBrowserDeviceId ?? livePlayback?.deviceId ?? activeDevice?.id ?? null;
  const queueDeviceName =
    effectiveBrowserDeviceId
      ? browserDevice.deviceName
      : livePlayback?.deviceName ?? activeDevice?.name ?? null;
  const deviceStatusMessage = devicesError
    ? devicesError
    : queueDeviceId
      ? `Queue actions will target ${queueDeviceName ?? "your active Spotify device"}.`
      : "No active Spotify device detected yet. Start playback in Spotify, then try again.";
  const fallbackControlsReady = Boolean(queueDeviceId);
  const previousHistoryEntry =
    playbackHistory.length > 0 ? playbackHistory[playbackHistory.length - 1] : null;
  const nextUpcomingTrack = upcomingTracks[0] ?? null;

  function persistUpcomingTracks(nextTracks: UpcomingTrack[]) {
    console.log("[player-queue] persistUpcomingTracks", {
      nextCount: nextTracks.length,
      trackIds: nextTracks.map((track) => track.spotifyTrackId),
    });
    setUpcomingTracks(nextTracks);
    if (!session) {
      return;
    }

    window.localStorage.setItem(
      getUpcomingQueueStorageKey(session.id),
      JSON.stringify(nextTracks),
    );
  }

  async function handleFallbackPlaybackControl(
    action: "resume" | "pause" | "next" | "previous" | "restart" | "seek",
    positionMs?: number,
  ) {
    const response = await fetch("/api/spotify/playback/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        deviceId: queueDeviceId ?? undefined,
        positionMs,
      }),
    });

    const payload =
      (await response.json()) as ApiResponse<PlaybackControlResponse>;

    if (!payload.ok) {
      throw new Error(payload.error.message);
    }

    if (action !== "previous") {
      setQueueNotice(null);
    }

    await refreshPlayback();
    await refreshDevices();
    await refreshQueue();
  }

  async function handlePlayHistoryEntry(entry: PlaybackHistoryEntry) {
    if (!session) {
      return;
    }

    const currentPlayback = playback;
    const nextUpcomingTracks = buildUpcomingTracks({
      currentTracks: [
        ...(currentPlayback?.trackId
          ? [
              {
                spotifyTrackId: currentPlayback.trackId,
                title: currentPlayback.trackTitle ?? "Current track",
                artistNames: currentPlayback.artistNames,
                albumName: currentPlayback.albumName,
                imageUrl: currentPlayback.imageUrl,
                tag: "Queued" as const,
              },
            ]
          : []),
        ...upcomingTracks.filter((track) => track.spotifyTrackId !== entry.trackId),
      ],
      recommendedTracks,
      currentTrackId: entry.trackId,
    });

    suppressNextHistoryPushRef.current = true;

    await startManagedPlayback({
      spotifyTrackId: entry.trackId,
      deviceId: queueDeviceId ?? undefined,
      upcoming: nextUpcomingTracks,
    });

    persistUpcomingTracks(nextUpcomingTracks);

    setPlaybackHistory((currentHistory) => {
      const nextHistory = currentHistory.slice(0, -1);
      window.localStorage.setItem(
        getPlaybackHistoryStorageKey(session.id),
        JSON.stringify(nextHistory),
      );
      return nextHistory;
    });

    await refreshPlayback();
    await refreshDevices();
  }

  function insertQueuedTrack(track: TrackCandidate, placement: "start" | "end") {
    const filteredTracks = upcomingTracks.filter(
      (item) =>
        item.spotifyTrackId !== track.spotifyTrackId || item.tag === "Recommended",
    );

    const nextTrack: UpcomingTrack = {
      ...track,
      tag: "Queued",
    };

    const nextTracks = buildUpcomingTracks({
      currentTracks:
        placement === "start"
          ? [nextTrack, ...filteredTracks]
          : [...filteredTracks, nextTrack],
      recommendedTracks,
      currentTrackId: playback?.trackId ?? null,
    });

    persistUpcomingTracks(nextTracks);
  }

  function removeCurrentTrackFromUpcoming(trackId: string) {
    persistUpcomingTracks(
      buildUpcomingTracks({
        currentTracks: upcomingTracks.filter(
          (track) => track.spotifyTrackId !== trackId,
        ),
        recommendedTracks,
        currentTrackId: trackId,
      }),
    );
  }

  async function handleResetQueue() {
    if (!session) {
      return;
    }

    console.log("[player-queue] handleResetQueue:start", {
      currentTrackId: playback?.trackId ?? null,
      currentUpcomingCount: upcomingTracks.length,
    });

    setPlaybackHistory([]);
    setQueueNotice("Upcoming list reset");
    window.localStorage.removeItem(getPlaybackHistoryStorageKey(session.id));
    const nextRecommendedTracks = await refreshRecommendations(10);
    const nextTracks = pickRecommendedUpcomingTracks({
      candidates:
        nextRecommendedTracks.length > 0 ? nextRecommendedTracks : recommendedTracks,
      currentTrackId: playback?.trackId ?? null,
      existingTrackIds: new Set<string>(),
      count: 10,
    });
    console.log("[player-queue] handleResetQueue:nextTracks", {
      count: nextTracks.length,
      trackIds: nextTracks.map((track) => track.spotifyTrackId),
    });
    persistUpcomingTracks(nextTracks);
  }

  function handleMoveUpcomingTrack(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= upcomingTracks.length ||
      toIndex >= upcomingTracks.length ||
      fromIndex === toIndex
    ) {
      return;
    }

    const nextTracks = [...upcomingTracks];
    const [movedTrack] = nextTracks.splice(fromIndex, 1);

    if (!movedTrack) {
      return;
    }

    nextTracks.splice(toIndex, 0, movedTrack);
    persistUpcomingTracks(nextTracks);
  }

  function handleMoveUpcomingTrackToPosition(fromIndex: number, toIndex: number) {
    handleMoveUpcomingTrack(
      fromIndex,
      Math.min(Math.max(toIndex, 0), upcomingTracks.length - 1),
    );
  }

  async function handleDeleteUpcomingTrack(index: number) {
    console.log("[player-queue] handleDeleteUpcomingTrack:start", {
      index,
      currentUpcomingCount: upcomingTracks.length,
    });
    const currentTracks = upcomingTracks.filter(
      (_, currentIndex) => currentIndex !== index,
    );
    const existingTrackIds = new Set(
      currentTracks.map((track) => track.spotifyTrackId),
    );
    const neededCount = Math.max(0, 10 - currentTracks.length);
    const nextRecommendedTracks =
      neededCount > 0
        ? await refreshRecommendations(Math.max(neededCount * 3, 10))
        : [];
    const refillTracks = pickRecommendedUpcomingTracks({
      candidates:
        nextRecommendedTracks.length > 0 ? nextRecommendedTracks : recommendedTracks,
      currentTrackId: playback?.trackId ?? null,
      existingTrackIds,
      count: neededCount,
    });
    const nextTracks = [...currentTracks, ...refillTracks];
    console.log("[player-queue] handleDeleteUpcomingTrack:nextTracks", {
      count: nextTracks.length,
      trackIds: nextTracks.map((track) => track.spotifyTrackId),
    });

    persistUpcomingTracks(nextTracks);
  }

  async function handleRecommendSong() {
    console.log("[player-queue] handleRecommendSong:start", {
      currentTrackId: playback?.trackId ?? null,
      currentUpcomingCount: upcomingTracks.length,
      currentUpcomingTrackIds: upcomingTracks.map((track) => track.spotifyTrackId),
    });
    const nextRecommendedTracks = await fetchRecommendations(25, false);
    console.log("[player-queue] handleRecommendSong:fetched", {
      fetchedCount: nextRecommendedTracks.length,
      fetchedTrackIds: nextRecommendedTracks.map((track) => track.spotifyTrackId),
    });
    const recommendedTrack = pickRecommendedUpcomingTracks({
      candidates: dedupeTrackCandidates([
        ...nextRecommendedTracks,
        ...recommendedTracks,
      ]),
      currentTrackId: playback?.trackId ?? null,
      existingTrackIds: new Set(upcomingTracks.map((track) => track.spotifyTrackId)),
      count: 1,
    })[0];

    if (!recommendedTrack) {
      console.log("[player-queue] handleRecommendSong:no-track");
      setQueueNotice("No new recommendation available");
      return;
    }

    console.log("[player-queue] handleRecommendSong:selected", {
      trackId: recommendedTrack.spotifyTrackId,
      title: recommendedTrack.title,
    });
    persistUpcomingTracks([
      ...upcomingTracks,
      recommendedTrack,
    ]);
    setQueueNotice(`Added ${recommendedTrack.title}`);
  }

  async function handleSelectUpcomingTrack(index: number) {
    const selectedTrack = upcomingTracks[index];

    if (!selectedTrack) {
      return;
    }

    const nextTracks = buildUpcomingTracks({
      currentTracks: upcomingTracks.filter(
        (track) => track.spotifyTrackId !== selectedTrack.spotifyTrackId,
      ),
      recommendedTracks,
      currentTrackId: selectedTrack.spotifyTrackId,
    });

    await startManagedPlayback({
      spotifyTrackId: selectedTrack.spotifyTrackId,
      deviceId: queueDeviceId ?? undefined,
      upcoming: nextTracks,
    });

    persistUpcomingTracks(nextTracks);
    await refreshPlayback();
    await refreshDevices();
  }

  return (
    <main className="page-section">
      <Container>
        <div className="stack-lg">
          <HeroPanel
            eyebrow="Player"
            title="Playback view"
            description="Track the current song, active device, and the next songs the AI DJ wants to play."
          />

          <BrowserPlaybackCard
            onBrowserDeviceChange={handleBrowserDeviceChange}
            onBrowserPlaybackChange={handleBrowserPlaybackChange}
            onActivationComplete={async () => {
              await refreshDevices();
              await refreshPlayback();
            }}
            browserDeviceSnapshot={{
              deviceId: effectiveBrowserDeviceId,
              deviceName: browserDevice.deviceName,
              isReady: Boolean(effectiveBrowserDeviceId),
            }}
            browserPlaybackSnapshot={
              playback?.deviceName === browserDevice.deviceName ? playback : null
            }
          />

          <div className="grid-auto-wide">
            <NowPlayingCard
              trackTitle={playback?.trackTitle ?? "Nothing playing"}
              artistName={playback?.artistNames.join(", ") ?? "No artist"}
              albumName={playback?.albumName ?? "Unknown album"}
              deviceName={playback?.deviceName ?? "No active device"}
              progressLabel={progressLabel}
              statusLabel={playbackStatusLabel}
              statusTone={playbackStatusTone}
              onPlayPause={
                browserControls.togglePlay
                  ? async () => {
                      await browserControls.togglePlay?.();
                      await refreshPlayback();
                    }
                  : fallbackControlsReady
                    ? async () => {
                        await handleFallbackPlaybackControl(
                          playback?.isPlaying ? "pause" : "resume",
                        );
                      }
                    : undefined
              }
              onNext={
                nextUpcomingTrack
                  ? async () => {
                      await handleSelectUpcomingTrack(0);
                    }
                  : undefined
              }
              onPrevious={
                previousHistoryEntry
                  ? async () => {
                      await handlePlayHistoryEntry(previousHistoryEntry);
                    }
                  : undefined
              }
              onRestart={
                browserControls.restartTrack
                  ? async () => {
                      await browserControls.restartTrack?.();
                      await refreshPlayback();
                    }
                  : fallbackControlsReady
                    ? async () => {
                        await handleFallbackPlaybackControl("restart");
                      }
                    : undefined
              }
              playPauseLabel={
                browserControls.ready
                  ? browserControls.isPaused
                    ? "Play"
                    : "Pause"
                  : playback?.isPlaying
                    ? "Pause"
                    : "Play"
              }
              previousDisabled={!previousHistoryEntry}
              nextDisabled={!nextUpcomingTrack}
              controlsDisabled={!browserControls.ready && !fallbackControlsReady}
              progressMs={playback?.progressMs ?? null}
              durationMs={playback?.durationMs ?? null}
              onSeek={
                browserControls.seekTo
                  ? async (positionMs) => {
                      await browserControls.seekTo?.(positionMs);
                      await refreshPlayback();
                    }
                  : fallbackControlsReady
                    ? async (positionMs) => {
                        await handleFallbackPlaybackControl("seek", positionMs);
                      }
                    : undefined
              }
            />

            <UpcomingQueueCard
              tracks={
                upcomingTracks.length > 0
                  ? upcomingTracks.map((track) => ({
                      id: track.spotifyTrackId,
                      title: track.title,
                      artistNames: track.artistNames,
                      reason: track.albumName ?? "Saved recommendation",
                      tag: track.tag,
                    }))
                  : []
              }
              onResetQueue={handleResetQueue}
              onMoveTrack={handleMoveUpcomingTrack}
              onMoveTrackToPosition={handleMoveUpcomingTrackToPosition}
              onDeleteTrack={handleDeleteUpcomingTrack}
              onPlayTrack={handleSelectUpcomingTrack}
              onRecommendSong={handleRecommendSong}
              resetMessage={queueNotice}
            />
          </div>

          {queueError ? <p className="muted-text">{queueError}</p> : null}

          <QueueSearchCard
            deviceId={queueDeviceId}
            deviceName={queueDeviceName}
            deviceStatusMessage={deviceStatusMessage}
            onPlayTrack={async (track) => {
              const nextTracks = buildUpcomingTracks({
                currentTracks: upcomingTracks.filter(
                  (upcomingTrack) => upcomingTrack.spotifyTrackId !== track.spotifyTrackId,
                ),
                recommendedTracks,
                currentTrackId: track.spotifyTrackId,
              });

              await startManagedPlayback({
                spotifyTrackId: track.spotifyTrackId,
                deviceId: queueDeviceId ?? undefined,
                upcoming: nextTracks,
              });

              persistUpcomingTracks(nextTracks);
              await refreshPlayback();
              await refreshDevices();
            }}
            onPlayNextTrack={async (track) => {
              insertQueuedTrack(track, "start");
            }}
            onQueueTrack={async (track) => {
              insertQueuedTrack(track, "end");
            }}
            onPreparePlayback={browserControls.activateBrowserPlayback ?? undefined}
          />
        </div>
      </Container>
    </main>
  );
}

function SectionStateMessage({ message }: { message: string }) {
  return <p className="muted-text">{message}</p>;
}

function formatProgressLabel(playback: PlaybackSnapshot | null) {
  if (!playback || playback.progressMs === null || playback.durationMs === null) {
    return "No playback data";
  }

  return `${Math.floor(playback.progressMs / 60000)}:${String(
    Math.floor((playback.progressMs % 60000) / 1000),
  ).padStart(2, "0")} / ${Math.floor(playback.durationMs / 60000)}:${String(
    Math.floor((playback.durationMs % 60000) / 1000),
  ).padStart(2, "0")}`;
}

function getPlaybackHistoryStorageKey(sessionId: string) {
  return `ai-dj-playback-history:${sessionId}`;
}

function getUpcomingQueueStorageKey(sessionId: string) {
  return `ai-dj-upcoming-queue:${sessionId}`;
}

function getSeedTrackStorageKey(sessionId: string) {
  return `ai-dj-seed-track:${sessionId}`;
}

function buildUpcomingTracks({
  currentTracks,
  recommendedTracks,
  currentTrackId,
}: {
  currentTracks: UpcomingTrack[];
  recommendedTracks: TrackCandidate[];
  currentTrackId: string | null;
}) {
  const filteredTracks = currentTracks.filter(
    (track) => track.spotifyTrackId !== currentTrackId,
  );
  const seenTrackIds = new Set(filteredTracks.map((track) => track.spotifyTrackId));
  const nextTracks = [...filteredTracks];
  const shuffledRecommendations = shuffleTracks(recommendedTracks);

  for (const track of shuffledRecommendations) {
    if (nextTracks.length >= 10) {
      break;
    }

    if (track.spotifyTrackId === currentTrackId || seenTrackIds.has(track.spotifyTrackId)) {
      continue;
    }

    nextTracks.push({
      ...track,
      tag: "Recommended",
    });
    seenTrackIds.add(track.spotifyTrackId);
  }

  return nextTracks;
}

function shuffleTracks<T>(tracks: T[]) {
  const nextTracks = [...tracks];

  for (let index = nextTracks.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const currentTrack = nextTracks[index];
    const swapTrack = nextTracks[swapIndex];

    if (currentTrack === undefined || swapTrack === undefined) {
      continue;
    }

    nextTracks[index] = swapTrack;
    nextTracks[swapIndex] = currentTrack;
  }

  return nextTracks;
}

function dedupeTrackCandidates(tracks: TrackCandidate[]) {
  const seenTrackIds = new Set<string>();

  return tracks.filter((track) => {
    if (seenTrackIds.has(track.spotifyTrackId)) {
      return false;
    }

    seenTrackIds.add(track.spotifyTrackId);
    return true;
  });
}

function pickRecommendedUpcomingTracks({
  candidates,
  currentTrackId,
  existingTrackIds,
  count,
}: {
  candidates: TrackCandidate[];
  currentTrackId: string | null;
  existingTrackIds: Set<string>;
  count: number;
}) {
  const nextTracks: UpcomingTrack[] = [];
  const seenTrackIds = new Set(existingTrackIds);

  for (const track of shuffleTracks(candidates)) {
    if (nextTracks.length >= count) {
      break;
    }

    if (track.spotifyTrackId === currentTrackId || seenTrackIds.has(track.spotifyTrackId)) {
      continue;
    }

    nextTracks.push({
      ...track,
      tag: "Recommended",
    });
    seenTrackIds.add(track.spotifyTrackId);
  }

  return nextTracks;
}

async function startManagedPlayback({
  spotifyTrackId,
  deviceId,
  upcoming,
  positionMs = 0,
}: {
  spotifyTrackId: string;
  deviceId?: string;
  upcoming: UpcomingTrack[];
  positionMs?: number;
}) {
  const response = await fetch("/api/spotify/playback/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      spotifyTrackId,
      spotifyTrackIds: upcoming.map((track) => track.spotifyTrackId),
      deviceId,
      positionMs,
    }),
  });

  const payload = (await response.json()) as ApiResponse<StartPlaybackResponse>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }
}
