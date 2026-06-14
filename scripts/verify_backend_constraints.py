#!/usr/bin/env python3
"""Verify backend dependency constraints are wired into builds."""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"
PYPROJECT_PATH = BACKEND_DIR / "pyproject.toml"
CONSTRAINTS_PATH = BACKEND_DIR / "constraints.txt"
DOCKERFILES = (
    BACKEND_DIR / "Dockerfile",
    BACKEND_DIR / "Dockerfile.prod",
)

NAME_PATTERN = re.compile(r"^\s*([A-Za-z0-9_.-]+)")


def _normalized_name(requirement: str) -> str:
    name_part = requirement.split(";", maxsplit=1)[0].strip()
    name_part = name_part.split("[", maxsplit=1)[0]
    name_part = re.split(r"\s*(?:==|>=|<=|~=|!=|>|<)", name_part, maxsplit=1)[0]
    return name_part.lower().replace("_", "-")


def _constraint_names() -> set[str]:
    names: set[str] = set()
    for line in CONSTRAINTS_PATH.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "==" not in stripped:
            raise AssertionError(f"Constraint is not pinned with ==: {stripped}")
        match = NAME_PATTERN.match(stripped)
        if match is None:
            raise AssertionError(f"Could not parse constraint line: {stripped}")
        names.add(match.group(1).lower().replace("_", "-"))
    return names


def _direct_dependency_names() -> set[str]:
    pyproject = tomllib.loads(PYPROJECT_PATH.read_text(encoding="utf-8"))
    project = pyproject["project"]
    names = {_normalized_name(requirement) for requirement in project.get("dependencies", [])}
    for requirements in project.get("optional-dependencies", {}).values():
        names.update(_normalized_name(requirement) for requirement in requirements)
    return names


def main() -> int:
    constraint_names = _constraint_names()
    direct_dependency_names = _direct_dependency_names()
    missing = sorted(direct_dependency_names - constraint_names)
    errors: list[str] = []
    if missing:
        errors.append(
            "Direct backend dependencies missing pinned constraints: " + ", ".join(missing)
        )

    for dockerfile in DOCKERFILES:
        content = dockerfile.read_text(encoding="utf-8")
        if "constraints.txt" not in content or "-c constraints.txt" not in content:
            errors.append(f"{dockerfile.relative_to(REPO_ROOT)} does not use constraints.txt")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print(
        "Backend constraints verified: "
        f"{len(direct_dependency_names)} direct dependencies constrained and Dockerfiles wired."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
