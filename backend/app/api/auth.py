from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_account, is_valid_jwt_id
from app.core.auth import (
    AuthTokenError,
    claims_from_bearer_token,
    claims_from_jwks_bearer_token,
    issue_hs256_access_token,
)
from app.core.config import get_settings
from app.db.session import get_db
from app.models import Account
from app.schemas.auth import (
    AuthSessionRead,
    AuthSessionsResponse,
    DevLoginRequest,
    DevLoginResponse,
    LogoutAllResponse,
    LogoutResponse,
    OidcLoginRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
)
from app.services.auth_sessions import (
    create_auth_session,
    find_active_session_by_refresh_token,
    list_active_account_sessions,
    revoke_account_session_by_id,
    revoke_all_account_sessions,
    revoke_auth_session,
    rotate_auth_session,
)
from app.services.rate_limits import consume_fixed_window_rate_limit, normalize_retry_after_seconds
from app.services.token_revocation import revoke_jwt_id

router = APIRouter(prefix="/auth", tags=["auth"])

email_adapter = TypeAdapter(EmailStr)


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(payload: DevLoginRequest, db: Session = Depends(get_db)) -> Account:
    if not get_settings().dev_auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Development login is disabled",
        )

    account = db.scalar(select(Account).where(Account.email == payload.email))
    if account is None:
        account = Account(email=payload.email, display_name=payload.display_name)
        db.add(account)
        db.commit()
        db.refresh(account)
    return account


@router.post("/oidc-login", response_model=RefreshTokenResponse)
def oidc_login(
    payload: OidcLoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> RefreshTokenResponse:
    settings = get_settings()
    if not (
        settings.auth_oidc_jwks_url
        and settings.auth_oidc_issuer
        and settings.auth_oidc_audience
        and settings.auth_jwt_secret
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "oidc_login_not_configured",
                "message": "OIDC login is not configured.",
            },
        )

    client_rate_limit = consume_fixed_window_rate_limit(
        scope="auth_login_client",
        key=f"client:{_client_rate_limit_key(request)}",
        limit=settings.auth_login_client_rate_limit_count,
        window_seconds=settings.auth_login_client_rate_limit_window_seconds,
        db=db,
    )
    if not client_rate_limit.allowed:
        db.commit()
        raise _rate_limit_exceeded(
            client_rate_limit.retry_after_seconds,
            message="Too many login attempts. Try again later.",
        )

    try:
        claims = claims_from_jwks_bearer_token(
            f"Bearer {payload.id_token}",
            jwks_url=settings.auth_oidc_jwks_url,
            issuer=settings.auth_oidc_issuer,
            audience=settings.auth_oidc_audience,
            max_age_seconds=settings.auth_oidc_max_age_seconds,
            timeout_seconds=settings.auth_oidc_timeout_seconds,
        )
    except AuthTokenError as exc:
        db.commit()
        raise _invalid_oidc_token() from exc

    email = _email_from_oidc_claims(claims)
    if email is None or not _email_verified(claims) or not _nonce_matches(claims, payload.nonce):
        db.commit()
        raise _invalid_oidc_token()

    account = db.scalar(select(Account).where(Account.email == email))
    if account is None:
        account = Account(
            email=email,
            display_name=_display_name_from_oidc_claims(claims, fallback=email),
        )
        db.add(account)
        db.flush()

    refresh_token_value = token_urlsafe(48)
    create_auth_session(
        account_id=account.id,
        refresh_token=refresh_token_value,
        expires_at=datetime.now(UTC) + timedelta(days=settings.auth_refresh_token_days),
        db=db,
        device_fingerprint=payload.device_fingerprint,
    )
    access_token = issue_hs256_access_token(
        account_id=account.id,
        secret=settings.auth_jwt_secret,
        expires_in_seconds=settings.auth_jwt_max_age_seconds,
        issuer=settings.auth_jwt_issuer,
        audience=settings.auth_jwt_audience,
    )
    db.commit()
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_value,
        expires_in=settings.auth_jwt_max_age_seconds,
    )


@router.get("/me", response_model=DevLoginResponse)
def current_auth_account(account: Account = Depends(get_current_account)) -> Account:
    return account


@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_token(
    payload: RefreshTokenRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> RefreshTokenResponse:
    settings = get_settings()
    if not settings.auth_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "auth_not_configured",
                "message": "Token refresh is not configured.",
            },
        )
    client_rate_limit = consume_fixed_window_rate_limit(
        scope="auth_refresh_client",
        key=f"client:{_client_rate_limit_key(request)}",
        limit=settings.auth_refresh_client_rate_limit_count,
        window_seconds=settings.auth_refresh_client_rate_limit_window_seconds,
        db=db,
    )
    if not client_rate_limit.allowed:
        db.commit()
        raise _rate_limit_exceeded(client_rate_limit.retry_after_seconds)

    rate_limit = consume_fixed_window_rate_limit(
        scope="auth_refresh",
        key=payload.refresh_token,
        limit=settings.auth_refresh_rate_limit_count,
        window_seconds=settings.auth_refresh_rate_limit_window_seconds,
        db=db,
    )
    if not rate_limit.allowed:
        db.commit()
        raise _rate_limit_exceeded(rate_limit.retry_after_seconds)

    session = find_active_session_by_refresh_token(payload.refresh_token, db)
    if session is None:
        db.commit()
        raise _invalid_refresh_token()

    account = db.get(Account, session.account_id)
    if account is None:
        raise _invalid_refresh_token()

    next_refresh_token = token_urlsafe(48)
    rotated = rotate_auth_session(
        session=session,
        current_refresh_token=payload.refresh_token,
        next_refresh_token=next_refresh_token,
        next_expires_at=datetime.now(UTC) + timedelta(days=settings.auth_refresh_token_days),
    )
    if not rotated:
        raise _invalid_refresh_token()

    access_token = issue_hs256_access_token(
        account_id=account.id,
        secret=settings.auth_jwt_secret,
        expires_in_seconds=settings.auth_jwt_max_age_seconds,
        issuer=settings.auth_jwt_issuer,
        audience=settings.auth_jwt_audience,
    )
    db.commit()
    return RefreshTokenResponse(
        access_token=access_token,
        refresh_token=next_refresh_token,
        expires_in=settings.auth_jwt_max_age_seconds,
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    payload: RefreshTokenRequest,
    request: Request,
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> LogoutResponse:
    settings = get_settings()
    client_rate_limit = consume_fixed_window_rate_limit(
        scope="auth_logout_client",
        key=f"client:{_client_rate_limit_key(request)}",
        limit=settings.auth_logout_client_rate_limit_count,
        window_seconds=settings.auth_logout_client_rate_limit_window_seconds,
        db=db,
    )
    if not client_rate_limit.allowed:
        db.commit()
        raise _rate_limit_exceeded(
            client_rate_limit.retry_after_seconds,
            message="Too many logout attempts. Try again later.",
        )

    session = find_active_session_by_refresh_token(payload.refresh_token, db)
    if session is not None:
        revoke_auth_session(session)
    _revoke_bearer_access_token_if_valid(authorization, db)
    db.commit()
    return LogoutResponse()


@router.post("/logout-all", response_model=LogoutAllResponse)
def logout_all(
    authorization: str | None = Header(default=None, alias="Authorization"),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> LogoutAllResponse:
    revoked_sessions = revoke_all_account_sessions(account.id, db)
    _revoke_bearer_access_token_if_valid(authorization, db)
    db.commit()
    return LogoutAllResponse(revoked_sessions=revoked_sessions)


@router.get("/sessions", response_model=AuthSessionsResponse)
def list_sessions(
    limit: int = Query(default=100, ge=1, le=500),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> AuthSessionsResponse:
    sessions = list_active_account_sessions(account.id, db, limit=limit)
    return AuthSessionsResponse(
        root=[
            AuthSessionRead(
                id=session.id,
                created_at=session.created_at,
                expires_at=session.expires_at,
                last_used_at=session.last_used_at,
                has_device_fingerprint=session.device_fingerprint_hash is not None,
            )
            for session in sessions
        ]
    )


@router.delete("/sessions/{session_id}", response_model=LogoutResponse)
def revoke_session(
    session_id: UUID,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> LogoutResponse:
    revoked = revoke_account_session_by_id(account.id, session_id, db)
    if revoked:
        db.commit()
    return LogoutResponse()


def _invalid_refresh_token() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "invalid_refresh_token",
            "message": "Refresh token is invalid or expired.",
            "hint": "sign_in_again",
        },
    )


def _invalid_oidc_token() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "invalid_oidc_token",
            "message": "OIDC token is invalid or missing required verified email claims.",
            "hint": "sign_in_again",
        },
    )


def _rate_limit_exceeded(
    retry_after_seconds: int,
    *,
    message: str = "Too many refresh attempts. Try again later.",
) -> HTTPException:
    bounded_retry_after_seconds = normalize_retry_after_seconds(retry_after_seconds)
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "code": "rate_limit_exceeded",
            "message": message,
            "retry_after_seconds": bounded_retry_after_seconds,
        },
        headers={"Retry-After": str(bounded_retry_after_seconds)},
    )


def _client_rate_limit_key(request: Request) -> str:
    if request.client is None or not request.client.host:
        return "unknown"
    return request.client.host


def _email_from_oidc_claims(claims: dict[str, object]) -> str | None:
    value = claims.get("email")
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower()
    if not normalized:
        return None
    try:
        return str(email_adapter.validate_python(normalized))
    except ValidationError:
        return None


def _email_verified(claims: dict[str, object]) -> bool:
    value = claims.get("email_verified")
    if value is None:
        return True
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() == "true"
    return False


def _nonce_matches(claims: dict[str, object], expected_nonce: str) -> bool:
    value = claims.get("nonce")
    return isinstance(value, str) and value == expected_nonce


def _display_name_from_oidc_claims(claims: dict[str, object], *, fallback: str) -> str:
    for key in ("name", "given_name", "preferred_username"):
        value = claims.get(key)
        if isinstance(value, str):
            normalized = value.strip()
            if normalized:
                return normalized[:120]
    return fallback.split("@", 1)[0][:120] or "User"


def _revoke_bearer_access_token_if_valid(authorization: str | None, db: Session) -> None:
    settings = get_settings()
    if not authorization or (not settings.auth_jwks_url and not settings.auth_jwt_secret):
        return
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
    except AuthTokenError:
        return

    jwt_id = claims.get("jti")
    expires_at = claims.get("exp")
    if not is_valid_jwt_id(jwt_id) or not isinstance(expires_at, int | float):
        return
    revoke_jwt_id(jwt_id, datetime.fromtimestamp(expires_at, tz=UTC), db)
