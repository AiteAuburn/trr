import json
from datetime import UTC, date, datetime
from hashlib import sha256
from html import escape
from typing import Literal, cast
from uuid import UUID

import httpx
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import AchievementUnlock, Record, UserProfile, YearReviewSharePackage, YearReviewSnapshot
from app.schemas.year_review import (
    YearReviewMetric,
    YearReviewObservation,
    YearReviewRead,
    YearReviewShareAssetRead,
    YearReviewShareCardRead,
    YearReviewSharePackageRead,
)
from app.services.achievement_catalog import ACHIEVEMENT_CATEGORY_DEFINITIONS, achievement_levels_for_progress
from app.services.audit import write_audit_event

YEAR_REVIEW_GENERATION_BATCH_SIZE = 500
YEAR_REVIEW_AI_RESPONSE_CHAR_BUDGET = 4000
YEAR_REVIEW_AI_SUMMARY_TEXT_MAX_LENGTH = 240
YearReviewSharePackageStatus = Literal["confirmed", "opened", "dismissed", "revoked"]
YEAR_REVIEW_AI_SYSTEM_PROMPT = (
    "你是糖錄錄年度回顧摘要助手。只根據使用者提供的年度聚合統計撰寫繁體中文回顧，"
    "不可要求更多資料、不可編造、不可提供診療建議或療效宣稱。"
    "只輸出 JSON object，欄位必須是 important_observation 與 encouragement，"
    "每個欄位都要是 120 字以內的字串。"
)


def latest_completed_year(now: datetime | None = None) -> int:
    current = now or datetime.now(UTC)
    return current.year - 1


def validate_completed_year_review_year(year: int, now: datetime | None = None) -> int:
    completed_year = latest_completed_year(now)
    if year < 2000 or year > completed_year:
        raise ValueError("year_review_year_not_completed")
    return year


def number_value(payload: dict[str, object], key: str) -> float | None:
    value = payload.get(key)
    if isinstance(value, bool):
        return None
    if isinstance(value, int | float):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def achieved_badge_summary(
    cumulative_counts: tuple[int, ...],
    streak_counts: tuple[int, ...],
    persisted_unlocks: list[AchievementUnlock],
) -> tuple[int, int]:
    achieved_ids: set[str] = set()
    highest_level = 0
    for definition, cumulative_count, streak_count in zip(
        ACHIEVEMENT_CATEGORY_DEFINITIONS,
        cumulative_counts,
        streak_counts,
        strict=True,
    ):
        category = str(definition["id"])
        for level in achievement_levels_for_progress(cumulative_count):
            if cumulative_count >= level:
                achieved_ids.add(f"{category}-cumulative-{level}")
                highest_level = max(highest_level, level)
        for level in achievement_levels_for_progress(streak_count):
            if streak_count >= level:
                achieved_ids.add(f"{category}-streak-{level}")
                highest_level = max(highest_level, level)
    for unlock in persisted_unlocks:
        achieved_ids.add(unlock.achievement_id)
        highest_level = max(highest_level, unlock.level)
    return len(achieved_ids), highest_level


def longest_streak(days: set[date]) -> int:
    longest = 0
    current = 0
    previous = None
    for day in sorted(days):
        if previous is not None and (day - previous).days == 1:
            current += 1
        else:
            current = 1
        longest = max(longest, current)
        previous = day
    return longest


def snapshot_read(snapshot: YearReviewSnapshot) -> YearReviewRead:
    return YearReviewRead(
        **snapshot.summary_json,
        snapshot_id=snapshot.id,
        generated_at=snapshot.generated_at,
        source="snapshot",
    )


def _metric_value(summary_json: dict[str, object], section: str, key: str) -> int | float | str:
    raw_metrics = summary_json.get(section)
    if not isinstance(raw_metrics, list):
        return 0
    for item in raw_metrics:
        if isinstance(item, dict) and item.get("key") == key:
            value = item.get("value")
            if isinstance(value, int | float | str):
                return value
    return 0


def build_year_review_share_card(snapshot: YearReviewSnapshot) -> YearReviewShareCardRead:
    record_days = _metric_value(snapshot.summary_json, "annual_stats", "record_days")
    longest_streak_days = _metric_value(snapshot.summary_json, "annual_stats", "longest_streak_days")
    achieved_badges = _metric_value(snapshot.summary_json, "annual_stats", "achieved_badges")
    highest_badge_level = _metric_value(snapshot.summary_json, "annual_stats", "highest_badge_level")
    metrics = [
        YearReviewMetric(key="record_days", label="記錄天數", value=record_days),
        YearReviewMetric(key="longest_streak_days", label="最長連續", value=longest_streak_days),
        YearReviewMetric(key="achieved_badges", label="達成徽章", value=achieved_badges),
        YearReviewMetric(key="highest_badge_level", label="最高級距", value=highest_badge_level),
    ]
    share_text = (
        f"我的 {snapshot.year} 糖錄錄年度回顧：記錄 {record_days} 天，"
        f"最長連續 {longest_streak_days} 天，達成 {achieved_badges} 枚徽章。"
    )
    return YearReviewShareCardRead(
        snapshot_id=snapshot.id,
        year=snapshot.year,
        title=f"{snapshot.year} 糖錄錄年度回顧",
        subtitle="持續記錄，累積看得見的健康習慣。",
        privacy_level="public_summary",
        privacy_mask_applied=True,
        external_share_enabled=False,
        metrics=metrics,
        share_text=share_text,
        card_style="annual_public_summary",
    )


def build_year_review_share_asset(snapshot: YearReviewSnapshot) -> YearReviewShareAssetRead:
    share_card = build_year_review_share_card(snapshot)
    metric_lines = [
        (metric.label, str(metric.value))
        for metric in share_card.metrics
    ]
    metric_svg = "\n".join(
        f'<text x="112" y="{540 + index * 84}" class="metric-label">{escape(label)}</text>'
        f'<text x="632" y="{540 + index * 84}" class="metric-value" text-anchor="end">{escape(value)}</text>'
        for index, (label, value) in enumerate(metric_lines)
    )
    svg_text = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" role="img" aria-label="{escape(share_card.title)}">
  <style>
    .bg {{ fill: #F6FBF8; }}
    .panel {{ fill: #FFFFFF; stroke: #D9E7DF; stroke-width: 3; }}
    .brand {{ fill: #2F8F72; font: 700 44px sans-serif; }}
    .title {{ fill: #1F3B2F; font: 800 64px sans-serif; }}
    .subtitle {{ fill: #557064; font: 500 34px sans-serif; }}
    .metric-label {{ fill: #557064; font: 500 36px sans-serif; }}
    .metric-value {{ fill: #1F3B2F; font: 800 52px sans-serif; }}
    .privacy {{ fill: #6B7F75; font: 500 28px sans-serif; }}
    .accent {{ fill: #D97706; }}
  </style>
  <rect class="bg" width="1080" height="1350" rx="0"/>
  <rect class="panel" x="52" y="72" width="976" height="1206" rx="44"/>
  <circle class="accent" cx="904" cy="176" r="52"/>
  <text x="72" y="160" class="brand">糖錄錄</text>
  <text x="72" y="248" class="title">{escape(share_card.title)}</text>
  <text x="72" y="336" class="subtitle">{escape(share_card.subtitle)}</text>
  <rect x="72" y="420" width="600" height="430" rx="32" fill="#EAF6F1"/>
  {metric_svg}
  <text x="72" y="1010" class="privacy">{escape(share_card.share_text)}</text>
  <text x="72" y="1080" class="privacy">已套用公開摘要隱私遮罩，不含血糖數值。</text>
  <text x="72" y="1160" class="privacy">外部分享需使用者確認後才可啟用。</text>
</svg>'''
    checksum = sha256(svg_text.encode("utf-8")).hexdigest()
    return YearReviewShareAssetRead(
        snapshot_id=snapshot.id,
        year=snapshot.year,
        asset_kind="svg_card",
        mime_type="image/svg+xml",
        filename=f"tanglulu-year-review-{snapshot.year}.svg",
        alt_text=f"{snapshot.year} 糖錄錄年度回顧公開摘要卡",
        privacy_level="public_summary",
        privacy_mask_applied=True,
        external_share_enabled=False,
        svg_text=svg_text,
        checksum_sha256=checksum,
    )


def build_year_review_share_package(
    snapshot: YearReviewSnapshot,
    share_package: YearReviewSharePackage,
) -> YearReviewSharePackageRead:
    share_card = build_year_review_share_card(snapshot)
    asset = build_year_review_share_asset(snapshot)
    return YearReviewSharePackageRead(
        share_package_id=share_package.id,
        snapshot_id=snapshot.id,
        year=snapshot.year,
        privacy_level="public_summary",
        privacy_mask_applied=True,
        external_share_enabled=True,
        status=cast(YearReviewSharePackageStatus, share_package.status),
        confirmed_at=share_package.confirmed_at,
        shared_at=share_package.shared_at,
        revoked_at=share_package.revoked_at,
        share_text=share_card.share_text,
        asset=asset,
    )


def create_year_review_share_package(snapshot: YearReviewSnapshot, db: Session) -> YearReviewSharePackage:
    share_card = build_year_review_share_card(snapshot)
    asset = build_year_review_share_asset(snapshot)
    share_package = YearReviewSharePackage(
        snapshot_id=snapshot.id,
        profile_id=snapshot.profile_id,
        year=snapshot.year,
        privacy_level="public_summary",
        asset_kind=asset.asset_kind,
        asset_checksum_sha256=asset.checksum_sha256,
        share_text=share_card.share_text,
        status="confirmed",
        confirmed_at=datetime.now(UTC),
    )
    db.add(share_package)
    db.flush()
    return share_package


def deterministic_year_review_ai_summary(
    *,
    year: int,
    record_day_count: int,
    glucose_count: int,
    average_glucose: float,
    has_records: bool,
) -> tuple[str, str]:
    observation = (
        f"{year} 年共記錄 {record_day_count} 天，血糖記錄 {glucose_count} 次，"
        f"年平均血糖 {average_glucose} mg/dL。"
    )
    encouragement = (
        "你已建立可回顧的年度健康資料，持續記錄會讓分析更穩定。"
        if has_records
        else "今年尚無可分析紀錄，開始記錄後年度回顧會自動累積成果。"
    )
    return observation, encouragement


def _bounded_year_review_ai_text(value: object) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()[:YEAR_REVIEW_AI_SUMMARY_TEXT_MAX_LENGTH]


def _read_bounded_year_review_ai_response_text(
    *,
    client: httpx.Client,
    parser_url: str,
    body: dict[str, object],
    headers: dict[str, str],
) -> str:
    chunks: list[str] = []
    total_chars = 0
    with client.stream("POST", parser_url, json=body, headers=headers) as response:
        response.raise_for_status()
        for chunk in response.iter_text():
            if not chunk:
                continue
            total_chars += len(chunk)
            if total_chars > YEAR_REVIEW_AI_RESPONSE_CHAR_BUDGET:
                raise ValueError("year_review_ai_response_too_large")
            chunks.append(chunk)
    return "".join(chunks)


def _extract_openai_compatible_message_content(payload: object) -> str:
    if not isinstance(payload, dict):
        return ""
    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        return ""
    message = first_choice.get("message")
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    return content if isinstance(content, str) else ""


def deepseek_year_review_ai_summary(
    *,
    year: int,
    annual_stats: list[YearReviewMetric],
    health_outcomes: list[YearReviewMetric],
) -> tuple[str, str] | None:
    settings = get_settings()
    if not settings.deepseek_parser_url or not settings.deepseek_api_key:
        return None

    aggregate_payload = {
        "year": year,
        "annual_stats": [metric.model_dump(mode="json") for metric in annual_stats],
        "health_outcomes": [metric.model_dump(mode="json") for metric in health_outcomes],
        "instructions": (
            "請整理年度重要觀察與年度鼓勵。只能使用上述聚合統計；不要輸出診斷、治療建議、"
            "raw records、個人識別資訊或額外欄位。"
        ),
    }
    body = {
        "model": settings.deepseek_model_id,
        "messages": [
            {"role": "system", "content": YEAR_REVIEW_AI_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(aggregate_payload, ensure_ascii=False)},
        ],
        "temperature": 0,
        "max_tokens": min(settings.local_llm_max_tokens, 240),
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    headers = {"Authorization": f"Bearer {settings.deepseek_api_key}"}
    try:
        with httpx.Client(timeout=settings.local_llm_timeout_seconds) as client:
            response_text = _read_bounded_year_review_ai_response_text(
                client=client,
                parser_url=settings.deepseek_parser_url,
                body=body,
                headers=headers,
            )
        response_payload = json.loads(response_text)
        content = _extract_openai_compatible_message_content(response_payload)
        summary_payload = json.loads(content)
    except (httpx.HTTPError, json.JSONDecodeError, ValueError):
        return None

    if not isinstance(summary_payload, dict):
        return None
    observation = _bounded_year_review_ai_text(summary_payload.get("important_observation"))
    encouragement = _bounded_year_review_ai_text(summary_payload.get("encouragement"))
    if not observation or not encouragement:
        return None
    return observation, encouragement


def build_year_review_summary(year: int, profile_id: UUID, db: Session) -> dict[str, object]:
    start = datetime(year, 1, 1, tzinfo=UTC)
    end = datetime(year + 1, 1, 1, tzinfo=UTC)
    records = list(
        db.scalars(
            select(Record).where(
                Record.profile_id == profile_id,
                Record.deleted_at.is_(None),
                Record.occurred_at >= start,
                Record.occurred_at < end,
            )
        )
    )

    record_days = {record.occurred_at.date() for record in records}
    glucose_records = [record for record in records if record.record_type == "glucose"]
    meal_count = sum(1 for record in records if record.record_type == "meal")
    exercise_count = sum(1 for record in records if record.record_type == "exercise")
    glucose_values = [
        value
        for record in glucose_records
        if (value := number_value(record.payload, "value")) is not None
    ]
    cumulative_counts = tuple(
        sum(1 for record in records if record.record_type == str(definition["record_type"]))
        for definition in ACHIEVEMENT_CATEGORY_DEFINITIONS
    )
    streak_counts = tuple(
        longest_streak(
            {
                record.occurred_at.date()
                for record in records
                if record.record_type == str(definition["record_type"])
            }
        )
        for definition in ACHIEVEMENT_CATEGORY_DEFINITIONS
    )
    persisted_unlocks = list(
        db.scalars(select(AchievementUnlock).where(AchievementUnlock.profile_id == profile_id))
    )
    average_glucose = round(sum(glucose_values) / len(glucose_values), 1) if glucose_values else 0
    highest_glucose = int(max(glucose_values)) if glucose_values else 0
    lowest_glucose = int(min(glucose_values)) if glucose_values else 0
    longest_streak_days = longest_streak(record_days)
    achieved_badges, highest_badge = achieved_badge_summary(
        cumulative_counts,
        streak_counts,
        persisted_unlocks,
    )

    annual_stats = [
        YearReviewMetric(key="record_days", label="本年度總記錄天數", value=len(record_days)),
        YearReviewMetric(key="glucose_count", label="本年度血糖記錄次數", value=len(glucose_records)),
        YearReviewMetric(key="meal_count", label="本年度飲食記錄次數", value=meal_count),
        YearReviewMetric(key="exercise_count", label="本年度運動記錄次數", value=exercise_count),
        YearReviewMetric(key="longest_streak_days", label="最長連續記錄天數", value=longest_streak_days),
        YearReviewMetric(key="achieved_badges", label="達成徽章數量", value=achieved_badges),
        YearReviewMetric(key="highest_badge_level", label="解鎖最高等級徽章", value=highest_badge),
    ]
    health_outcomes = [
        YearReviewMetric(key="average_glucose", label="年平均血糖", value=average_glucose),
        YearReviewMetric(key="highest_glucose", label="年度最高血糖", value=highest_glucose),
        YearReviewMetric(key="lowest_glucose", label="年度最低血糖", value=lowest_glucose),
    ]
    observation, encouragement = deepseek_year_review_ai_summary(
        year=year,
        annual_stats=annual_stats,
        health_outcomes=health_outcomes,
    ) or deterministic_year_review_ai_summary(
        year=year,
        record_day_count=len(record_days),
        glucose_count=len(glucose_records),
        average_glucose=average_glucose,
        has_records=bool(records),
    )
    review = YearReviewRead(
        year=year,
        generated_for_previous_year=True,
        generated_at=None,
        source="generated",
        annual_stats=annual_stats,
        health_outcomes=health_outcomes,
        ai_summary=[
            YearReviewObservation(kind="important_observation", text=observation),
            YearReviewObservation(kind="encouragement", text=encouragement),
        ],
    )
    return review.model_dump(mode="json", exclude={"snapshot_id", "generated_at", "source"})


def get_or_create_year_review_snapshot(
    *,
    year: int,
    profile_id: UUID,
    db: Session,
    actor_account_id: UUID | None,
) -> tuple[YearReviewSnapshot, bool]:
    existing_snapshot = db.scalar(
        select(YearReviewSnapshot).where(
            YearReviewSnapshot.profile_id == profile_id,
            YearReviewSnapshot.year == year,
        )
    )
    if existing_snapshot is not None:
        return existing_snapshot, False

    snapshot = YearReviewSnapshot(
        profile_id=profile_id,
        year=year,
        summary_json=build_year_review_summary(year, profile_id, db),
        generated_at=datetime.now(UTC),
    )
    db.add(snapshot)
    db.flush()
    write_audit_event(
        db,
        actor_account_id=actor_account_id,
        profile_id=profile_id,
        action="year_review.snapshot.created",
        resource_type="year_review_snapshot",
        resource_id=snapshot.id,
        metadata_json={"year": year},
    )
    return snapshot, True


def generate_missing_year_review_snapshots(
    *,
    year: int,
    db: Session,
    batch_size: int = YEAR_REVIEW_GENERATION_BATCH_SIZE,
) -> tuple[int, int]:
    validate_completed_year_review_year(year)
    if batch_size < 1:
        raise ValueError("batch_size must be positive")
    if batch_size > YEAR_REVIEW_GENERATION_BATCH_SIZE:
        raise ValueError("batch_size exceeds maximum")

    profile_ids = list(
        db.scalars(
            select(UserProfile.id)
            .where(
                ~exists().where(
                    YearReviewSnapshot.profile_id == UserProfile.id,
                    YearReviewSnapshot.year == year,
                )
            )
            .order_by(UserProfile.created_at.asc(), UserProfile.id.asc())
            .limit(batch_size)
        )
    )
    created_count = 0
    for profile_id in profile_ids:
        _, created = get_or_create_year_review_snapshot(
            year=year,
            profile_id=profile_id,
            db=db,
            actor_account_id=None,
        )
        if created:
            created_count += 1
    return created_count, len(profile_ids)
