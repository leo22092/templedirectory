#!/usr/bin/env bash
# =============================================================================
# publish.sh — TempleDiary 48-hour D1 publish pipeline
#
# What it does:
#   1. Verifies repo root and a clean main branch
#   2. Exports live D1 data to data/*.json  (export-d1-to-json.mjs --remote)
#   3. Rebuilds the All-India search index  (generate-index.mjs)
#   4. Commits to main and pushes origin/main  (skips if nothing changed)
#   5. Resets production branch to match main and force-pushes it
#   6. Returns to main — always, even on failure
#
# Usage:
#   bash scripts/publish.sh
#
# Requirements:
#   - Run from the repo root
#   - wrangler must be configured with remote D1 access
#   - Both 'main' and 'production' branches must exist locally
#   - No uncommitted changes on main before running
# =============================================================================

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()  { echo -e "\n${CYAN}${BOLD}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✔  $*${NC}"; }
warn() { echo -e "${YELLOW}⚠  $*${NC}"; }
fail() { echo -e "\n${RED}✖  $*${NC}\n"; exit 1; }

# ── Always return to main on exit (success or failure) ────────────────────────
trap 'EXIT_CODE=$?; git checkout main 2>/dev/null || true; [[ $EXIT_CODE -ne 0 ]] && echo -e "\n${RED}Script exited with an error. Returned to main.${NC}" || true' EXIT

# ── 1. Verify repo root ───────────────────────────────────────────────────────
log "Checking environment..."
[[ -f "AGENTS.md" ]] || fail "Must be run from the repo root (AGENTS.md not found)."
[[ -f "scripts/export-d1-to-json.mjs" ]] || fail "scripts/export-d1-to-json.mjs not found."
[[ -f "scripts/generate-index.mjs" ]] || fail "scripts/generate-index.mjs not found."
ok "Repo root confirmed."

# ── 2. Ensure we are on main ──────────────────────────────────────────────────
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  warn "Currently on '$CURRENT_BRANCH'. Switching to main..."
  git checkout main
fi

# Verify main branch exists on remote (non-fatal)
git fetch origin main --quiet 2>/dev/null || warn "Could not fetch origin/main — continuing with local."

ok "On branch: main."

# ── 3. Verify clean working tree ──────────────────────────────────────────────
log "Checking for uncommitted changes..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Uncommitted changes detected on main. Stash or commit them before running this script."
fi
ok "Working tree is clean."

# ── 4. Export D1 data to data/*.json ─────────────────────────────────────────
log "Exporting D1 data (remote)..."
node scripts/export-d1-to-json.mjs --write --yes --remote
ok "D1 export complete."

# ── 5. Rebuild All-India search index ────────────────────────────────────────
log "Rebuilding data/index.json..."
node scripts/generate-index.mjs
ok "Index rebuilt."

# ── 6. Commit to main (skip if nothing changed) ───────────────────────────────
log "Checking for changes to commit..."
COMMIT_MSG="D1 export $(date '+%Y-%m-%d %H:%M IST')"
COMMITTED=false

if git diff --quiet && git diff --cached --quiet; then
  warn "No data changes after export. Nothing to commit — skipping production promotion."
else
  git add .
  git commit -m "$COMMIT_MSG"
  ok "Committed to main: \"$COMMIT_MSG\""

  log "Pushing main to origin..."
  git push origin main
  ok "origin/main is up to date."

  COMMITTED=true
fi

# ── 7. Promote to production ──────────────────────────────────────────────────
if [[ "$COMMITTED" == "true" ]]; then
  log "Switching to production branch..."
  git checkout production || fail "'production' branch not found locally. Create it first: git checkout -b production"

  log "Resetting production to match main..."
  git reset --hard main

  log "Force-pushing production to origin..."
  git push origin production --force
  ok "Production promoted to: \"$COMMIT_MSG\""

  # Return to main (trap also handles this but be explicit)
  git checkout main
  ok "Returned to main."
else
  ok "Nothing to publish. Already on main."
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}═══════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  Publish complete. Branch: main  ✔${NC}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════${NC}"
echo ""
