from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

ProfileGrantScope = Literal["profile:read", "profile:write", "profile:export", "profile:share"]
ProfileGrantType = Literal["caregiver", "doctor", "share"]

PROFILE_DISPLAY_NAME_MAX_LENGTH = 120
PROFILE_GRANT_SCOPES_MAX_COUNT = 4
PROFILE_GRANT_TYPE_MAX_LENGTH = 80
PROFILE_RELATIONSHIP_MAX_LENGTH = 80


class ProfileCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=PROFILE_DISPLAY_NAME_MAX_LENGTH)
    relationship: str = Field(default="self", min_length=1, max_length=PROFILE_RELATIONSHIP_MAX_LENGTH)

    @field_validator("display_name", "relationship")
    @classmethod
    def normalize_profile_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("profile text must not be blank")
        return normalized


class ProfileRead(BaseModel):
    id: UUID
    account_id: UUID
    display_name: str = Field(min_length=1, max_length=PROFILE_DISPLAY_NAME_MAX_LENGTH)
    relationship: str = Field(min_length=1, max_length=PROFILE_RELATIONSHIP_MAX_LENGTH)
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfileAccessGrantCreate(BaseModel):
    grantee_account_id: UUID
    grant_type: ProfileGrantType = "caregiver"
    scopes: list[ProfileGrantScope] = Field(min_length=1, max_length=PROFILE_GRANT_SCOPES_MAX_COUNT)
    expires_at: datetime | None = None


class ProfileAccessGrantRead(BaseModel):
    id: UUID
    profile_id: UUID
    grantee_account_id: UUID
    grant_type: ProfileGrantType
    scopes: list[ProfileGrantScope] = Field(max_length=PROFILE_GRANT_SCOPES_MAX_COUNT)
    expires_at: datetime | None
    revoked_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SharedProfileRead(BaseModel):
    profile_id: UUID
    display_name: str = Field(min_length=1, max_length=PROFILE_DISPLAY_NAME_MAX_LENGTH)
    relationship: str = Field(min_length=1, max_length=PROFILE_RELATIONSHIP_MAX_LENGTH)
    grant_id: UUID
    grant_type: ProfileGrantType
    scopes: list[ProfileGrantScope] = Field(max_length=PROFILE_GRANT_SCOPES_MAX_COUNT)
    expires_at: datetime | None
    created_at: datetime
