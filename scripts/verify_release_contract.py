#!/usr/bin/env python3
"""Verify the release and rollback contract for the Lightsail deployment."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(text: str, marker: str, source: str, errors: list[str]) -> None:
    if marker not in text:
        errors.append(f"{source}: missing {marker!r}")


def main() -> int:
    errors: list[str] = []
    contract = json.loads((ROOT / "infra/release-contract.json").read_text(encoding="utf-8"))
    compose = (ROOT / "infra/lightsail/compose.yml").read_text(encoding="utf-8")
    main_py = (ROOT / "backend/app/main.py").read_text(encoding="utf-8")
    runbook = (ROOT / "ai_context/DEPLOYMENT.md").read_text(encoding="utf-8")

    if contract.get("schema_version") != 2:
        errors.append("release contract schema_version must be 2")
    if contract.get("deployment_target") != "infra/lightsail/compose.yml":
        errors.append("release contract must name infra/lightsail/compose.yml as the deployment target")
    if contract.get("database_policy", {}).get("automatic_downgrade") is not False:
        errors.append("release contract must prohibit automatic database downgrade")
    if contract.get("database_policy", {}).get("backup_before_migration") is not True:
        errors.append("release contract must require a backup before migrations")
    if contract.get("artifact_policy", {}).get("backend_and_migration_use_same_image") is not True:
        errors.append("release contract must run migrations with the backend image")
    rollout = contract.get("rollout_policy", {})
    for key, value in (("readiness_path", "/readyz"), ("liveness_path", "/healthz"), ("release_identity_path", "/version")):
        if rollout.get(key) != value:
            errors.append(f"release contract rollout_policy.{key} must be {value}")

    # The backend container only counts as up once /readyz answers.
    backend_block = compose.split("\n  backend:", maxsplit=1)[-1].split("\n  web:", maxsplit=1)[0]
    require(backend_block, "http://127.0.0.1:8000/readyz", "infra/lightsail/compose.yml (backend healthcheck)", errors)
    require(compose, "condition: service_healthy", "infra/lightsail/compose.yml", errors)

    for marker in ('@app.get("/healthz")', '@app.get("/readyz")', '@app.get("/version")', '"release_id": settings.release_id', '"git_sha": settings.git_sha', '"api_contract_version": settings.api_contract_version'):
        require(main_py, marker, "backend/app/main.py", errors)

    # The runbook must keep the steps that make a release reversible.
    for marker in ("expand/contract", "infra/lightsail/backup.sh", "run --rm backend alembic upgrade head", "/version", "15 分鐘", "不自動降版資料庫", "簽章"):
        require(runbook, marker, "ai_context/DEPLOYMENT.md", errors)

    if errors:
        print("\n".join(errors))
        return 1
    print("Release contract verified: backup before expand-only migrations, readiness-gated restart, and application-first rollback.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
