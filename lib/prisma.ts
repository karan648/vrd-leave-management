// =============================================================================
// Prisma Client Singleton
// =============================================================================
// Uses a shared instance in development to avoid exhausting connection limits.
// In production (Neon + PgBouncer), the pooled DATABASE_URL is used.

import { PrismaClient } from "@prisma/client";

declare global {
  // Allow global var in development hot-reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export { prisma };
export default prisma;
