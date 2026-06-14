from datetime import datetime
import re
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, RootModel, field_validator

ACCESS_TOKEN_MAX_LENGTH = 4096
AUTH_DISPLAY_NAME_MAX_LENGTH = 120
AUTH_SESSION_LIST_MAX_COUNT = 500
DEVICE_FINGERPRINT_MAX_LENGTH = 256
ID_TOKEN_MAX_LENGTH = 4096
LOGOUT_ALL_REVOKED_SESSIONS_MAX_COUNT = 10_000
OIDC_NONCE_MAX_LENGTH = 128
OIDC_NONCE_PATTERN = r"^[A-Za-z0-9._~+-]+$"
OIDC_PROVIDER_MAX_LENGTH = 32
OIDC_PROVIDER_PATTERN = r"^[A-Za-z0-9._-]+$"
REFRESH_TOKEN_MAX_LENGTH = 512
REFRESH_TOKEN_PATTERN = r"^[A-Za-z0-9._~+-]+$"
TOKEN_EXPIRES_IN_MAX_SECONDS = 86_400
JWT_COMPACT_PATTERN = re.compile(r"^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$")


class DevLoginRequest(BaseModel):
    email: EmailStr = "demo@example.com"
    display_name: str = Field(
        default="Demo User",
        min_length=1,
        max_length=AUTH_DISPLAY_NAME_MAX_LENGTH,
    )

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("display_name must not be blank")
        return normalized


class DevLoginResponse(BaseModel):
    id: UUID
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=AUTH_DISPLAY_NAME_MAX_LENGTH)

    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(
        min_length=32,
        max_length=REFRESH_TOKEN_MAX_LENGTH,
        pattern=REFRESH_TOKEN_PATTERN,
    )


class OidcLoginRequest(BaseModel):
    provider: str = Field(
        min_length=1,
        max_length=OIDC_PROVIDER_MAX_LENGTH,
        pattern=OIDC_PROVIDER_PATTERN,
    )
    id_token: str = Field(min_length=1, max_length=ID_TOKEN_MAX_LENGTH)
    nonce: str = Field(
        min_length=16,
        max_length=OIDC_NONCE_MAX_LENGTH,
        pattern=OIDC_NONCE_PATTERN,
    )
    device_fingerprint: str | None = Field(default=None, max_length=DEVICE_FINGERPRINT_MAX_LENGTH)

    @field_validator("provider", mode="before")
    @classmethod
    def normalize_provider(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator("id_token", mode="before")
    @classmethod
    def normalize_id_token(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        normalized = value.strip()
        if JWT_COMPACT_PATTERN.fullmatch(normalized) is None:
            raise ValueError("id_token must be a compact JWT")
        return normalized

    @field_validator("nonce", mode="before")
    @classmethod
    def normalize_nonce(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("device_fingerprint", mode="before")
    @classmethod
    def normalize_device_fingerprint(cls, value: object) -> object:
        if value is None:
            return None
        if not isinstance(value, str):
            return value
        normalized = value.strip()
        return normalized or None


class RefreshTokenResponse(BaseModel):
    access_token: str = Field(min_length=1, max_length=ACCESS_TOKEN_MAX_LENGTH)
    refresh_token: str = Field(
        min_length=32,
        max_length=REFRESH_TOKEN_MAX_LENGTH,
        pattern=REFRESH_TOKEN_PATTERN,
    )
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(ge=1, le=TOKEN_EXPIRES_IN_MAX_SECONDS)


class LogoutResponse(BaseModel):
    revoked: bool = True


class LogoutAllResponse(BaseModel):
    revoked_sessions: int = Field(ge=0, le=LOGOUT_ALL_REVOKED_SESSIONS_MAX_COUNT)


class AuthSessionRead(BaseModel):
    id: UUID
    created_at: datetime
    expires_at: datetime
    last_used_at: datetime | None = None
    has_device_fingerprint: bool


class AuthSessionsResponse(RootModel[list[AuthSessionRead]]):
    root: list[AuthSessionRead] = Field(max_length=AUTH_SESSION_LIST_MAX_COUNT)
