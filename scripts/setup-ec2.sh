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

# ── Docker (official install) ─────────────────────────────────────────────
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
usermod -aG docker ubuntu    # let the ubuntu user run docker without sudo

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
echo 'vm.max_map_count=262144' >> /etc/sysctl.conf

# ── Clone repo ────────────────────────────────────────────────────────────
git clone "$REPO_URL" "$APP_DIR"
chown -R ubuntu:ubuntu "$APP_DIR"

# ── Create .env from prompt ───────────────────────────────────────────────
cat <<'ENVEOF' > "$APP_DIR/.env"
# Production secrets — fill these in before starting the app
JWT_SECRET=CHANGE_ME_USE_A_LONG_RANDOM_STRING
GEMINI_API_KEY=
PORT=3000
ENVEOF

echo ""
echo "═══════════════════════════════════════════"
echo " Setup complete!"
echo ""
echo " Next steps:"
echo "  1. Edit $APP_DIR/.env  — set JWT_SECRET and GEMINI_API_KEY"
echo "  2. cd $APP_DIR"
echo "  3. docker compose -f docker-compose.prod.yml up -d --build"
echo "  4. Open port 3000 in your EC2 Security Group"
echo "═══════════════════════════════════════════"
