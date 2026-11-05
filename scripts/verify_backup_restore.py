#!/usr/bin/env python3
"""Verify the Lightsail backup/restore scripts keep their safety guards."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKUP_SCRIPT = REPO_ROOT / "infra" / "lightsail" / "backup.sh"
RESTORE_SCRIPT = REPO_ROOT / "infra" / "lightsail" / "restore.sh"
GITIGNORE = REPO_ROOT / ".gitignore"


def _require(content: str, needle: str, *, script: Path, errors: list[str]) -> None:
    if needle not in content:
        errors.append(f"{script.relative_to(REPO_ROOT)} missing required guard: {needle}")


def main() -> int:
    errors: list[str] = []
    for script in (BACKUP_SCRIPT, RESTORE_SCRIPT):
        if not script.is_file():
            errors.append(f"{script.relative_to(REPO_ROOT)} is missing")
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    backup = BACKUP_SCRIPT.read_text(encoding="utf-8")
    restore = RESTORE_SCRIPT.read_text(encoding="utf-8")

    for script, content in ((BACKUP_SCRIPT, backup), (RESTORE_SCRIPT, restore)):
        _require(content, "set -eu", script=script, errors=errors)
        _require(content, "LIGHTSAIL_ENV_FILE", script=script, errors=errors)
        _require(content, '--env-file "$env_file"', script=script, errors=errors)
        _require(content, "infra/lightsail/compose.yml", script=script, errors=errors)

    # Write to a temp file and rename, so a failed dump never looks like a good backup.
    _require(backup, ".tmp", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "trap 'rm -f \"$tmp_file\"' EXIT", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, 'mv "$tmp_file" "$final_file"', script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "pg_dump", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "-Fc", script=BACKUP_SCRIPT, errors=errors)
    _require(backup, 'chmod 600 "$final_file"', script=BACKUP_SCRIPT, errors=errors)
    _require(backup, "BACKUP_RETENTION_DAYS", script=BACKUP_SCRIPT, errors=errors)

    _require(restore, '[ ! -r "$dump_file" ]', script=RESTORE_SCRIPT, errors=errors)
    _require(restore, "pg_restore", script=RESTORE_SCRIPT, errors=errors)
    _require(restore, "--clean --if-exists", script=RESTORE_SCRIPT, errors=errors)

    # Dumps contain health data and must never be committed.
    if "backups/" not in GITIGNORE.read_text(encoding="utf-8"):
        errors.append(".gitignore must ignore backups/ (database dumps contain PHI)")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print("Backup/restore scripts verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
