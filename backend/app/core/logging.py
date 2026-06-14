import logging
import json
from datetime import UTC, datetime
from typing import Any


NOISY_THIRD_PARTY_LOGGERS = (
    "httpcore",
    "httpx",
)

SAFE_EXTRA_FIELDS = (
    "duration_ms",
    "event",
    "method",
    "path",
    "request_id",
    "status",
    "trace_id",
)
MAX_LOG_STRING_LENGTH = 256


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
