#!/usr/bin/env bash
set -eu

deployment_dir=${1:-/opt/bloodsugar/infra/lightsail}
env_file="${deployment_dir}/.env"
temp_file="${deployment_dir}/.env.tmp"

if [ ! -f "${env_file}" ]; then
  echo "Missing ${env_file}; initialize the server environment first." >&2
  exit 1
fi

printf 'Admin username [admin]: '
IFS= read -r admin_username
admin_username=${admin_username:-admin}
case "${admin_username}" in
  *[!A-Za-z0-9_.-]*|'')
    echo "Admin username may contain only letters, numbers, dot, dash, and underscore." >&2
    exit 1
    ;;
esac

printf 'Admin password (input hidden): '
IFS= read -r -s admin_password
printf '\n'
if [ -z "${admin_password}" ]; then
  echo "Admin password cannot be empty." >&2
  exit 1
fi

compose_file="${deployment_dir}/compose.yml"
admin_password_hash=$(
  printf '%s' "${admin_password}" |
    docker compose --env-file "${env_file}" -f "${compose_file}" run --rm -T --no-deps backend \
      python -c 'import sys; from app.services.admin_auth import hash_admin_password; print(hash_admin_password(sys.stdin.read()))'
)
admin_session_secret=$(openssl rand -hex 32)
umask 077

awk \
  -v username="${admin_username}" \
  -v password_hash="${admin_password_hash}" \
  -v session_secret="${admin_session_secret}" '
    BEGIN { seen_username=0; seen_hash=0; seen_secret=0 }
    /^ADMIN_USERNAME=/ { print "ADMIN_USERNAME=" username; seen_username=1; next }
    /^ADMIN_PASSWORD_HASH=/ { print "ADMIN_PASSWORD_HASH=" password_hash; seen_hash=1; next }
    /^ADMIN_SESSION_SECRET=/ { print "ADMIN_SESSION_SECRET=" session_secret; seen_secret=1; next }
    { print }
    END {
      if (!seen_username) print "ADMIN_USERNAME=" username
      if (!seen_hash) print "ADMIN_PASSWORD_HASH=" password_hash
      if (!seen_secret) print "ADMIN_SESSION_SECRET=" session_secret
    }
  ' "${env_file}" > "${temp_file}"

chmod 600 "${temp_file}"
mv "${temp_file}" "${env_file}"
unset admin_password admin_password_hash admin_session_secret
echo "Admin credentials updated; plaintext password was not stored."
