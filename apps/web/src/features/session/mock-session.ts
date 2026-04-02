import type { Session } from "@ai-dj/shared";

/**
 * Initial mock session data used before backend integration.
 * This lets us prototype the full UX with realistic structure.
 */
const now = "2026-03-30T00:00:00.000Z";

export const initialMockSession: Session = {
  id: "session-demo-1",
  userId: null,
  spotifyUserId: null,
  title: "Late-night drive demo",
  status: "active",
  lastPrompt: "Make it smoother, a little less mainstream, and add more Tamil songs.",
  vibe: {
    energy: "medium",
    mood: "Late-night drive",
    languages: ["Tamil", "English"],
    mainstreamness: "low",
    genreHints: ["Indie pop", "Tamil soundtrack"],
    setting: "Night drive",
  },
  playback: {
    source: "mock",
    isPlaying: true,
    deviceId: "mock-web-player",
    deviceName: "Web Player",
    trackId: "spotify:track:mock-kadhal-sadugudu",
    trackTitle: "Kadhal Sadugudu",
    artistNames: ["A.R. Rahman", "S.P. Charan", "Naveen"],
    albumName: "Alaipayuthey",
    imageUrl: null,
    progressMs: 102000,
    durationMs: 276000,
    fetchedAt: now,
  },
  messages: [
    {
      id: "message-1",
      role: "user",
      text: "Make it smoother, a little less mainstream, and add more Tamil songs.",
      createdAt: now,
    },
    {
      id: "message-2",
      role: "assistant",
      text: "Shifted the session toward a smoother late-night Tamil blend with less mainstream picks.",
      createdAt: now,
    },
  ],
  queuePlan: [
    {
      id: "track-1",
      spotifyTrackId: "spotify:track:track-1",
      title: "Nenjukkul Peidhidum",
      artistNames: ["Harris Jayaraj", "Hariharan", "Devan Ekambaram"],
      reason: "Keeps the late-night drive feeling while staying melodic and smooth.",
      score: 0.91,
      source: "seed",
      queuedAt: null,
    },
    {
      id: "track-2",
      spotifyTrackId: "spotify:track:track-2",
      title: "Munbe Vaa",
      artistNames: ["A.R. Rahman", "Naresh Iyer", "Shreya Ghoshal"],
      reason: "Adds warmth and familiarity without pushing the energy too high.",
      score: 0.89,
      source: "seed",
      queuedAt: null,
    },
    {
      id: "track-3",
      spotifyTrackId: "spotify:track:track-3",
      title: "The Less I Know The Better",
      artistNames: ["Tame Impala"],
      reason: "Introduces a slightly more indie texture while preserving groove.",
      score: 0.84,
      source: "seed",
      queuedAt: null,
    },
  ],
  createdAt: now,
  updatedAt: now,
};
