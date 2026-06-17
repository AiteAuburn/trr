import logging
import re
from collections.abc import Awaitable, Callable
from time import perf_counter
from uuid import uuid4

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy import text
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import Message, Receive

from app.api import achievements, ai, auth, community, dev, profiles, records, reports, store, subscriptions, year_reviews
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.metrics import http_metrics
from app.db.session import engine

settings = get_settings()
configure_logging(settings.log_level)
logger = logging.getLogger("app.request")

JSON_BODY_METHODS = {"PATCH", "POST"}
JSON_BODY_PREFIXES = (
    "/ai/",
    "/auth/",
    "/community/",
    "/dev/",
    "/profiles",
    "/records",
    "/reports",
    "/store/",
    "/year-reviews",
)
CONTENT_LENGTH_PATTERN = re.compile(r"^[0-9]{1,20}$")
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,80}$")
TRACEPARENT_PATTERN = re.compile(
    r"^[0-9a-f]{2}-([0-9a-f]{32})-[0-9a-f]{16}-[0-9a-f]{2}$"
)
ZERO_TRACE_ID = "0" * 32
MAX_VALIDATION_ERRORS = 32
MAX_VALIDATION_DETAIL_DEPTH = 4
MAX_VALIDATION_DETAIL_NODES = 128
MAX_VALIDATION_DETAIL_CONTAINER_LENGTH = 32
MAX_VALIDATION_DETAIL_STRING_LENGTH = 256
VALIDATION_DETAIL_TRUNCATED = "[TRUNCATED]"

app = FastAPI(
    title="Tang Lu Lu API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai.router)
app.include_router(achievements.router)
app.include_router(auth.router)
app.include_router(community.router)
app.include_router(dev.router)
app.include_router(profiles.router)
app.include_router(records.router)
app.include_router(reports.router)
app.include_router(store.router)
app.include_router(subscriptions.router)
app.include_router(year_reviews.router)


def _is_json_content_type(content_type: str | None) -> bool:
    if content_type is None:
        return False
    media_type = content_type.split(";", maxsplit=1)[0].strip().lower()
    return media_type == "application/json" or media_type.endswith("+json")


def _requires_json_body_guard(request: Request) -> bool:
    return request.method in JSON_BODY_METHODS and request.url.path.startswith(JSON_BODY_PREFIXES)


def _request_body_too_large_response() -> JSONResponse:
    return JSONResponse(
        status_code=413,
        content={
            "detail": {
                "code": "request_body_too_large",
                "message": "Request body is too large.",
                "max_request_body_bytes": settings.max_request_body_bytes,
            }
        },
    )


def _invalid_content_length_response() -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            "detail": {
                "code": "invalid_content_length",
                "message": "Content-Length must be a non-negative integer.",
            }
        },
    )


def _parse_content_length(value: str | None) -> int | None:
    if value is None:
        return None
    if CONTENT_LENGTH_PATTERN.fullmatch(value) is None:
        raise ValueError("invalid content-length")
    return int(value)


async def _bounded_body_replay_or_response(
    request: Request,
) -> tuple[JSONResponse | None, Receive | None, int]:
    messages: list[Message] = []
    total_body_bytes = 0
    while True:
        message = await request.receive()
        messages.append(message)
        if message.get("type") != "http.request":
            break

        body = message.get("body", b"")
        if isinstance(body, bytes):
            total_body_bytes += len(body)
        if total_body_bytes > settings.max_request_body_bytes:
            return _request_body_too_large_response(), None, total_body_bytes
        if not message.get("more_body", False):
            break

    message_iter = iter(messages)

    async def replay_receive() -> Message:
        try:
            return next(message_iter)
        except StopIteration:
            return {"type": "http.request", "body": b"", "more_body": False}

    return None, replay_receive, total_body_bytes


def _request_id_from_header(value: str | None) -> str:
    if value is not None and REQUEST_ID_PATTERN.fullmatch(value):
        return value
    return str(uuid4())


def _trace_id_from_header(value: str | None) -> str:
    if value is not None:
        match = TRACEPARENT_PATTERN.fullmatch(value.strip())
        if match is not None:
            trace_id = match.group(1)
            if trace_id != ZERO_TRACE_ID:
                return trace_id
    return uuid4().hex


def _sanitized_validation_errors(exc: RequestValidationError) -> list[dict[str, object]]:
    sanitized_errors: list[dict[str, object]] = []
    for error in exc.errors()[:MAX_VALIDATION_ERRORS]:
        sanitizer = _ValidationDetailSanitizer()
        sanitized_errors.append(
            {
                key: sanitizer.sanitize(value, depth=1)
                for key, value in error.items()
                if key != "input"
            }
        )
    if len(exc.errors()) > MAX_VALIDATION_ERRORS:
        sanitized_errors.append({"type": "too_many_validation_errors", "msg": VALIDATION_DETAIL_TRUNCATED})
    return sanitized_errors


def _json_safe_validation_value(value: object) -> object:
    return _ValidationDetailSanitizer().sanitize(value, depth=1)


class _ValidationDetailSanitizer:
    def __init__(self) -> None:
        self.nodes = 0

    def sanitize(self, value: object, *, depth: int) -> object:
        self.nodes += 1
        if self.nodes > MAX_VALIDATION_DETAIL_NODES:
            return VALIDATION_DETAIL_TRUNCATED
        if depth > MAX_VALIDATION_DETAIL_DEPTH:
            return VALIDATION_DETAIL_TRUNCATED
        if isinstance(value, dict):
            return self._sanitize_dict(value, depth=depth)
        if isinstance(value, list | tuple):
            return [
                self.sanitize(item, depth=depth + 1)
                for item in value[:MAX_VALIDATION_DETAIL_CONTAINER_LENGTH]
            ] + ([VALIDATION_DETAIL_TRUNCATED] if len(value) > MAX_VALIDATION_DETAIL_CONTAINER_LENGTH else [])
        if isinstance(value, str):
            return value[:MAX_VALIDATION_DETAIL_STRING_LENGTH]
        if isinstance(value, int | float | bool) or value is None:
            return value
        return str(value)[:MAX_VALIDATION_DETAIL_STRING_LENGTH]

    def _sanitize_dict(self, value: dict[object, object], *, depth: int) -> dict[str, object]:
        sanitized: dict[str, object] = {}
        for index, (key, item) in enumerate(value.items()):
            if index >= MAX_VALIDATION_DETAIL_CONTAINER_LENGTH:
                sanitized["_truncated"] = True
                break
            sanitized_key = str(key).strip()[:MAX_VALIDATION_DETAIL_STRING_LENGTH] or f"key_{index}"
            sanitized[sanitized_key] = self.sanitize(item, depth=depth + 1)
        return sanitized


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    _ = request
    return JSONResponse(
        status_code=422,
        content={"detail": _sanitized_validation_errors(exc)},
    )


@app.middleware("http")
async def log_requests(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    started_at = perf_counter()
    request_id = _request_id_from_header(request.headers.get("X-Request-ID"))
    trace_id = _trace_id_from_header(request.headers.get("traceparent"))
    response: Response
    content_length = request.headers.get("content-length")
    try:
        request_body_bytes = _parse_content_length(content_length)
    except ValueError:
        response = _invalid_content_length_response()
    else:
        if request_body_bytes is not None and request_body_bytes > settings.max_request_body_bytes:
            response = _request_body_too_large_response()
        elif _requires_json_body_guard(request) and content_length is None:
            pre_read_response, replay_receive, request_body_bytes = await _bounded_body_replay_or_response(
                request
            )
            if pre_read_response is not None:
                response = pre_read_response
            else:
                assert replay_receive is not None
                request = Request(request.scope, replay_receive)
                if request_body_bytes > 0 and not _is_json_content_type(request.headers.get("content-type")):
                    response = JSONResponse(
                        status_code=415,
                        content={
                            "detail": {
                                "code": "unsupported_media_type",
                                "message": "Request body must be JSON.",
                            }
                        },
                    )
                else:
                    response = await call_next(request)
        elif (
            _requires_json_body_guard(request)
            and request_body_bytes is not None
            and request_body_bytes > 0
            and not _is_json_content_type(request.headers.get("content-type"))
        ):
            response = JSONResponse(
                status_code=415,
                content={
                    "detail": {
                        "code": "unsupported_media_type",
                        "message": "Request body must be JSON.",
                    }
                },
            )
        else:
            response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Trace-ID"] = trace_id
    duration_seconds = perf_counter() - started_at
    duration_ms = round(duration_seconds * 1000, 2)
    route = getattr(request.scope.get("route"), "path", "unmatched")
    http_metrics.record_request(
        method=request.method,
        route=route,
        status=response.status_code,
        duration_seconds=duration_seconds,
    )
    logger.info(
        "request",
        extra={
            "duration_ms": duration_ms,
            "event": "http_request",
            "method": request.method,
            "path": request.url.path,
            "request_id": request_id,
            "status": response.status_code,
            "trace_id": trace_id,
        },
    )
    return response


@app.get("/metrics", response_class=PlainTextResponse)
def metrics() -> PlainTextResponse:
    return PlainTextResponse(
        http_metrics.render_prometheus(),
        media_type="text/plain; version=0.0.4; charset=utf-8",
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "backend",
        "env": settings.app_env,
    }


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "backend",
    }


@app.get("/readyz")
def readyz() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {
        "status": "ready",
        "service": "backend",
    }


@app.get("/version")
def version() -> dict[str, str]:
    return {
        "service": "backend",
        "version": app.version,
    }
