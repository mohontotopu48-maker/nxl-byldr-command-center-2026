import "dotenv/config";
import { defineConfig } from "prisma/config";

/** Fallback only for `prisma generate` when DATABASE_URL is unset (e.g. CI); runtime must set a real URL. */
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres?sslmode=prefer";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
