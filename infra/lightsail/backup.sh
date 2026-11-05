#!/usr/bin/env sh
# Dump the Lightsail PostgreSQL database to a timestamped custom-format file.
# Run from the repository root on the server: sh infra/lightsail/backup.sh
set -eu

compose_file="${LIGHTSAIL_COMPOSE_FILE:-infra/lightsail/compose.yml}"
env_file="${LIGHTSAIL_ENV_FILE:-infra/lightsail/.env}"
backup_dir="${BACKUP_DIR:-./backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
final_file="$backup_dir/bloodsugar-$stamp.dump"
tmp_file="$backup_dir/.bloodsugar-$stamp.dump.tmp"

if [ ! -f "$env_file" ]; then
  echo "Missing env file: $env_file (create it with infra/lightsail/initialize-env.sh)" >&2
  exit 1
fi

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
trap 'rm -f "$tmp_file"' EXIT

# The database credentials come from the db container's own environment.
docker compose --env-file "$env_file" -f "$compose_file" exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$tmp_file"

mv "$tmp_file" "$final_file"
chmod 600 "$final_file"

find "$backup_dir" -type f -name 'bloodsugar-*.dump' -mtime +"${BACKUP_RETENTION_DAYS:-14}" -delete
echo "Backup written: $final_file"
