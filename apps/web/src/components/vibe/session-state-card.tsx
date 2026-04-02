import { SectionCard } from "@/components/ui/section-card";
import { PanelHeader } from "@/components/ui/panel-header";
import { StatusBadge } from "@/components/ui/status-badge";

type SessionStateCardProps = {
  energy: string;
  mood: string;
  languages: string;
  mainstreamness: string;
  sessionStatus: string;
};

/**
 * Mock session state card showing the interpreted vibe state.
 * Later this will use real structured session data.
 */
export function SessionStateCard({
  energy,
  mood,
  languages,
  mainstreamness,
  sessionStatus,
}: SessionStateCardProps) {
  return (
    <SectionCard>
      <PanelHeader
        title="Current vibe state"
        description="The AI DJ's current interpretation of the session."
        action={<StatusBadge label={sessionStatus} />}
      />

      <div className="info-list">
        <div className="info-row">
          <span className="info-row__label">Energy</span>
          <span className="info-row__value">{energy}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Mood</span>
          <span className="info-row__value">{mood}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Languages</span>
          <span className="info-row__value">{languages}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Mainstreamness</span>
          <span className="info-row__value">{mainstreamness}</span>
        </div>
      </div>
    </SectionCard>
  );
}