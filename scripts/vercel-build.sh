#!/bin/bash
# Build script for Vercel: Prisma generate + optional db push + Next.js build

echo "=== Vercel Build Script ==="

# Use DATABASE_PUBLIC_URL as fallback for DATABASE_URL
if [ -z "$DATABASE_URL" ] && [ -n "$DATABASE_PUBLIC_URL" ]; then
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
  echo "DATABASE_URL set from DATABASE_PUBLIC_URL"
fi

# Generate Prisma client (required for build)
echo "Generating Prisma client..."
npx prisma generate --schema=prisma/schema.prisma

# Try to push schema to database (optional - won't fail build if DB unreachable)
if [ -n "$DATABASE_URL" ]; then
  echo "Attempting database schema push..."
  echo "DATABASE_URL prefix: ${DATABASE_URL:0:40}..."
  npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 || {
    echo "⚠️  Database push skipped (DB may not be reachable during build)"
    echo "   Schema will be pushed on first API request or via manual migration"
  }
else
  echo "⚠️  No DATABASE_URL set — skipping schema push"
fi

# Build Next.js
echo "Building Next.js application..."
next build
