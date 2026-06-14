from uuid import UUID
from typing import TypeGuard

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.auth import AuthTokenError, claims_from_bearer_token, claims_from_jwks_bearer_token
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Account
from app.services.token_revocation import MAX_JWT_ID_LENGTH, is_jwt_revoked


def production_auth_not_configured_detail() -> dict[str, str]:
    return {
        "code": "production_auth_not_configured",
        "message": "Production authentication is not configured.",
        "hint": "configure_jwt_or_oidc_auth",
    }


def invalid_auth_token_detail() -> dict[str, str]:
    return {
        "code": "invalid_auth_token",
        "message": "Authentication token is invalid or expired.",
        "hint": "sign_in_again",
    }


def get_current_account(
    x_account_id: UUID | None = Header(default=None, alias="X-Account-Id"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> Account:
    settings = get_settings()
    if not settings.dev_auth_enabled:
        if not settings.auth_jwks_url and not settings.auth_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=production_auth_not_configured_detail(),
            )
        try:
            if settings.auth_jwks_url:
                claims = claims_from_jwks_bearer_token(
                    authorization,
                    jwks_url=settings.auth_jwks_url,
                    issuer=settings.auth_jwt_issuer,
                    audience=settings.auth_jwt_audience,
                    max_age_seconds=settings.auth_jwt_max_age_seconds,
                    timeout_seconds=settings.auth_jwks_timeout_seconds,
                )
            else:
                claims = claims_from_bearer_token(
                    authorization,
                    secret=settings.auth_jwt_secret,
                    issuer=settings.auth_jwt_issuer,
                    audience=settings.auth_jwt_audience,
                    max_age_seconds=settings.auth_jwt_max_age_seconds,
                )
            jwt_id = claims.get("jti")
            if settings.auth_jwt_require_jti and not is_valid_jwt_id(jwt_id):
                raise AuthTokenError("missing token id")
            if is_valid_jwt_id(jwt_id) and is_jwt_revoked(jwt_id, db):
                raise AuthTokenError("token revoked")
            subject = claims.get("sub")
            if not isinstance(subject, str):
                raise AuthTokenError("missing token subject")
            account_id = UUID(subject)
        except AuthTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=invalid_auth_token_detail(),
            ) from exc
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=invalid_auth_token_detail(),
            ) from exc
        account = db.scalar(select(Account).where(Account.id == account_id))
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=invalid_auth_token_detail(),
            )
        return account

    if x_account_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Account-Id header",
        )

    account = db.scalar(select(Account).where(Account.id == x_account_id))
    if account is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown account",
        )
    return account


def is_valid_jwt_id(value: object) -> TypeGuard[str]:
    return isinstance(value, str) and bool(value.strip()) and len(value.strip()) <= MAX_JWT_ID_LENGTH
