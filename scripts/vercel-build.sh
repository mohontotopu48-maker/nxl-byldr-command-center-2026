#!/bin/bash
# Build script for Vercel: sets DATABASE_URL from DATABASE_PUBLIC_URL if not set
# This allows Neon PostgreSQL to work with Prisma

if [ -z "$DATABASE_URL" ] && [ -n "$DATABASE_PUBLIC_URL" ]; then
  export DATABASE_URL="$DATABASE_PUBLIC_URL"
fi

echo "Using DATABASE_URL: ${DATABASE_URL:0:30}..."
prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss 2>&1
next build
