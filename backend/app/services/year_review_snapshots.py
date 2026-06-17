from datetime import UTC, date, datetime
from hashlib import sha256
from html import escape
from typing import Literal, cast
from uuid import UUID

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.models import Record, UserProfile, YearReviewSharePackage, YearReviewSnapshot
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
YearReviewSharePackageStatus = Literal["confirmed", "opened", "dismissed", "revoked"]


def latest_completed_year(now: datetime | None = None) -> int:
    current = now or datetime.now(UTC)
    return current.year - 1


def validate_completed_year_review_year(year: int, now: datetime | None = None) -> int:
    completed_year = latest_completed_year(now)
    if year < 2000 or year > completed_year:
        raise ValueError("year_review_year_not_completed")
    return completed_year


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


def highest_unlocked_level(counts: tuple[int, ...]) -> int:
    best = 0
    for count in counts:
        for level in achievement_levels_for_progress(count):
            if count >= level:
                best = max(best, level)
    return best


def achieved_badge_count(counts: tuple[int, ...]) -> int:
    return sum(1 for count in counts for level in achievement_levels_for_progress(count) if count >= level)


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
    annual_badge_progress_counts = cumulative_counts + streak_counts
    average_glucose = round(sum(glucose_values) / len(glucose_values), 1) if glucose_values else 0
    highest_glucose = int(max(glucose_values)) if glucose_values else 0
    lowest_glucose = int(min(glucose_values)) if glucose_values else 0
    longest_streak_days = longest_streak(record_days)
    achieved_badges = achieved_badge_count(annual_badge_progress_counts)
    highest_badge = highest_unlocked_level(annual_badge_progress_counts)

    observation = (
        f"{year} 年共記錄 {len(record_days)} 天，血糖記錄 {len(glucose_records)} 次，"
        f"年平均血糖 {average_glucose} mg/dL。"
    )
    encouragement = (
        "你已建立可回顧的年度健康資料，持續記錄會讓分析更穩定。"
        if records
        else "今年尚無可分析紀錄，開始記錄後年度回顧會自動累積成果。"
    )
    review = YearReviewRead(
        year=year,
        generated_for_previous_year=True,
        generated_at=None,
        source="generated",
        annual_stats=[
            YearReviewMetric(key="record_days", label="本年度總記錄天數", value=len(record_days)),
            YearReviewMetric(key="glucose_count", label="本年度血糖記錄次數", value=len(glucose_records)),
            YearReviewMetric(key="meal_count", label="本年度飲食記錄次數", value=meal_count),
            YearReviewMetric(key="exercise_count", label="本年度運動記錄次數", value=exercise_count),
            YearReviewMetric(key="longest_streak_days", label="最長連續記錄天數", value=longest_streak_days),
            YearReviewMetric(key="achieved_badges", label="達成徽章數量", value=achieved_badges),
            YearReviewMetric(key="highest_badge_level", label="解鎖最高等級徽章", value=highest_badge),
        ],
        health_outcomes=[
            YearReviewMetric(key="average_glucose", label="年平均血糖", value=average_glucose),
            YearReviewMetric(key="highest_glucose", label="年度最高血糖", value=highest_glucose),
            YearReviewMetric(key="lowest_glucose", label="年度最低血糖", value=lowest_glucose),
        ],
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
