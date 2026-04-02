import { SectionCard } from "@/components/ui/section-card";
import { PanelHeader } from "@/components/ui/panel-header";
import { Button } from "@/components/ui/button";

type QueueTrack = {
  id: string;
  title: string;
  artistNames: string[];
  reason: string;
  tag: "Queued" | "Recommended";
};

type UpcomingQueueCardProps = {
  tracks: QueueTrack[];
  onResetQueue?: () => void;
  onMoveTrack?: (fromIndex: number, toIndex: number) => void;
  onDeleteTrack?: (index: number) => void;
  onPlayTrack?: (index: number) => void;
  onMoveTrackToPosition?: (fromIndex: number, toIndex: number) => void;
  onRecommendSong?: () => void;
  resetMessage?: string | null;
};

/**
 * Mock queue card showing upcoming planned tracks and selection reasons.
 */
export function UpcomingQueueCard({
  tracks,
  onResetQueue,
  onMoveTrack,
  onDeleteTrack,
  onPlayTrack,
  onMoveTrackToPosition,
  onRecommendSong,
  resetMessage,
}: UpcomingQueueCardProps) {
  return (
    <SectionCard className="queue-card">
      <PanelHeader
        title="Upcoming songs"
        action={
          onResetQueue ? (
            <Button variant="ghost" onClick={onResetQueue}>
              Reset upcoming list
            </Button>
          ) : null
        }
      />

      <div className="queue-card__list">
        {resetMessage ? <p className="success-text">{resetMessage}</p> : null}
        <div className="track-list">
          {tracks.length > 0 ? (
            tracks.map((track, index) => (
              <article
                key={`${track.id}-${index}`}
                className="track-item track-item--queue"
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  const fromIndex = Number(
                    event.dataTransfer.getData("text/plain"),
                  );

                  if (!Number.isNaN(fromIndex) && onMoveTrack) {
                    onMoveTrack(fromIndex, index);
                  }
                }}
              >
                <div className="track-item__top">
                  <div className="track-item__content">
                    <div className="queue-track-heading">
                      <input
                        type="number"
                        min={1}
                        max={tracks.length}
                        defaultValue={index + 1}
                        className="queue-position-input"
                        aria-label={`Move ${track.title} to position`}
                        onBlur={(event) => {
                          const targetIndex = Number(event.target.value) - 1;

                          if (
                            onMoveTrackToPosition &&
                            Number.isInteger(targetIndex)
                          ) {
                            onMoveTrackToPosition(index, targetIndex);
                          }

                          event.currentTarget.value = String(index + 1);
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") {
                            return;
                          }

                          event.preventDefault();
                          event.currentTarget.blur();
                        }}
                      />
                      <button
                        type="button"
                        className="queue-track-button"
                        onClick={() => onPlayTrack?.(index)}
                      >
                        <h4 className="track-item__title">{track.title}</h4>
                      </button>
                    </div>
                    <p className="track-item__artist">
                      {track.artistNames.join(", ")}
                    </p>
                  </div>
                  <div className="track-item__meta">
                    <span
                      className={`track-tag ${
                        track.tag === "Queued"
                          ? "track-tag--queued"
                          : "track-tag--recommended"
                      }`}
                    >
                      {track.tag}
                    </span>
                    <button
                      type="button"
                      className="queue-delete-button"
                      aria-label={`Delete ${track.title}`}
                      onClick={() => onDeleteTrack?.(index)}
                    >
                      ×
                    </button>
                    <button
                      type="button"
                      className="drag-handle"
                      draggable={Boolean(onMoveTrack)}
                      aria-label={`Reorder ${track.title}`}
                      onDragStart={(event) => {
                        event.dataTransfer.setData(
                          "text/plain",
                          String(index),
                        );
                      }}
                    >
                      <span aria-hidden="true">|||</span>
                    </button>
                  </div>
                </div>
                <p className="track-item__reason">{track.reason}</p>
              </article>
            ))
          ) : (
            <p className="muted-text">No tracks are currently queued.</p>
          )}

          {onRecommendSong ? (
            <button
              type="button"
              className="recommend-row-button"
              onClick={onRecommendSong}
            >
              + Recommend a song
            </button>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
