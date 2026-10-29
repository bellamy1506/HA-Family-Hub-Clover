#!/usr/bin/env bash
# Family Hub sandbox: a throwaway local Home Assistant running the board with
# made-up data. See README.md in this folder.
#
#   bash tests/sandbox/sandbox.sh reset [SANDBOX_DIR]   wipe, rebuild, reseed
#   bash tests/sandbox/sandbox.sh start [SANDBOX_DIR]   start it (detached)
#   bash tests/sandbox/sandbox.sh stop  [SANDBOX_DIR]   stop it
#
# SANDBOX_DIR defaults to /home/user/ha-sandbox. FH_COMMIT (default 32c486e,
# the build the house runs) picks the Family Hub build to install. Nothing
# here talks to the house; Home Assistant listens on 127.0.0.1:8123 only.
set -euo pipefail

cmd="${1:-}"
SANDBOX="$(realpath -m "${2:-/home/user/ha-sandbox}")"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
FH_COMMIT="${FH_COMMIT:-32c486e}"
HA_VERSION="2026.10.4"
CONFIG="$SANDBOX/config"
VENV="$SANDBOX/venv"
PY="$VENV/bin/python"

is_running() { pgrep -f "$VENV/bin/hass -c $CONFIG" >/dev/null 2>&1; }

wait_up() {
  # Home Assistant opens its port once startup is done. /auth/providers needs
  # no token (asking /api/ without one would log a failed sign-in): 200, or
  # 400 before onboarding.
  for _ in $(seq 1 150); do
    code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8123/auth/providers || true)
    case "$code" in 200|400) return 0 ;; esac
    sleep 2
  done
  echo "Home Assistant did not come up; see $SANDBOX/ha.log" >&2
  return 1
}

start() {
  if is_running; then echo "already running: http://127.0.0.1:8123"; return 0; fi
  # Restart from the UI exits with code 100: the loop starts it again.
  setsid nohup bash -c "while true; do '$VENV/bin/hass' -c '$CONFIG' --log-file '$SANDBOX/ha.log'; code=\$?; [ \$code -eq 100 ] || exit \$code; done" \
    > "$SANDBOX/ha-stdout.log" 2>&1 < /dev/null &
  wait_up
  echo "running: http://127.0.0.1:8123"
}

stop() {
  pkill -f "while true; do '$VENV/bin/hass' -c '$CONFIG'" 2>/dev/null || true
  pkill -TERM -f "$VENV/bin/hass -c $CONFIG" 2>/dev/null || true
  for _ in $(seq 1 30); do is_running || { echo "stopped"; return 0; }; sleep 1; done
  pkill -KILL -f "$VENV/bin/hass -c $CONFIG" 2>/dev/null || true
  echo "stopped (killed)"
}

ensure_venv() {
  if [ ! -x "$VENV/bin/hass" ] || [ "$("$VENV/bin/hass" --version 2>/dev/null)" != "$HA_VERSION" ]; then
    py314="$(uv python find 3.14)"
    uv venv --allow-existing --python "$py314" "$VENV"
    uv pip install --python "$PY" "homeassistant==$HA_VERSION"
  fi
  # The integrations' own requirements, so the first start needs no installs.
  # Versions are the ones Home Assistant 2026.10.4 pins.
  uv pip install --quiet --python "$PY" "home-assistant-frontend==20260930.5" "Pillow==12.3.0" "ical==14.3.0"
}

ensure_secrets() {
  if [ ! -f "$SANDBOX/secrets.json" ]; then
    "$PY" -I -c 'import json, secrets; print(json.dumps({r: f"{r}-{secrets.token_hex(3)}" for r in ("owner", "jenn", "wall")}))' > "$SANDBOX/secrets.json"
    chmod 600 "$SANDBOX/secrets.json"
  fi
}

reset() {
  local t0=$SECONDS
  mkdir -p "$SANDBOX" "$SANDBOX/shots"
  ensure_venv
  ensure_secrets
  stop >/dev/null
  # Browser profiles hold sign-ins for the old users; they go too.
  rm -rf "$CONFIG" "$SANDBOX/state.json" "$SANDBOX/profiles"
  mkdir -p "$CONFIG/.storage"
  cp "$HERE/configuration.yaml" "$CONFIG/configuration.yaml"
  # Onboarding: only the user step is left open (provision.py does it). The
  # core-config step would add Met.no weather, radio browser and Google
  # Translate, which the board doesn't use and which need the internet.
  printf '%s\n' '{"version": 4, "minor_version": 1, "key": "onboarding", "data": {"done": ["analytics", "core_config", "integration"]}}' \
    > "$CONFIG/.storage/onboarding"
  # Family Hub: a copy of the chosen commit, not a link to the working tree.
  git -C "$REPO" archive "$FH_COMMIT" custom_components/family_hub | tar -x -C "$CONFIG"
  find "$CONFIG/custom_components" -name __pycache__ -type d -prune -exec rm -rf {} +
  echo "$FH_COMMIT" > "$CONFIG/custom_components/family_hub/SANDBOX_COMMIT"
  cp -r "$HERE/custom_components/sandbox_house" "$CONFIG/custom_components/"
  start
  "$PY" -I -B "$HERE/provision.py" "$SANDBOX"
  "$PY" -I -B "$HERE/seed.py" "$SANDBOX"
  "$PY" -I -B "$HERE/write_access.py" "$SANDBOX"
  echo "reset done in $((SECONDS - t0)) s"
}

case "$cmd" in
  start) start ;;
  stop) stop ;;
  reset) reset ;;
  *) sed -n '2,12p' "$0"; exit 2 ;;
esac
