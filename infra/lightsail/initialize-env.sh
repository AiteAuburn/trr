#!/usr/bin/env bash
set -eu

domain=${1:?usage: initialize-env.sh DOMAIN}
deployment_dir=${2:-/opt/bloodsugar/infra/lightsail}
env_file="${deployment_dir}/.env"

if [ -e "${env_file}" ]; then
  echo "Refusing to overwrite existing ${env_file}" >&2
  exit 1
fi

db_password=$(openssl rand -hex 24)
jwt_secret=$(openssl rand -hex 32)
umask 077

{
  printf 'DOMAIN=%s\n' "${domain}"
  printf 'BACKEND_CORS_ORIGINS=https://%s\n' "${domain}"
  printf 'POSTGRES_DB=bloodsugar\n'
  printf 'POSTGRES_USER=app\n'
  printf 'POSTGRES_PASSWORD=%s\n' "${db_password}"
  printf 'DATABASE_URL=postgresql+psycopg://app:%s@db:5432/bloodsugar\n' "${db_password}"
  printf 'ALLOW_DEV_AUTH=true\n'
  printf 'AUTH_JWT_SECRET=%s\n' "${jwt_secret}"
  printf 'AUTH_JWT_ISSUER=https://%s\n' "${domain}"
  printf 'AUTH_JWT_AUDIENCE=bloodsugar-api\n'
  printf 'DEEPSEEK_API_KEY=\n'
  printf 'DEEPSEEK_MODEL_ID=deepseek-v4-flash\n'
} > "${env_file}"

chmod 600 "${env_file}"
unset db_password jwt_secret
echo "Initialized ${env_file}; DeepSeek key is still unset."
