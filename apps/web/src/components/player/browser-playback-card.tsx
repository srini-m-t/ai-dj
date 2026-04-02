"use client";

import { useEffect, useRef, useState } from "react";

import type { ApiResponse } from "@ai-dj/shared";

import { Button } from "@/components/ui/button";
import { PanelHeader } from "@/components/ui/panel-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PlaybackSnapshot } from "@ai-dj/shared";

type SpotifySdkTokenResponse = {
  token: string;
  premium: boolean | null;
};

type TransferPlaybackResponse = {
  transferred: true;
};

type BrowserPlaybackCardProps = {
  onBrowserDeviceChange: (device: {
    deviceId: string | null;
    deviceName: string;
    isReady: boolean;
  }) => void;
  onActivationComplete?: () => Promise<void> | void;
  browserDeviceSnapshot?: {
    deviceId: string | null;
    deviceName: string;
    isReady: boolean;
  };
  browserPlaybackSnapshot?: PlaybackSnapshot | null;
  onBrowserPlaybackChange: (payload: {
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
  }) => void;
};

const BROWSER_PLAYER_NAME = "AI DJ Browser Player";

/**
 * Boots the Spotify Web Playback SDK so the current browser tab can become a
 * first-class Spotify Connect device for playback and queue targeting.
 */
export function BrowserPlaybackCard({
  onBrowserDeviceChange,
  onActivationComplete,
  browserDeviceSnapshot,
  browserPlaybackSnapshot,
  onBrowserPlaybackChange,
}: BrowserPlaybackCardProps) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const currentDeviceIdRef = useRef<string | null>(null);
  const tokenRef = useRef<{ value: string; fetchedAt: number } | null>(null);
  const tokenRequestRef = useRef<Promise<string> | null>(null);
  const playbackActivationRef = useRef<(() => Promise<void>) | null>(null);
  const shouldAutoTransferRef = useRef(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [canEnableBrowserPlayback, setCanEnableBrowserPlayback] = useState(false);
  const [hasActivatedBrowserPlayback, setHasActivatedBrowserPlayback] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const effectiveDeviceId = deviceId ?? browserDeviceSnapshot?.deviceId ?? null;
  const effectiveDeviceReady = isSdkReady || browserDeviceSnapshot?.isReady === true;
  const isWaitingForBrowserDevice = hasActivatedBrowserPlayback && !effectiveDeviceReady;

  useEffect(() => {
    let isMounted = true;
    let statePollIntervalId: number | null = null;

    function buildPlaybackSnapshot(state: SpotifyWebPlaybackState): PlaybackSnapshot {
      return {
        source: "sdk",
        isPlaying: !state.paused,
        deviceId: currentDeviceIdRef.current,
        deviceName: BROWSER_PLAYER_NAME,
        trackId: state.track_window.current_track.id,
        trackTitle: state.track_window.current_track.name,
        artistNames: state.track_window.current_track.artists.map(
          (artist) => artist.name,
        ),
        albumName: state.track_window.current_track.album.name,
        imageUrl: state.track_window.current_track.album.images[0]?.url ?? null,
        progressMs: state.position,
        durationMs: state.duration,
        fetchedAt: new Date().toISOString(),
      };
    }

    function pushPlaybackState(state: SpotifyWebPlaybackState | null) {
      if (!isMounted) {
        return;
      }

      if (!state) {
        setCurrentTrack(null);
        onBrowserPlaybackChange({
          playback: null,
          controls: {
            togglePlay: null,
            nextTrack: null,
            previousTrack: null,
            restartTrack: null,
            seekTo: null,
            activateBrowserPlayback: playbackActivationRef.current,
            isPaused: true,
            ready: false,
          },
        });
        return;
      }

      setCurrentTrack(state.track_window.current_track.name);
      onBrowserPlaybackChange({
        playback: buildPlaybackSnapshot(state),
        controls: {
          togglePlay: async () => {
            await playerRef.current?.togglePlay();
          },
          nextTrack: async () => {
            await playerRef.current?.nextTrack();
          },
          previousTrack: async () => {
            await playerRef.current?.previousTrack();
          },
          restartTrack: async () => {
            await playerRef.current?.seek(0);
          },
          seekTo: async (positionMs: number) => {
            await playerRef.current?.seek(positionMs);
          },
          activateBrowserPlayback: playbackActivationRef.current,
          isPaused: state.paused,
          ready: true,
        },
      });
    }

    async function fetchSdkToken(forceRefresh = false) {
      const cachedToken = tokenRef.current;

      if (
        !forceRefresh &&
        cachedToken &&
        Date.now() - cachedToken.fetchedAt < 45 * 60 * 1000
      ) {
        return cachedToken.value;
      }

      if (!forceRefresh && tokenRequestRef.current) {
        return tokenRequestRef.current;
      }

      const pendingRequest = (async () => {
        const response = await fetch("/api/auth/spotify/sdk-token", {
          cache: "no-store",
        });

        const payload =
          (await response.json()) as ApiResponse<SpotifySdkTokenResponse>;

        if (!payload.ok) {
          throw new Error(payload.error.message);
        }

        if (isMounted) {
          setIsAuthenticated(true);
          setIsPremium(payload.data.premium);
        }

        tokenRef.current = {
          value: payload.data.token,
          fetchedAt: Date.now(),
        };

        return payload.data.token;
      })();

      tokenRequestRef.current = pendingRequest;

      try {
        return await pendingRequest;
      } finally {
        tokenRequestRef.current = null;
      }
    }

    async function initializePlayer() {
      try {
        await fetchSdkToken();
      } catch (error) {
        if (isMounted) {
          setIsAuthenticated(false);
          setSdkError(
            error instanceof Error
              ? error.message
              : "Failed to initialize browser playback.",
          );
        }
        return;
      }

      await loadSpotifySdkScript();

      if (!window.Spotify) {
        if (isMounted) {
          setSdkError("Spotify Web Playback SDK did not load.");
        }
        return;
      }

      if (playerRef.current) {
        return;
      }

      const player = new window.Spotify.Player({
        name: BROWSER_PLAYER_NAME,
        getOAuthToken: async (callback) => {
          try {
            const token = await fetchSdkToken();
            callback(token);
          } catch (error) {
            if (isMounted) {
              setIsAuthenticated(false);
              setSdkError(
                error instanceof Error
                  ? error.message
                  : "Spotify player authentication failed.",
              );
            }

            playerRef.current?.disconnect();
          }
        },
        volume: 0.8,
      });

      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        if (!isMounted) {
          return;
        }

        currentDeviceIdRef.current = device_id;
        setDeviceId(device_id);
        setIsSdkReady(true);
        setSdkError(null);
        onBrowserDeviceChange({
          deviceId: device_id,
          deviceName: BROWSER_PLAYER_NAME,
          isReady: true,
        });
        onBrowserPlaybackChange({
          playback: null,
          controls: {
            togglePlay: null,
            nextTrack: null,
            previousTrack: null,
            restartTrack: null,
            seekTo: null,
            activateBrowserPlayback: playbackActivationRef.current,
            isPaused: true,
            ready: false,
          },
        });

        if (shouldAutoTransferRef.current && playbackActivationRef.current) {
          shouldAutoTransferRef.current = false;
          void playbackActivationRef.current().catch((error: unknown) => {
            if (!isMounted) {
              return;
            }

            setSdkError(
              error instanceof Error
                ? error.message
                : "Failed to activate browser playback.",
            );
          });
        }
      });

      player.addListener("not_ready", () => {
        if (!isMounted) {
          return;
        }

        currentDeviceIdRef.current = null;
        setDeviceId(null);
        setIsSdkReady(false);
        onBrowserDeviceChange({
          deviceId: null,
          deviceName: BROWSER_PLAYER_NAME,
          isReady: false,
        });
        pushPlaybackState(null);
      });

      player.addListener("player_state_changed", (state?: SpotifyWebPlaybackState) => {
        if (!isMounted || !state) {
          return;
        }

        pushPlaybackState(state);
      });

      player.addListener("initialization_error", (error?: SpotifyPlayerError) => {
        if (isMounted) {
          setSdkError(error?.message ?? "Spotify player initialization failed.");
        }
      });

      player.addListener("authentication_error", (error?: SpotifyPlayerError) => {
        if (isMounted) {
          setSdkError(error?.message ?? "Spotify player authentication failed.");
        }
      });

      player.addListener("account_error", (error?: SpotifyPlayerError) => {
        if (isMounted) {
          setSdkError(
            error?.message ?? "Spotify Premium is required for browser playback.",
          );
        }
      });

      player.addListener("playback_error", (error?: SpotifyPlayerError) => {
        if (isMounted) {
          setSdkError(error?.message ?? "Spotify playback failed.");
        }
      });

      player.addListener("autoplay_failed", () => {
        if (isMounted) {
          setSdkError(
            "Browser autoplay was blocked. Click enable browser playback again.",
          );
        }
      });

      playerRef.current = player;
      playbackActivationRef.current = async () => {
        if (!playerRef.current) {
          throw new Error("Browser playback is still loading.");
        }

        await playerRef.current.activateElement();
        setHasActivatedBrowserPlayback(true);

        if (!currentDeviceIdRef.current) {
          shouldAutoTransferRef.current = true;
          return;
        }

        const response = await fetch("/api/spotify/playback/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deviceId: currentDeviceIdRef.current,
            play: true,
          }),
        });

        const payload =
          (await response.json()) as ApiResponse<TransferPlaybackResponse>;

        if (!payload.ok) {
          throw new Error(payload.error.message);
        }
      };
      setCanEnableBrowserPlayback(true);
      await player.connect();

      statePollIntervalId = window.setInterval(async () => {
        const currentState = await player.getCurrentState();
        pushPlaybackState(currentState);
      }, 1000);
    }

    void initializePlayer();

    return () => {
      isMounted = false;
      currentDeviceIdRef.current = null;
      tokenRequestRef.current = null;
      playbackActivationRef.current = null;
      setCanEnableBrowserPlayback(false);
      if (statePollIntervalId !== null) {
        window.clearInterval(statePollIntervalId);
      }
      playerRef.current?.disconnect();
      playerRef.current = null;
      onBrowserDeviceChange({
        deviceId: null,
        deviceName: BROWSER_PLAYER_NAME,
        isReady: false,
      });
      onBrowserPlaybackChange({
        playback: null,
        controls: {
          togglePlay: null,
          nextTrack: null,
          previousTrack: null,
          restartTrack: null,
          seekTo: null,
          activateBrowserPlayback: null,
          isPaused: true,
          ready: false,
        },
      });
    };
  }, [onBrowserDeviceChange, onBrowserPlaybackChange]);

  async function handleActivateBrowserPlayback() {
    if (!playbackActivationRef.current) {
      return;
    }

    setIsActivating(true);
    setSdkError(null);

    try {
      await playbackActivationRef.current();
      await onActivationComplete?.();
    } catch (error) {
      setSdkError(
        error instanceof Error
          ? error.message
          : "Failed to activate browser playback.",
      );
    } finally {
      setIsActivating(false);
    }
  }

  const statusLabel = effectiveDeviceReady
    ? "Browser player ready"
    : isWaitingForBrowserDevice
      ? "Browser player connecting"
      : "Browser player starting";
  const statusTone = effectiveDeviceReady ? "success" : "danger";
  const helperText = sdkError
    ? sdkError
    : isAuthenticated === false
      ? "Connect Spotify on this browser origin to initialize browser playback."
    : isPremium === false
      ? "Spotify Premium is required for playback in this browser tab."
      : hasActivatedBrowserPlayback && effectiveDeviceReady
        ? "Browser playback is enabled. This tab is ready to act as your Spotify device."
      : isWaitingForBrowserDevice
        ? "Browser playback has been enabled. Waiting for the tab device to finish registering."
      : isPremium === null
        ? "Spotify is connected. Premium status is being inferred from the playback SDK."
      : effectiveDeviceReady
        ? `Browser device registered as ${BROWSER_PLAYER_NAME}.`
        : "Preparing this browser tab as a Spotify Connect device.";
  const headerControl = hasActivatedBrowserPlayback ? (
    <span className="button button--static button--enabled">
      {isWaitingForBrowserDevice ? (
        <>
          <span className="loading-dot" aria-hidden="true" />
          Browser playback enabling
        </>
      ) : (
        "Browser playback enabled"
      )}
    </span>
  ) : (
    <Button
      variant="primary"
      onClick={handleActivateBrowserPlayback}
      disabled={!canEnableBrowserPlayback || isActivating || isPremium === false}
    >
      {isActivating ? (
        <>
          <span className="loading-dot" aria-hidden="true" />
          Enabling browser playback
        </>
      ) : (
        "Enable browser playback"
      )}
    </Button>
  );

  return (
    <SectionCard>
      <PanelHeader
        title={headerControl}
        action={<StatusBadge label={statusLabel} tone={statusTone} />}
      />

      <div className="stack-md">
        {sdkError ? <p className="error-text">{helperText}</p> : null}

        <div className="info-list">
          <div className="info-row">
            <span className="info-row__label">Browser device</span>
            <span className="info-row__value">
              {effectiveDeviceId ? BROWSER_PLAYER_NAME : "Not ready yet"}
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

async function loadSpotifySdkScript() {
  if (window.Spotify) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-spotify-sdk="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Spotify Web Playback SDK.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.dataset.spotifySdk = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Spotify Web Playback SDK."));
    document.body.appendChild(script);
  });

  if (window.Spotify) {
    return;
  }

  await new Promise<void>((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
  });
}
