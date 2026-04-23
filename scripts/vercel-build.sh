#!/bin/bash
# Build script for Vercel: Prisma generate + db push + Next.js build
# Uses PostgreSQL schema for production (Neon)

echo "=== Vercel Build Script ==="

# Ensure DATABASE_URL is set (Neon PostgreSQL)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  No DATABASE_URL set — skipping schema push"
else
  echo "DATABASE_URL prefix: ${DATABASE_URL:0:50}..."
fi

# Swap to PostgreSQL schema for production build
echo "Swapping to PostgreSQL schema..."
cp prisma/schema.prisma prisma/schema.prisma.bak
cp prisma/schema.postgres.prisma prisma/schema.prisma

# Generate Prisma client with PostgreSQL schema
echo "Generating Prisma client (PostgreSQL)..."
npx prisma generate --schema=prisma/schema.prisma

# Try to push schema to database (won't fail build if DB unreachable)
if [ -n "$DATABASE_URL" ]; then
  echo "Attempting database schema push to Neon..."
  npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || {
    echo "⚠️  Database push skipped (DB may not be reachable during build)"
  }
fi

# Restore original SQLite schema (not strictly needed but keeps git clean)
cp prisma/schema.prisma.bak prisma/schema.prisma
rm -f prisma/schema.prisma.bak

# Build Next.js
echo "Building Next.js application..."
next build
