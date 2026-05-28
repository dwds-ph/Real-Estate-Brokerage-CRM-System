#!/usr/bin/env bash
# Real Estate CRM — Deploy Script
set -euo pipefail

echo "🚀 Deploying Real Estate CRM..."

# Check prerequisites
command -v firebase >/dev/null 2>&1 || { echo "❌ Install firebase-tools: npm install -g firebase-tools"; exit 1; }

# Read project from .firebaserc
PROJECT_ID=$(grep -oP '"default"\s*:\s*"\K[^"]+' .firebaserc 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "demo-crm" ]; then
  echo "⚠️  .firebaserc not configured with a real project ID."
  echo "   Edit .firebaserc or run: firebase use --add"
  echo "   Or set: FIREBASE_PROJECT_ID=your-project-id ./deploy.sh"
  PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
  [ -z "$PROJECT_ID" ] && { echo "❌ No project ID. Aborting."; exit 1; }
fi

echo "📁 Project: $PROJECT_ID"

# Build
echo "🔨 Building..."
yarn build
echo "✅ Build complete"

# Deploy Firestore rules + indexes + storage rules
echo "📜 Deploying rules..."
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project "$PROJECT_ID"
echo "✅ Rules deployed"

# Deploy Hosting
echo "🌐 Deploying Hosting..."
firebase deploy --only hosting --project "$PROJECT_ID"
echo "✅ Hosting deployed"

echo ""
echo "🎉 Deployment complete!"
echo "   App: https://$PROJECT_ID.web.app"
echo "   Seed: https://$PROJECT_ID.web.app/seed-data"