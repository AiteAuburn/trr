from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from pytest import MonkeyPatch, raises

from app.db.session import SessionLocal
from app.main import app
from app.services import auth_sessions
from app.services.auth_sessions import (
    AUTH_SESSION_PRUNE_BATCH_SIZE,
    MAX_AUTH_TOKEN_HASH_INPUT_LENGTH,
    MAX_DEVICE_FINGERPRINT_LENGTH,
    create_auth_session,
    find_active_session_by_refresh_token,
    optional_fingerprint_hash,
    prune_expired_auth_sessions,
    revoke_all_account_sessions,
    rotate_auth_session,
    token_hash,
)
from tests.helpers import create_account_and_profile


def test_token_hash_normalizes_whitespace() -> None:
    refresh_token = f"refresh-token-test-value-{uuid4()}"

    assert token_hash(f"  {refresh_token}\n") == token_hash(refresh_token)


def test_token_hash_rejects_oversized_value_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_hash(_: bytes) -> object:
        raise AssertionError("oversized token should not be hashed")

    monkeypatch.setattr(auth_sessions.hashlib, "sha256", fail_hash)

    with raises(ValueError, match="token"):
        token_hash("t" * (MAX_AUTH_TOKEN_HASH_INPUT_LENGTH + 1))


def test_device_fingerprint_hash_normalizes_whitespace() -> None:
    device_fingerprint = f"device-fingerprint-test-value-{uuid4()}"

    assert optional_fingerprint_hash(f"  {device_fingerprint}\n") == token_hash(device_fingerprint)


def test_device_fingerprint_rejects_oversized_value_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_hash(_: str) -> str:
        raise AssertionError("oversized device fingerprint should not be hashed")

    monkeypatch.setattr(auth_sessions, "token_hash", fail_hash)

    with raises(ValueError, match="device_fingerprint"):
        optional_fingerprint_hash("a" * (MAX_DEVICE_FINGERPRINT_LENGTH + 1))


def test_refresh_session_create_rejects_naive_expiration_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-session-naive-create")

    def fail_hash(_: str) -> str:
        raise AssertionError("naive expiration should be rejected before token hashing")

    monkeypatch.setattr(auth_sessions, "token_hash", fail_hash)

    with SessionLocal() as db:
        with raises(ValueError, match="expires_at"):
            create_auth_session(
                account_id=UUID(account_id),
                refresh_token=f"refresh-token-test-value-{uuid4()}",
                expires_at=datetime(2026, 5, 28, 10, 0, 0),
                db=db,
            )


def test_refresh_session_rotation_rejects_naive_next_expiration_before_hashing(
    monkeypatch: MonkeyPatch,
) -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-session-naive-rotate")
    current_token = f"current-refresh-token-test-value-{uuid4()}"

    with SessionLocal() as db:
        session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=current_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()
        db.refresh(session)

        def fail_hash(_: str) -> str:
            raise AssertionError("naive next expiration should be rejected before token hashing")

        monkeypatch.setattr(auth_sessions, "token_hash", fail_hash)

        with raises(ValueError, match="next_expires_at"):
            rotate_auth_session(
                session=session,
                current_refresh_token=current_token,
                next_refresh_token=f"next-refresh-token-test-value-{uuid4()}",
                next_expires_at=datetime(2026, 5, 28, 10, 0, 0),
            )


def test_refresh_session_stores_hashes_only_and_can_be_found_by_token() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-session")
    refresh_token = f"refresh-token-test-value-{uuid4()}"
    device_fingerprint = f"device-fingerprint-test-value-{uuid4()}"

    with SessionLocal() as db:
        session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=refresh_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
            device_fingerprint=device_fingerprint,
        )
        db.commit()
        db.refresh(session)

        found_session = find_active_session_by_refresh_token(refresh_token, db)

        assert found_session is not None
        assert found_session.id == session.id
        assert found_session.refresh_token_hash == token_hash(refresh_token)
        assert found_session.device_fingerprint_hash == optional_fingerprint_hash(device_fingerprint)
        assert refresh_token not in found_session.refresh_token_hash
        assert device_fingerprint not in found_session.device_fingerprint_hash


def test_refresh_session_rotation_invalidates_previous_token_hash() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-rotation")
    current_token = f"current-refresh-token-test-value-{uuid4()}"
    next_token = f"next-refresh-token-test-value-{uuid4()}"

    with SessionLocal() as db:
        session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=current_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()
        db.refresh(session)

        rotated = rotate_auth_session(
            session=session,
            current_refresh_token=current_token,
            next_refresh_token=next_token,
            next_expires_at=datetime.now(UTC) + timedelta(days=14),
        )
        db.commit()

        assert rotated is True
        assert find_active_session_by_refresh_token(current_token, db) is None
        found_session = find_active_session_by_refresh_token(next_token, db)
        assert found_session is not None
        assert found_session.id == session.id
        assert found_session.last_used_at is not None
        assert found_session.rotated_at is not None


def test_refresh_session_rotation_rejects_wrong_or_expired_token() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-rotation-deny")
    current_token = f"rotation-deny-current-token-{uuid4()}"

    with SessionLocal() as db:
        session = create_auth_session(
            account_id=UUID(account_id),
            refresh_token=current_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()
        db.refresh(session)

        wrong_token_rotated = rotate_auth_session(
            session=session,
            current_refresh_token="wrong-refresh-token",
            next_refresh_token=f"must-not-activate-{uuid4()}",
            next_expires_at=datetime.now(UTC) + timedelta(days=14),
        )
        session.expires_at = datetime.now(UTC) - timedelta(minutes=1)
        expired_token_rotated = rotate_auth_session(
            session=session,
            current_refresh_token=current_token,
            next_refresh_token=f"must-not-activate-either-{uuid4()}",
            next_expires_at=datetime.now(UTC) + timedelta(days=14),
        )

        assert wrong_token_rotated is False
        assert expired_token_rotated is False


def test_all_active_account_sessions_can_be_revoked() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-revoke-all")
    first_token = f"first-refresh-token-{uuid4()}"
    second_token = f"second-refresh-token-{uuid4()}"

    with SessionLocal() as db:
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=first_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=second_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

        revoked_count = revoke_all_account_sessions(UUID(account_id), db)
        db.commit()

        assert revoked_count == 2
        assert find_active_session_by_refresh_token(first_token, db) is None
        assert find_active_session_by_refresh_token(second_token, db) is None


def test_expired_auth_sessions_can_be_pruned_without_touching_active_sessions() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-prune")
    expired_token = f"expired-refresh-token-{uuid4()}"
    active_token = f"active-refresh-token-{uuid4()}"

    with SessionLocal() as db:
        prune_expired_auth_sessions(db)
        db.commit()
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=expired_token,
            expires_at=datetime.now(UTC) - timedelta(minutes=5),
            db=db,
        )
        create_auth_session(
            account_id=UUID(account_id),
            refresh_token=active_token,
            expires_at=datetime.now(UTC) + timedelta(days=7),
            db=db,
        )
        db.commit()

        deleted_count = prune_expired_auth_sessions(db)
        db.commit()

        assert deleted_count == 1
        assert find_active_session_by_refresh_token(expired_token, db) is None
        assert find_active_session_by_refresh_token(active_token, db) is not None


def test_expired_auth_session_pruning_is_batched() -> None:
    client = TestClient(app)
    account_id, _ = create_account_and_profile(client, "auth-prune-batch")
    expired_tokens = [f"expired-refresh-batch-token-{index}-{uuid4()}" for index in range(3)]

    with SessionLocal() as db:
        prune_expired_auth_sessions(db)
        db.commit()
        for index, token in enumerate(expired_tokens):
            create_auth_session(
                account_id=UUID(account_id),
                refresh_token=token,
                expires_at=datetime.now(UTC) - timedelta(minutes=index + 1),
                db=db,
            )
        db.commit()

        first_deleted_count = prune_expired_auth_sessions(db, batch_size=2)
        db.commit()
        second_deleted_count = prune_expired_auth_sessions(db, batch_size=2)
        db.commit()

    assert first_deleted_count == 2
    assert second_deleted_count == 1


def test_expired_auth_session_pruning_rejects_oversized_batch_before_query(
    monkeypatch: MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("oversized batch should be rejected before query construction")

    monkeypatch.setattr(auth_sessions, "select", fail_select)

    with SessionLocal() as db:
        with raises(ValueError, match="batch_size"):
            prune_expired_auth_sessions(db, batch_size=AUTH_SESSION_PRUNE_BATCH_SIZE + 1)
