#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"; [ -f "$root/.env" ] || cp "$root/.env.example" "$root/.env"
(cd "$root" && npm ci); (cd "$root/client" && npm install)
