import type { Session } from "@ai-dj/shared";

import { initialMockSession } from "@/features/session/mock-session";

type CreateSessionSeed = {
  title?: string;
  status?: Session["status"];
  lastPrompt?: string | null;
  vibe?: Partial<Session["vibe"]>;
  messages?: Array<{
    role: Session["messages"][number]["role"];
    text: string;
    createdAt?: string;
  }>;
  queuePlan?: Array<{
    spotifyTrackId: string;
    title: string;
    artistNames: string[];
    reason: string;
    score: number;
    source: Session["queuePlan"][number]["source"];
    queuedAt?: string | null;
  }>;
  playback?: Session["playback"];
};

/**
 * Converts the current prototype session into repository create input.
 * This lets us bootstrap persisted sessions without leaking app code into the
 * database package.
 */
export function buildSeedSessionInput(overrides: CreateSessionSeed = {}) {
  return {
    title: overrides.title ?? initialMockSession.title,
    status: overrides.status ?? initialMockSession.status,
    lastPrompt: overrides.lastPrompt ?? initialMockSession.lastPrompt,
    vibe: {
      ...initialMockSession.vibe,
      ...overrides.vibe,
    },
    messages: overrides.messages ?? initialMockSession.messages,
    queuePlan: overrides.queuePlan ?? initialMockSession.queuePlan,
    playback: overrides.playback ?? initialMockSession.playback,
  };
}
