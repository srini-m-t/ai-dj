type StatusBadgeProps = {
  label: string;
  tone?: "success" | "danger" | "neutral";
};

/**
 * Simple status badge used for device/session/playback state.
 */
export function StatusBadge({
  label,
  tone = "success",
}: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span
        className={`status-badge__dot status-badge__dot--${tone}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
