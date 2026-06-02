#!/usr/bin/env bash
# Simulates the CI deploy script locally — no EC2, no git pull.
# Run from the repo root: bash scripts/deploy-local-test.sh
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml"

echo "═══════════════════════════════════════════"
echo " TalentMatcher — local deploy test"
echo "═══════════════════════════════════════════"

# ── Step 1: start ES (no-op if already running) ───────────────────────────
echo ""
echo "── [1/4] ensuring elasticsearch is up ──"
$COMPOSE up -d elasticsearch

# ── Step 2: wait for ES health ────────────────────────────────────────────
echo ""
echo "── [2/4] waiting for elasticsearch to be healthy ──"
for i in $(seq 1 30); do
  if $COMPOSE ps elasticsearch | grep -q "healthy"; then
    echo "  elasticsearch is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  ERROR: elasticsearch did not become healthy in time"
    $COMPOSE logs --tail=20 elasticsearch
    exit 1
  fi
  echo "  waiting... ($i/30)"
  sleep 5
done

# ── Step 3: rebuild + restart app only ───────────────────────────────────
echo ""
echo "── [3/4] rebuilding app image ──"
$COMPOSE build app

echo ""
echo "── [4/4] restarting app only (--no-deps) ──"
$COMPOSE up -d --no-deps app

# ── Result ────────────────────────────────────────────────────────────────
echo ""
echo "── container status ──"
$COMPOSE ps

echo ""
echo "── app logs (last 20 lines) ──"
$COMPOSE logs --tail=20 app

echo ""
echo "═══════════════════════════════════════════"
echo " Deploy test complete!"
echo " App should be running at http://localhost:3000"
echo " Run a second time to confirm ES is NOT restarted."
echo "═══════════════════════════════════════════"
