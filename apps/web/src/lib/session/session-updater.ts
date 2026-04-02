import type {
  IntentPatch,
  Session,
  SessionMessage,
  TrackDecision,
  VibeState,
} from "@ai-dj/shared";

export type SessionUpdateResult = {
  lastPrompt: string;
  vibe: VibeState;
  queuePlan: TrackDecision[];
  appliedIntent: IntentPatch;
  newMessages: [SessionMessage, SessionMessage];
};

/**
 * Deterministic prompt interpretation for the prototype backend flow.
 * This stays pure so it can be reused by API routes and tests.
 */
export function deriveSessionUpdate(
  currentSession: Session,
  prompt: string,
): SessionUpdateResult {
  const normalizedPrompt = prompt.trim().toLowerCase();

  const nextVibe: VibeState = {
    ...currentSession.vibe,
  };
  const appliedIntent: IntentPatch = {};

  if (
    normalizedPrompt.includes("upbeat") ||
    normalizedPrompt.includes("more energy") ||
    normalizedPrompt.includes("higher energy")
  ) {
    nextVibe.energy = "high";
    nextVibe.mood = "Upbeat drive";
    nextVibe.setting = "Drive";
    appliedIntent.energy = "high";
    appliedIntent.mood = "Upbeat drive";
    appliedIntent.setting = "Drive";
  }

  if (
    normalizedPrompt.includes("smooth") ||
    normalizedPrompt.includes("smoother") ||
    normalizedPrompt.includes("softer")
  ) {
    nextVibe.energy = "low";
    nextVibe.mood = "Smooth night drive";
    nextVibe.setting = "Night drive";
    appliedIntent.energy = "low";
    appliedIntent.mood = "Smooth night drive";
    appliedIntent.setting = "Night drive";
  }

  if (
    normalizedPrompt.includes("late night") ||
    normalizedPrompt.includes("night drive")
  ) {
    nextVibe.mood = "Late-night drive";
    nextVibe.setting = "Night drive";
    appliedIntent.mood = "Late-night drive";
    appliedIntent.setting = "Night drive";
  }

  if (normalizedPrompt.includes("tamil")) {
    nextVibe.languages = Array.from(new Set([...nextVibe.languages, "Tamil"]));
    appliedIntent.languages = nextVibe.languages;
    nextVibe.genreHints = Array.from(
      new Set([...nextVibe.genreHints, "Tamil soundtrack"]),
    );
    appliedIntent.genreHints = nextVibe.genreHints;
  }

  if (normalizedPrompt.includes("english")) {
    nextVibe.languages = Array.from(new Set([...nextVibe.languages, "English"]));
    appliedIntent.languages = nextVibe.languages;
  }

  if (
    normalizedPrompt.includes("less mainstream") ||
    normalizedPrompt.includes("more niche") ||
    normalizedPrompt.includes("less popular")
  ) {
    nextVibe.mainstreamness = "low";
    appliedIntent.mainstreamness = "low";
  }

  if (
    normalizedPrompt.includes("more mainstream") ||
    normalizedPrompt.includes("more familiar")
  ) {
    nextVibe.mainstreamness = "high";
    appliedIntent.mainstreamness = "high";
  }

  if (normalizedPrompt.includes("indie")) {
    nextVibe.genreHints = Array.from(new Set([...nextVibe.genreHints, "Indie"]));
    appliedIntent.genreHints = nextVibe.genreHints;
  }

  const timestamp = new Date().toISOString();

  return {
    lastPrompt: prompt,
    vibe: nextVibe,
    queuePlan: buildQueueFromVibe(nextVibe),
    appliedIntent,
    newMessages: [
      {
        id: `message-user-${Date.now()}`,
        role: "user",
        text: prompt,
        createdAt: timestamp,
      },
      {
        id: `message-assistant-${Date.now()}`,
        role: "assistant",
        text: buildAssistantSummary(nextVibe, appliedIntent),
        createdAt: timestamp,
      },
    ],
  };
}

function buildQueueFromVibe(vibe: VibeState): TrackDecision[] {
  if (vibe.energy === "high") {
    return [
      {
        id: "high-1",
        spotifyTrackId: "spotify:track:high-1",
        title: "Vaathi Coming",
        artistNames: ["Anirudh Ravichander", "Gana Balachandar"],
        reason: "Raises the energy immediately and makes the session feel more lively.",
        score: 0.96,
        source: "seed",
        queuedAt: null,
      },
      {
        id: "high-2",
        spotifyTrackId: "spotify:track:high-2",
        title: "Arabic Kuthu",
        artistNames: ["Anirudh Ravichander", "Jonita Gandhi"],
        reason: "Keeps momentum high with a strong, crowd-friendly pulse.",
        score: 0.92,
        source: "seed",
        queuedAt: null,
      },
      {
        id: "high-3",
        spotifyTrackId: "spotify:track:high-3",
        title: "Blinding Lights",
        artistNames: ["The Weeknd"],
        reason: "Adds high-energy familiarity while keeping a sleek night-drive feel.",
        score: 0.88,
        source: "seed",
        queuedAt: null,
      },
    ];
  }

  if (vibe.energy === "low") {
    return [
      {
        id: "low-1",
        spotifyTrackId: "spotify:track:low-1",
        title: "Munbe Vaa",
        artistNames: ["A.R. Rahman", "Naresh Iyer", "Shreya Ghoshal"],
        reason: "Softens the mood and keeps the atmosphere warm and melodic.",
        score: 0.93,
        source: "seed",
        queuedAt: null,
      },
      {
        id: "low-2",
        spotifyTrackId: "spotify:track:low-2",
        title: "New York Nagaram",
        artistNames: ["A.R. Rahman"],
        reason: "Supports a reflective, smooth late-night mood.",
        score: 0.9,
        source: "seed",
        queuedAt: null,
      },
      {
        id: "low-3",
        spotifyTrackId: "spotify:track:low-3",
        title: "After Hours",
        artistNames: ["The Weeknd"],
        reason: "Adds a more atmospheric texture without breaking the calm flow.",
        score: 0.86,
        source: "seed",
        queuedAt: null,
      },
    ];
  }

  return [
    {
      id: "medium-1",
      spotifyTrackId: "spotify:track:medium-1",
      title: "Nenjukkul Peidhidum",
      artistNames: ["Harris Jayaraj", "Hariharan", "Devan Ekambaram"],
      reason: "Balances melody and movement while staying emotionally warm.",
      score: 0.91,
      source: "seed",
      queuedAt: null,
    },
    {
      id: "medium-2",
      spotifyTrackId: "spotify:track:medium-2",
      title: "Vaseegara",
      artistNames: ["Bombay Jayashri"],
      reason: "Keeps the session intimate and familiar with a softer groove.",
      score: 0.87,
      source: "seed",
      queuedAt: null,
    },
    {
      id: "medium-3",
      spotifyTrackId: "spotify:track:medium-3",
      title: "The Less I Know The Better",
      artistNames: ["Tame Impala"],
      reason: "Brings in a tasteful indie feel without changing the vibe too sharply.",
      score: 0.84,
      source: "seed",
      queuedAt: null,
    },
  ];
}

function buildAssistantSummary(vibe: VibeState, appliedIntent: IntentPatch): string {
  const details: string[] = [];

  if (appliedIntent.energy) {
    details.push(`${appliedIntent.energy} energy`);
  }

  if (appliedIntent.mainstreamness) {
    details.push(`${appliedIntent.mainstreamness} mainstreamness`);
  }

  if (appliedIntent.languages?.length) {
    details.push(`${appliedIntent.languages.join("/")} language mix`);
  }

  const detailText =
    details.length > 0 ? details.join(", ") : "the current session preferences";

  return `Updated the vibe toward ${vibe.mood ?? "a refined mix"} with ${detailText}.`;
}
