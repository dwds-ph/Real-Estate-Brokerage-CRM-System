#!/usr/bin/env bash
# Wait for Firebase emulators and Vite dev server to be ready
set -euo pipefail

echo "---WAITING FOR SERVICES---"

# Wait for Auth emulator (port 9099)
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:9099/ > /dev/null 2>&1; then
    echo "AUTH_EMULATOR_READY"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "TIMEOUT: Auth emulator not ready"
    exit 1
  fi
  sleep 1
done

# Wait for Firestore emulator (port 8080)
for i in $(seq 1 30); do
  if curl -sf http://127.0.0.1:8080/ > /dev/null 2>&1; then
    echo "FIRESTORE_EMULATOR_READY"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "TIMEOUT: Firestore emulator not ready"
    exit 1
  fi
  sleep 1
done

# Wait for Vite dev server
VITE_PORT=""
for port in 5173 5174 5175 3000 3001; do
  RESP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$port/" 2>/dev/null || true)
  if [ "$RESP" != "000" ] && [ -n "$RESP" ]; then
    BODY=$(curl -sf "http://127.0.0.1:$port/" 2>/dev/null || true)
    if echo "$BODY" | grep -qE '<script|root|index\.html'; then
      VITE_PORT=$port
      echo "VITE_READY port=$port"
      break
    fi
  fi
  sleep 0.5
done

if [ -z "$VITE_PORT" ]; then
  echo "TIMEOUT: Vite dev server not ready"
  exit 1
fi

echo "ALL_SERVICES_READY VITE_PORT=$VITE_PORT"
export E2E_BASE_URL="http://localhost:$VITE_PORT"
echo "E2E_BASE_URL=$E2E_BASE_URL"