#!/bin/bash
# Build script for Vercel: Prisma generate + migrate deploy + Next.js build
set -e

echo "=== Vercel Build Script ==="

if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set — prisma generate uses prisma.config.ts fallback"
else
  echo "DATABASE_URL prefix: ${DATABASE_URL:0:40}..."
fi

echo "Generating Prisma client..."
npx prisma generate

if [ -n "$DATABASE_URL" ]; then
  echo "Applying Prisma migrations (migrate deploy)..."
  npx prisma migrate deploy
fi

echo "Building Next.js application..."
next build
