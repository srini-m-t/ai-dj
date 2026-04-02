import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __aiDjPrismaClient__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient();
}

export const prisma =
  globalThis.__aiDjPrismaClient__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__aiDjPrismaClient__ = prisma;
}
