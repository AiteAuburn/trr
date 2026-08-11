#!/usr/bin/env python3
"""Verify API contract range and post-baseline Alembic expand/contract policy."""

from __future__ import annotations

import ast
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSIONS = ROOT / "backend/alembic/versions"


def assignments(path: Path) -> dict[str, object]:
    values: dict[str, object] = {}
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in tree.body:
        name = None
        value = None
        if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            name, value = node.targets[0].id, node.value
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            name, value = node.target.id, node.value
        if name and value is not None:
            try:
                values[name] = ast.literal_eval(value)
            except (ValueError, TypeError):
                continue
    return values


def main() -> int:
    errors: list[str] = []
    policy = json.loads((ROOT / "infra/api-migration-compatibility.json").read_text(encoding="utf-8"))
    api = policy["api"]
    database = policy["database"]
    current = api["current_contract"]
    if not (
        api["minimum_supported_contract"] <= current <= api["maximum_supported_contract"]
        and api["breaking_change_requires_new_contract"] is True
    ):
        errors.append("API compatibility range must contain current contract and require a new contract for breaking changes")

    config = (ROOT / "backend/app/core/config.py").read_text(encoding="utf-8")
    release = json.loads((ROOT / "infra/release-contract.json").read_text(encoding="utf-8"))
    if f'api_contract_version: str = Field(default="{current}"' not in config:
        errors.append("backend API_CONTRACT_VERSION default must match compatibility policy")
    if release.get("api_contract_version") != current:
        errors.append("release contract API version must match compatibility policy")

    revisions: dict[str, tuple[str | None, Path, dict[str, object]]] = {}
    for path in sorted(VERSIONS.glob("*.py")):
        metadata = assignments(path)
        revision = metadata.get("revision")
        down_revision = metadata.get("down_revision")
        if not isinstance(revision, str) or (down_revision is not None and not isinstance(down_revision, str)):
            errors.append(f"{path.relative_to(ROOT)} must have scalar revision/down_revision metadata")
            continue
        revisions[revision] = (down_revision, path, metadata)

    baseline = database["legacy_baseline_head"]
    if baseline not in revisions:
        errors.append(f"legacy baseline head {baseline!r} does not exist")
    legacy: set[str] = set()
    cursor: str | None = baseline if baseline in revisions else None
    while cursor is not None:
        if cursor in legacy:
            errors.append("Alembic revision chain contains a cycle")
            break
        legacy.add(cursor)
        cursor = revisions[cursor][0] if cursor in revisions else None

    children = {down for down, _, _ in revisions.values() if down is not None}
    heads = sorted(set(revisions) - children)
    if len(heads) != 1:
        errors.append(f"Alembic must have one linear head, found {heads}")

    for revision, (_, path, metadata) in revisions.items():
        if revision in legacy:
            continue
        phase = metadata.get("migration_phase")
        rollback_compatible = metadata.get("rollback_compatible")
        if phase != database["required_new_migration_phase"]:
            errors.append(f"{path.relative_to(ROOT)} must declare migration_phase='expand'")
        if rollback_compatible is not True:
            errors.append(f"{path.relative_to(ROOT)} must declare rollback_compatible=True")
        source = path.read_text(encoding="utf-8")
        if "op.drop_" in source.split("def downgrade", maxsplit=1)[0]:
            errors.append(f"{path.relative_to(ROOT)} expand upgrade must not drop schema objects")

    if database["allow_contract_migrations"] is not False:
        errors.append("contract migrations must remain disabled until supported clients and rollback versions expire")

    if errors:
        print("\n".join(errors))
        return 1
    print(f"API/migration compatibility verified: contract {current}, linear Alembic head {heads[0]}, post-baseline expand-only policy.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
