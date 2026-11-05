import hmac
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Account, AiParseAudit, AuditLog, DailyRecord, OperationalEvent, Record, UserProfile
from app.schemas.admin import AdminLoginRequest, AdminSessionResponse, AdminUsageOverview
from app.services.admin_auth import (
    AdminAuthError,
    admin_username_from_session,
    issue_admin_session,
    verify_admin_password,
)
from app.services.rate_limits import consume_fixed_window_rate_limit
from app.services.audit import write_audit_event
from app.services.operational_events import safe_record_operational_event
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
        safe_record_operational_event(
            event_code="admin_login_rate_limited",
            source="admin_auth",
            severity="WARNING",
            route="/admin/login",
            method="POST",
            http_status=status.HTTP_429_TOO_MANY_REQUESTS,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={"Retry-After": str(decision.retry_after_seconds)},
            detail={"code": "admin_login_rate_limited", "message": "Too many login attempts."},
        )
    valid_username = hmac.compare_digest(payload.username, settings.admin_username)
    valid_password = verify_admin_password(payload.password, settings.admin_password_hash)
    if not valid_username or not valid_password:
        safe_record_operational_event(
            event_code="admin_login_denied",
            source="admin_auth",
            severity="WARNING",
            route="/admin/login",
            method="POST",
            http_status=status.HTTP_401_UNAUTHORIZED,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "invalid_admin_credentials", "message": "Invalid credentials."},
        )
    token = issue_admin_session(
        username=settings.admin_username,
        secret=settings.admin_session_secret,
        expires_in_seconds=settings.admin_session_seconds,
    )
    write_audit_event(
        db,
        action="admin.login",
        resource_type="admin_session",
        metadata_json={
            "actor_type": "admin",
            "admin_username": settings.admin_username,
            "request_id": getattr(request.state, "request_id", ""),
        },
    )
    db.commit()
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
def admin_logout(
    request: Request,
    response: Response,
    username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> AdminSessionResponse:
    write_audit_event(
        db,
        action="admin.logout",
        resource_type="admin_session",
        metadata_json={
            "actor_type": "admin",
            "admin_username": username,
            "request_id": getattr(request.state, "request_id", ""),
        },
    )
    db.commit()
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


def _event_last_seen_at(event: dict[str, object]) -> datetime:
    value = event["last_seen_at"]
    return value if isinstance(value, datetime) else datetime.min.replace(tzinfo=UTC)


@router.get("/events")
def admin_operational_events(
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    _username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    now = datetime.now(UTC)
    cutoff = now - timedelta(days=30)
    rows = db.scalars(
        select(OperationalEvent)
        .where(OperationalEvent.last_seen_at >= cutoff)
        .order_by(OperationalEvent.last_seen_at.desc())
        .limit(limit)
    ).all()
    access_rows = db.scalars(
        select(AuditLog)
        .where(
            AuditLog.created_at >= cutoff,
            AuditLog.action.in_(
                {
                    "admin.login",
                    "admin.logout",
                    "admin.user_directory_view",
                    "admin.user_health_data_view",
                    "auth.login",
                    "auth.email_password_login",
                    "auth.dev_login",
                    "auth.register",
                    "auth.token_refresh",
                    "auth.logout",
                    "auth.logout_all",
                    "auth.session_list",
                    "auth.session_revoke",
                    "record.list_viewed",
                    "record.viewed",
                    "daily_record.list_viewed",
                    "year_review.viewed",
                    "year_review.share_card_viewed",
                    "year_review.share_asset_viewed",
                    "year_review.share_package_viewed",
                }
            ),
        )
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    ).all()
    events: list[dict[str, object]] = [
        {
            "id": str(item.id),
            "first_seen_at": item.first_seen_at,
            "last_seen_at": item.last_seen_at,
            "event_code": item.event_code,
            "source": item.source,
            "severity": item.severity,
            "event_count": item.event_count,
            "provider": item.provider,
            "model_id": item.model_id,
            "route": item.route,
            "method": item.method,
            "http_status": item.http_status or None,
            "error_type": item.error_type,
            "batch_number": item.batch_number or None,
            "duration_ms_max": item.duration_ms_max,
            "request_id": item.latest_request_id,
            "target_id": "",
            "actor": "",
        }
        for item in rows
    ]
    admin_routes = {
        "admin.login": ("/admin/login", "POST"),
        "admin.logout": ("/admin/logout", "POST"),
        "admin.user_directory_view": ("/admin/users", "GET"),
        "admin.user_health_data_view": ("/admin/users/{account_id}", "GET"),
        "auth.login": ("/auth/oidc-login", "POST"),
        "auth.email_password_login": ("/auth/login", "POST"),
        "auth.dev_login": ("/auth/dev-login", "POST"),
        "auth.register": ("/auth/register", "POST"),
        "auth.token_refresh": ("/auth/refresh", "POST"),
        "auth.logout": ("/auth/logout", "POST"),
        "auth.logout_all": ("/auth/logout-all", "POST"),
        "auth.session_list": ("/auth/sessions", "GET"),
        "auth.session_revoke": ("/auth/sessions/{session_id}", "DELETE"),
        "record.list_viewed": ("/records", "GET"),
        "record.viewed": ("/records/{record_id}", "GET"),
        "daily_record.list_viewed": ("/daily-records", "GET"),
        "year_review.viewed": ("/year-reviews/{year}", "GET"),
        "year_review.share_card_viewed": ("/year-reviews/{year}/share-card", "GET"),
        "year_review.share_asset_viewed": ("/year-reviews/{year}/share-card/asset", "GET"),
        "year_review.share_package_viewed": ("/year-reviews/share-packages/{id}", "GET"),
    }
    for item in access_rows:
        route, method = admin_routes[item.action]
        events.append(
            {
                "id": str(item.id),
                "first_seen_at": item.created_at,
                "last_seen_at": item.created_at,
                "event_code": item.action,
                "source": "admin_audit" if item.action.startswith("admin.") else "auth_audit",
                "severity": "INFO",
                "event_count": 1,
                "provider": "",
                "model_id": "",
                "route": route,
                "method": method,
                "http_status": None,
                "error_type": "",
                "batch_number": None,
                "duration_ms_max": 0,
                "request_id": str(item.metadata_json.get("request_id", "")),
                "target_id": str(item.resource_id or item.profile_id or item.actor_account_id or ""),
                "actor": str(
                    item.metadata_json.get(
                        "admin_username", "account" if item.actor_account_id is not None else "system"
                    )
                ),
            }
        )
    events.sort(key=_event_last_seen_at, reverse=True)
    return {
        "generated_at": now,
        "retention_days": 30,
        "refresh_after_seconds": 10,
        "events": events[: limit * 2],
    }


@router.get("/users")
def admin_users(
    request: Request,
    q: Annotated[str, Query(max_length=120)] = "",
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    _username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    profile_summary = (
        select(UserProfile.account_id.label("account_id"), func.count().label("profile_count"))
        .group_by(UserProfile.account_id)
        .subquery()
    )
    parse_summary = (
        select(
            AiParseAudit.account_id.label("account_id"),
            func.count().label("parse_count"),
            func.sum(AiParseAudit.input_tokens).label("input_tokens"),
            func.sum(AiParseAudit.output_tokens).label("output_tokens"),
            func.sum(AiParseAudit.total_tokens).label("total_tokens"),
        )
        .group_by(AiParseAudit.account_id)
        .subquery()
    )
    query = (
        select(
            Account.id,
            Account.email,
            Account.display_name,
            Account.created_at,
            func.coalesce(profile_summary.c.profile_count, 0),
            func.coalesce(parse_summary.c.parse_count, 0),
            func.coalesce(parse_summary.c.input_tokens, 0),
            func.coalesce(parse_summary.c.output_tokens, 0),
            func.coalesce(parse_summary.c.total_tokens, 0),
        )
        .outerjoin(profile_summary, profile_summary.c.account_id == Account.id)
        .outerjoin(parse_summary, parse_summary.c.account_id == Account.id)
    )
    normalized_query = q.strip()
    if normalized_query:
        pattern = f"%{normalized_query}%"
        query = query.where(
            or_(
                Account.email.ilike(pattern),
                Account.display_name.ilike(pattern),
                select(UserProfile.id)
                .where(
                    UserProfile.account_id == Account.id,
                    UserProfile.display_name.ilike(pattern),
                )
                .exists(),
            )
        )
    total = db.scalar(select(func.count()).select_from(query.order_by(None).subquery())) or 0
    rows = db.execute(
        query.order_by(Account.created_at.desc(), Account.id.asc()).offset(offset).limit(limit)
    ).all()
    request_id = getattr(request.state, "request_id", "") if request is not None else ""
    write_audit_event(
        db,
        action="admin.user_directory_view",
        resource_type="user_directory",
        metadata_json={
            "actor_type": "admin",
            "admin_username": _username,
            "request_id": request_id,
            "query_present": bool(normalized_query),
            "offset": offset,
            "limit": limit,
            "result_count": len(rows),
        },
    )
    db.commit()
    return {
        "total": int(total),
        "limit": limit,
        "offset": offset,
        "users": [
            {
                "id": str(row[0]),
                "email": row[1],
                "display_name": row[2],
                "created_at": row[3],
                "profile_count": int(row[4] or 0),
                "parse_count": int(row[5] or 0),
                "input_tokens": int(row[6] or 0),
                "output_tokens": int(row[7] or 0),
                "total_tokens": int(row[8] or 0),
            }
            for row in rows
        ],
    }


@router.get("/users/{account_id}")
def admin_user_detail(
    account_id: UUID,
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0, le=1_000_000)] = 0,
    _username: str = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    profiles = db.scalars(
        select(UserProfile)
        .where(UserProfile.account_id == account_id)
        .order_by(UserProfile.created_at.asc(), UserProfile.id.asc())
    ).all()
    daily_rows = db.execute(
        select(DailyRecord, UserProfile.display_name)
        .join(UserProfile, UserProfile.id == DailyRecord.profile_id)
        .where(UserProfile.account_id == account_id)
        .order_by(DailyRecord.record_date.desc(), DailyRecord.updated_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    record_rows = db.execute(
        select(Record, UserProfile.display_name)
        .join(UserProfile, UserProfile.id == Record.profile_id)
        .where(UserProfile.account_id == account_id, Record.deleted_at.is_(None))
        .order_by(Record.occurred_at.desc(), Record.id.asc())
        .offset(offset)
        .limit(limit)
    ).all()
    audits = db.scalars(
        select(AiParseAudit)
        .where(AiParseAudit.account_id == account_id)
        .order_by(AiParseAudit.created_at.desc(), AiParseAudit.id.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    parse_totals = db.execute(
        select(
            func.count(),
            func.sum(AiParseAudit.input_tokens),
            func.sum(AiParseAudit.output_tokens),
            func.sum(AiParseAudit.total_tokens),
        ).where(AiParseAudit.account_id == account_id)
    ).one()
    daily_record_count = db.scalar(
        select(func.count())
        .select_from(DailyRecord)
        .join(UserProfile, UserProfile.id == DailyRecord.profile_id)
        .where(UserProfile.account_id == account_id)
    ) or 0
    record_count = db.scalar(
        select(func.count())
        .select_from(Record)
        .join(UserProfile, UserProfile.id == Record.profile_id)
        .where(UserProfile.account_id == account_id, Record.deleted_at.is_(None))
    ) or 0
    detail = {
        "account": {
            "id": str(account.id),
            "email": account.email,
            "display_name": account.display_name,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
        },
        "usage": {
            "parse_count": int(parse_totals[0] or 0),
            "input_tokens": int(parse_totals[1] or 0),
            "output_tokens": int(parse_totals[2] or 0),
            "total_tokens": int(parse_totals[3] or 0),
        },
        "profiles": [
            {
                "id": str(profile.id),
                "display_name": profile.display_name,
                "relationship": profile.relationship,
                "created_at": profile.created_at,
                "updated_at": profile.updated_at,
            }
            for profile in profiles
        ],
        "parser_submissions": [
            {
                "id": str(item.id),
                "profile_id": str(item.profile_id),
                "transcript_text": item.transcript_text,
                "stt_model_id": item.stt_model_id,
                "llm_model_id": item.llm_model_id,
                "status": item.status,
                "result": item.result_json,
                "models": item.usage_json,
                "input_tokens": item.input_tokens,
                "output_tokens": item.output_tokens,
                "total_tokens": item.total_tokens,
                "error_code": item.error_code,
                "created_at": item.created_at,
            }
            for item in audits
        ],
        "daily_records": [
            {
                "id": str(item.id),
                "profile_id": str(item.profile_id),
                "profile_name": profile_name,
                "record_date": item.record_date,
                "summary_text": item.summary_text,
                "transcript_entries": item.transcript_entries_json,
                "analysis": item.preview_records_json,
                "source": item.source,
                "updated_at": item.updated_at,
            }
            for item, profile_name in daily_rows
        ],
        "records": [
            {
                "id": str(item.id),
                "profile_id": str(item.profile_id),
                "profile_name": profile_name,
                "record_type": item.record_type,
                "occurred_at": item.occurred_at,
                "payload": item.payload,
                "metadata": item.metadata_json,
                "source": item.source,
            }
            for item, profile_name in record_rows
        ],
        "history_page": {
            "limit": limit,
            "offset": offset,
            "parser_submissions": int(parse_totals[0] or 0),
            "daily_records": int(daily_record_count),
            "records": int(record_count),
        },
    }
    write_audit_event(
        db,
        action="admin.user_health_data_view",
        resource_type="user_account",
        resource_id=account_id,
        metadata_json={
            "actor_type": "admin",
            "admin_username": _username,
            "request_id": getattr(request.state, "request_id", ""),
            "profile_count": len(profiles),
            "offset": offset,
            "limit": limit,
        },
    )
    db.commit()
    return detail
