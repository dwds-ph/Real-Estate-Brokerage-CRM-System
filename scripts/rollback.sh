#!/usr/bin/env bash
# Real Estate CRM — Firebase Hosting Rollback Script
# Usage: ./scripts/rollback.sh [version]
#   version: optional, defaults to previous version
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔄 Real Estate CRM — Rollback Utility${NC}"
echo ""

# Check prerequisites
command -v firebase >/dev/null 2>&1 || { echo -e "${RED}❌ Install firebase-tools: npm install -g firebase-tools${NC}"; exit 1; }

# Read project from .firebaserc
PROJECT_ID=$(grep -oP '"default"\s*:\s*"\K[^"]+' .firebaserc 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "demo-crm" ]; then
  PROJECT_ID="${FIREBASE_PROJECT_ID:-}"
  [ -z "$PROJECT_ID" ] && { echo -e "${RED}❌ No project ID. Set FIREBASE_PROJECT_ID or configure .firebaserc${NC}"; exit 1; }
fi

echo -e "${YELLOW}📁 Project:${NC} $PROJECT_ID"

# List recent versions
echo ""
echo -e "${CYAN}📋 Recent hosting versions:${NC}"
firebase hosting:channel:list --project "$PROJECT_ID" 2>/dev/null || true

echo ""
VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  # Rollback to previous (live → previous live)
  echo -e "${YELLOW}⏪ Rolling back to previous version (live)...${NC}"
  firebase hosting:clone "$PROJECT_ID"/live/latest "$PROJECT_ID"/live/rollback-$(date +%s) --project "$PROJECT_ID"
  echo ""
  echo -e "${GREEN}✅ Rollback complete. Previous version restored.${NC}"
  echo -e "   ${CYAN}Visit:${NC} https://$PROJECT_ID.web.app"
else
  # Rollback to specific version
  echo -e "${YELLOW}⏪ Rolling back to version:${NC} $VERSION"
  firebase hosting:clone "$PROJECT_ID"/"$VERSION"/latest "$PROJECT_ID"/live/rollback-$(date +%s) --project "$PROJECT_ID"
  echo ""
  echo -e "${GREEN}✅ Rollback to $VERSION complete.${NC}"
  echo -e "   ${CYAN}Visit:${NC} https://$PROJECT_ID.web.app"
fi
