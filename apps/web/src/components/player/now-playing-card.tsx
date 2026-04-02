import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PanelHeader } from "@/components/ui/panel-header";

type NowPlayingCardProps = {
  trackTitle: string;
  artistName: string;
  albumName: string;
  deviceName: string;
  progressLabel: string;
  statusLabel?: string;
  statusTone?: "success" | "danger" | "neutral";
  helperText?: string;
  onPrevious?: () => void;
  onPlayPause?: () => void;
  onRestart?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  playPauseLabel?: string;
  controlsDisabled?: boolean;
  progressMs?: number | null;
  durationMs?: number | null;
  onSeek?: (positionMs: number) => Promise<void> | void;
};

/**
 * Mock now-playing card for early UI development.
 * Later this will be fed from Spotify playback state.
 */
export function NowPlayingCard({
  trackTitle,
  artistName,
  albumName,
  deviceName,
  progressLabel,
  statusLabel = `Connected to ${deviceName}`,
  statusTone = "success",
  helperText,
  onPrevious,
  onPlayPause,
  onRestart,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  playPauseLabel = "Play / Pause",
  controlsDisabled = false,
  progressMs = null,
  durationMs = null,
  onSeek,
}: NowPlayingCardProps) {
  const playPauseIconSrc =
    playPauseLabel === "Pause" ? "/icons/pause.png" : "/icons/play.png";
  const [seekValue, setSeekValue] = useState(progressMs ?? 0);
  const [isSeeking, setIsSeeking] = useState(false);

  useEffect(() => {
    if (!isSeeking) {
      setSeekValue(progressMs ?? 0);
    }
  }, [isSeeking, progressMs]);

  const canSeek =
    durationMs !== null &&
    durationMs > 0 &&
    progressMs !== null &&
    Boolean(onSeek) &&
    !controlsDisabled;
  const displayedProgressLabel =
    durationMs !== null && durationMs > 0
      ? formatProgressLabelFromValues(
          isSeeking ? seekValue : progressMs ?? 0,
          durationMs,
        )
      : progressLabel;

  return (
    <SectionCard>
      <PanelHeader
        title="Now playing"
        action={<StatusBadge label={statusLabel} tone={statusTone} />}
      />

      {helperText ? <p className="muted-text">{helperText}</p> : null}

      {(onPlayPause || onRestart) ? (
        <div className="button-row player-controls">
          <Button
            variant="ghost"
            onClick={onPrevious}
            disabled={controlsDisabled || previousDisabled}
            aria-label="Previous track"
            className="player-control-button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/prev-track.png"
              alt=""
              aria-hidden="true"
              className="player-control-button__icon"
            />
          </Button>
          {onPlayPause ? (
            <Button
              variant="ghost"
              onClick={onPlayPause}
              disabled={controlsDisabled}
              aria-label={playPauseLabel}
              className="player-control-button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={playPauseIconSrc}
                alt=""
                aria-hidden="true"
                className="player-control-button__icon"
              />
            </Button>
          ) : null}
          {onRestart ? (
            <Button
              variant="ghost"
              onClick={onRestart}
              disabled={controlsDisabled}
              aria-label="Restart track"
              className="player-control-button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/restart-track.png"
                alt=""
                aria-hidden="true"
                className="player-control-button__icon"
              />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            onClick={onNext}
            disabled={controlsDisabled || nextDisabled}
            aria-label="Next track"
            className="player-control-button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/next-track.png"
              alt=""
              aria-hidden="true"
              className="player-control-button__icon"
            />
          </Button>
        </div>
      ) : null}

      <div className="info-list">
        <div className="info-row">
          <span className="info-row__label">Track</span>
          <span className="info-row__value">{trackTitle}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Artist</span>
          <span className="info-row__value">{artistName}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Album</span>
          <span className="info-row__value">{albumName}</span>
        </div>
        <div className="info-row">
            <span className="info-row__label">Progress</span>
          <div className="progress-row">
            <span className="info-row__value">{displayedProgressLabel}</span>
            <input
              type="range"
              className="progress-slider"
              min={0}
              max={durationMs ?? 0}
              step={1000}
              value={durationMs ? Math.min(seekValue, durationMs) : 0}
              onMouseDown={() => setIsSeeking(true)}
              onTouchStart={() => setIsSeeking(true)}
              onChange={(event) => {
                setSeekValue(Number(event.target.value));
              }}
              onMouseUp={async (event) => {
                setIsSeeking(false);
                if (!canSeek) {
                  return;
                }

                await onSeek?.(Number(event.currentTarget.value));
              }}
              onTouchEnd={async (event) => {
                setIsSeeking(false);
                if (!canSeek) {
                  return;
                }

                await onSeek?.(Number(event.currentTarget.value));
              }}
              disabled={!canSeek}
              aria-label="Seek playback position"
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function formatProgressLabelFromValues(progressMs: number, durationMs: number) {
  return `${formatTime(progressMs)} / ${formatTime(durationMs)}`;
}

function formatTime(valueMs: number) {
  return `${Math.floor(valueMs / 60000)}:${String(
    Math.floor((valueMs % 60000) / 1000),
  ).padStart(2, "0")}`;
}
