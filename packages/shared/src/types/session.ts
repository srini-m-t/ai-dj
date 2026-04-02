import type { IntentPatch, VibeState } from "./vibe";

export type SessionStatus = "idle" | "active" | "paused" | "ended";

export type MessageRole = "user" | "assistant" | "system";

export type PlaybackSource = "spotify" | "sdk" | "mock";

export type SessionSummary = {
  id: string;
  title: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
};

export type SessionMessage = {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string;
};

export type TrackCandidate = {
  spotifyTrackId: string;
  title: string;
  artistNames: string[];
  albumName: string | null;
  imageUrl: string | null;
};

export type QueueTrackSnapshot = TrackCandidate;

export type SpotifyDevice = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  isRestricted: boolean;
};

export type TrackDecision = {
  id: string;
  spotifyTrackId: string;
  title: string;
  artistNames: string[];
  reason: string;
  score: number;
  source: "search" | "seed" | "manual";
  queuedAt: string | null;
};

export type PlaybackSnapshot = {
  source: PlaybackSource;
  isPlaying: boolean;
  deviceId: string | null;
  deviceName: string | null;
  trackId: string | null;
  trackTitle: string | null;
  artistNames: string[];
  albumName: string | null;
  imageUrl: string | null;
  progressMs: number | null;
  durationMs: number | null;
  fetchedAt: string;
};

export type Session = {
  id: string;
  userId: string | null;
  spotifyUserId: string | null;
  title: string;
  status: SessionStatus;
  vibe: VibeState;
  lastPrompt: string | null;
  messages: SessionMessage[];
  queuePlan: TrackDecision[];
  playback: PlaybackSnapshot | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSessionRequest = {
  title?: string;
};

export type CreateSessionResponse = {
  session: Session;
};

export type GetSessionResponse = {
  session: Session;
};

export type CreateSessionMessageRequest = {
  text: string;
};

export type CreateSessionMessageResponse = {
  session: Session;
  assistantMessage: SessionMessage;
  appliedIntent: IntentPatch;
};

export type GetPlaybackResponse = {
  playback: PlaybackSnapshot | null;
  authenticated: boolean;
  hasActiveDevice: boolean;
};

export type SpotifyDevicesResponse = {
  devices: SpotifyDevice[];
};

export type SpotifySearchTracksResponse = {
  tracks: TrackCandidate[];
};

export type AddToQueueRequest = {
  spotifyTrackId: string;
  deviceId?: string;
};

export type AddToQueueResponse = {
  queued: true;
};

export type GetSpotifyQueueResponse = {
  currentlyPlaying: QueueTrackSnapshot | null;
  queue: QueueTrackSnapshot[];
};

export type TransferPlaybackRequest = {
  deviceId: string;
  play?: boolean;
};

export type TransferPlaybackResponse = {
  transferred: true;
};

export type StartPlaybackRequest = {
  spotifyTrackId?: string;
  spotifyTrackIds?: string[];
  deviceId?: string;
  positionMs?: number;
};

export type StartPlaybackResponse = {
  started: true;
};

export type PlaybackControlAction =
  | "resume"
  | "pause"
  | "next"
  | "previous"
  | "restart"
  | "seek";

export type PlaybackControlRequest = {
  action: PlaybackControlAction;
  deviceId?: string;
  positionMs?: number;
};

export type PlaybackControlResponse = {
  controlled: true;
};
