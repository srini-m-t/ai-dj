"use client";

import { PanelHeader } from "@/components/ui/panel-header";
import { SectionCard } from "@/components/ui/section-card";
import { useSession } from "@/features/session/session-context";

/**
 * Displays the current interpreted prototype session state.
 */
export function ChatInsightsCard() {
  const { session, isLoading } = useSession();

  if (isLoading || !session) {
    return (
      <SectionCard
        title="Live session preview"
        description="Your persisted chat history and interpreted vibe will appear here."
      >
        <p className="muted-text">Loading session details...</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Live session preview"
      description="This panel now reflects the server-backed session state that survives refresh."
    >
      <PanelHeader
        title="Recent chat"
        description="The latest messages stored for this session."
      />

      <div className="message-list">
        {session.messages.slice(-4).map((message) => (
          <article key={message.id} className="message-item">
            <div className="message-item__meta">
              <span className="message-item__role">{message.role}</span>
              <span className="message-item__time">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="message-item__text">{message.text}</p>
          </article>
        ))}
      </div>

      <div className="stack-md">
        <PanelHeader
          title="Current interpretation"
          description="How the backend currently understands the session vibe."
        />

      <div className="info-list">
        <div className="info-row">
          <span className="info-row__label">Last prompt</span>
          <span className="info-row__value">
            {session.lastPrompt ?? "No prompt yet"}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Energy</span>
          <span className="info-row__value">{session.vibe.energy}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Mood</span>
          <span className="info-row__value">{session.vibe.mood}</span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Languages</span>
          <span className="info-row__value">
            {session.vibe.languages.join(", ")}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row__label">Mainstreamness</span>
          <span className="info-row__value">{session.vibe.mainstreamness}</span>
        </div>
      </div>
      </div>
    </SectionCard>
  );
}
