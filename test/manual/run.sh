#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CONFIG="${1:-anthropic}"
CONFIG_FILE="$ROOT/test/manual/configs/$CONFIG.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Unknown config \"$CONFIG\". Available: $(ls "$ROOT/test/manual/configs/" | sed 's/\.json//' | tr '\n' ' ')"
  exit 1
fi

cd "$ROOT"
echo "Building skillproof..."
npm run build --silent

echo ""
echo "Config: $CONFIG ($CONFIG_FILE)"
echo ""

node dist/cli.js --config "$CONFIG_FILE" "${@:2}"
