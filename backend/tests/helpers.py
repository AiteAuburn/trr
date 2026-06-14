from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient


def create_account_and_profile(client: TestClient, email_prefix: str = "test") -> tuple[str, str]:
    login_response = client.post(
        "/auth/dev-login",
        json={
            "email": f"{email_prefix}-{uuid4()}@example.com",
            "display_name": "Test User",
        },
    )
    assert login_response.status_code == 200
    account_id = login_response.json()["id"]

    profile_response = client.post(
        "/profiles",
        headers={"X-Account-Id": account_id},
        json={"display_name": "自己", "relationship": "self"},
    )
    assert profile_response.status_code == 201
    return account_id, profile_response.json()["id"]


def create_record(
    client: TestClient,
    account_id: str,
    profile_id: str,
    record_type: str,
    occurred_at: datetime,
    payload_json: dict[str, object],
) -> None:
    response = client.post(
        "/records",
        headers={"X-Account-Id": account_id},
        json={
            "profile_id": profile_id,
            "record_type": record_type,
            "occurred_at": occurred_at.isoformat(),
            "payload_json": payload_json,
            "source": "manual",
        },
    )
    assert response.status_code == 201
