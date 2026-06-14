from datetime import UTC, datetime
from uuid import UUID

from fastapi.testclient import TestClient
from pytest import MonkeyPatch, raises
from sqlalchemy import select

from app.db.session import SessionLocal
from app.main import app
from app.models import PlanEntitlement, Subscription, UsageCounter
from app.services import entitlements
from app.services.entitlements import (
    MAX_DAILY_VOICE_LIMIT_SECONDS,
    MAX_PUBLIC_PLAN_CODE_LENGTH,
    MAX_REQUESTED_VOICE_SECONDS,
    MAX_STORED_VOICE_USAGE_SECONDS,
    VOICE_DAILY_SECONDS_KEY,
    VOICE_SECONDS_COUNTER,
    current_voice_usage_seconds,
    ensure_trial_subscription_for_account_id,
    normalize_public_plan_code,
    require_voice_quota_for_account_id,
    today_counter_window,
    voice_quota_limit_seconds,
)
from app.schemas.subscription import VoiceQuotaRead
from tests.helpers import create_account_and_profile


def test_today_counter_window_rejects_naive_datetime() -> None:
    with raises(ValueError, match="now"):
        today_counter_window(datetime(2026, 5, 28, 10, 0, 0))


def test_today_counter_window_uses_timezone_aware_date() -> None:
    start, end = today_counter_window(datetime(2026, 5, 28, 10, 0, 0, tzinfo=UTC))

    assert start.isoformat() == "2026-05-28"
    assert end.isoformat() == "2026-05-29"


def test_voice_quota_rejects_negative_seconds_before_subscription_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_subscription_lookup(*_: object, **__: object) -> object:
        raise AssertionError("invalid voice seconds should be rejected before subscription lookup")

    monkeypatch.setattr(entitlements, "ensure_trial_subscription_for_account_id", fail_subscription_lookup)

    with SessionLocal() as db:
        with raises(ValueError, match="requested_seconds"):
            require_voice_quota_for_account_id(UUID(int=1), -1, db)


def test_voice_quota_rejects_oversized_seconds_before_subscription_lookup(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_subscription_lookup(*_: object, **__: object) -> object:
        raise AssertionError("invalid voice seconds should be rejected before subscription lookup")

    monkeypatch.setattr(entitlements, "ensure_trial_subscription_for_account_id", fail_subscription_lookup)

    with SessionLocal() as db:
        with raises(ValueError, match="requested_seconds"):
            require_voice_quota_for_account_id(UUID(int=1), MAX_REQUESTED_VOICE_SECONDS + 1, db)


def test_voice_quota_limit_rejects_oversized_entitlement_value() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "entitlement-limit")

    with SessionLocal() as db:
        subscription = ensure_trial_subscription_for_account_id(UUID(account_id), db)
        entitlement = db.scalar(
            select(PlanEntitlement).where(
                PlanEntitlement.plan_id == subscription.plan_id,
                PlanEntitlement.entitlement_key == VOICE_DAILY_SECONDS_KEY,
            )
        )
        assert entitlement is not None
        entitlement.value_json = {"seconds": MAX_DAILY_VOICE_LIMIT_SECONDS + 1}
        db.flush()

        assert voice_quota_limit_seconds(subscription, db) == 0


def test_public_plan_code_is_bounded_for_quota_outputs() -> None:
    assert normalize_public_plan_code(" trial ") == "trial"
    assert normalize_public_plan_code(" ") == "unknown"
    assert normalize_public_plan_code(None) == "unknown"
    assert normalize_public_plan_code("x" * (MAX_PUBLIC_PLAN_CODE_LENGTH + 1)) == "unknown"


def test_voice_quota_response_schema_bounds_public_fields() -> None:
    with raises(ValueError):
        VoiceQuotaRead(
            plan_code="x" * (MAX_PUBLIC_PLAN_CODE_LENGTH + 1),
            status="trialing",
            preserves_intro_price=False,
            daily_limit_seconds=300,
            used_seconds_today=0,
            remaining_seconds_today=300,
        )

    with raises(ValueError):
        VoiceQuotaRead(
            plan_code="trial",
            status="trialing",
            referral_code="x" * 81,
            preserves_intro_price=False,
            daily_limit_seconds=300,
            used_seconds_today=0,
            remaining_seconds_today=300,
        )

    with raises(ValueError):
        VoiceQuotaRead(
            plan_code="trial",
            status="trialing",
            preserves_intro_price=False,
            daily_limit_seconds=MAX_DAILY_VOICE_LIMIT_SECONDS + 1,
            used_seconds_today=0,
            remaining_seconds_today=300,
        )


def test_current_voice_usage_clamps_invalid_counter_values() -> None:
    client = TestClient(app)
    negative_account_id, _ = create_account_and_profile(client, "voice-negative-counter")
    oversized_account_id, _ = create_account_and_profile(client, "voice-oversized-counter")
    period_start, period_end = today_counter_window()

    with SessionLocal() as db:
        db.add(
            UsageCounter(
                account_id=UUID(negative_account_id),
                counter_key=VOICE_SECONDS_COUNTER,
                period_start=period_start,
                period_end=period_end,
                used_units=-10,
            )
        )
        db.add(
            UsageCounter(
                account_id=UUID(oversized_account_id),
                counter_key=VOICE_SECONDS_COUNTER,
                period_start=period_start,
                period_end=period_end,
                used_units=MAX_STORED_VOICE_USAGE_SECONDS + 1,
            )
        )
        db.flush()

        assert current_voice_usage_seconds(UUID(negative_account_id), db) == 0
        assert (
            current_voice_usage_seconds(UUID(oversized_account_id), db)
            == MAX_STORED_VOICE_USAGE_SECONDS
        )


def test_voice_quota_atomic_update_normalizes_negative_counter() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "voice-negative-upsert")
    period_start, period_end = today_counter_window()

    with SessionLocal() as db:
        ensure_trial_subscription_for_account_id(UUID(account_id), db)
        db.add(
            UsageCounter(
                account_id=UUID(account_id),
                counter_key=VOICE_SECONDS_COUNTER,
                period_start=period_start,
                period_end=period_end,
                used_units=-10,
            )
        )
        db.flush()

        decision = require_voice_quota_for_account_id(UUID(account_id), 300, db)
        counter = db.scalar(
            select(UsageCounter).where(
                UsageCounter.account_id == UUID(account_id),
                UsageCounter.counter_key == VOICE_SECONDS_COUNTER,
            )
        )

    assert decision.used_seconds == 300
    assert decision.remaining_seconds == 0
    assert counter is not None
    assert counter.used_units == 300


def test_voice_quota_endpoint_creates_trial_subscription() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "entitlement")

    response = client.get("/subscriptions/voice-quota", headers={"X-Account-Id": account_id})

    assert response.status_code == 200
    quota = response.json()
    assert quota["plan_code"] == "trial"
    assert quota["status"] == "trialing"
    assert quota["daily_limit_seconds"] == 300
    assert quota["used_seconds_today"] == 0
    assert quota["remaining_seconds_today"] == 300
    assert quota["trial_started_at"]
    assert quota["trial_ends_at"]
    assert quota["referral_code"] is None
    assert quota["preserves_intro_price"] is False

    with SessionLocal() as db:
        subscription = db.scalar(
            select(Subscription).where(Subscription.account_id == UUID(account_id))
        )
        counter = db.scalar(
            select(UsageCounter).where(
                UsageCounter.account_id == UUID(account_id),
                UsageCounter.counter_key == VOICE_SECONDS_COUNTER,
            )
        )
    assert subscription is not None
    assert counter is None


def test_voice_quota_parse_preview_increments_usage_counter() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "voice-usage")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早上空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "voice_seconds": 12,
        },
    )

    assert response.status_code == 200
    with SessionLocal() as db:
        counter = db.scalar(
            select(UsageCounter).where(
                UsageCounter.account_id == UUID(account_id),
                UsageCounter.counter_key == VOICE_SECONDS_COUNTER,
            )
        )
    assert counter is not None
    assert counter.used_units == 12


def test_voice_quota_parse_preview_denies_over_limit() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "voice-deny")
    payload = {
        "profile_id": profile_id,
        "transcript": "今天早上空腹血糖 138",
        "stt_model_id": "browser-web-speech",
        "llm_model_id": "local-llm-schema-stub",
        "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
    }

    assert (
        client.post(
            "/ai/parse-preview",
            headers={"X-Account-Id": account_id},
            json={**payload, "voice_seconds": 300},
        ).status_code
        == 200
    )
    denied_response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={**payload, "voice_seconds": 1},
    )

    assert denied_response.status_code == 429
    assert denied_response.json()["detail"] == {
        "code": "voice_quota_exceeded",
        "limit_seconds": 300,
        "used_seconds": 300,
        "requested_seconds": 1,
        "remaining_seconds": 0,
        "plan_code": "trial",
    }


def test_voice_quota_rejects_single_request_above_limit_without_incrementing() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "voice-single-deny")

    response = client.post(
        "/ai/parse-preview",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "transcript": "今天早上空腹血糖 138",
            "stt_model_id": "browser-web-speech",
            "llm_model_id": "local-llm-schema-stub",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "voice_seconds": 301,
        },
    )

    assert response.status_code == 429
    assert response.json()["detail"] == {
        "code": "voice_quota_exceeded",
        "limit_seconds": 300,
        "used_seconds": 0,
        "requested_seconds": 301,
        "remaining_seconds": 300,
        "plan_code": "trial",
    }
    with SessionLocal() as db:
        counter = db.scalar(
            select(UsageCounter).where(
                UsageCounter.account_id == UUID(account_id),
                UsageCounter.counter_key == VOICE_SECONDS_COUNTER,
            )
        )
    assert counter is None or counter.used_units == 0
