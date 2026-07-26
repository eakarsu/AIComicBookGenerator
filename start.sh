#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
[ -f "$root/.env" ] || { echo "Missing .env (copy .env.example)" >&2; exit 1; }
[ -d "$root/node_modules" ] && [ -d "$root/client/node_modules" ] || { echo "Dependencies missing; run scripts/bootstrap.sh" >&2; exit 1; }
set -a; . "$root/.env"; set +a
if [ "${NODE_ENV:-development}" != production ] && [ "${ENABLE_DEMO_CREDENTIAL_AUTOFILL:-true}" = true ]; then psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$root/server/migrations/002_governed_publishing_workflow.sql" >/dev/null; node "$root/server/provision-demo-credentials.js"; fi
export VITE_API_TARGET="http://127.0.0.1:${PORT:-3001}"
(cd "$root" && npm start) & backend_pid=$!
(cd "$root/client" && npm run dev -- --port "${CLIENT_PORT:-5173}") & frontend_pid=$!
cleanup(){ kill "$backend_pid" "$frontend_pid" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
wait "$backend_pid" "$frontend_pid"
