import logging
import re
from collections.abc import Mapping
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import case, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models import AiTokenUsageDaily, ApiUsageDaily


logger = logging.getLogger("app.analytics")

MAX_ROUTE_LENGTH = 160
MAX_PROVIDER_LENGTH = 32
MAX_MODEL_ID_LENGTH = 120
MAX_TOKEN_COUNT = 1_000_000_000_000
MAX_REQUEST_DURATION_MICROS = 86_400_000_000
SAFE_IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z0-9_./:{}+-]+$")
EXCLUDED_API_USAGE_ROUTES = frozenset(
    {"/health", "/healthz", "/readyz", "/metrics", "/version"}
)


def should_record_api_usage(route: str) -> bool:
    return route not in EXCLUDED_API_USAGE_ROUTES and not route.startswith("/admin")


def record_api_usage(
    *,
    method: str,
    route: str,
    status_code: int,
    duration_seconds: float,
    bucket_date: date | None = None,
    db: Session | None = None,
) -> None:
    normalized_route = _normalized_identifier(route, max_length=MAX_ROUTE_LENGTH, fallback="unmatched")
    if not should_record_api_usage(normalized_route):
        return
    normalized_method = _normalized_identifier(method.upper(), max_length=8, fallback="OTHER")
    status_class = min(max(status_code // 100, 1), 5)
    duration_micros = min(
        max(round(max(duration_seconds, 0) * 1_000_000), 0),
        MAX_REQUEST_DURATION_MICROS,
    )
    values = {
        "bucket_date": bucket_date or datetime.now(UTC).date(),
        "method": normalized_method,
        "route": normalized_route,
        "status_class": status_class,
        "request_count": 1,
        "duration_micros_total": duration_micros,
        "duration_micros_max": duration_micros,
    }
    statement = insert(ApiUsageDaily).values(**values)
    statement = statement.on_conflict_do_update(
        index_elements=["bucket_date", "method", "route", "status_class"],
        set_={
            "request_count": ApiUsageDaily.request_count + 1,
            "duration_micros_total": ApiUsageDaily.duration_micros_total + duration_micros,
            "duration_micros_max": func.greatest(
                ApiUsageDaily.duration_micros_max, duration_micros
            ),
            "updated_at": func.now(),
        },
    )
    _execute_statement(statement, db=db)


def record_ai_token_usage(
    *,
    provider: str,
    model_id: str,
    succeeded: bool,
    usage: object,
    bucket_date: date | None = None,
    db: Session | None = None,
) -> None:
    normalized_provider = _normalized_identifier(
        provider.lower(), max_length=MAX_PROVIDER_LENGTH, fallback="unknown"
    )
    normalized_model_id = _normalized_identifier(
        model_id, max_length=MAX_MODEL_ID_LENGTH, fallback="unknown"
    )
    input_tokens, output_tokens, total_tokens, usage_reported = _token_counts(usage)
    values = {
        "bucket_date": bucket_date or datetime.now(UTC).date(),
        "provider": normalized_provider,
        "model_id": normalized_model_id,
        "request_count": 1,
        "success_count": int(succeeded),
        "failure_count": int(not succeeded),
        "usage_reported_count": int(usage_reported),
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": total_tokens,
    }
    statement = insert(AiTokenUsageDaily).values(**values)
    statement = statement.on_conflict_do_update(
        index_elements=["bucket_date", "provider", "model_id"],
        set_={
            "request_count": AiTokenUsageDaily.request_count + 1,
            "success_count": AiTokenUsageDaily.success_count + int(succeeded),
            "failure_count": AiTokenUsageDaily.failure_count + int(not succeeded),
            "usage_reported_count": (
                AiTokenUsageDaily.usage_reported_count + int(usage_reported)
            ),
            "input_tokens": AiTokenUsageDaily.input_tokens + input_tokens,
            "output_tokens": AiTokenUsageDaily.output_tokens + output_tokens,
            "total_tokens": AiTokenUsageDaily.total_tokens + total_tokens,
            "updated_at": func.now(),
        },
    )
    _execute_statement(statement, db=db)


def safe_record_api_usage(**kwargs: Any) -> None:
    try:
        record_api_usage(**kwargs)
    except (SQLAlchemyError, ValueError):
        logger.warning("api_usage_aggregate_write_failed", exc_info=False)


def safe_record_ai_token_usage(**kwargs: Any) -> None:
    try:
        record_ai_token_usage(**kwargs)
    except (SQLAlchemyError, ValueError):
        logger.warning("ai_token_usage_aggregate_write_failed", exc_info=False)


def usage_overview(*, days: int, db: Session) -> dict[str, object]:
    start_date = datetime.now(UTC).date() - timedelta(days=days - 1)
    error_count = func.sum(
        case((ApiUsageDaily.status_class >= 4, ApiUsageDaily.request_count), else_=0)
    )
    total_requests, total_errors = db.execute(
        select(func.sum(ApiUsageDaily.request_count), error_count).where(
            ApiUsageDaily.bucket_date >= start_date
        )
    ).one()
    total_tokens = db.scalar(
        select(func.sum(AiTokenUsageDaily.total_tokens)).where(
            AiTokenUsageDaily.bucket_date >= start_date
        )
    )
    endpoint_rows = db.execute(
        select(
            ApiUsageDaily.method,
            ApiUsageDaily.route,
            func.sum(ApiUsageDaily.request_count),
            error_count,
            func.sum(ApiUsageDaily.duration_micros_total),
            func.max(ApiUsageDaily.duration_micros_max),
        )
        .where(ApiUsageDaily.bucket_date >= start_date)
        .group_by(ApiUsageDaily.method, ApiUsageDaily.route)
        .order_by(func.sum(ApiUsageDaily.request_count).desc(), ApiUsageDaily.route.asc())
        .limit(50)
    ).all()
    daily_rows = db.execute(
        select(
            ApiUsageDaily.bucket_date,
            func.sum(ApiUsageDaily.request_count),
            error_count,
            func.sum(ApiUsageDaily.duration_micros_total),
        )
        .where(ApiUsageDaily.bucket_date >= start_date)
        .group_by(ApiUsageDaily.bucket_date)
        .order_by(ApiUsageDaily.bucket_date.asc())
    ).all()
    model_rows = db.execute(
        select(
            AiTokenUsageDaily.provider,
            AiTokenUsageDaily.model_id,
            func.sum(AiTokenUsageDaily.request_count),
            func.sum(AiTokenUsageDaily.success_count),
            func.sum(AiTokenUsageDaily.failure_count),
            func.sum(AiTokenUsageDaily.usage_reported_count),
            func.sum(AiTokenUsageDaily.input_tokens),
            func.sum(AiTokenUsageDaily.output_tokens),
            func.sum(AiTokenUsageDaily.total_tokens),
        )
        .where(AiTokenUsageDaily.bucket_date >= start_date)
        .group_by(AiTokenUsageDaily.provider, AiTokenUsageDaily.model_id)
        .order_by(func.sum(AiTokenUsageDaily.total_tokens).desc())
        .limit(50)
    ).all()

    endpoints = [
        {
            "method": method,
            "route": route,
            "request_count": int(request_count or 0),
            "error_count": int(errors or 0),
            "average_duration_ms": _average_millis(duration_total, request_count),
            "max_duration_ms": round(int(duration_max or 0) / 1000, 2),
        }
        for method, route, request_count, errors, duration_total, duration_max in endpoint_rows
    ]
    daily = [
        {
            "date": bucket_date,
            "request_count": int(request_count or 0),
            "error_count": int(errors or 0),
            "average_duration_ms": _average_millis(duration_total, request_count),
        }
        for bucket_date, request_count, errors, duration_total in daily_rows
    ]
    models = [
        {
            "provider": provider,
            "model_id": model_id,
            "request_count": int(request_count or 0),
            "success_count": int(success_count or 0),
            "failure_count": int(failure_count or 0),
            "usage_reported_count": int(usage_reported_count or 0),
            "input_tokens": int(input_tokens or 0),
            "output_tokens": int(output_tokens or 0),
            "total_tokens": int(total_tokens or 0),
        }
        for (
            provider,
            model_id,
            request_count,
            success_count,
            failure_count,
            usage_reported_count,
            input_tokens,
            output_tokens,
            total_tokens,
        ) in model_rows
    ]
    return {
        "generated_at": datetime.now(UTC),
        "days": days,
        "total_requests": int(total_requests or 0),
        "total_errors": int(total_errors or 0),
        "total_tokens": int(total_tokens or 0),
        "endpoints": endpoints,
        "daily": daily,
        "models": models,
    }


def _execute_statement(statement: Any, *, db: Session | None) -> None:
    if db is not None:
        db.execute(statement)
        db.flush()
        return
    with SessionLocal() as analytics_db:
        analytics_db.execute(statement)
        analytics_db.commit()


def _normalized_identifier(value: object, *, max_length: int, fallback: str) -> str:
    normalized = str(value).strip()[:max_length]
    if not normalized or SAFE_IDENTIFIER_PATTERN.fullmatch(normalized) is None:
        return fallback
    return normalized


def _token_counts(usage: object) -> tuple[int, int, int, bool]:
    if not isinstance(usage, Mapping):
        return 0, 0, 0, False
    input_tokens = _bounded_token_count(usage.get("prompt_tokens"))
    output_tokens = _bounded_token_count(usage.get("completion_tokens"))
    raw_total = usage.get("total_tokens")
    total_tokens = _bounded_token_count(raw_total)
    if total_tokens == 0 and input_tokens + output_tokens > 0:
        total_tokens = input_tokens + output_tokens
    reported = any(
        isinstance(usage.get(key), int)
        for key in ("prompt_tokens", "completion_tokens", "total_tokens")
    )
    return input_tokens, output_tokens, total_tokens, reported


def _bounded_token_count(value: object) -> int:
    if not isinstance(value, int) or isinstance(value, bool):
        return 0
    return min(max(value, 0), MAX_TOKEN_COUNT)


def _average_millis(duration_micros: object, request_count: object) -> float:
    count = int(request_count or 0)
    if count <= 0:
        return 0.0
    return round(int(duration_micros or 0) / count / 1000, 2)
