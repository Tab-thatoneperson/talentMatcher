#!/usr/bin/env bash
# Run once on a fresh Ubuntu 22.04 EC2 instance (t2.micro or larger).
# sudo bash setup-ec2.sh
set -euo pipefail

REPO_URL="https://github.com/<your-org>/talentMatcher.git"   # ← update this
APP_DIR="/opt/talentmatcher"

echo "═══════════════════════════════════════════"
echo " TalentMatcher — EC2 bootstrap"
echo "═══════════════════════════════════════════"

# ── System packages ────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y git curl ca-certificates gnupg

# ── Docker (skip if already installed) ───────────────────────────────────
if command -v docker &>/dev/null && docker compose version &>/dev/null; then
  echo "── docker already installed, skipping ──"
else
  echo "── installing docker ──"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list

  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

  systemctl enable --now docker
  usermod -aG docker ubuntu
fi

# ── Swap (recommended for t2.micro with 1 GB RAM) ─────────────────────────
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ── vm.max_map_count required by Elasticsearch ────────────────────────────
sysctl -w vm.max_map_count=262144
grep -qxF 'vm.max_map_count=262144' /etc/sysctl.conf \
  || echo 'vm.max_map_count=262144' >> /etc/sysctl.conf

# ── Clone repo (skip if already cloned) ───────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  echo "── repo already cloned, pulling latest ──"
  git -C "$APP_DIR" pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  chown -R ubuntu:ubuntu "$APP_DIR"
fi

# ── Create .env if it doesn't exist ──────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cat <<'ENVEOF' > "$APP_DIR/.env"
# Production secrets — fill these in before starting the app
JWT_SECRET=CHANGE_ME_USE_A_LONG_RANDOM_STRING
GEMINI_API_KEY=
PORT=3000
ENVEOF
fi

# ── Start Elasticsearch first, wait for it, then start the app ───────────
echo "── starting elasticsearch ──"
docker compose -f "$APP_DIR/docker-compose.prod.yml" up -d elasticsearch

echo "── waiting for elasticsearch to be healthy ──"
for i in $(seq 1 30); do
  if docker compose -f "$APP_DIR/docker-compose.prod.yml" ps elasticsearch \
      | grep -q "healthy"; then
    echo "elasticsearch is healthy"
    break
  fi
  echo "  waiting... ($i/30)"
  sleep 5
done

echo "── starting app ──"
docker compose -f "$APP_DIR/docker-compose.prod.yml" up -d --no-deps app

echo ""
echo "═══════════════════════════════════════════"
echo " Bootstrap complete!"
echo ""
echo " If first run, make sure to:"
echo "  1. Edit $APP_DIR/.env  — set JWT_SECRET and GEMINI_API_KEY"
echo "  2. Restart app:  docker compose -f $APP_DIR/docker-compose.prod.yml up -d --no-deps app"
echo "  3. Open port 3000 in your EC2 Security Group"
echo "═══════════════════════════════════════════"
