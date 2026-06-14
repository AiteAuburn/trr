#!/usr/bin/env sh
set -eu

backup_dir="${BACKUP_DIR:-./backups}"
env_file="${MINIMAL_ENV_FILE:-infra/minimal/.env}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_file="$backup_dir/bloodsugar-$stamp.dump"
tmp_file="$backup_dir/.bloodsugar-$stamp.dump.tmp"

if [ ! -f "$env_file" ]; then
  echo "Missing env file: $env_file" >&2
  echo "Set MINIMAL_ENV_FILE or create infra/minimal/.env from infra/minimal/.env.example." >&2
  exit 1
fi

mkdir -p "$backup_dir"
trap 'rm -f "$tmp_file"' EXIT

docker compose --env-file "$env_file" -f infra/minimal/docker-compose.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-app}" -d "${POSTGRES_DB:-bloodsugar}" \
  -Fc > "$tmp_file"

mv "$tmp_file" "$final_file"

find "$backup_dir" -type f -name 'bloodsugar-*.dump' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete
echo "Backup written: $final_file"
