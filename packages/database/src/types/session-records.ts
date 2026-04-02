import type { Prisma } from "@prisma/client";

export const sessionAggregateInclude = {
  spotifyAccount: {
    select: {
      spotifyUserId: true,
    },
  },
  vibeState: true,
  messages: {
    orderBy: {
      createdAt: "asc",
    },
  },
  trackDecisions: {
    orderBy: {
      position: "asc",
    },
  },
  playbackSnapshots: {
    orderBy: {
      fetchedAt: "desc",
    },
    take: 1,
  },
} satisfies Prisma.SessionInclude;

export type SessionAggregateRecord = Prisma.SessionGetPayload<{
  include: typeof sessionAggregateInclude;
}>;
