#!/usr/bin/env python3
"""Verify minimal production backup/restore scripts keep safe guardrails."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKUP_SCRIPT = REPO_ROOT / "infra" / "minimal" / "backup.sh"
RESTORE_SCRIPT = REPO_ROOT / "infra" / "minimal" / "restore.sh"


def _require(content: str, needle: str, *, script: Path, errors: list[str]) -> None:
    if needle not in content:
        errors.append(f"{script.relative_to(REPO_ROOT)} missing required guard: {needle}")


def main() -> int:
    errors: list[str] = []
    backup = BACKUP_SCRIPT.read_text(encoding="utf-8")
    restore = RESTORE_SCRIPT.read_text(encoding="utf-8")

    for script, content in ((BACKUP_SCRIPT, backup), (RESTORE_SCRIPT, restore)):
        _require(content, "set -eu", script=script, errors=errors)
        _require(content, "MINIMAL_ENV_FILE", script=script, errors=errors)
        _require(content, "--env-file \"$env_file\"", script=script, errors=errors)
        _require(content, "infra/minimal/docker-compose.yml", script=script, errors=errors)

    _require(backup, ".tmp", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "trap 'rm -f \"$tmp_file\"' EXIT", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "mv \"$tmp_file\" \"$final_file\"", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "pg_dump", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "-Fc", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "BACKUP_RETENTION_DAYS", script=BACKUP_SCRIPT, errors=errors)

    _require(restore, "[ ! -r \"$dump_file\" ]", script=RESTORE_SCRIPT, errors=errors)
    _require(restore, "pg_restore", script=RESTORE_SCRIPT, errors=errors)
    _require(restore, "--clean --if-exists", script=RESTORE_SCRIPT, errors=errors)

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Minimal backup/restore scripts verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
