import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
  if (accelerateUrl) {
    return new PrismaClient({
      accelerateUrl,
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL (direct Postgres), or add PRISMA_ACCELERATE_URL and keep DATABASE_URL for migrations.",
    );
  }
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
