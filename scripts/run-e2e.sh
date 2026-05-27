#!/usr/bin/env bash
set -euo pipefail

# Real Estate CRM — E2E Test Runner
# Starts Firebase emulators, seeds test users, starts Vite, runs Playwright

echo "🧪 Real Estate CRM — E2E Test Suite"
echo "==================================="
echo ""

PROJECT="${FIREBASE_PROJECT_ID:-demo-crm}"
VITE_PORT="${VITE_PORT:-3000}"
E2E_BASE_URL="http://localhost:${VITE_PORT}"

# ── 1. Check prerequisites ──────────────────────────────────────────
command -v java >/dev/null 2>&1 || { echo "❌ Java required: apt install default-jre-headless"; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "❌ firebase-tools required: npm install -g firebase-tools"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "❌ npx required: npm install -g npx"; exit 1; }

# ── 2. Set up .env.e2e ─────────────────────────────────────────────
cat > .env.e2e << ENVEOF
VITE_FIREBASE_API_KEY=fake-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost:9099
VITE_FIREBASE_PROJECT_ID=${PROJECT}
VITE_FIREBASE_STORAGE_BUCKET=${PROJECT}.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
ENVEOF
echo "✅ .env.e2e configured for project: ${PROJECT}"

# ── 3. Kill any leftover processes ──────────────────────────────────
echo "🧹 Cleaning up old processes..."
for port in 9099 8080 4000 4400 4500 3000 5173; do
  lsof -ti :${port} 2>/dev/null | xargs kill -9 2>/dev/null || true
done

# ── 4. Start Firebase Emulators ─────────────────────────────────────
echo "🔥 Starting Firebase Emulators..."
firebase emulators:start --only auth,firestore --project "${PROJECT}" > /tmp/firebase-emulator.log 2>&1 &
FIREBASE_PID=$!

# Wait for Firestore emulator to be ready
echo -n "   Waiting for emulators"
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8080/ >/dev/null 2>&1; then
    echo " ready! (${i}s)"
    break
  fi
  if ! kill -0 $FIREBASE_PID 2>/dev/null; then
    echo ""
    echo "❌ Firebase emulator died. Check /tmp/firebase-emulator.log"
    exit 1
  fi
  echo -n "."
  sleep 2
done

# ── 5. Start Vite Dev Server ────────────────────────────────────────
echo "🚀 Starting Vite dev server..."
VITE_FIREBASE_API_KEY=fake-api-key \
VITE_FIREBASE_AUTH_DOMAIN=localhost:9099 \
VITE_FIREBASE_PROJECT_ID=${PROJECT} \
VITE_FIREBASE_STORAGE_BUCKET=${PROJECT}.appspot.com \
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 \
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000 \
  npx vite --host 0.0.0.0 --port ${VITE_PORT} > /tmp/vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to be ready
echo -n "   Waiting for Vite"
for i in $(seq 1 20); do
  if curl -s http://127.0.0.1:${VITE_PORT}/ >/dev/null 2>&1; then
    echo " ready! (${i}s)"
    break
  fi
  if ! kill -0 $VITE_PID 2>/dev/null; then
    echo ""
    echo "❌ Vite dev server died. Check /tmp/vite.log"
    exit 1
  fi
  echo -n "."
  sleep 2
done

# ── 6. Seed test users ──────────────────────────────────────────────
echo "👤 Seeding test users..."
node -e "
const { seedTestUsers } = require('./e2e/helpers/auth');
seedTestUsers().then(() => console.log('Users seeded!')).catch(console.error);
" || echo "⚠️  User seeding skipped (may already exist)"

# ── 7. Run Playwright ───────────────────────────────────────────────
echo "🎭 Running Playwright E2E tests..."
E2E_BASE_URL="${E2E_BASE_URL}" npx playwright test --reporter=list "$@"
EXIT_CODE=$?

# ── 8. Cleanup ──────────────────────────────────────────────────────
echo "🧹 Cleaning up..."
kill $VITE_PID 2>/dev/null || true
kill $FIREBASE_PID 2>/dev/null || true

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All E2E tests passed!"
else
  echo "❌ Some E2E tests failed (exit code: $EXIT_CODE)"
fi

exit $EXIT_CODE
