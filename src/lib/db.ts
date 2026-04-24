import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _dbConnectionFailed = false;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    _dbConnectionFailed = true;
    console.warn(
      '[DB] DATABASE_URL is not set. API routes that need the database will return 503.'
    );
    // Return a dummy client — calls will fail, but the import won't crash.
    // The API handlers should use isDbAvailable() to check before querying.
    return new PrismaClient({ log: ["error"] });
  }

  try {
    // Prisma 6.x: PrismaPg accepts pg.Pool or pg.PoolConfig
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    _dbConnectionFailed = true;
    console.error('[DB] Failed to create database connection:', error);
    return new PrismaClient({ log: ["error"] });
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Cache in development to avoid exhausting database connections during hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * Check if the database is available for queries.
 * Returns false if DATABASE_URL is not set or connection has failed.
 */
export function isDbAvailable(): boolean {
  return !_dbConnectionFailed && !!process.env.DATABASE_URL;
}
