#!/usr/bin/env sh
set -eu

env_file="${MINIMAL_ENV_FILE:-infra/minimal/.env}"
dump_file="${1:?usage: infra/minimal/restore.sh backups/bloodsugar-YYYY.dump}"

if [ ! -f "$env_file" ]; then
  echo "Missing env file: $env_file" >&2
  echo "Set MINIMAL_ENV_FILE or create infra/minimal/.env from infra/minimal/.env.example." >&2
  exit 1
fi

if [ ! -r "$dump_file" ]; then
  echo "Dump file is not readable: $dump_file" >&2
  exit 1
fi

docker compose --env-file "$env_file" -f infra/minimal/docker-compose.yml exec -T db \
  pg_restore -U "${POSTGRES_USER:-app}" -d "${POSTGRES_DB:-bloodsugar}" \
  --clean --if-exists < "$dump_file"
