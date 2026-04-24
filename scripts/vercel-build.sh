#!/bin/bash
# Build script for Vercel: Prisma generate + db push + Next.js build
set -e

echo "=== Vercel Build Script ==="

# Save original DATABASE_URL (if any)
_ORIG_DB_URL="$DATABASE_URL"

# prisma generate only parses the schema file — it does NOT connect to the database.
# Provide a placeholder so generate succeeds even when DATABASE_URL is unset.
if [ -z "$DATABASE_URL" ]; then
  echo "Note: DATABASE_URL not set — using placeholder for prisma generate"
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/placeholder?sslmode=prefer"
fi

echo "Generating Prisma client..."
npx prisma generate

echo "Prisma client generated successfully."

# If we had a real DATABASE_URL, push schema to the database
if [ -n "$_ORIG_DB_URL" ]; then
  export DATABASE_URL="$_ORIG_DB_URL"
  echo "Pushing schema to database..."
  npx prisma db push 2>&1
  echo "Database schema pushed."
else
  echo "Skipping db push (no DATABASE_URL configured)."
fi

echo "Building Next.js application..."
next build
