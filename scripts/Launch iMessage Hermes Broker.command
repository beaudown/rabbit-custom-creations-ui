#!/bin/zsh
set -euo pipefail

PROJECT_DIR="/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui"
TOKEN_FILE="/private/tmp/imessage-hermes-broker-token.txt"
LOG_DIR="/private/tmp/imessage-hermes-broker"
STATE_ROOT="/private/tmp/imessage-hermes-broker-state"

mkdir -p "$LOG_DIR" "$STATE_ROOT"

if [[ ! -s "$TOKEN_FILE" ]]; then
  openssl rand -hex 24 > "$TOKEN_FILE"
  chmod 600 "$TOKEN_FILE"
fi

export IMESSAGE_BROKER_HOST="${IMESSAGE_BROKER_HOST:-127.0.0.1}"
export IMESSAGE_BROKER_PORT="${IMESSAGE_BROKER_PORT:-8796}"
export IMESSAGE_BROKER_TOKEN_FILE="${IMESSAGE_BROKER_TOKEN_FILE:-$TOKEN_FILE}"
export IMESSAGE_BROKER_REQUIRE_TOKEN="${IMESSAGE_BROKER_REQUIRE_TOKEN:-true}"
export IMESSAGE_BROKER_REQUIRE_SEND_TOKEN="${IMESSAGE_BROKER_REQUIRE_SEND_TOKEN:-true}"
export IMESSAGE_BROKER_STATE_ROOT="${IMESSAGE_BROKER_STATE_ROOT:-$STATE_ROOT}"
export HERMES_IMESSAGE_UPSTREAM="${HERMES_IMESSAGE_UPSTREAM:-http://127.0.0.1:9120}"

# Real iMessage sends are enabled by default for this launcher.
export IMESSAGE_BROKER_ALLOW_SEND="${IMESSAGE_BROKER_ALLOW_SEND:-true}"

cd "$PROJECT_DIR"

echo "iMessage Hermes Broker"
echo "Endpoint: http://${IMESSAGE_BROKER_HOST}:${IMESSAGE_BROKER_PORT}"
echo "Token file: $TOKEN_FILE"
echo "Token required: $IMESSAGE_BROKER_REQUIRE_TOKEN"
echo "Token required for real sends: $IMESSAGE_BROKER_REQUIRE_SEND_TOKEN"
echo "Token source: local file available, value not printed"
echo "Hermes upstream: $HERMES_IMESSAGE_UPSTREAM"
echo "Real Messages sends enabled: $IMESSAGE_BROKER_ALLOW_SEND"
echo
echo "Health check:"
echo "curl -H \"x-imessage-broker-token: \$(cat $TOKEN_FILE)\" http://${IMESSAGE_BROKER_HOST}:${IMESSAGE_BROKER_PORT}/imessage/health"
echo

npm run broker:imessage 2>&1 | tee -a "$LOG_DIR/broker.log"
