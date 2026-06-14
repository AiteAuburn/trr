from collections.abc import Mapping, Sequence
from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.redaction import REDACTED, is_sensitive_key
from app.models import AuditLog

MAX_AUDIT_METADATA_DEPTH = 4
MAX_AUDIT_METADATA_NODES = 64
MAX_AUDIT_METADATA_CONTAINER_LENGTH = 32
MAX_AUDIT_METADATA_STRING_LENGTH = 256
AUDIT_METADATA_TRUNCATED = "[TRUNCATED]"


def write_audit_event(
    db: Session,
    *,
    action: str,
    resource_type: str,
    actor_account_id: UUID | None = None,
    profile_id: UUID | None = None,
    resource_id: UUID | None = None,
    metadata_json: Mapping[str, Any] | None = None,
) -> AuditLog:
    metadata = sanitize_audit_metadata(metadata_json or {})
    audit_log = AuditLog(
        actor_account_id=actor_account_id,
        profile_id=profile_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_json=metadata,
    )
    db.add(audit_log)
    return audit_log


def sanitize_audit_metadata(metadata_json: Mapping[str, Any]) -> dict[str, Any]:
    sanitizer = _AuditMetadataSanitizer()
    sanitized = sanitizer.sanitize(metadata_json, depth=1)
    if not isinstance(sanitized, dict):
        return {"value": sanitized}
    return sanitized


class _AuditMetadataSanitizer:
    def __init__(self) -> None:
        self.nodes = 0

    def sanitize(self, value: Any, *, depth: int) -> Any:
        self.nodes += 1
        if self.nodes > MAX_AUDIT_METADATA_NODES:
            return AUDIT_METADATA_TRUNCATED
        if depth > MAX_AUDIT_METADATA_DEPTH:
            return AUDIT_METADATA_TRUNCATED
        if isinstance(value, str):
            return _truncate_audit_string(value)
        if isinstance(value, Mapping):
            return self._sanitize_mapping(value, depth=depth)
        if isinstance(value, Sequence) and not isinstance(value, bytes | bytearray | str):
            return self._sanitize_sequence(value, depth=depth)
        if isinstance(value, bool | int | float) or value is None:
            return value
        return _truncate_audit_string(str(value))

    def _sanitize_mapping(self, value: Mapping[Any, Any], *, depth: int) -> dict[str, Any]:
        sanitized: dict[str, Any] = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= MAX_AUDIT_METADATA_CONTAINER_LENGTH:
                sanitized["_truncated"] = True
                break
            sanitized_key = _sanitize_audit_key(key, fallback=f"key_{index}")
            if is_sensitive_key(sanitized_key):
                sanitized[sanitized_key] = REDACTED
            else:
                sanitized[sanitized_key] = self.sanitize(item, depth=depth + 1)
        return sanitized

    def _sanitize_sequence(self, value: Sequence[Any], *, depth: int) -> list[Any]:
        sanitized = [
            self.sanitize(item, depth=depth + 1)
            for item in value[:MAX_AUDIT_METADATA_CONTAINER_LENGTH]
        ]
        if len(value) > MAX_AUDIT_METADATA_CONTAINER_LENGTH:
            sanitized.append(AUDIT_METADATA_TRUNCATED)
        return sanitized


def _sanitize_audit_key(value: Any, *, fallback: str) -> str:
    if not isinstance(value, str):
        return fallback
    normalized = value.strip()
    if not normalized:
        return fallback
    return _truncate_audit_string(normalized)


def _truncate_audit_string(value: str) -> str:
    if len(value) <= MAX_AUDIT_METADATA_STRING_LENGTH:
        return value
    return value[:MAX_AUDIT_METADATA_STRING_LENGTH]
