#!/usr/bin/env sh
# Restore a dump made by backup.sh into the Lightsail database. This replaces
# existing objects; stop the backend first so no writes happen during restore.
# Usage: sh infra/lightsail/restore.sh backups/bloodsugar-YYYYMMDDTHHMMSSZ.dump
set -eu

compose_file="${LIGHTSAIL_COMPOSE_FILE:-infra/lightsail/compose.yml}"
env_file="${LIGHTSAIL_ENV_FILE:-infra/lightsail/.env}"
dump_file="${1:?usage: infra/lightsail/restore.sh backups/bloodsugar-YYYY.dump}"

if [ ! -f "$env_file" ]; then
  echo "Missing env file: $env_file" >&2
  exit 1
fi

if [ ! -r "$dump_file" ]; then
  echo "Dump file is not readable: $dump_file" >&2
  exit 1
fi

docker compose --env-file "$env_file" -f "$compose_file" exec -T db \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < "$dump_file"
echo "Restore finished from: $dump_file"
