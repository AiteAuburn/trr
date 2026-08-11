#!/usr/bin/env python3
"""Verify the production rolling-release and rollback contract."""

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
    backend = (ROOT / "infra/k8s/backend.yaml").read_text(encoding="utf-8")
    migration = (ROOT / "infra/k8s/migration-job.yaml").read_text(encoding="utf-8")
    configmap = (ROOT / "infra/k8s/configmap.yaml").read_text(encoding="utf-8")
    main_py = (ROOT / "backend/app/main.py").read_text(encoding="utf-8")
    runbook = (ROOT / "ai_context/ZERO_DOWNTIME_RELEASE_RUNBOOK.md").read_text(encoding="utf-8")

    if contract.get("schema_version") != 1:
        errors.append("release contract schema_version must be 1")
    if contract.get("rollout_policy", {}).get("max_unavailable") != 0:
        errors.append("release contract must require max_unavailable=0")
    if contract.get("database_policy", {}).get("automatic_downgrade") is not False:
        errors.append("release contract must prohibit automatic database downgrade")
    if contract.get("artifact_policy", {}).get("backend_and_migration_use_same_digest") is not True:
        errors.append("release contract must bind backend and migration to the same digest")

    for marker in ("maxUnavailable: 0", "minReadySeconds: 10", "progressDeadlineSeconds: 300", "path: /readyz", "path: /healthz"):
        require(backend, marker, "infra/k8s/backend.yaml", errors)
    backend_image = next((line.strip() for line in backend.splitlines() if line.strip().startswith("image:")), "")
    migration_image = next((line.strip() for line in migration.splitlines() if line.strip().startswith("image:")), "")
    if backend_image != migration_image:
        errors.append("backend and migration image references must stay identical")
    for marker in ("RELEASE_ID:", "GIT_SHA:", "API_CONTRACT_VERSION:"):
        require(configmap, marker, "infra/k8s/configmap.yaml", errors)
    for marker in ('@app.get("/version")', '"release_id": settings.release_id', '"git_sha": settings.git_sha', '"api_contract_version": settings.api_contract_version'):
        require(main_py, marker, "backend/app/main.py", errors)
    for marker in ("expand/contract", "immutable digest", "Do not automatically downgrade", "15 minutes", "signed mobile"):
        require(runbook, marker, "ai_context/ZERO_DOWNTIME_RELEASE_RUNBOOK.md", errors)

    if errors:
        print("\n".join(errors))
        return 1
    print("Release contract verified: immutable artifacts, expand/contract migrations, readiness-gated rolling updates, and application-first rollback.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
