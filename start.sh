#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
[ -f "$root/.env" ] || { echo "Missing .env (copy .env.example)" >&2; exit 1; }
[ -d "$root/node_modules" ] && [ -d "$root/client/node_modules" ] || { echo "Dependencies missing; run scripts/bootstrap.sh" >&2; exit 1; }
set -a; . "$root/.env"; set +a
(cd "$root" && npm start) & backend_pid=$!
(cd "$root/client" && npm run dev -- --port "${CLIENT_PORT:-5173}") & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
