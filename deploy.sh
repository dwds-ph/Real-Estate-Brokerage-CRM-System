#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Real Estate CRM — Deploy Script"
echo "==================================="
echo ""

# 1. Check prerequisites
command -v firebase >/dev/null 2>&1 || { echo "❌ firebase-tools not found. Run: npm install -g firebase-tools"; exit 1; }

# 2. Verify .firebaserc is configured
PROJECT_ID=$(grep -oP '"default"\s*:\s*"\K[^"]+' .firebaserc 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "YOUR_FIREBASE_PROJECT_ID" ]; then
  echo "⚠️  .firebaserc not configured. Run: firebase use --add"
  echo "   Then edit .firebaserc to set your project ID."
  echo "   Or set: export FIREBASE_PROJECT_ID=your-project-id"
  echo ""
  PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
  if [ -z "$PROJECT_ID" ]; then
    echo "❌ No project ID found. Aborting."
    exit 1
  fi
fi

echo "📁 Project: $PROJECT_ID"
echo ""

# 3. Build
echo "🔨 Building SPA..."
yarn build
echo "✅ Build complete"
echo ""

# 4. Deploy Firestore rules + indexes + storage rules
echo "📜 Deploying Firestore rules & indexes..."
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project "$PROJECT_ID"
echo "✅ Firestore & Storage rules deployed"
echo ""

# 5. Deploy Hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting --project "$PROJECT_ID"
echo "✅ Hosting deployed"
echo ""

echo "🎉 Deployment complete!"
echo "   App:    https://$PROJECT_ID.web.app"
echo "   Seed:   https://$PROJECT_ID.web.app/seed-data"
