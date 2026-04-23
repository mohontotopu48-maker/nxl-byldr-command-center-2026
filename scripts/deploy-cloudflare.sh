#!/bin/bash
# ============================================
# NXL BYLDR Command Center - Cloudflare Deploy
# ============================================
# Run this script from your local machine:
#   chmod +x scripts/deploy-cloudflare.sh
#   ./scripts/deploy-cloudflare.sh
#
# Prerequisites:
#   - Node.js 18+ and bun installed
#   - Cloudflare account with Workers/Pages/D1 access
# ============================================

set -e

echo "🚀 NXL BYLDR Command Center - Cloudflare Deployment"
echo "===================================================="
echo ""

# Check for Cloudflare token
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not set"
  echo "   Run: export CLOUDFLARE_API_TOKEN=your_token_here"
  exit 1
fi

echo "✅ Cloudflare API Token found"

# Step 1: Create D1 database (if not exists)
echo ""
echo "📦 Step 1: Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create nxl-byldr-db 2>&1 || true)
DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | sed 's/.*"\(.*\)".*/\1/')

if [ -z "$DB_ID" ]; then
  echo "⚠️  Could not create D1 database. It may already exist."
  echo "   Checking existing databases..."
  DB_LIST=$(npx wrangler d1 list 2>&1 || true)
  DB_ID=$(echo "$DB_LIST" | grep "nxl-byldr-db" | head -1 | awk '{print $NF}')
fi

if [ -n "$DB_ID" ]; then
  echo "✅ D1 Database ID: $DB_ID"

  # Update wrangler.toml with the actual database ID
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/database_id = \"PLACEHOLDER\"/database_id = \"$DB_ID\"/" wrangler.toml
  else
    sed -i "s/database_id = \"PLACEHOLDER\"/database_id = \"$DB_ID\"/" wrangler.toml
  fi
  echo "✅ Updated wrangler.toml with database ID"
else
  echo "❌ Failed to get D1 database ID. Please create one manually:"
  echo "   npx wrangler d1 create nxl-byldr-db"
  echo "   Then update wrangler.toml with the database_id"
  exit 1
fi

# Step 2: Initialize D1 database schema
echo ""
echo "🗄️  Step 2: Initializing D1 database schema..."
npx wrangler d1 execute nxl-byldr-db --file=./prisma/d1-schema.sql
echo "✅ D1 schema initialized"

# Step 3: Install dependencies
echo ""
echo "📥 Step 3: Installing dependencies..."
bun install
echo "✅ Dependencies installed"

# Step 4: Set NextAuth secret
echo ""
echo "🔐 Step 4: Setting NextAuth secret..."
echo "vsual-business-os-secret-key-2025" | npx wrangler secret put NEXTAUTH_SECRET
echo "✅ Secret set"

# Step 5: Build the project
echo ""
echo "🏗️  Step 5: Building for Cloudflare..."
npx opennextjs-cloudflare build
echo "✅ Build complete"

# Step 6: Deploy to Cloudflare Pages
echo ""
echo "☁️  Step 6: Deploying to Cloudflare Pages..."
npx opennextjs-cloudflare deploy
echo ""
echo "🎉 Deployment complete!"
echo "===================================================="
echo "Your app should be live at:"
echo "  https://nxl-byldr-command-center.pages.dev"
echo ""
echo "To check deployment status:"
echo "  npx wrangler pages deployment list"
