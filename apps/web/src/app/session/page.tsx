"use client";

import { Container } from "@/components/ui/container";
import { HeroPanel } from "@/components/ui/hero-panel";
import { SectionCard } from "@/components/ui/section-card";
import { SessionStateCard } from "@/components/vibe/session-state-card";
import { useSession } from "@/features/session/session-context";

export default function SessionPage() {
  const { session, isLoading } = useSession();

  if (isLoading || !session) {
    return (
      <main className="page-section">
        <Container>
          <div className="stack-lg">
            <HeroPanel
              eyebrow="Session"
              title="Session state"
              description="See how the AI DJ currently interprets the vibe and what preferences are guiding the queue."
            />
            <p className="muted-text">Loading your persisted session...</p>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="page-section">
      <Container>
        <div className="stack-lg">
          <HeroPanel
            eyebrow="Session"
            title="Session state"
            description="See how the AI DJ currently interprets the vibe and what preferences are guiding the queue."
          />

          <div className="grid-auto-wide">
            <SessionStateCard
              energy={session.vibe.energy}
              mood={session.vibe.mood ?? "Not set"}
              languages={session.vibe.languages.join(", ")}
              mainstreamness={session.vibe.mainstreamness}
              sessionStatus={session.status}
            />

            <SectionCard
              title="Decision log"
              description="This prototype updates the vibe and queue from your last prompt. Later this panel will show prompt history, explanations, and backend-driven decisions."
            >
              <div className="info-list">
                <div className="info-row">
                  <span className="info-row__label">Session ID</span>
                  <span className="info-row__value">{session.id}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Last prompt</span>
                  <span className="info-row__value">
                    {session.lastPrompt ?? "No prompt yet"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Queue size</span>
                  <span className="info-row__value">{session.queuePlan.length}</span>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </Container>
    </main>
  );
}
