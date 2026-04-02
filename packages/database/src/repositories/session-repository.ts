import type {
  EnergyLevel,
  MainstreamnessLevel,
  PlaybackSnapshot,
  Session,
  SessionMessage,
  SessionStatus,
  TrackDecision,
  VibeState,
} from "@ai-dj/shared";

import { prisma } from "../client";
import {
  sessionAggregateInclude,
  type SessionAggregateRecord,
} from "../types/session-records";

type CreateSessionInput = {
  title?: string;
  status?: SessionStatus;
  userId?: string | null;
  spotifyAccountId?: string | null;
  spotifyUserId?: string | null;
  vibe?: Partial<VibeState>;
  lastPrompt?: string | null;
  messages?: Array<{
    role: SessionMessage["role"];
    text: string;
    createdAt?: string;
  }>;
  queuePlan?: Array<{
    spotifyTrackId: string;
    title: string;
    artistNames: string[];
    reason: string;
    score: number;
    source: TrackDecision["source"];
    queuedAt?: string | null;
  }>;
  playback?: PlaybackSnapshot | null;
};

type ApplySessionUpdateInput = {
  sessionId: string;
  lastPrompt: string;
  vibe: VibeState;
  newMessages: Array<{
    role: SessionMessage["role"];
    text: string;
    createdAt?: string;
  }>;
  queuePlan: Array<{
    spotifyTrackId: string;
    title: string;
    artistNames: string[];
    reason: string;
    score: number;
    source: TrackDecision["source"];
    queuedAt?: string | null;
  }>;
};

const defaultVibeState: VibeState = {
  energy: "medium",
  mood: "Late-night drive",
  languages: ["Tamil", "English"],
  mainstreamness: "medium",
  genreHints: [],
  setting: "Night drive",
};

export async function createSession(input: CreateSessionInput = {}): Promise<Session> {
  const createdSession = await prisma.session.create({
    data: {
      title: input.title ?? "New AI DJ session",
      status: input.status ?? "active",
      userId: input.userId ?? null,
      spotifyAccountId: input.spotifyAccountId ?? null,
      lastPrompt: input.lastPrompt ?? null,
      vibeState: {
        create: serializeVibeState({
          ...defaultVibeState,
          ...input.vibe,
        }),
      },
      messages: input.messages?.length
        ? {
            create: input.messages.map((message) => ({
              role: message.role,
              text: message.text,
              createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
            })),
          }
        : undefined,
      trackDecisions: input.queuePlan?.length
        ? {
            create: input.queuePlan.map((track, index) => ({
              spotifyTrackId: track.spotifyTrackId,
              title: track.title,
              artistNamesJson: JSON.stringify(track.artistNames),
              reason: track.reason,
              score: track.score,
              source: track.source,
              position: index,
              queuedAt: track.queuedAt ? new Date(track.queuedAt) : null,
            })),
          }
        : undefined,
      playbackSnapshots: input.playback
        ? {
            create: serializePlaybackSnapshot(input.playback),
          }
        : undefined,
    },
    include: sessionAggregateInclude,
  });

  return mapSessionAggregate(createdSession, input.spotifyUserId ?? null);
}

export async function getSessionById(sessionId: string): Promise<Session | null> {
  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: sessionAggregateInclude,
  });

  if (!session) {
    return null;
  }

  return mapSessionAggregate(session, session.spotifyAccount?.spotifyUserId ?? null);
}

export async function applySessionUpdate(
  input: ApplySessionUpdateInput,
): Promise<Session> {
  const updatedSession = await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: {
        id: input.sessionId,
      },
      data: {
        lastPrompt: input.lastPrompt,
      },
    });

    await tx.sessionVibeState.upsert({
      where: {
        sessionId: input.sessionId,
      },
      create: {
        sessionId: input.sessionId,
        ...serializeVibeState(input.vibe),
      },
      update: serializeVibeState(input.vibe),
    });

    await tx.sessionMessage.createMany({
      data: input.newMessages.map((message) => ({
        sessionId: input.sessionId,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
      })),
    });

    await tx.trackDecision.deleteMany({
      where: {
        sessionId: input.sessionId,
      },
    });

    await tx.trackDecision.createMany({
      data: input.queuePlan.map((track, index) => ({
        sessionId: input.sessionId,
        spotifyTrackId: track.spotifyTrackId,
        title: track.title,
        artistNamesJson: JSON.stringify(track.artistNames),
        reason: track.reason,
        score: track.score,
        source: track.source,
        position: index,
        queuedAt: track.queuedAt ? new Date(track.queuedAt) : null,
      })),
    });

    return tx.session.findUniqueOrThrow({
      where: {
        id: input.sessionId,
      },
      include: sessionAggregateInclude,
    });
  });

  return mapSessionAggregate(
    updatedSession,
    updatedSession.spotifyAccount?.spotifyUserId ?? null,
  );
}

function serializeVibeState(vibe: VibeState) {
  return {
    energy: vibe.energy,
    mood: vibe.mood,
    languagesJson: JSON.stringify(vibe.languages),
    mainstreamness: vibe.mainstreamness,
    genreHintsJson: JSON.stringify(vibe.genreHints),
    setting: vibe.setting,
  };
}

function serializePlaybackSnapshot(playback: PlaybackSnapshot) {
  return {
    source: playback.source,
    isPlaying: playback.isPlaying,
    deviceId: playback.deviceId,
    deviceName: playback.deviceName,
    trackId: playback.trackId,
    trackTitle: playback.trackTitle,
    artistNamesJson: JSON.stringify(playback.artistNames),
    albumName: playback.albumName,
    imageUrl: playback.imageUrl,
    progressMs: playback.progressMs,
    durationMs: playback.durationMs,
    fetchedAt: new Date(playback.fetchedAt),
  };
}

function mapSessionAggregate(
  session: SessionAggregateRecord,
  spotifyUserId: string | null,
): Session {
  return {
    id: session.id,
    userId: session.userId,
    spotifyUserId,
    title: session.title,
    status: session.status as SessionStatus,
    vibe: mapVibeState(session.vibeState),
    lastPrompt: session.lastPrompt,
    messages: session.messages.map((message) => ({
      id: message.id,
      role: message.role as SessionMessage["role"],
      text: message.text,
      createdAt: message.createdAt.toISOString(),
    })),
    queuePlan: session.trackDecisions.map((decision) => ({
      id: decision.id,
      spotifyTrackId: decision.spotifyTrackId,
      title: decision.title,
      artistNames: parseJsonArray(decision.artistNamesJson),
      reason: decision.reason,
      score: decision.score,
      source: decision.source as TrackDecision["source"],
      queuedAt: decision.queuedAt?.toISOString() ?? null,
    })),
    playback: mapPlaybackSnapshot(session.playbackSnapshots[0] ?? null),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function mapVibeState(vibeState: SessionAggregateRecord["vibeState"]): VibeState {
  if (!vibeState) {
    return defaultVibeState;
  }

  return {
    energy: vibeState.energy as EnergyLevel,
    mood: vibeState.mood,
    languages: parseJsonArray(vibeState.languagesJson),
    mainstreamness: vibeState.mainstreamness as MainstreamnessLevel,
    genreHints: parseJsonArray(vibeState.genreHintsJson),
    setting: vibeState.setting,
  };
}

function mapPlaybackSnapshot(
  playbackSnapshot: SessionAggregateRecord["playbackSnapshots"][number] | null,
): PlaybackSnapshot | null {
  if (!playbackSnapshot) {
    return null;
  }

  return {
    source: playbackSnapshot.source as PlaybackSnapshot["source"],
    isPlaying: playbackSnapshot.isPlaying,
    deviceId: playbackSnapshot.deviceId,
    deviceName: playbackSnapshot.deviceName,
    trackId: playbackSnapshot.trackId,
    trackTitle: playbackSnapshot.trackTitle,
    artistNames: parseJsonArray(playbackSnapshot.artistNamesJson),
    albumName: playbackSnapshot.albumName,
    imageUrl: playbackSnapshot.imageUrl,
    progressMs: playbackSnapshot.progressMs,
    durationMs: playbackSnapshot.durationMs,
    fetchedAt: playbackSnapshot.fetchedAt.toISOString(),
  };
}

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isString) : [];
  } catch {
    return [];
  }
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
