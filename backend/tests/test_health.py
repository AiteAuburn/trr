import asyncio
import json

from fastapi.testclient import TestClient

from app.core.metrics import MAX_METRIC_LABEL_VALUE_LENGTH, http_metrics
from app.main import (
    MAX_VALIDATION_DETAIL_CONTAINER_LENGTH,
    MAX_VALIDATION_DETAIL_STRING_LENGTH,
    VALIDATION_DETAIL_TRUNCATED,
    _json_safe_validation_value,
    app,
)


async def _post_ai_parse_preview_raw(
    *,
    headers: list[tuple[bytes, bytes]],
    body_chunks: list[bytes],
) -> tuple[int, dict[str, str], bytes]:
    sent_chunks = 0
    events: list[dict[str, object]] = []

    async def receive() -> dict[str, object]:
        nonlocal sent_chunks
        if sent_chunks < len(body_chunks):
            body = body_chunks[sent_chunks]
            sent_chunks += 1
            return {
                "type": "http.request",
                "body": body,
                "more_body": sent_chunks < len(body_chunks),
            }
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message: dict[str, object]) -> None:
        events.append(message)

    await app(
        {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "POST",
            "scheme": "http",
            "path": "/ai/parse-preview",
            "raw_path": b"/ai/parse-preview",
            "query_string": b"",
            "headers": headers,
            "client": ("testclient", 50000),
            "server": ("testserver", 80),
        },
        receive,
        send,
    )

    start = next(event for event in events if event["type"] == "http.response.start")
    body = b"".join(
        event.get("body", b"")
        for event in events
        if event["type"] == "http.response.body" and isinstance(event.get("body", b""), bytes)
    )
    response_headers = {
        key.decode().lower(): value.decode()
        for key, value in start.get("headers", [])
        if isinstance(key, bytes) and isinstance(value, bytes)
    }
    status = start["status"]
    assert isinstance(status, int)
    return status, response_headers, body


def test_health() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "backend"


def test_request_id_header_is_returned() -> None:
    client = TestClient(app)

    response = client.get("/healthz", headers={"X-Request-ID": "test-request-id"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request-id"


def test_invalid_request_id_header_is_replaced() -> None:
    client = TestClient(app)
    unsafe_request_id = f"bad-request-id-{'x' * 200}"

    response = client.get("/healthz", headers={"X-Request-ID": unsafe_request_id})

    assert response.status_code == 200
    returned_request_id = response.headers["X-Request-ID"]
    assert returned_request_id != unsafe_request_id
    assert len(returned_request_id) == 36


def test_traceparent_trace_id_is_returned_without_echoing_full_header() -> None:
    client = TestClient(app)
    trace_id = "1234567890abcdef1234567890abcdef"
    traceparent = f"00-{trace_id}-1234567890abcdef-01"

    response = client.get("/healthz", headers={"traceparent": traceparent})

    assert response.status_code == 200
    assert response.headers["X-Trace-ID"] == trace_id
    assert "traceparent" not in response.text
    assert "1234567890abcdef-01" not in response.text


def test_invalid_traceparent_is_replaced() -> None:
    client = TestClient(app)
    unsafe_traceparent = f"00-{'f' * 200}-1234567890abcdef-01"

    response = client.get("/healthz", headers={"traceparent": unsafe_traceparent})

    assert response.status_code == 200
    returned_trace_id = response.headers["X-Trace-ID"]
    assert returned_trace_id not in unsafe_traceparent
    assert len(returned_trace_id) == 32


def test_validation_detail_sanitizer_is_bounded_and_json_safe() -> None:
    nested: dict[str, object] = {"leaf": "done"}
    for index in range(20):
        nested = {f"level_{index}": nested}
    wide = list(range(MAX_VALIDATION_DETAIL_CONTAINER_LENGTH + 1))
    sanitized = _json_safe_validation_value(
        {
            "deep": nested,
            "wide": wide,
            "long": "x" * (MAX_VALIDATION_DETAIL_STRING_LENGTH + 1),
            "non_json": ValueError("should be stringified"),
        }
    )

    assert isinstance(sanitized, dict)
    assert sanitized["long"] == "x" * MAX_VALIDATION_DETAIL_STRING_LENGTH
    assert isinstance(sanitized["wide"], list)
    assert sanitized["wide"][-1] == VALIDATION_DETAIL_TRUNCATED
    assert sanitized["non_json"] == "should be stringified"
    deep_value = sanitized["deep"]
    assert isinstance(deep_value, dict)
    first_value = next(iter(deep_value.values()))
    assert isinstance(first_value, dict)
    second_value = next(iter(first_value.values()))
    assert isinstance(second_value, dict)
    third_value = next(iter(second_value.values()))
    assert third_value == VALIDATION_DETAIL_TRUNCATED


def test_oversized_request_body_is_rejected_before_route_handling() -> None:
    client = TestClient(app)

    response = client.post(
        "/ai/parse-preview",
        content=b"x" * 1_048_577,
        headers={"X-Request-ID": "oversized-request"},
    )

    assert response.status_code == 413
    assert response.headers["X-Request-ID"] == "oversized-request"
    assert response.json()["detail"] == {
        "code": "request_body_too_large",
        "message": "Request body is too large.",
        "max_request_body_bytes": 1_048_576,
    }


def test_oversized_request_body_without_content_length_is_rejected_before_route_handling() -> None:
    status, headers, body = asyncio.run(
        _post_ai_parse_preview_raw(
            headers=[
                (b"content-type", b"application/json"),
                (b"x-request-id", b"no-content-length"),
            ],
            body_chunks=[b"x" * 600_000, b"x" * 448_577],
        )
    )

    assert status == 413
    assert headers["x-request-id"] == "no-content-length"
    assert json.loads(body)["detail"] == {
        "code": "request_body_too_large",
        "message": "Request body is too large.",
        "max_request_body_bytes": 1_048_576,
    }


def test_malformed_content_length_is_rejected_before_route_handling() -> None:
    status, headers, body = asyncio.run(
        _post_ai_parse_preview_raw(
            headers=[
                (b"content-type", b"application/json"),
                (b"content-length", b"not-a-number"),
                (b"x-request-id", b"bad-content-length"),
            ],
            body_chunks=[b'{"transcript":"should-not-be-read"}'],
        )
    )

    assert status == 400
    assert headers["x-request-id"] == "bad-content-length"
    assert json.loads(body)["detail"] == {
        "code": "invalid_content_length",
        "message": "Content-Length must be a non-negative integer.",
    }
    assert "should-not-be-read" not in body.decode()


def test_negative_content_length_is_rejected_before_route_handling() -> None:
    status, headers, body = asyncio.run(
        _post_ai_parse_preview_raw(
            headers=[
                (b"content-type", b"application/json"),
                (b"content-length", b"-1"),
                (b"x-request-id", b"negative-content-length"),
            ],
            body_chunks=[b'{"transcript":"should-not-be-read"}'],
        )
    )

    assert status == 400
    assert headers["x-request-id"] == "negative-content-length"
    assert json.loads(body)["detail"] == {
        "code": "invalid_content_length",
        "message": "Content-Length must be a non-negative integer.",
    }
    assert "should-not-be-read" not in body.decode()


def test_oversized_content_length_header_is_rejected_before_integer_conversion() -> None:
    oversized_content_length = b"9" * 200
    status, headers, body = asyncio.run(
        _post_ai_parse_preview_raw(
            headers=[
                (b"content-type", b"application/json"),
                (b"content-length", oversized_content_length),
                (b"x-request-id", b"oversized-content-length-header"),
            ],
            body_chunks=[b'{"transcript":"should-not-be-read"}'],
        )
    )

    assert status == 400
    assert headers["x-request-id"] == "oversized-content-length-header"
    assert json.loads(body)["detail"] == {
        "code": "invalid_content_length",
        "message": "Content-Length must be a non-negative integer.",
    }
    assert "should-not-be-read" not in body.decode()
    assert oversized_content_length.decode() not in body.decode()


def test_signed_content_length_is_rejected_before_route_handling() -> None:
    status, headers, body = asyncio.run(
        _post_ai_parse_preview_raw(
            headers=[
                (b"content-type", b"application/json"),
                (b"content-length", b"+1"),
                (b"x-request-id", b"signed-content-length"),
            ],
            body_chunks=[b'{"transcript":"should-not-be-read"}'],
        )
    )

    assert status == 400
    assert headers["x-request-id"] == "signed-content-length"
    assert json.loads(body)["detail"] == {
        "code": "invalid_content_length",
        "message": "Content-Length must be a non-negative integer.",
    }
    assert "should-not-be-read" not in body.decode()


def test_non_json_api_body_is_rejected_before_route_handling() -> None:
    client = TestClient(app)

    response = client.post(
        "/ai/parse-preview",
        content=b"not-json",
        headers={
            "Content-Type": "text/plain",
            "X-Request-ID": "non-json-request",
        },
    )

    assert response.status_code == 415
    assert response.headers["X-Request-ID"] == "non-json-request"
    assert response.json()["detail"] == {
        "code": "unsupported_media_type",
        "message": "Request body must be JSON.",
    }


def test_year_review_post_body_uses_json_guard_before_route_handling() -> None:
    client = TestClient(app)

    response = client.post(
        "/year-reviews/2025/share-card/confirm?profile_id=00000000-0000-0000-0000-000000000001",
        content=b"not-json",
        headers={
            "Content-Type": "text/plain",
            "X-Request-ID": "year-review-non-json-request",
        },
    )

    assert response.status_code == 415
    assert response.headers["X-Request-ID"] == "year-review-non-json-request"
    assert response.json()["detail"] == {
        "code": "unsupported_media_type",
        "message": "Request body must be JSON.",
    }


def test_json_content_type_with_charset_is_allowed() -> None:
    client = TestClient(app)

    response = client.post(
        "/ai/parse-preview",
        content=b"{}",
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "X-Request-ID": "json-request",
        },
    )

    assert response.status_code != 415
    assert response.headers["X-Request-ID"] == "json-request"


def test_healthz() -> None:
    client = TestClient(app)

    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "backend"}


def test_readyz() -> None:
    client = TestClient(app)

    response = client.get("/readyz")

    assert response.status_code == 200
    assert response.json() == {"status": "ready", "service": "backend"}


def test_metrics_endpoint_exposes_phi_safe_route_metrics() -> None:
    http_metrics.reset()
    client = TestClient(app)

    health_response = client.get("/healthz?transcript=should-not-appear")
    metrics_response = client.get("/metrics")

    assert health_response.status_code == 200
    assert metrics_response.status_code == 200
    assert metrics_response.headers["content-type"].startswith("text/plain")
    body = metrics_response.text
    assert 'app_http_requests_total{method="GET",route="/healthz",status="200"} 1' in body
    assert 'app_http_request_duration_seconds_sum{method="GET",route="/healthz",status="200"}' in body
    assert "transcript" not in body
    assert "should-not-appear" not in body
    assert "X-Request-ID" not in body
    assert "X-Trace-ID" not in body


def test_metrics_endpoint_exposes_phi_safe_parser_metrics() -> None:
    http_metrics.reset()
    http_metrics.record_parser_result(
        model_id="ollama-qwen2.5-1.5b",
        outcome="failure",
        reason="local_parser_failed",
    )

    response = TestClient(app).get("/metrics")

    assert response.status_code == 200
    body = response.text
    assert (
        'app_parser_results_total{model_id="ollama-qwen2.5-1.5b",'
        'outcome="failure",reason="local_parser_failed"} 1'
    ) in body
    assert "transcript" not in body
    assert "prompt" not in body
    assert "payload_json" not in body


def test_metrics_labels_are_normalized_and_bounded() -> None:
    http_metrics.reset()
    long_model_id = "模型-" + ("x" * (MAX_METRIC_LABEL_VALUE_LENGTH + 20))
    http_metrics.record_parser_result(
        model_id=long_model_id,
        outcome="failure with spaces",
        reason='raw "prompt"\nwith unicode 血糖 188',
    )

    body = http_metrics.render_prometheus()

    assert "模型" not in body
    assert "血糖" not in body
    assert "188" not in body
    assert "failure with spaces" not in body
    label_line = next(line for line in body.splitlines() if line.startswith("app_parser_results_total"))
    assert label_line == (
        'app_parser_results_total{model_id="unknown",'
        'outcome="unknown",reason="unknown"} 1'
    )


def test_metrics_endpoint_exposes_phi_safe_db_timing_metrics() -> None:
    http_metrics.reset()
    client = TestClient(app)

    ready_response = client.get("/readyz")
    metrics_response = client.get("/metrics")

    assert ready_response.status_code == 200
    assert metrics_response.status_code == 200
    body = metrics_response.text
    assert 'app_db_operations_total{operation="select"}' in body
    assert 'app_db_operation_duration_seconds_sum{operation="select"}' in body
    assert "SELECT 1" not in body
    assert "profile_id" not in body
    assert "payload_json" not in body
