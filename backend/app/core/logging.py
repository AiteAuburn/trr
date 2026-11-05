import logging
import json
from contextlib import contextmanager
from contextvars import ContextVar
from datetime import UTC, datetime
from threading import Lock
from time import monotonic
from typing import Any
from collections.abc import Iterator


NOISY_THIRD_PARTY_LOGGERS = (
    "asyncio",
    "httpcore",
    "httpx",
)

SAFE_EXTRA_FIELDS = (
    "batch_number",
    "duration_ms",
    "event",
    "event_code",
    "error_type",
    "event_count",
    "http_status",
    "model_id",
    "method",
    "provider",
    "request_id",
    "route",
    "source",
    "suppressed_count",
    "status",
    "trace_id",
)
MAX_LOG_STRING_LENGTH = 256
WARNING_THROTTLE_SECONDS = 60.0
_warning_throttle_lock = Lock()
_warning_throttle_state: dict[str, tuple[float, int]] = {}
_request_id_context: ContextVar[str] = ContextVar("log_request_id", default="")
_trace_id_context: ContextVar[str] = ContextVar("log_trace_id", default="")


@contextmanager
def request_log_context(request_id: str, trace_id: str) -> Iterator[None]:
    request_token = _request_id_context.set(request_id)
    trace_token = _trace_id_context.set(trace_id)
    try:
        yield
    finally:
        _request_id_context.reset(request_token)
        _trace_id_context.reset(trace_token)


def current_request_log_context() -> tuple[str, str]:
    return _request_id_context.get(), _trace_id_context.get()


def log_throttled_warning(
    logger_name: str,
    event_code: str,
    *,
    source: str,
    level: int = logging.WARNING,
    throttle_key: str | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    now = monotonic()
    state_key = throttle_key or event_code
    with _warning_throttle_lock:
        previous = _warning_throttle_state.get(state_key)
        if previous is not None and now - previous[0] < WARNING_THROTTLE_SECONDS:
            _warning_throttle_state[state_key] = (previous[0], previous[1] + 1)
            return
        suppressed_count = previous[1] if previous is not None else 0
        _warning_throttle_state[state_key] = (now, 0)

    fields: dict[str, Any] = {"event": event_code, "event_code": event_code, "source": source}
    if extra:
        fields.update(extra)
    if suppressed_count:
        fields["suppressed_count"] = suppressed_count
    logging.getLogger(logger_name).log(level, event_code, extra=fields, exc_info=False)


class PhiSafeJsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": _bounded_log_string(record.levelname),
            "logger": _bounded_log_string(record.name),
            "message": _bounded_log_string(record.getMessage()),
        }
        for field in SAFE_EXTRA_FIELDS:
            value = getattr(record, field, None)
            if value is not None:
                payload[field] = _safe_log_value(value)
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_logging(log_level: str) -> None:
    numeric_level = logging.getLevelName(log_level.upper())
    formatter = PhiSafeJsonFormatter()
    logging.basicConfig(
        level=numeric_level,
        format="%(message)s",
    )
    logging.getLogger().setLevel(numeric_level)
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)
    for logger_name in NOISY_THIRD_PARTY_LOGGERS:
        logging.getLogger(logger_name).setLevel(logging.WARNING)


def _safe_log_value(value: Any) -> Any:
    if isinstance(value, str):
        return _bounded_log_string(value)
    if isinstance(value, int | float | bool) or value is None:
        return value
    return _bounded_log_string(str(value))


def _bounded_log_string(value: str) -> str:
    return value[:MAX_LOG_STRING_LENGTH]
