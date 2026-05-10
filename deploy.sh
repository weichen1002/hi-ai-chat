#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="${APP_NAME:-hi-ai-chat}"
ECOSYSTEM_FILE="${ECOSYSTEM_FILE:-ecosystem.config.cjs}"

log() {
  printf '\n[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

cd "$ROOT_DIR"

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  log "Pulling latest code"
  git pull --ff-only
fi

if [[ -f package-lock.json ]]; then
  log "Installing dependencies with npm ci"
  npm ci
else
  log "Installing dependencies with npm install"
  npm install
fi

log "Removing old build output"
rm -rf .next

log "Building production bundle"
npm run build

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Restarting PM2 app: $APP_NAME"
  pm2 restart "$APP_NAME" --update-env
else
  log "Starting PM2 app from $ECOSYSTEM_FILE"
  pm2 start "$ECOSYSTEM_FILE"
fi

log "Saving PM2 process list"
pm2 save

log "Deploy finished"
