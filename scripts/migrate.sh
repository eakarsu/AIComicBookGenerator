#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; set -a; . "$root/.env"; set +a; : "${DATABASE_URL:?DATABASE_URL required}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$root/server/schema.sql"
for file in "$root"/server/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"; done
