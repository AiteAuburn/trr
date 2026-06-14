from datetime import UTC, datetime, timedelta
from uuid import UUID

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.api import profiles as profiles_api
from app.db.session import SessionLocal
from app.main import app
from app.models import Account, AuditLog, ProfileAccessGrant
from app.services import permissions as permissions_service
from app.services.permissions import (
    PROFILE_GRANT_PRUNE_BATCH_SIZE,
    assert_can_read_record,
    assert_can_share_profile,
    get_effective_profile_scopes,
    prune_inactive_profile_access_grants,
    resolve_profile_permission,
    resolve_record_permission,
)
from tests.helpers import create_account_and_profile


def test_profile_permission_decision_allows_owned_profile_only() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "permission-owner")
    other_account_id, _ = create_account_and_profile(client, "permission-other")

    with SessionLocal() as db:
        account = db.scalar(select(Account).where(Account.id == UUID(account_id)))
        other_account = db.scalar(select(Account).where(Account.id == UUID(other_account_id)))
        assert account is not None
        assert other_account is not None

        allowed = resolve_profile_permission(
            scope="profile:share",
            profile_id=UUID(profile_id),
            account=account,
            db=db,
        )
        denied = resolve_profile_permission(
            scope="profile:share",
            profile_id=UUID(profile_id),
            account=other_account,
            db=db,
        )

    assert allowed.allowed is True
    assert allowed.reason == "owner_profile"
    assert allowed.profile is not None
    assert str(allowed.profile.id) == profile_id
    assert denied.allowed is False
    assert denied.reason == "not_found_or_not_owned"
    assert denied.profile is None


def test_profile_permission_assertions_hide_unowned_profiles() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-hidden-owner")
    other_account_id, _ = create_account_and_profile(client, "permission-hidden-other")

    with SessionLocal() as db:
        other_account = db.scalar(select(Account).where(Account.id == UUID(other_account_id)))
        assert other_account is not None

        with pytest.raises(HTTPException) as exc_info:
            assert_can_share_profile(UUID(profile_id), other_account, db)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Profile not found"


def test_record_permission_decision_allows_owned_active_records_only() -> None:
    client = TestClient(app)
    account_id, profile_id = create_account_and_profile(client, "permission-record")
    other_account_id, _ = create_account_and_profile(client, "permission-record-other")
    create_response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201
    record_id = create_response.json()["id"]

    with SessionLocal() as db:
        account = db.scalar(select(Account).where(Account.id == UUID(account_id)))
        other_account = db.scalar(select(Account).where(Account.id == UUID(other_account_id)))
        assert account is not None
        assert other_account is not None

        allowed = resolve_record_permission(
            scope="record:read",
            record_id=UUID(record_id),
            account=account,
            db=db,
        )
        denied = resolve_record_permission(
            scope="record:read",
            record_id=UUID(record_id),
            account=other_account,
            db=db,
        )
        readable_record = assert_can_read_record(UUID(record_id), account, db)

    assert allowed.allowed is True
    assert allowed.reason == "owner_profile"
    assert allowed.record is not None
    assert str(allowed.record.id) == record_id
    assert denied.allowed is False
    assert denied.reason == "not_found_or_not_owned"
    assert denied.record is None
    assert str(readable_record.id) == record_id


def test_profile_read_grant_allows_unowned_profile_without_write_access() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-grant-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-grant-reader")
    create_response = client.post(
        "/records",
        headers={"X-Account-Id": owner_account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 8, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 138, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_response.status_code == 201

    with SessionLocal() as db:
        db.add(
            ProfileAccessGrant(
                profile_id=UUID(profile_id),
                grantee_account_id=UUID(grantee_account_id),
                grant_type="caregiver",
                scopes=["profile:read", "profile:export"],
                metadata_json={},
            )
        )
        db.commit()
        grantee_account = db.scalar(select(Account).where(Account.id == UUID(grantee_account_id)))
        assert grantee_account is not None

        read_decision = resolve_profile_permission(
            scope="profile:read",
            profile_id=UUID(profile_id),
            account=grantee_account,
            db=db,
        )
        write_decision = resolve_profile_permission(
            scope="profile:write",
            profile_id=UUID(profile_id),
            account=grantee_account,
            db=db,
        )

    assert read_decision.allowed is True
    assert read_decision.reason == "active_grant"
    assert write_decision.allowed is False

    list_response = client.get(
        f"/records?profile_id={profile_id}",
        headers={"X-Account-Id": grantee_account_id},
    )
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    create_attempt_response = client.post(
        "/records",
        headers={"X-Account-Id": grantee_account_id},
        json={
            "profile_id": profile_id,
            "record_type": "glucose",
            "occurred_at": datetime(2026, 4, 30, 9, 0, tzinfo=UTC).isoformat(),
            "payload_json": {"value": 140, "unit": "mg/dL"},
            "source": "manual",
        },
    )
    assert create_attempt_response.status_code == 404


def test_revoked_and_expired_profile_grants_are_denied() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-expired-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-expired-grantee")

    with SessionLocal() as db:
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                    revoked_at=datetime.now(UTC),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                    expires_at=datetime.now(UTC) - timedelta(minutes=1),
                ),
            ]
        )
        db.commit()
        grantee_account = db.scalar(select(Account).where(Account.id == UUID(grantee_account_id)))
        assert grantee_account is not None

        decision = resolve_profile_permission(
            scope="profile:read",
            profile_id=UUID(profile_id),
            account=grantee_account,
            db=db,
        )

    assert decision.allowed is False
    assert decision.reason == "not_found_or_not_owned"


def test_inactive_profile_access_grants_can_be_pruned_by_retention_cutoff() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-prune-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-prune-grantee")
    cutoff = datetime.now(UTC) - timedelta(days=1)

    with SessionLocal() as db:
        prune_inactive_profile_access_grants(older_than=datetime.now(UTC) + timedelta(days=1), db=db)
        db.commit()
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:read"],
                    metadata_json={},
                    revoked_at=cutoff - timedelta(minutes=5),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                    expires_at=cutoff - timedelta(minutes=5),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="share",
                    scopes=["profile:read"],
                    metadata_json={},
                    revoked_at=cutoff + timedelta(minutes=5),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:read"],
                    metadata_json={},
                    expires_at=cutoff + timedelta(minutes=5),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                ),
            ]
        )
        db.commit()

        deleted_count = prune_inactive_profile_access_grants(older_than=cutoff, db=db)
        db.commit()
        remaining_grants = list(
            db.scalars(
                select(ProfileAccessGrant).where(ProfileAccessGrant.profile_id == UUID(profile_id))
            )
        )

    assert deleted_count == 2
    assert len(remaining_grants) == 3
    assert {grant.grant_type for grant in remaining_grants} == {"share", "caregiver", "doctor"}


def test_inactive_profile_access_grant_pruning_rejects_naive_cutoff_before_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("naive cutoff should be rejected before query construction")

    monkeypatch.setattr(permissions_service, "select", fail_select)

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="older_than"):
            prune_inactive_profile_access_grants(
                older_than=datetime(2026, 5, 28, 10, 0, 0),
                db=db,
            )


def test_inactive_profile_access_grant_pruning_rejects_oversized_batch_before_query(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    def fail_select(*_: object, **__: object) -> object:
        raise AssertionError("oversized batch should be rejected before query construction")

    monkeypatch.setattr(permissions_service, "select", fail_select)

    with SessionLocal() as db:
        with pytest.raises(ValueError, match="batch_size"):
            prune_inactive_profile_access_grants(
                older_than=datetime.now(UTC) - timedelta(days=1),
                db=db,
                batch_size=PROFILE_GRANT_PRUNE_BATCH_SIZE + 1,
            )


def test_inactive_profile_access_grant_pruning_is_batched() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-prune-batch-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-prune-batch-grantee")
    cutoff = datetime.now(UTC) - timedelta(days=1)

    with SessionLocal() as db:
        prune_inactive_profile_access_grants(older_than=datetime.now(UTC) + timedelta(days=1), db=db)
        db.commit()
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:read"],
                    metadata_json={},
                    revoked_at=cutoff - timedelta(minutes=index + 1),
                )
                for index in range(3)
            ]
        )
        db.commit()

        first_deleted_count = prune_inactive_profile_access_grants(
            older_than=cutoff,
            db=db,
            batch_size=2,
        )
        db.commit()
        second_deleted_count = prune_inactive_profile_access_grants(
            older_than=cutoff,
            db=db,
            batch_size=2,
        )
        db.commit()

    assert first_deleted_count == 2
    assert second_deleted_count == 1


def test_profile_grant_api_creates_lists_and_revokes_with_audit() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-api-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-api-grantee")
    expires_at = datetime.now(UTC) + timedelta(days=30)

    create_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read", "profile:export"],
            "expires_at": expires_at.isoformat(),
        },
    )

    assert create_response.status_code == 201
    created_grant = create_response.json()
    assert created_grant["profile_id"] == profile_id
    assert created_grant["grantee_account_id"] == grantee_account_id
    assert created_grant["grant_type"] == "caregiver"
    assert created_grant["scopes"] == ["profile:read", "profile:export"]
    assert created_grant["revoked_at"] is None

    list_response = client.get(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
    )
    assert list_response.status_code == 200
    assert [grant["id"] for grant in list_response.json()] == [created_grant["id"]]

    revoke_response = client.delete(
        f"/profiles/{profile_id}/grants/{created_grant['id']}",
        headers={"X-Account-Id": owner_account_id},
    )
    assert revoke_response.status_code == 200
    assert revoke_response.json()["revoked_at"] is not None

    with SessionLocal() as db:
        audit_logs = list(
            db.scalars(
                select(AuditLog)
                .where(
                    AuditLog.resource_type == "profile_access_grant",
                    AuditLog.resource_id == UUID(created_grant["id"]),
                )
                .order_by(AuditLog.created_at.asc())
            )
        )

    assert [log.action for log in audit_logs] == [
        "profile_access_grant.created",
        "profile_access_grant.revoked",
    ]
    assert audit_logs[0].metadata_json == {
        "grant_type": "caregiver",
        "scopes": ["profile:read", "profile:export"],
        "has_expiration": True,
    }
    assert audit_logs[1].metadata_json == {
        "grant_type": "caregiver",
        "scopes": ["profile:read", "profile:export"],
    }


def test_profile_grant_create_rejects_expired_grant_before_permission_lookup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(
        client, "permission-expired-grant-owner"
    )
    grantee_account_id, _ = create_account_and_profile(client, "permission-expired-grant-grantee")

    def fail_share_lookup(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("share permission lookup should not run for expired grants")

    monkeypatch.setattr(profiles_api, "assert_can_share_profile", fail_share_lookup)

    response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
            "expires_at": (datetime.now(UTC) - timedelta(minutes=1)).isoformat(),
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_grant_expiration",
        "message": "expires_at must be in the future.",
    }


def test_profile_grant_create_rejects_naive_expiration_before_permission_lookup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(
        client, "permission-naive-grant-owner"
    )
    grantee_account_id, _ = create_account_and_profile(client, "permission-naive-grant-grantee")

    def fail_share_lookup(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("share permission lookup should not run for naive grant expiration")

    monkeypatch.setattr(profiles_api, "assert_can_share_profile", fail_share_lookup)

    response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
            "expires_at": "2026-05-30T00:00:00",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "expires_at",
        "message": "datetime must include a timezone.",
    }


def test_profile_grant_listing_is_bounded() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-grant-limit-owner")
    grantee_account_ids = [
        create_account_and_profile(client, f"permission-grant-limit-{index}")[0]
        for index in range(3)
    ]
    for grantee_account_id in grantee_account_ids:
        response = client.post(
            f"/profiles/{profile_id}/grants",
            headers={"X-Account-Id": owner_account_id},
            json={
                "grantee_account_id": grantee_account_id,
                "grant_type": "caregiver",
                "scopes": ["profile:read"],
            },
        )
        assert response.status_code == 201

    list_response = client.get(
        f"/profiles/{profile_id}/grants?limit=2",
        headers={"X-Account-Id": owner_account_id},
    )
    too_large_response = client.get(
        f"/profiles/{profile_id}/grants?limit=501",
        headers={"X-Account-Id": owner_account_id},
    )

    assert list_response.status_code == 200
    assert len(list_response.json()) == 2
    assert too_large_response.status_code == 422


def test_profile_grant_listing_supports_before_cursor() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-grant-cursor-owner")
    grantee_account_ids = [
        create_account_and_profile(client, f"permission-grant-cursor-{index}")[0]
        for index in range(3)
    ]
    created_grants: list[dict[str, object]] = []
    for grantee_account_id in grantee_account_ids:
        response = client.post(
            f"/profiles/{profile_id}/grants",
            headers={"X-Account-Id": owner_account_id},
            json={
                "grantee_account_id": grantee_account_id,
                "grant_type": "caregiver",
                "scopes": ["profile:read"],
            },
        )
        assert response.status_code == 201
        created_grants.append(response.json())

    first_page = client.get(
        f"/profiles/{profile_id}/grants?limit=2",
        headers={"X-Account-Id": owner_account_id},
    )
    assert first_page.status_code == 200
    first_page_items = first_page.json()
    next_page = client.get(
        f"/profiles/{profile_id}/grants?limit=2&before={first_page_items[-1]['created_at']}",
        headers={"X-Account-Id": owner_account_id},
    )

    assert next_page.status_code == 200
    assert [item["id"] for item in first_page_items] == [
        created_grants[2]["id"],
        created_grants[1]["id"],
    ]
    assert [item["id"] for item in next_page.json()] == [created_grants[0]["id"]]


def test_profile_grant_listing_rejects_naive_cursor_before_permission_lookup(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(
        client, "permission-naive-grant-cursor-owner"
    )

    def fail_share_lookup(*_args: object, **_kwargs: object) -> None:
        raise AssertionError("share permission lookup should not run for naive grant cursor")

    monkeypatch.setattr(profiles_api, "assert_can_share_profile", fail_share_lookup)

    response = client.get(
        f"/profiles/{profile_id}/grants?before=2026-04-30T08:00:00",
        headers={"X-Account-Id": owner_account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "before",
        "message": "datetime must include a timezone.",
    }


def test_profile_grant_api_requires_share_permission_and_hides_foreign_profile() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-api-hidden-owner")
    other_account_id, grantee_profile_id = create_account_and_profile(
        client, "permission-api-hidden-other"
    )

    create_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": other_account_id},
        json={
            "grantee_account_id": other_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
        },
    )
    list_response = client.get(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": other_account_id},
    )
    missing_grantee_response = client.post(
        f"/profiles/{grantee_profile_id}/grants",
        headers={"X-Account-Id": other_account_id},
        json={
            "grantee_account_id": str(UUID(int=0)),
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
        },
    )

    assert create_response.status_code == 404
    assert list_response.status_code == 404
    assert missing_grantee_response.status_code == 404


def test_profile_grant_api_limits_delegated_scopes_to_current_permissions() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-delegate-owner")
    delegate_account_id, _ = create_account_and_profile(client, "permission-delegate-actor")
    target_account_id, _ = create_account_and_profile(client, "permission-delegate-target")

    delegate_grant_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": delegate_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read", "profile:share"],
        },
    )
    assert delegate_grant_response.status_code == 201

    allowed_delegate_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": delegate_account_id},
        json={
            "grantee_account_id": target_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
        },
    )
    denied_delegate_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": delegate_account_id},
        json={
            "grantee_account_id": target_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:write"],
        },
    )

    assert allowed_delegate_response.status_code == 201
    assert allowed_delegate_response.json()["scopes"] == ["profile:read"]
    assert denied_delegate_response.status_code == 403
    assert denied_delegate_response.json()["detail"]["code"] == "grant_scope_not_allowed"

    target_shared_response = client.get(
        "/profiles/shared",
        headers={"X-Account-Id": target_account_id},
    )
    assert target_shared_response.status_code == 200
    assert [item["grant_id"] for item in target_shared_response.json()] == [
        allowed_delegate_response.json()["id"]
    ]


def test_effective_profile_scopes_exclude_revoked_and_expired_grants() -> None:
    client = TestClient(app)
    _, profile_id = create_account_and_profile(client, "permission-effective-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-effective-grantee")

    with SessionLocal() as db:
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:read"],
                    metadata_json={},
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:share"],
                    metadata_json={},
                    revoked_at=datetime.now(UTC),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:export"],
                    metadata_json={},
                    expires_at=datetime.now(UTC) - timedelta(minutes=1),
                ),
            ]
        )
        db.commit()
        grantee_account = db.scalar(select(Account).where(Account.id == UUID(grantee_account_id)))
        assert grantee_account is not None

        effective_scopes = get_effective_profile_scopes(
            profile_id=UUID(profile_id),
            account=grantee_account,
            db=db,
        )

    assert effective_scopes == {"profile:read"}


def test_shared_profiles_lists_only_active_readable_grants() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-shared-owner")
    _, other_profile_id = create_account_and_profile(client, "permission-shared-other-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-shared-grantee")

    active_grant_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
        },
    )
    assert active_grant_response.status_code == 201

    with SessionLocal() as db:
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(other_profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                    expires_at=datetime.now(UTC) - timedelta(minutes=1),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(other_profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:write"],
                    metadata_json={},
                ),
            ]
        )
        db.commit()

    shared_response = client.get(
        "/profiles/shared",
        headers={"X-Account-Id": grantee_account_id},
    )

    assert shared_response.status_code == 200
    shared_profiles = shared_response.json()
    assert len(shared_profiles) == 1
    assert shared_profiles[0]["profile_id"] == profile_id
    assert shared_profiles[0]["grant_id"] == active_grant_response.json()["id"]
    assert shared_profiles[0]["grant_type"] == "caregiver"
    assert shared_profiles[0]["scopes"] == ["profile:read"]
    assert "account_id" not in shared_profiles[0]


def test_shared_profiles_applies_active_readable_filters_before_limit() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(client, "permission-shared-filter-owner")
    grantee_account_id, _ = create_account_and_profile(client, "permission-shared-filter-grantee")

    active_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read"],
        },
    )
    assert active_response.status_code == 201

    with SessionLocal() as db:
        db.add_all(
            [
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="doctor",
                    scopes=["profile:read"],
                    metadata_json={},
                    expires_at=datetime.now(UTC) - timedelta(minutes=1),
                ),
                ProfileAccessGrant(
                    profile_id=UUID(profile_id),
                    grantee_account_id=UUID(grantee_account_id),
                    grant_type="caregiver",
                    scopes=["profile:write"],
                    metadata_json={},
                ),
            ]
        )
        db.commit()

    shared_response = client.get(
        "/profiles/shared?limit=1",
        headers={"X-Account-Id": grantee_account_id},
    )

    assert shared_response.status_code == 200
    assert [item["grant_id"] for item in shared_response.json()] == [active_response.json()["id"]]


def test_shared_profiles_supports_before_cursor() -> None:
    client = TestClient(app)
    grantee_account_id, _ = create_account_and_profile(client, "permission-shared-cursor-grantee")
    created_grants: list[dict[str, object]] = []
    for index in range(3):
        owner_account_id, profile_id = create_account_and_profile(
            client, f"permission-shared-cursor-owner-{index}"
        )
        response = client.post(
            f"/profiles/{profile_id}/grants",
            headers={"X-Account-Id": owner_account_id},
            json={
                "grantee_account_id": grantee_account_id,
                "grant_type": "caregiver",
                "scopes": ["profile:read"],
            },
        )
        assert response.status_code == 201
        created_grants.append(response.json())

    first_page = client.get(
        "/profiles/shared?limit=2",
        headers={"X-Account-Id": grantee_account_id},
    )
    assert first_page.status_code == 200
    first_page_items = first_page.json()
    next_page = client.get(
        f"/profiles/shared?limit=2&before={first_page_items[-1]['created_at']}",
        headers={"X-Account-Id": grantee_account_id},
    )

    assert next_page.status_code == 200
    assert [item["grant_id"] for item in first_page_items] == [
        created_grants[2]["id"],
        created_grants[1]["id"],
    ]
    assert [item["grant_id"] for item in next_page.json()] == [created_grants[0]["id"]]


def test_shared_profiles_rejects_naive_cursor_before_query() -> None:
    client = TestClient(app)
    grantee_account_id, _ = create_account_and_profile(client, "permission-shared-naive-cursor")

    response = client.get(
        "/profiles/shared?before=2026-04-30T08:00:00",
        headers={"X-Account-Id": grantee_account_id},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_datetime",
        "field": "before",
        "message": "datetime must include a timezone.",
    }


def test_shared_profile_grant_can_be_self_revoked_by_grantee_with_audit() -> None:
    client = TestClient(app)
    owner_account_id, profile_id = create_account_and_profile(
        client, "permission-shared-revoke-owner"
    )
    grantee_account_id, _ = create_account_and_profile(client, "permission-shared-revoke-grantee")
    other_account_id, _ = create_account_and_profile(client, "permission-shared-revoke-other")

    grant_response = client.post(
        f"/profiles/{profile_id}/grants",
        headers={"X-Account-Id": owner_account_id},
        json={
            "grantee_account_id": grantee_account_id,
            "grant_type": "caregiver",
            "scopes": ["profile:read", "profile:export"],
        },
    )
    assert grant_response.status_code == 201
    grant_id = grant_response.json()["id"]

    wrong_account_response = client.delete(
        f"/profiles/shared/{grant_id}",
        headers={"X-Account-Id": other_account_id},
    )
    assert wrong_account_response.status_code == 404

    revoke_response = client.delete(
        f"/profiles/shared/{grant_id}",
        headers={"X-Account-Id": grantee_account_id},
    )
    assert revoke_response.status_code == 200
    assert revoke_response.json()["revoked_at"] is not None

    second_revoke_response = client.delete(
        f"/profiles/shared/{grant_id}",
        headers={"X-Account-Id": grantee_account_id},
    )
    assert second_revoke_response.status_code == 200
    assert second_revoke_response.json()["revoked_at"] == revoke_response.json()["revoked_at"]

    shared_response = client.get(
        "/profiles/shared",
        headers={"X-Account-Id": grantee_account_id},
    )
    assert shared_response.status_code == 200
    assert shared_response.json() == []

    with SessionLocal() as db:
        self_revoke_logs = list(
            db.scalars(
                select(AuditLog)
                .where(
                    AuditLog.action == "profile_access_grant.self_revoked",
                    AuditLog.resource_id == UUID(grant_id),
                )
                .order_by(AuditLog.created_at.asc())
            )
        )

    assert len(self_revoke_logs) == 1
    assert self_revoke_logs[0].metadata_json == {
        "grant_type": "caregiver",
        "scopes": ["profile:read", "profile:export"],
    }
