import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
      "Format: postgresql://user:password@host:5432/database?sslmode=require"
    );
  }

  // Prisma 6.x: PrismaPg accepts pg.Pool or pg.PoolConfig
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

// Cache in development to avoid exhausting database connections during hot reloads
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
