import hmac
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.admin import AdminLoginRequest, AdminSessionResponse, AdminUsageOverview
from app.services.admin_auth import (
    AdminAuthError,
    admin_username_from_session,
    issue_admin_session,
    verify_admin_password,
)
from app.services.rate_limits import consume_fixed_window_rate_limit
from app.services.usage_analytics import usage_overview


router = APIRouter(prefix="/admin", tags=["admin"])
ADMIN_COOKIE_NAME = "bloodsugar_admin_session"


def get_current_admin(
    session_token: Annotated[str | None, Cookie(alias=ADMIN_COOKIE_NAME)] = None,
) -> str:
    settings = get_settings()
    try:
        return admin_username_from_session(
            session_token,
            secret=settings.admin_session_secret,
            username=settings.admin_username,
        )
    except AdminAuthError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "admin_auth_required", "message": "Admin authentication required."},
        ) from exc


@router.post("/login", response_model=AdminSessionResponse)
def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> AdminSessionResponse:
    settings = get_settings()
    if not (
        settings.admin_username
        and settings.admin_password_hash
        and settings.admin_session_secret
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"code": "admin_not_configured", "message": "Admin access is not configured."},
        )
    client_key = request.client.host if request.client is not None else "unknown"
    decision = consume_fixed_window_rate_limit(
        scope="admin_login_client",
        key=f"client:{client_key}",
        limit=settings.admin_login_rate_limit_count,
        window_seconds=settings.admin_login_rate_limit_window_seconds,
        db=db,
    )
    db.commit()
    if not decision.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(decision.retry_after_seconds)},
            detail={"code": "admin_login_rate_limited", "message": "Too many login attempts."},
        )
    valid_username = hmac.compare_digest(payload.username, settings.admin_username)
    valid_password = verify_admin_password(payload.password, settings.admin_password_hash)
    if not valid_username or not valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_admin_credentials", "message": "Invalid credentials."},
        )
    token = issue_admin_session(
        username=settings.admin_username,
        secret=settings.admin_session_secret,
        expires_in_seconds=settings.admin_session_seconds,
    )
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=token,
        max_age=settings.admin_session_seconds,
        httponly=True,
        secure=settings.app_env in {"staging", "production"},
        samesite="strict",
        path="/",
    )
    response.headers["Cache-Control"] = "no-store"
    return AdminSessionResponse(authenticated=True, username=settings.admin_username)


@router.post("/logout", response_model=AdminSessionResponse)
def admin_logout(response: Response) -> AdminSessionResponse:
    response.delete_cookie(key=ADMIN_COOKIE_NAME, path="/")
    response.headers["Cache-Control"] = "no-store"
    return AdminSessionResponse(authenticated=False, username="signed-out")


@router.get("/session", response_model=AdminSessionResponse)
def admin_session(username: str = Depends(get_current_admin)) -> AdminSessionResponse:
    return AdminSessionResponse(authenticated=True, username=username)


@router.get("/usage", response_model=AdminUsageOverview)
def admin_usage(
    days: Annotated[int, Query(ge=1, le=90)] = 30,
    _username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminUsageOverview:
    return AdminUsageOverview.model_validate(usage_overview(days=days, db=db))
