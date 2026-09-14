import json

from app.services import ai_pipeline


def test_openai_compatible_parser_records_provider_model_and_tokens(monkeypatch) -> None:
    recorded: list[dict[str, object]] = []
    response_payload = {
        "choices": [{"message": {"content": "{}"}}],
        "usage": {"prompt_tokens": 12, "completion_tokens": 4, "total_tokens": 16},
    }

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def raise_for_status(self) -> None:
            return None

        def iter_text(self) -> list[str]:
            return [json.dumps(response_payload)]

    class FakeClient:
        def __init__(self, *, timeout: float) -> None:
            assert timeout == 2.0

        def __enter__(self):
            return self

        def __exit__(self, *args: object) -> bool:
            return False

        def stream(self, method: str, url: str, json: object, headers: object):
            assert method == "POST"
            assert url == "https://provider.example/v1/chat/completions"
            assert headers == {"Authorization": "Bearer hidden"}
            return FakeResponse()

    monkeypatch.setattr(ai_pipeline.httpx, "Client", FakeClient)
    monkeypatch.setattr(
        ai_pipeline,
        "safe_record_ai_token_usage",
        lambda **kwargs: recorded.append(kwargs),
    )

    parsed = ai_pipeline._request_local_parser_json(
        parser_url="https://provider.example/v1/chat/completions",
        body={"model": "model-v2"},
        timeout_seconds=2.0,
        batch_number=1,
        headers={"Authorization": "Bearer hidden"},
        usage_provider="provider",
        usage_model_id="model-v2",
    )

    assert parsed == {}
    assert recorded == [
        {
            "provider": "provider",
            "model_id": "model-v2",
            "succeeded": True,
            "usage": response_payload["usage"],
        }
    ]
