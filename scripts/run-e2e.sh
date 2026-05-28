#!/usr/bin/env bash
# E2E test runner — starts services, waits, runs Playwright, cleans up
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

PROJECT="demo-crm"
echo "🚀 E2E: project=$PROJECT args=$*"

# Cleanup all stale Vite processes
pkill -f "node.*vite" 2>/dev/null || true
sleep 1

cleanup() { 
  pkill -f "firebase.*emulators" 2>/dev/null || true
  pkill -f "node.*auth/server" 2>/dev/null || true
  pkill -f "node.*vite" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "1:firestore"
firebase emulators:start --only firestore --project "$PROJECT" &
echo "2:auth"
node -e "
const{createApp}=require('/usr/local/lib/node_modules/firebase-tools/lib/emulator/auth/server');
createApp('${PROJECT}',0).then(a=>a.listen(9099,'127.0.0.1',()=>console.log('AUTH_READY')));
setInterval(()=>{},60000);
" &
echo "3:vite"
npx vite &
echo "4:wait"
for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:9099/ >/dev/null 2>&1 && echo "AUTH_OK" && break
  [ "$i" -eq 30 ] && echo "AUTH_TIMEOUT" && exit 1
  sleep 1
done

# Wait for Firestore
for i in $(seq 1 30); do
  curl -sf http://127.0.0.1:8080/ >/dev/null 2>&1 && echo "FIRESTORE_OK" && break
  [ "$i" -eq 30 ] && echo "FIRESTORE_TIMEOUT" && exit 1
  sleep 1
done

# Wait for Vite — probe body content to avoid stale servers
VITE_PORT=""
for i in $(seq 1 15); do
  for port in 5173 5174 5175 3000 3001 3002 3003; do
    BODY=$(curl -sf "http://127.0.0.1:$port/" 2>/dev/null || echo "")
    if echo "$BODY" | grep -qE 'id="root"|__VITE_HMR_'; then
      VITE_PORT=$port
      echo "VITE_OK port=$port"
      break 2
    fi
  done
  sleep 1
done
[ -z "$VITE_PORT" ] && echo "VITE_TIMEOUT" && exit 1

export E2E_BASE_URL="http://localhost:$VITE_PORT"
echo "READY E2E_BASE_URL=$E2E_BASE_URL"

# Run tests
E2E_BASE_URL="$E2E_BASE_URL" npx playwright test "$@"
exit $?