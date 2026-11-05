import hashlib
import json
import logging
import re
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from sqlalchemy import delete, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.logging import current_request_log_context, log_throttled_warning
from app.db.session import SessionLocal
from app.models import OperationalEvent


SAFE_EVENT_VALUE = re.compile(r"^[A-Za-z0-9_./:{}+-]+$")
RETENTION_DAYS = 30
MAX_BATCH_NUMBER = 32767


def record_operational_event(
    *,
    event_code: str,
    source: str,
    severity: str,
    provider: str = "",
    model_id: str = "",
    route: str = "",
    method: str = "",
    http_status: int = 0,
    error_type: str = "",
    batch_number: int = 0,
    duration_ms: int = 0,
    request_id: str = "",
    trace_id: str = "",
    now: datetime | None = None,
    db: Session | None = None,
) -> None:
    timestamp = now or datetime.now(UTC)
    context_request_id, context_trace_id = current_request_log_context()
    request_id = request_id or context_request_id
    trace_id = trace_id or context_trace_id
    bucket_minute = timestamp.replace(second=0, microsecond=0)
    normalized = {
        "event_code": _safe_value(event_code, limit=80, fallback="unknown_event"),
        "source": _safe_value(source, limit=80, fallback="unknown_source"),
        "severity": _severity(severity),
        "provider": _safe_value(provider, limit=32),
        "model_id": _safe_model_id(model_id),
        "route": _safe_value(route, limit=160),
        "method": _safe_value(method.upper(), limit=8),
        "http_status": min(max(http_status, 0), 599),
        "error_type": _safe_value(error_type, limit=80),
        "batch_number": min(max(batch_number, 0), MAX_BATCH_NUMBER),
        "duration_ms_max": min(max(duration_ms, 0), 86_400_000),
        "latest_request_id": _safe_value(request_id, limit=80),
    }
    log_throttled_warning(
        "app.operational",
        str(normalized["event_code"]),
        source=str(normalized["source"]),
        level=getattr(logging, str(normalized["severity"])),
        throttle_key="|".join(
            str(normalized[key])
            for key in (
                "event_code",
                "source",
                "provider",
                "model_id",
                "route",
                "http_status",
                "error_type",
                "batch_number",
            )
        ),
        extra={**normalized, "trace_id": _safe_value(trace_id, limit=64)},
        )

    dimensions = {
        key: normalized[key]
        for key in (
            "event_code",
            "source",
            "severity",
            "provider",
            "model_id",
            "route",
            "method",
            "http_status",
            "error_type",
            "batch_number",
        )
    }
    fingerprint = hashlib.sha256(
        json.dumps(dimensions, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    values: dict[str, Any] = {
        "bucket_minute": bucket_minute,
        "fingerprint": fingerprint,
        "id": uuid4(),
        **normalized,
        "event_count": 1,
        "first_seen_at": timestamp,
        "last_seen_at": timestamp,
    }
    statement = insert(OperationalEvent).values(**values)
    statement = statement.on_conflict_do_update(
        index_elements=["bucket_minute", "fingerprint"],
        set_={
            "event_count": OperationalEvent.event_count + 1,
            "last_seen_at": func.greatest(OperationalEvent.last_seen_at, timestamp),
            "duration_ms_max": func.greatest(OperationalEvent.duration_ms_max, normalized["duration_ms_max"]),
            "latest_request_id": normalized["latest_request_id"],
        },
    )
    cutoff = timestamp - timedelta(days=RETENTION_DAYS)
    if db is not None:
        db.execute(statement)
        db.execute(delete(OperationalEvent).where(OperationalEvent.last_seen_at < cutoff))
        db.flush()
        return
    try:
        with SessionLocal() as event_db:
            event_db.execute(statement)
            event_db.execute(delete(OperationalEvent).where(OperationalEvent.last_seen_at < cutoff))
            event_db.commit()
    except SQLAlchemyError:
        log_throttled_warning(
            "app.operational",
            "operational_event_persistence_failed",
            source="operational",
        )


def safe_record_operational_event(**kwargs: Any) -> None:
    try:
        record_operational_event(**kwargs)
    except (SQLAlchemyError, TypeError, ValueError):
        log_throttled_warning(
            "app.operational",
            "operational_event_record_rejected",
            source="operational",
        )


def _safe_value(value: str, *, limit: int, fallback: str = "") -> str:
    normalized = value.strip()[:limit]
    if normalized and SAFE_EVENT_VALUE.fullmatch(normalized) is None:
        return fallback
    return normalized


def _safe_model_id(value: str) -> str:
    normalized = _safe_value(value, limit=120)
    if len(normalized) >= 80 or any(marker in normalized.lower() for marker in ("secret", "token", "key")):
        return "unknown"
    return normalized


def _severity(value: str) -> str:
    normalized = value.upper()
    return normalized if normalized in {"WARNING", "ERROR", "CRITICAL"} else "ERROR"
