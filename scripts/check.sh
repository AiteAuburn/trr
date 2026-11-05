#!/usr/bin/env bash
# Local quality gate (replaces the removed GitHub Actions CI). Run with: make check
#
# Uses its own compose project (separate database volume, no host ports, no root
# .env), so it never touches the `make dev` database. The backend suite includes
# a test that clears every table, which is why it must not share that database.
set -euo pipefail
cd "$(dirname "$0")/.."

PY=${PYTHON:-python3}
step() { printf '\n==> %s\n' "$*"; }

step "Repo contract scripts"
for script in \
  verify_backend_constraints \
  verify_backend_ai_cost_boundaries \
  verify_minimal_backup_restore \
  verify_k8s_manifests \
  verify_deployment_config \
  verify_release_contract \
  verify_feature_flags \
  verify_api_migration_compatibility; do
  "$PY" "scripts/${script}.py"
done

export COMPOSE_PROJECT_NAME=bloodsugar_check
dc() { docker compose --env-file /dev/null -f docker-compose.yml -f compose.check.yml "$@"; }
trap 'dc down -v --remove-orphans >/dev/null 2>&1 || true' EXIT

step "Build backend and web images"
dc build backend web

step "Database migrations"
dc up -d --wait db
dc run --rm backend alembic upgrade head

step "Backend: ruff, mypy, pytest"
dc run --rm --no-deps backend ruff check .
dc run --rm --no-deps backend mypy .
dc run --rm backend pytest -q -p no:cacheprovider

step "Web: lint, typecheck, tests"
dc run --rm --no-deps web npm run lint
dc run --rm --no-deps web npm run typecheck
dc run --rm --no-deps web npm test -- --run

step "Mobile quality"
if command -v node >/dev/null 2>&1; then
  (cd mobile && npm run quality)
else
  echo "SKIPPED: node is not installed here. Run 'cd mobile && npm run quality' where Node is available."
fi

step "All checks passed"
