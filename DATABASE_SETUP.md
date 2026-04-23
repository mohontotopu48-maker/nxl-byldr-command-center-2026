# ═══════════════════════════════════════════════════════════════════════════
# VSUAL NXL BYLDR — Database Setup Guide
# ═══════════════════════════════════════════════════════════════════════════
#
# This project uses Neon PostgreSQL for production and SQLite for local dev.
#
# ═══ NEON DATABASE SETUP (Production - Vercel) ═══
#
# 1. Go to https://console.neon.tech/app/projects
# 2. Select your project (ep-bold-mode-anuusxdu)
# 3. Go to "Connection Details" 
# 4. Copy the connection string (Pooled or Unpooled)
#
# Connection string format:
#   postgresql://neondb_owner:[PASSWORD]@ep-bold-mode-anuusxdu-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
#
# 5. Set this as DATABASE_URL in your Vercel project settings:
#    https://vercel.com/topus-projects-8d0cf7fa/my-project/settings/environment-variables
#
#    Variable:  DATABASE_URL
#    Value:     (paste your Neon connection string above)
#    Envs:      Production + Preview
#
# ═══ GITHUB SECRETS (for Neon Branch Workflow) ═══
#
# Go to: https://github.com/toponseo25/NXL-BYLDR-Command-Center/settings/secrets/actions
#
# 1. NEON_API_KEY     — Your Neon API key (from https://console.neon.tech/app/settings/api-keys)
# 2. NEON_PROJECT_ID  — Your Neon project ID (from project URL or dashboard)
#
# Go to: https://github.com/toponseo25/NXL-BYLDR-Command-Center/settings/variables/actions
#
# 3. NEON_PROJECT_ID  — Same as above (also needed as variable)
#
# ═══ LOCAL DEVELOPMENT ═══
#
# Local dev uses SQLite automatically via .env file.
# No additional setup needed.
#
# Commands:
#   bun run dev         — Start dev server (uses SQLite)
#   bun run db:push     — Push schema to local SQLite
#   bun run db:push:pg  — Push schema to Neon PostgreSQL
#   bun run lint        — Check code quality
#
# ═══════════════════════════════════════════════════════════════════════════
