#!/usr/bin/env bash
set -eu

deployment_dir=${1:-/opt/bloodsugar/infra/lightsail}
env_file="${deployment_dir}/.env"
temp_file="${deployment_dir}/.env.tmp"

if [ ! -f "${env_file}" ]; then
  echo "Missing ${env_file}; initialize the server environment first." >&2
  exit 1
fi

printf 'Paste the rotated DeepSeek API key (input hidden): '
IFS= read -r -s deepseek_key
printf '\n'
if [ -z "${deepseek_key}" ]; then
  echo "DeepSeek API key cannot be empty." >&2
  exit 1
fi

umask 077
found=false
while IFS= read -r line || [ -n "${line}" ]; do
  case "${line}" in
    DEEPSEEK_API_KEY=*)
      printf 'DEEPSEEK_API_KEY=%s\n' "${deepseek_key}"
      found=true
      ;;
    *) printf '%s\n' "${line}" ;;
  esac
done < "${env_file}" > "${temp_file}"

if [ "${found}" != true ]; then
  printf 'DEEPSEEK_API_KEY=%s\n' "${deepseek_key}" >> "${temp_file}"
fi

chmod 600 "${temp_file}"
mv "${temp_file}" "${env_file}"
unset deepseek_key
echo "DeepSeek API key updated without displaying it."
