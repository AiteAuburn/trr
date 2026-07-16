#!/usr/bin/env python3
"""Verify mobile navigation stays aligned with the UI route contract."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = REPO_ROOT / "mobile" / "App.tsx"
API_CLIENT_PATH = REPO_ROOT / "mobile" / "apiClient.ts"
APP_TYPES_PATH = REPO_ROOT / "mobile" / "appTypes.ts"
APP_RUNTIME_CONFIG_PATH = REPO_ROOT / "mobile" / "appRuntimeConfig.ts"
NAVIGATION_CONFIG_PATH = REPO_ROOT / "mobile" / "navigationConfig.ts"
RECORD_DISPLAY_PATH = REPO_ROOT / "mobile" / "recordDisplay.ts"
RECORD_EDIT_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "recordEditTransforms.ts"
RECORD_BOUNDS_PATH = REPO_ROOT / "mobile" / "recordBounds.ts"
RECORD_SAVE_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "recordSaveTransforms.ts"
DAILY_TRANSCRIPT_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "dailyTranscriptTransforms.ts"
RECORDING_COPY_PATH = REPO_ROOT / "mobile" / "recordingCopy.ts"
RECORD_WORKFLOW_COPY_PATH = REPO_ROOT / "mobile" / "recordWorkflowCopy.ts"
RECORD_STATUS_COPY_PATH = REPO_ROOT / "mobile" / "recordStatusCopy.ts"
REPORT_STATUS_COPY_PATH = REPO_ROOT / "mobile" / "reportStatusCopy.ts"
NATIVE_STATUS_COPY_PATH = REPO_ROOT / "mobile" / "nativeStatusCopy.ts"
FIRST_VERSION_FLOW_COPY_PATH = REPO_ROOT / "mobile" / "firstVersionFlowCopy.ts"
HISTORY_COPY_PATH = REPO_ROOT / "mobile" / "historyCopy.ts"
HISTORY_SCREEN_DATA_PATH = REPO_ROOT / "mobile" / "historyScreenData.ts"
ANALYSIS_COPY_PATH = REPO_ROOT / "mobile" / "analysisCopy.ts"
ANALYSIS_DATA_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "analysisDataTransforms.ts"
ANALYSIS_METRIC_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "analysisMetricTransforms.ts"
ANALYSIS_SCREEN_DATA_PATH = REPO_ROOT / "mobile" / "analysisScreenData.ts"
SETTINGS_COPY_PATH = REPO_ROOT / "mobile" / "settingsCopy.ts"
SETTINGS_SCREEN_DATA_PATH = REPO_ROOT / "mobile" / "settingsScreenData.ts"
SETTINGS_CHOICE_DISPLAY_PATH = REPO_ROOT / "mobile" / "settingsChoiceDisplay.ts"
MODEL_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "modelTransforms.ts"
SUBSCRIPTION_COPY_PATH = REPO_ROOT / "mobile" / "subscriptionCopy.ts"
SUBSCRIPTION_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "subscriptionTransforms.ts"
ACCOUNT_COPY_PATH = REPO_ROOT / "mobile" / "accountCopy.ts"
ACCOUNT_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "accountTransforms.ts"
AI_MODEL_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "aiModelTransforms.ts"
AUTH_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "authTransforms.ts"
AUTH_REQUEST_HEADERS_PATH = REPO_ROOT / "mobile" / "authRequestHeaders.ts"
AUTH_SESSION_DISPLAY_PATH = REPO_ROOT / "mobile" / "authSessionDisplay.ts"
AUTH_STATUS_COPY_PATH = REPO_ROOT / "mobile" / "authStatusCopy.ts"
SHARED_DISPLAY_ITEMS_PATH = REPO_ROOT / "mobile" / "sharedDisplayItems.ts"
FUTURE_MODULE_DISPLAY_PATH = REPO_ROOT / "mobile" / "futureModuleDisplay.ts"
YEAR_REVIEW_SHARE_FILE_PATH = REPO_ROOT / "mobile" / "yearReviewShareFile.ts"
DAILY_RECORD_DETAIL_ROW_PATH = REPO_ROOT / "mobile" / "dailyRecordDetailRow.tsx"
DELETE_CONFIRM_PREVIEW_BLOCK_PATH = REPO_ROOT / "mobile" / "deleteConfirmPreviewBlock.tsx"
HISTORY_CALENDAR_MONTH_PICKER_PATH = REPO_ROOT / "mobile" / "historyCalendarMonthPicker.tsx"
HISTORY_DAILY_RECORD_SECTION_CARD_PATH = REPO_ROOT / "mobile" / "historyDailyRecordSectionCard.tsx"
HISTORY_DAILY_SUMMARY_CARD_PATH = REPO_ROOT / "mobile" / "historyDailySummaryCard.tsx"
HISTORY_DAILY_SUMMARY_TABLE_PATH = REPO_ROOT / "mobile" / "historyDailySummaryTable.tsx"
HISTORY_DETAIL_MODE_TABS_PATH = REPO_ROOT / "mobile" / "historyDetailModeTabs.tsx"
HISTORY_INTRO_STATUS_BLOCKS_PATH = REPO_ROOT / "mobile" / "historyIntroStatusBlocks.tsx"
HISTORY_NO_RANGE_RECORDS_CARD_PATH = REPO_ROOT / "mobile" / "historyNoRangeRecordsCard.tsx"
HISTORY_NO_RECORD_STATUS_BLOCK_PATH = REPO_ROOT / "mobile" / "historyNoRecordStatusBlock.tsx"
HISTORY_RAW_TRANSCRIPT_CARD_PATH = REPO_ROOT / "mobile" / "historyRawTranscriptCard.tsx"
HISTORY_SELECTED_DATE_HEADER_PATH = REPO_ROOT / "mobile" / "historySelectedDateHeader.tsx"
HISTORY_SELECTED_DATE_PANEL_PATH = REPO_ROOT / "mobile" / "historySelectedDatePanel.tsx"
HISTORY_SELECTED_SUMMARY_CARD_PATH = REPO_ROOT / "mobile" / "historySelectedSummaryCard.tsx"
HISTORY_SYNC_BOUNDARY_BLOCK_PATH = REPO_ROOT / "mobile" / "historySyncBoundaryBlock.tsx"
FIELD_LABEL_PATH = REPO_ROOT / "mobile" / "fieldLabel.tsx"
DETAIL_ROW_PATH = REPO_ROOT / "mobile" / "detailRow.tsx"
HIGHLIGHT_BULLET_ROW_PATH = REPO_ROOT / "mobile" / "highlightBulletRow.tsx"
HIGHLIGHT_DETAIL_ROW_PATH = REPO_ROOT / "mobile" / "highlightDetailRow.tsx"
MANUAL_RECORD_CREATE_PREVIEW_ACTION_PATH = REPO_ROOT / "mobile" / "manualRecordCreatePreviewAction.tsx"
MANUAL_RECORD_CONFIRM_FOOTER_ACTIONS_PATH = REPO_ROOT / "mobile" / "manualRecordConfirmFooterActions.tsx"
MANUAL_RECORD_CONFIRM_PREVIEW_BLOCK_PATH = REPO_ROOT / "mobile" / "manualRecordConfirmPreviewBlock.tsx"
MANUAL_RECORD_DATE_TIME_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordDateTimeFields.tsx"
MANUAL_RECORD_EXERCISE_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordExerciseFields.tsx"
MANUAL_RECORD_GLUCOSE_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordGlucoseFields.tsx"
MANUAL_RECORD_HEADER_INTRO_PATH = REPO_ROOT / "mobile" / "manualRecordHeaderIntro.tsx"
MANUAL_RECORD_MEAL_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordMealFields.tsx"
MANUAL_RECORD_MEDICATION_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordMedicationFields.tsx"
MANUAL_RECORD_NOTE_FIELDS_PATH = REPO_ROOT / "mobile" / "manualRecordNoteFields.tsx"
MANUAL_RECORD_TYPE_SELECTOR_PATH = REPO_ROOT / "mobile" / "manualRecordTypeSelector.tsx"
METRIC_CARD_PATH = REPO_ROOT / "mobile" / "metricCard.tsx"
RECORD_DETAIL_ACTION_PANEL_PATH = REPO_ROOT / "mobile" / "recordDetailActionPanel.tsx"
RECORD_DETAIL_INFO_PANEL_PATH = REPO_ROOT / "mobile" / "recordDetailInfoPanel.tsx"
RECORD_EDIT_FOOTER_ACTIONS_PATH = REPO_ROOT / "mobile" / "recordEditFooterActions.tsx"
RECORD_EDIT_HEADER_FIELDS_PATH = REPO_ROOT / "mobile" / "recordEditHeaderFields.tsx"
DATE_TIME_TRANSFORMS_PATH = REPO_ROOT / "mobile" / "dateTimeTransforms.ts"
MOBILE_BOUNDS_PATH = REPO_ROOT / "mobile" / "mobileBounds.ts"
README_PATH = REPO_ROOT / "README.md"
ACHIEVEMENTS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "achievements.py"
ACHIEVEMENT_CATALOG_PATH = REPO_ROOT / "backend" / "app" / "services" / "achievement_catalog.py"
YEAR_REVIEW_SNAPSHOTS_PATH = REPO_ROOT / "backend" / "app" / "services" / "year_review_snapshots.py"
YEAR_REVIEWS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "year_reviews.py"
COMMUNITY_SCHEMA_PATH = REPO_ROOT / "backend" / "app" / "schemas" / "community.py"
COMMUNITY_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "community.py"
STORE_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "store.py"
DEV_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "dev.py"
DAILY_RECORDS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "daily_records.py"
DAILY_RECORD_SCHEMA_PATH = REPO_ROOT / "backend" / "app" / "schemas" / "daily_record.py"
DAILY_RECORD_MODEL_PATH = REPO_ROOT / "backend" / "app" / "models" / "daily_record.py"
DAILY_RECORD_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0030_daily_records.py"
)
DAILY_RECORD_TEST_PATH = REPO_ROOT / "backend" / "tests" / "test_daily_records.py"
COMMUNITY_MODEL_PATH = REPO_ROOT / "backend" / "app" / "models" / "community.py"
COMMUNITY_FOOD_INDEX_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0024_community_food_lookup_indexes.py"
)
COMMUNITY_FOOD_LATEST_INDEX_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0025_community_food_share_latest_index.py"
)
COMMUNITY_LEADERBOARD_INDEX_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0026_community_leaderboard_indexes.py"
)
STORE_REDEMPTION_INDEX_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0027_store_redemption_wallet_index.py"
)
YEAR_REVIEW_SHARE_CONSTRAINT_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0028_year_review_share_package_constraints.py"
)
COMMUNITY_POINT_LEDGER_SOURCE_MIGRATION_PATH = (
    REPO_ROOT / "backend" / "alembic" / "versions" / "20260430_0029_community_point_ledger_source_unique.py"
)
REPORTS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "reports.py"
REPORTING_SERVICE_PATH = REPO_ROOT / "backend" / "app" / "services" / "reporting.py"
REPORTS_TEST_PATH = REPO_ROOT / "backend" / "tests" / "test_reports.py"
COMMUNITY_STORE_YEAR_REVIEW_TEST_PATH = REPO_ROOT / "backend" / "tests" / "test_community_store_year_review.py"

EXPECTED_MENU_DESTINATIONS = {
    "today",
    "history",
    "analysis",
    "settings",
}

EXPECTED_MENU_LABELS = {
    "today": "今日錄音",
    "history": "歷史紀錄",
    "analysis": "基本分析",
    "settings": "設定",
}

EXPECTED_FUTURE_TARGETS = {
    "doctorShare",
    "healthIntegration",
    "community",
    "ranking",
    "store",
    "foodPhoto",
}

EXPECTED_MENU_BACK_TARGETS = {
    "subscription",
    "tutorial",
    "achievements",
    "yearReview",
    "store",
    "settings",
    "foodPhoto",
}

EXPECTED_PREVIEW_RETURN_CTA_SCREENS = {
    "achievements",
    "yearReview",
    "store",
    "foodPhoto",
}

EXPECTED_ACHIEVEMENT_LEVELS = (10, 50, 100, 150, 200, 250)
EXPECTED_ACHIEVEMENT_CATEGORIES = (
    ("glucose", "血糖記錄", "glucose", "血"),
    ("meal", "飲食記錄", "meal", "食"),
    ("exercise", "運動記錄", "exercise", "動"),
)

EXPECTED_FOOD_COMMUNITY_CATEGORIES = (
    ("vegetable", "vegetables", "蔬菜"),
    ("meat", "meat", "肉類"),
    ("seafood", "seafood", "海鮮"),
    ("egg", "eggs", "蛋類"),
    ("bean", "beans", "豆類"),
    ("starch", "starches", "澱粉類"),
    ("drink", "drinks", "飲料"),
    ("fruit", "fruit", "水果"),
    ("snack", "snacks", "零食"),
    ("supplement", "supplements", "保健食品"),
)

MIN_TOUCH_TARGET_STYLE_RULES = {
    "menuButton": ("height", 44),
    "tabPill": ("minHeight", 44),
    "chip": ("minHeight", 44),
    "accountCard": ("minHeight", 64),
    "aiReviewCard": ("minHeight", 64),
    "primaryButton": ("minHeight", 44),
    "primaryButtonFull": ("minHeight", 44),
    "secondaryButton": ("minHeight", 44),
    "dangerButton": ("minHeight", 44),
    "historyItemButton": ("minHeight", 64),
    "lineChartPointColumn": ("minWidth", 44),
    "menuCard": ("minHeight", 64),
    "postSaveCard": ("minHeight", 64),
    "recordCard": ("minHeight", 64),
    "recordHoldButton": ("height", 44),
    "settingsRow": ("minHeight", 44),
    "segmentPill": ("minHeight", 44),
    "timelineCard": ("minHeight", 64),
    "uploadBox": ("minHeight", 64),
    "moreButton": ("minHeight", 44),
    "quickEntryItem": ("minHeight", 44),
    "closeButton": ("height", 44),
    "roundActionButton": ("height", 44),
}

MIN_TOUCH_TARGET_WIDTH_STYLE_RULES = {
    "menuButton": 44,
    "closeButton": 44,
    "roundActionButton": 44,
}

READABILITY_STYLE_RULES = {
    "sectionHeader": ("flexWrap", '"wrap"'),
    "recordHeader": ("flexWrap", '"wrap"'),
    "quotaStatsRow": ("flexWrap", '"wrap"'),
    "comparisonRow": ("flexWrap", '"wrap"'),
    "recordContent": ("flexShrink", "1"),
    "evidence": ("flexShrink", "1"),
}

MULTILINE_TEXT_INPUT_STYLE_RULES = {
    "homeTranscriptInput": 96,
    "transcriptInput": 160,
    "transcriptReviewInput": 240,
    "jsonInput": 160,
    "multilineField": 88,
}

MAX_TEXT_INPUT_PLACEHOLDER_LENGTH = 60
MAX_TEXT_INPUT_ACCESSIBILITY_LABEL_LENGTH = 80


def _match_block(content: str, pattern: str, name: str) -> str:
    match = re.search(pattern, content, flags=re.DOTALL | re.MULTILINE)
    if match is None:
        raise AssertionError(f"Could not find {name}.")
    return match.group(1)


def _screen_union(content: str) -> set[str]:
    block = _match_block(content, r"type AppScreen =([\s\S]*?);", "AppScreen union")
    return set(re.findall(r'\|\s+"([^"]+)"', block))


def _screen_chrome_keys(content: str) -> set[str]:
    keys = set(re.findall(r"^\s+([A-Za-z][A-Za-z0-9]*): \{ subtitle:", content, flags=re.MULTILINE))
    if not keys:
        raise AssertionError("Could not find screenChrome keys.")
    return keys


def _menu_destinations(content: str) -> set[str]:
    block = _match_block(
        content,
        r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];",
        "menuScreens",
    )
    return set(re.findall(r'id: "([^"]+)"', block))


def _menu_labels(content: str) -> dict[str, str]:
    block = _match_block(
        content,
        r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];",
        "menuScreens",
    )
    return {
        screen_id: label
        for screen_id, label in re.findall(r'id: "([^"]+)", label: "([^"]+)"', block)
    }


def _future_targets(content: str) -> set[str]:
    block = _match_block(
        content,
        r"export const futureModuleCards:[\s\S]*?= \[([\s\S]*?)\];",
        "futureModuleCards",
    )
    return set(re.findall(r'target: "([^"]+)"', block))


def _current_screen_checks(content: str) -> set[str]:
    return set(re.findall(r'currentScreen === "([^"]+)"', content))


def _style_block(content: str, style_name: str) -> str:
    pattern = rf"^\s+{re.escape(style_name)}: \{{([\s\S]*?)^\s+\}},?"
    return _match_block(content, pattern, f"{style_name} style")


def _today_home_render_block(content: str) -> str:
    return _match_block(
        content,
        r'\{currentScreen === "today" \? \(\s*([\s\S]*?)\s*\) : null\}\n\n\s*\{currentScreen === "record" \?',
        "Today minimal home render block",
    )


def _history_render_block(content: str) -> str:
    return _match_block(
        content,
        r'\{currentScreen === "history" \? \(\s*([\s\S]*?)\s*\) : null\}\n\n\s*\{currentScreen === "analysis" \?',
        "History render block",
    )


def _function_block(content: str, function_name: str) -> str:
    return _match_block(
        content,
        rf"function {re.escape(function_name)}[^\n]*\{{([\s\S]*?)\n\}}",
        f"{function_name} function block",
    )


def _verify_achievement_contract(content: str, future_module_display_content: str) -> None:
    readme_content = README_PATH.read_text(encoding="utf-8")
    backend_content = ACHIEVEMENTS_API_PATH.read_text(encoding="utf-8")
    catalog_content = ACHIEVEMENT_CATALOG_PATH.read_text(encoding="utf-8")
    year_review_content = YEAR_REVIEW_SNAPSHOTS_PATH.read_text(encoding="utf-8")
    mobile_level_marker = f"export const achievementLevels = [{', '.join(str(level) for level in EXPECTED_ACHIEVEMENT_LEVELS)}];"
    catalog_level_marker = f"ACHIEVEMENT_LEVELS = ({', '.join(str(level) for level in EXPECTED_ACHIEVEMENT_LEVELS)})"
    _assert_contains("mobile achievement levels", future_module_display_content, mobile_level_marker)
    _assert_contains("backend shared achievement levels", catalog_content, catalog_level_marker)
    _assert_contains("backend achievement catalog import", backend_content, "from app.services.achievement_catalog import (")
    _assert_contains(
        "year review achievement catalog import",
        year_review_content,
        "from app.services.achievement_catalog import ACHIEVEMENT_CATEGORY_DEFINITIONS, achievement_levels_for_progress",
    )
    _assert_contains("year review persisted unlock model import", year_review_content, "AchievementUnlock")
    _assert_not_contains("year review local achievement levels", year_review_content, catalog_level_marker)
    _assert_not_contains("achievement api local achievement levels", backend_content, catalog_level_marker)
    for label, marker in (
        ("year review cumulative badge counts", "cumulative_counts = tuple("),
        ("year review streak badge counts", "streak_counts = tuple("),
        ("year review achieved badge summary helper", "def achieved_badge_summary("),
        ("year review dynamic cumulative badge levels", "achievement_levels_for_progress(cumulative_count)"),
        ("year review dynamic streak badge levels", "achievement_levels_for_progress(streak_count)"),
        ("year review persisted unlock query", "select(AchievementUnlock).where(AchievementUnlock.profile_id == profile_id)"),
        ("year review achieved badge source", "achieved_badges, highest_badge = achieved_badge_summary("),
        ("year review glucose bool guard", "if isinstance(value, bool):"),
        ("year review glucose numeric string parsing", "return float(value.strip())"),
        ("year review DeepSeek summary helper", "def deepseek_year_review_ai_summary("),
        ("year review DeepSeek system prompt", "YEAR_REVIEW_AI_SYSTEM_PROMPT = ("),
        ("year review DeepSeek aggregate payload", '"annual_stats": [metric.model_dump(mode="json") for metric in annual_stats]'),
        ("year review DeepSeek health outcomes payload", '"health_outcomes": [metric.model_dump(mode="json") for metric in health_outcomes]'),
        ("year review DeepSeek JSON response format", '"response_format": {"type": "json_object"}'),
        ("year review deterministic fallback helper", "def deterministic_year_review_ai_summary("),
        ("README Year Review DeepSeek prompt documented", "你是糖錄錄年度回顧摘要助手。只根據使用者提供的年度聚合統計撰寫繁體中文回顧"),
        ("README Year Review DeepSeek prompt analysis", "Year Review prompt 分析："),
        ("README Year Review DeepSeek aggregate-only analysis", "DeepSeek 不會收到 raw records、food items、profile id、occurred_at、raw transcript、raw prompt 或 raw model output"),
        ("README Year Review DeepSeek fallback analysis", "DeepSeek 未設定、HTTP 失敗、回應過大、JSON 無效或缺欄位時，backend 會回到 deterministic fallback"),
    ):
        target_content = readme_content if label.startswith("README ") else year_review_content
        _assert_contains(label, target_content, marker)

    for category, label, record_type, icon in EXPECTED_ACHIEVEMENT_CATEGORIES:
        _assert_contains(
            f"mobile achievement category {category}",
            future_module_display_content,
            f'{{ id: "{category}", label: "{label}", recordType: "{record_type}", cumulativeIcon: "{icon}",',
        )
        _assert_contains(f"backend achievement category {category}", catalog_content, f'"id": "{category}"')
        _assert_contains(f"backend achievement label {category}", catalog_content, f'"label": "{label}"')
        _assert_contains(f"backend achievement record type {category}", catalog_content, f'"record_type": "{record_type}"')
        _assert_contains(f"backend achievement icon {category}", catalog_content, f'"cumulative_icon": "{icon}"')
        _assert_contains(
            f"mobile cumulative id {category}",
            future_module_display_content,
            f'id: `${{definition.id}}-cumulative-${{level}}`',
        )
        _assert_contains(
            f"mobile streak id {category}",
            future_module_display_content,
            f'id: `${{definition.id}}-streak-${{level}}`',
        )

    for label, marker in (
        ("mobile local achievement item helper", "export function localAchievementItemsForDefinition("),
        ("mobile cumulative kind", 'kind: "cumulative"'),
        ("mobile cumulative label", 'kindLabel: "累積型"'),
        ("mobile cumulative shared category icon", "icon: definition.cumulativeIcon"),
        ("mobile cumulative level color", "const badgeColor = achievementLevelColors[levelIndex] ?? definition.cumulativeColor"),
        ("mobile local achievement records helper", "export function localAchievementItemsForRecords(records: RecordItem[]): AchievementItem[]"),
        ("mobile local achievement max record count", "const maxObservedRecords = records.length;"),
        ("mobile local achievement max streak", "const maxObservedStreak = Math.max("),
        ("mobile local achievement dynamic levels binding", "const dynamicLevels = achievementDynamicLevels(maxObservedRecords, maxObservedStreak);"),
        ("mobile local achievement cumulative progress", "const cumulativeProgress = records.filter((record) => record.record_type === definition.recordType).length;"),
        ("mobile local achievement streak progress", "const streakProgress = currentRecordTypeStreakDays(records, definition.recordType);"),
        ("mobile local achievement item helper binding", "localAchievementItemsForDefinition(definition, dynamicLevels, cumulativeProgress, streakProgress)"),
        ("mobile local achievement records helper binding", "localAchievementItemsForRecords(recordsForDisplay)"),
        ("mobile streak kind", 'kind: "streak"'),
        ("mobile streak label", 'kindLabel: "連續型"'),
        ("mobile streak independent icon", 'icon: "連"'),
        ("mobile streak independent style", 'displayItem.kind === "streak" ? styles.achievementBadgeStreak : null'),
        ("mobile badge level number", "{achievementUnlockedCardLevel(displayItem)}"),
        ("backend cumulative kind", 'kind="cumulative"'),
        ("backend cumulative label", 'kind_label="累積型"'),
        ("backend cumulative shared category icon", 'icon=str(definition["cumulative_icon"])'),
        ("backend cumulative level color", "badge_color=badge_color"),
        ("backend dynamic achievement levels", "levels = achievement_levels_for_progress(max_progress)"),
        ("backend persisted unlock level helper", "def _max_persisted_unlock_level(unlocks: dict[str, AchievementUnlock]) -> int:"),
        ("backend summary includes persisted unlock levels", "max_progress = max(max_progress, _max_persisted_unlock_level(unlocks_by_id))"),
        ("backend unlock history includes persisted unlock levels", "levels = achievement_levels_for_progress(max(max_progress, _max_persisted_unlock_level(unlocks_by_id)))"),
        ("backend streak kind", 'kind="streak"'),
        ("backend streak label", 'kind_label="連續型"'),
        ("backend streak independent icon", 'icon="連"'),
        ("backend streak independent color", "badge_color=ACHIEVEMENT_STREAK_BADGE_COLOR"),
    ):
        if label.startswith("backend"):
            haystack = backend_content
        elif label in {
            "mobile local achievement records helper binding",
            "mobile streak independent style",
            "mobile badge level number",
        }:
            haystack = content
        else:
            haystack = future_module_display_content
        _assert_contains(label, haystack, marker)
    tests_content = COMMUNITY_STORE_YEAR_REVIEW_TEST_PATH.read_text(encoding="utf-8")
    _assert_contains(
        "achievement persisted extended unlock regression",
        tests_content,
        "test_achievement_persisted_unlocks_keep_extended_levels_without_active_records",
    )
    _assert_contains(
        "year review persisted unlock regression",
        tests_content,
        "test_year_review_includes_persisted_achievement_unlocks_after_active_progress_drops",
    )
    _assert_contains(
        "year review DeepSeek bounded summary regression",
        tests_content,
        "test_year_review_uses_deepseek_for_bounded_ai_summary_when_configured",
    )
    for label, marker in (
        ("year review DeepSeek aggregate prompt parsed", "aggregate_payload = json.loads(aggregate_prompt)"),
        ("year review DeepSeek aggregate prompt exact keys", 'assert set(aggregate_payload) == {"year", "annual_stats", "health_outcomes", "instructions"}'),
        ("year review DeepSeek instructions aggregate-only", 'assert "只能使用上述聚合統計" in aggregate_payload["instructions"]'),
        ("year review DeepSeek raw records instruction", 'assert "raw records" in aggregate_payload["instructions"]'),
        ("year review DeepSeek no raw transcript prompt", 'assert "raw_transcript" not in aggregate_prompt'),
        ("year review DeepSeek no raw prompt", 'assert "raw prompt" not in aggregate_prompt'),
        ("year review DeepSeek no raw model output", 'assert "raw model output" not in aggregate_prompt'),
    ):
        _assert_contains(label, tests_content, marker)


def _verify_food_community_category_contract(content: str, future_module_display_content: str) -> None:
    backend_content = COMMUNITY_SCHEMA_PATH.read_text(encoding="utf-8")
    backend_api_content = COMMUNITY_API_PATH.read_text(encoding="utf-8")
    backend_store_content = STORE_API_PATH.read_text(encoding="utf-8")
    backend_model_content = COMMUNITY_MODEL_PATH.read_text(encoding="utf-8")
    backend_index_migration_content = COMMUNITY_FOOD_INDEX_MIGRATION_PATH.read_text(encoding="utf-8")
    backend_latest_index_migration_content = COMMUNITY_FOOD_LATEST_INDEX_MIGRATION_PATH.read_text(encoding="utf-8")
    backend_leaderboard_index_migration_content = COMMUNITY_LEADERBOARD_INDEX_MIGRATION_PATH.read_text(encoding="utf-8")
    backend_store_index_migration_content = STORE_REDEMPTION_INDEX_MIGRATION_PATH.read_text(encoding="utf-8")
    backend_point_ledger_source_migration_content = COMMUNITY_POINT_LEDGER_SOURCE_MIGRATION_PATH.read_text(encoding="utf-8")
    food_item_model_block = _match_block(
        backend_model_content,
        r"class FoodItem\(Base\):([\s\S]*?)\n\nclass FoodShare",
        "FoodItem model block",
    )
    store_redemption_model_block = _match_block(
        backend_model_content,
        r"class StoreRedemption\(Base\):([\s\S]*?)\Z",
        "StoreRedemption model block",
    )
    _assert_contains(
        "food community mobile fallback categories",
        future_module_display_content,
        "export const foodCommunityCategories: Array<{ id: FoodCommunityCategory; label: string }> = [",
    )
    _assert_contains("food community backend labels", backend_content, "FOOD_CATEGORY_LABELS: dict[FoodCategory, str] = {")
    _assert_contains("food community category count schema", backend_content, "food_count: int = Field(default=0, ge=0, le=1_000_000)")
    _assert_contains("food community category sample schema", backend_content, "sample_foods: list[str] = Field(default_factory=list, max_length=3)")
    _assert_contains("food community api-to-mobile mapper", future_module_display_content, "export function mobileFoodCategoryFromApi(value: string)")
    _assert_contains("food community mobile-to-api mapper", future_module_display_content, "export function apiFoodCategoryFromMobile(value: FoodCommunityCategory)")
    _assert_contains(
        "food community mobile individual food items",
        future_module_display_content,
        "export const foodCommunityItems: FoodCommunityItem[] = [",
    )
    _assert_contains("food community category count response", backend_api_content, "select(FoodItem.category, func.count(FoodItem.id)).group_by(FoodItem.category)")
    _assert_contains("food community category sample response", backend_api_content, "sample_foods=sample_foods_by_category.get(code, [])")
    _assert_contains("food community mobile category count state", content, "foodCount: clampNumber(category.food_count ?? 0, 0, maxMobileCountValue)")
    _assert_contains("food community mobile category samples state", content, "sampleFoods: (category.sample_foods ?? [])")
    _assert_contains("food community category summary render", content, "{foodCommunityCategorySummary(selectedFoodCommunityCategoryDisplay)}")
    _assert_contains(
        "food community detail newest eaten share ordering",
        backend_api_content,
        ".order_by(FoodShare.eaten_at.desc(), FoodShare.created_at.desc(), FoodShare.id.desc())",
    )
    for label, marker in (
        ("food community reject client glucose delta dependency", "async def reject_client_supplied_glucose_delta(request: Request) -> None:"),
        ("food community client delta structured error code", '"code": "food_glucose_delta_client_supplied"'),
        ("food community client delta structured error message", '"message": "glucose_delta is calculated by the server and must not be supplied."'),
        ("food community client delta dependency binding", "_: None = Depends(reject_client_supplied_glucose_delta),"),
        ("food community server calculated glucose delta", "glucose_delta=payload.after_glucose - payload.before_glucose"),
        ("community leaderboard public account id masked", "CommunityLeaderboardEntry(account_id=None, display_name=display_name, score=int(score or 0))"),
        ("community leaderboard opt-in only", "CommunityPublicProfile.leaderboard_opt_in.is_(True)"),
        ("food community batched list stats helper", "def _food_stats_for_items(db: Session, food_item_ids: list[UUID]) -> dict[UUID, FoodStatsRead]:"),
        ("food community batched list stats grouping", ".group_by(FoodShare.food_item_id)"),
        ("food community list uses batched stats", "stats_by_food_id = _food_stats_for_items(db, [item.id for item in items])"),
    ):
        _assert_contains(label, backend_api_content, marker)
    for label, marker in (
        ("food item normalized name ORM index", 'Index("ix_food_items_normalized_name", "normalized_name")'),
        (
            "food share latest detail ORM index",
            'Index("ix_food_shares_food_item_eaten_created_id", "food_item_id", "eaten_at", "created_at", "id")',
        ),
        (
            "food share leaderboard ORM index",
            'Index("ix_food_shares_account_food_item", "account_id", "food_item_id")',
        ),
        (
            "community point leaderboard ORM index",
            'Index("ix_community_point_ledger_account_delta", "account_id", "delta")',
        ),
        (
            "community point ledger source ORM uniqueness",
            'UniqueConstraint("source_type", "source_id", name="uq_community_point_ledger_source")',
        ),
        (
            "community profile leaderboard ORM index",
            'Index("ix_community_public_profiles_opt_in_display", "leaderboard_opt_in", "display_name", "account_id")',
        ),
    ):
        _assert_contains(label, backend_model_content, marker)
    _assert_contains(
        "store redemption wallet ORM index on StoreRedemption",
        store_redemption_model_block,
        'Index("ix_store_redemptions_account_created_id", "account_id", "created_at", "id")',
    )
    if 'Index("ix_store_redemptions_account_created_id", "account_id", "created_at", "id")' in food_item_model_block:
        raise AssertionError("store redemption wallet ORM index must not be declared on FoodItem.")
    for label, marker in (
        ("food item normalized name migration index", 'op.create_index("ix_food_items_normalized_name", "food_items", ["normalized_name"])'),
    ):
        _assert_contains(label, backend_index_migration_content, marker)
    for label, marker in (
        ("food share previous latest detail migration drop", 'op.drop_index("ix_food_shares_food_item_eaten_created", table_name="food_shares")'),
        ("food share latest detail migration index", '"ix_food_shares_food_item_eaten_created_id"'),
        ("food share latest detail migration columns", '["food_item_id", "eaten_at", "created_at", "id"]'),
    ):
        _assert_contains(label, backend_latest_index_migration_content, marker)
    for label, marker in (
        ("food share leaderboard migration index", '"ix_food_shares_account_food_item"'),
        ("food share leaderboard migration columns", '["account_id", "food_item_id"]'),
        ("community point leaderboard migration index", '"ix_community_point_ledger_account_delta"'),
        ("community point leaderboard migration columns", '["account_id", "delta"]'),
        ("community profile leaderboard migration index", '"ix_community_public_profiles_opt_in_display"'),
        ("community profile leaderboard migration columns", '["leaderboard_opt_in", "display_name", "account_id"]'),
    ):
        _assert_contains(label, backend_leaderboard_index_migration_content, marker)
    for label, marker in (
        ("store points balance conditional earned aggregate", "case((CommunityPointLedger.delta > 0, CommunityPointLedger.delta), else_=0)"),
        ("store points balance conditional redeemed aggregate", "case((CommunityPointLedger.delta < 0, -CommunityPointLedger.delta), else_=0)"),
        ("store points balance account scoped query", ".where(CommunityPointLedger.account_id == account_id)"),
        ("store points balance single aggregate result", ").one()"),
    ):
        _assert_contains(label, backend_store_content, marker)
    for label, marker in (
        ("store redemption wallet migration index", '"ix_store_redemptions_account_created_id"'),
        ("store redemption wallet migration columns", '["account_id", "created_at", "id"]'),
    ):
        _assert_contains(label, backend_store_index_migration_content, marker)
    for label, marker in (
        ("community point ledger source migration constraint", '"uq_community_point_ledger_source"'),
        ("community point ledger source migration table", '"community_point_ledger"'),
        ("community point ledger source migration columns", '["source_type", "source_id"]'),
    ):
        _assert_contains(label, backend_point_ledger_source_migration_content, marker)
    backend_contract_tests_content = COMMUNITY_STORE_YEAR_REVIEW_TEST_PATH.read_text(encoding="utf-8")
    _assert_contains(
        "community point ledger duplicate source regression",
        backend_contract_tests_content,
        "test_community_point_ledger_declares_unique_source_constraint",
    )
    for label, marker in (
        ("food community API average delta signed clamp", "averageRise: clampNumber(Math.round(stats.average_glucose_delta ?? 0), -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community API max delta signed clamp", "maximumRise: clampNumber(stats.max_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community API min delta signed clamp", "minimumRise: clampNumber(stats.min_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community API share delta signed clamp", "glucoseDelta: clampNumber(share.glucose_delta, -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
    ):
        _assert_contains(label, future_module_display_content, marker)
    for label, marker in (
        ("food community individual share delta signed clamp", "const rise = clampNumber(value.glucoseDelta ?? after - before, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
        ("food community individual share delta copy", "血糖變化 ${rise} mg/dL"),
        ("food community display average delta signed clamp", "const averageRise = clampNumber(value.averageRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
        ("food community display max delta signed clamp", "const maximumRise = clampNumber(value.maximumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
        ("food community display min delta signed clamp", "const minimumRise = clampNumber(value.minimumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
    ):
        _assert_contains(label, future_module_display_content, marker)
    _assert_not_contains(
        "community leaderboard must not expose account id",
        backend_api_content,
        "CommunityLeaderboardEntry(account_id=account_id",
    )
    _assert_not_contains(
        "food community schema must not raise raw client delta validation error",
        backend_content,
        "glucose_delta is calculated by the server and must not be supplied.",
    )

    for mobile_id, api_code, label in EXPECTED_FOOD_COMMUNITY_CATEGORIES:
        _assert_contains(
            f"mobile food category {mobile_id}",
            future_module_display_content,
            f'{{ id: "{mobile_id}", label: "{label}" }}',
        )
        _assert_contains(
            f"mobile individual food item category {mobile_id}",
            future_module_display_content,
            f'category: "{mobile_id}"',
        )
        _assert_contains(f"backend food category {api_code}", backend_content, f'"{api_code}": "{label}"')
        if mobile_id == api_code:
            _assert_contains(
                f"food category direct api mapping {mobile_id}",
                future_module_display_content,
                f'value === "{mobile_id}"',
            )
        else:
            _assert_contains(
                f"food category api-to-mobile mapping {api_code}",
                future_module_display_content,
                f'value === "{api_code}"',
            )
            _assert_contains(
                f"food category mobile-to-api mapping {mobile_id}",
                future_module_display_content,
                f'value === "{mobile_id}"',
            )


def _verify_daily_record_contract(content: str, daily_transcript_content: str) -> None:
    backend_api_content = DAILY_RECORDS_API_PATH.read_text(encoding="utf-8")
    backend_schema_content = DAILY_RECORD_SCHEMA_PATH.read_text(encoding="utf-8")
    backend_model_content = DAILY_RECORD_MODEL_PATH.read_text(encoding="utf-8")
    backend_migration_content = DAILY_RECORD_MIGRATION_PATH.read_text(encoding="utf-8")
    backend_tests_content = DAILY_RECORD_TEST_PATH.read_text(encoding="utf-8")
    for label, haystack, marker in (
        ("daily record backend router prefix", backend_api_content, 'APIRouter(prefix="/daily-records"'),
        ("daily record backend save endpoint", backend_api_content, '@router.post("/save", response_model=DailyRecordSaveResponse, status_code=201)'),
        ("daily record backend transaction creates records", backend_api_content, "created_records.append(record)"),
        ("daily record backend upsert lookup", backend_api_content, "DailyRecord.record_date == payload.record_date"),
        ("daily record backend record id merge", backend_api_content, "daily_record.record_ids = _merge_record_ids("),
        ("daily record backend preview merge", backend_api_content, "daily_record.preview_records_json = _merge_preview_records("),
        ("daily record backend transcript merge", backend_api_content, "daily_record.transcript_entries_json = _merge_transcript_entries("),
        ("daily record backend audit event", backend_api_content, 'resource_type="daily_record"'),
        ("daily record schema save request", backend_schema_content, "class DailyRecordSaveRequest(BaseModel):"),
        ("daily record schema save response", backend_schema_content, "class DailyRecordSaveResponse(BaseModel):"),
        ("daily record transcript bounded source text", backend_schema_content, "source_text: str = Field(min_length=1, max_length=4000)"),
        ("daily record model table", backend_model_content, '__tablename__ = "daily_records"'),
        ("daily record model unique profile date", backend_model_content, 'UniqueConstraint("profile_id", "record_date", name="uq_daily_records_profile_date")'),
        ("daily record migration revision", backend_migration_content, 'revision: str = "20260430_0030"'),
        ("daily record migration table", backend_migration_content, '"daily_records"'),
        ("daily record migration unique profile date", backend_migration_content, '"uq_daily_records_profile_date"'),
        ("daily record backend create test", backend_tests_content, "test_daily_record_save_creates_records_and_one_daily_record"),
        ("daily record backend merge test", backend_tests_content, "test_daily_record_save_updates_same_day_instead_of_creating_second_daily_record"),
        ("daily record backend one row assertion", backend_tests_content, "assert len(daily_records) == 1"),
        ("daily record mobile save endpoint", content, '"/daily-records/save"'),
        ("daily record mobile save request helper", daily_transcript_content, "function buildDailyRecordSaveRequest("),
        ("daily record mobile transactional response", content, "const saveResponse = await requestJson<DailyRecordSaveResponse>"),
    ):
        _assert_contains(label, haystack, marker)


def _verify_basic_report_contract() -> None:
    reports_api_content = REPORTS_API_PATH.read_text(encoding="utf-8")
    reporting_content = REPORTING_SERVICE_PATH.read_text(encoding="utf-8")
    reports_test_content = REPORTS_TEST_PATH.read_text(encoding="utf-8")
    for label, marker in (
        ("basic report start bound inclusive", "statement = statement.where(Record.occurred_at >= start_at)"),
        ("basic report end bound exclusive", "statement = statement.where(Record.occurred_at < end_at)"),
        ("basic report window validates before permission", "validate_report_window(start_at=start_at, end_at=end_at)\n    assert_can_export_profile"),
    ):
        _assert_contains(label, reports_api_content, marker)
    for label, marker in (
        ("basic report fasting before meal helper", 'value.strip().lower() in {"fasting", "before_meal", "before-meal", "before"}'),
        ("basic report after meal helper", 'value.strip().lower() in {"after_meal", "after-meal", "after"}'),
        ("basic report glucose count increments with valid value", "glucose_count += 1"),
        ("basic report before meal count source", "before_meal_glucose_count += 1"),
        ("basic report after meal count source", "after_meal_glucose_count += 1"),
        ("basic report average source", "average=round(glucose_total / glucose_count, 1) if glucose_count else None"),
        ("basic report minimum source", "minimum=glucose_minimum"),
        ("basic report maximum source", "maximum=glucose_maximum"),
    ):
        _assert_contains(label, reporting_content, marker)
    for label, marker in (
        ("basic report date window regression", "def test_basic_report_supports_date_window()"),
        ("basic report test start query", "&start_at=2026-04-30T00:00:00Z"),
        ("basic report test exclusive end query", "&end_at=2026-05-01T00:00:00Z"),
        ("basic report test excludes end boundary value", '{"value": 90, "unit": "mg/dL", "meal_timing": "after_meal"}'),
        ("basic report test fasting timing", '{"value": 130, "unit": "mg/dL", "meal_timing": "fasting"}'),
        ("basic report test legacy before timing", '{"value": 140, "unit": "mg/dL", "meal_timing": "before"}'),
        ("basic report test legacy after timing", '{"value": 170, "unit": "mg/dL", "meal_timing": "after-meal"}'),
        ("basic report test record count", '"count": 5'),
        ("basic report test before meal count", '"before_meal_count": 3'),
        ("basic report test after meal count", '"after_meal_count": 2'),
        ("basic report test average", '"average": 154.0'),
        ("basic report test minimum", '"minimum": 130.0'),
        ("basic report test maximum", '"maximum": 180.0'),
    ):
        _assert_contains(label, reports_test_content, marker)


def _numeric_style_value(style_block: str, property_name: str) -> int | None:
    match = re.search(rf"^\s*{re.escape(property_name)}:\s*(\d+)", style_block, flags=re.MULTILINE)
    if match is None:
        return None
    return int(match.group(1))


def _unlabeled_close_buttons(content: str) -> list[str]:
    return [
        line.strip()
        for line in content.splitlines()
        if "styles.closeButton" in line and "<Pressable" in line and "accessibilityLabel=" not in line
    ]


def _scroll_views_missing_keyboard_tap_handling(content: str) -> list[str]:
    missing: list[str] = []
    for match in re.finditer(r"<ScrollView\b[^>]*>", content):
        tag = match.group(0)
        if 'keyboardShouldPersistTaps="handled"' not in tag:
            line_number = content.count("\n", 0, match.start()) + 1
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _keyboard_avoiding_view_errors(content: str) -> list[str]:
    errors: list[str] = []
    required_markers = {
        "KeyboardAvoidingView import": "KeyboardAvoidingView,",
        "Platform import": "Platform,",
        "keyboard avoiding open": "<KeyboardAvoidingView",
        "platform behavior": 'behavior={Platform.OS === "ios" ? "padding" : "height"}',
        "keyboard avoiding style": "style={styles.keyboardAvoidingRoot}",
        "keyboard avoiding style block": "keyboardAvoidingRoot: {\n    flex: 1\n  }",
    }
    for label, marker in required_markers.items():
        if marker not in content:
            errors.append(label)
    root_match = re.search(
        r"<KeyboardAvoidingView\b[\s\S]*?<ScrollView\b[\s\S]*?contentContainerStyle=\{mainScrollContainerStyle\}",
        content,
    )
    if root_match is None:
        errors.append("main ScrollView not wrapped by KeyboardAvoidingView")
    return errors


def _normalize_jsx_expression(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _extract_jsx_brace_expression(tag: str, prop_name: str) -> str | None:
    marker = f"{prop_name}={{"
    start = tag.find(marker)
    if start == -1:
        return None
    start += len(marker)
    end = tag.find("}", start)
    if end == -1:
        return None
    return _normalize_jsx_expression(tag[start:end])


def _extract_disabled_state_expression(tag: str) -> str | None:
    marker = "accessibilityState={{"
    start = tag.find(marker)
    if start == -1:
        return None
    state_body_start = start + len(marker)
    state_body_end = tag.find("}}", state_body_start)
    if state_body_end == -1:
        return None
    state_body = tag[state_body_start:state_body_end]
    match = re.search(
        r"\bdisabled\s*:\s*([\s\S]*?)(?=,\s*(?:selected|expanded|busy|checked)\s*:|$)",
        state_body,
    )
    if match is None:
        return None
    return _normalize_jsx_expression(match.group(1))


def _extract_selected_state_expression(tag: str) -> str | None:
    marker = "accessibilityState={{"
    start = tag.find(marker)
    if start == -1:
        return None
    state_body_start = start + len(marker)
    state_body_end = tag.find("}}", state_body_start)
    if state_body_end == -1:
        return None
    state_body = tag[state_body_start:state_body_end]
    match = re.search(
        r"\bselected\s*:\s*([\s\S]*?)(?=,\s*(?:disabled|expanded|busy|checked)\s*:|$)",
        state_body,
    )
    if match is None:
        return None
    return _normalize_jsx_expression(match.group(1))


def _unlabeled_pressables(content: str) -> list[str]:
    missing: list[str] = []
    search_from = 0
    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            line_number = content.count("\n", 0, start) + 1
            missing.append(f"{line_number}: unterminated <Pressable tag")
            break
        tag = content[start : end + 1]
        if "accessibilityLabel=" not in tag:
            line_number = content.count("\n", 0, start) + 1
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
        search_from = end + 1
    return missing


def _pressables_missing_button_role(content: str) -> list[str]:
    missing: list[str] = []
    search_from = 0
    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            line_number = content.count("\n", 0, start) + 1
            missing.append(f"{line_number}: unterminated <Pressable tag")
            break
        tag = content[start : end + 1]
        if 'accessibilityRole="button"' not in tag:
            line_number = content.count("\n", 0, start) + 1
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
        search_from = end + 1
    return missing


def _pressable_label_source_errors(content: str) -> list[str]:
    errors: list[str] = []
    label_pattern = re.compile(r'accessibilityLabel\s*=\s*("[^"]*"|\'[^\']*\'|\{([^{}]+)\})')
    bounded_display_label_objects = {
        "auxiliaryDisplayLabels",
        "coreFlowDisplayLabels",
        "futurePreviewDisplayLabels",
        "settingsSubscriptionDisplayLabels",
    }
    render_item_label_sources = {
        "category.accessibilityLabel",
        "item.accessibilityLabel",
        "item.editAccessibilityLabel",
        "item.removeAccessibilityLabel",
        "model.accessibilityLabel",
        "option.accessibilityLabel",
        "product.actionAccessibilityLabel",
        "profile.accessibilityLabel",
        "row.accessibilityLabel",
        "type.accessibilityLabel",
    }
    helper_label_sources = {
        "aiCandidateEditAccessibilityLabel(item)",
        "aiCandidateRemoveAccessibilityLabel(item)",
        "dailyRecordEntryAccessibilityLabel(item)",
        "dailyRecordEntryEditAccessibilityLabel(item)",
        "dailyRecordEntryRemoveAccessibilityLabel(item)",
        "destinationCardAccessibilityLabel(item)",
        "editOptionAccessibilityLabel(option)",
        "foodCommunityCategoryOptionAccessibilityLabel(category)",
        "futureModuleCardAccessibilityLabel(item)",
        "analysisRangeOptionAccessibilityLabel(item)",
        "menuDestinationAccessibilityLabel(item)",
        "previewStatusRowAccessibilityLabel(item)",
        "quickEntryModeAccessibilityLabel(item)",
        "recordingWhisperModelAccessibilityLabel(model)",
        "settingsDisplayRowAccessibilityLabel(row)",
        "settingsModelChoiceAccessibilityLabel(model)",
        "settingsProfileChoiceAccessibilityLabel(profile)",
        "storeCategoryOptionAccessibilityLabel(category)",
        "visualSmokeRouteAccessibilityLabel(item)",
        "foodCommunityListItemAccessibilityLabel(item)",
        "storeProductActionAccessibilityLabel(product)",
        "storeRedemptionActionAccessibilityLabel(product)",
    }
    search_from = 0
    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            line_number = content.count("\n", 0, start) + 1
            errors.append(f"{line_number}: unterminated <Pressable tag")
            break
        tag = content[start : end + 1]
        line_number = content.count("\n", 0, start) + 1
        label_match = label_pattern.search(tag)
        if not label_match:
            search_from = end + 1
            continue
        literal_or_expr = label_match.group(1)
        expression = label_match.group(2)
        if expression is None:
            if len(literal_or_expr.strip("\"'")) > 80:
                compact = " ".join(tag.split())[:180]
                errors.append(f"{line_number}: static Pressable accessibilityLabel too long: {compact}")
            search_from = end + 1
            continue
        source = expression.strip()
        source_object = source.split(".", maxsplit=1)[0]
        is_bounded_display_object = (
            source_object in bounded_display_label_objects
            and re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*\.[A-Za-z][A-Za-z0-9_]*", source)
        )
        is_render_item_source = source in render_item_label_sources
        is_helper_label_source = source in helper_label_sources
        is_prepared_label_variable = re.fullmatch(
            r"[A-Za-z][A-Za-z0-9_]*(Accessibility|AccessibilityLabel|AccessibilityDisplayLabel)",
            source,
        )
        if not (is_bounded_display_object or is_render_item_source or is_helper_label_source or is_prepared_label_variable):
            compact = " ".join(tag.split())[:180]
            errors.append(f"{line_number}: {compact}")
        search_from = end + 1
    return errors


def _disabled_pressables_missing_state(content: str) -> list[str]:
    missing: list[str] = []
    search_from = 0
    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            line_number = content.count("\n", 0, start) + 1
            missing.append(f"{line_number}: unterminated <Pressable tag")
            break
        tag = content[start : end + 1]
        if "disabled=" in tag and "accessibilityState=" not in tag:
            line_number = content.count("\n", 0, start) + 1
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
        search_from = end + 1
    return missing


def _disabled_pressables_mismatched_state(content: str) -> list[str]:
    mismatches: list[str] = []
    search_from = 0
    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            break
        tag = content[start : end + 1]
        line_number = content.count("\n", 0, start) + 1
        disabled_expression = _extract_jsx_brace_expression(tag, "disabled")
        if disabled_expression is None and re.search(r"\bdisabled(?=\s|>)", tag):
            disabled_expression = "true"
        if disabled_expression is None:
            search_from = end + 1
            continue
        state_expression = _extract_disabled_state_expression(tag)
        if state_expression is None:
            search_from = end + 1
            continue
        if _normalize_jsx_expression(disabled_expression) != state_expression:
            mismatches.append(
                f"{line_number}: disabled={_normalize_jsx_expression(disabled_expression)} "
                f"state={state_expression}"
            )
        search_from = end + 1
    return mismatches


def _selected_pressables_mismatched_state(content: str) -> list[str]:
    mismatches: list[str] = []
    search_from = 0
    selected_style_pattern = re.compile(
        r"([\s\S]*?)\?\s*styles\.(?:tabPillActive|segmentActive|chipSelected)\s*:\s*null"
    )

    def selected_style_condition(style_prefix: str) -> str:
        paren_depth = 0
        last_separator = -1
        for index, char in enumerate(style_prefix):
            if char == "(":
                paren_depth += 1
            elif char == ")" and paren_depth > 0:
                paren_depth -= 1
            elif char == "," and paren_depth == 0:
                last_separator = index
        return _normalize_jsx_expression(style_prefix[last_separator + 1 :])

    while True:
        start = content.find("<Pressable", search_from)
        if start == -1:
            break
        end = content.find(">", start)
        if end == -1:
            break
        tag = content[start : end + 1]
        line_number = content.count("\n", 0, start) + 1
        visual_selected_conditions = [
            selected_style_condition(match.group(1))
            for match in selected_style_pattern.finditer(tag)
        ]
        state_expression = _extract_selected_state_expression(tag)
        if visual_selected_conditions and state_expression is None:
            compact = " ".join(tag.split())[:180]
            mismatches.append(f"{line_number}: missing selected state for {compact}")
        elif state_expression is not None and visual_selected_conditions:
            if state_expression not in visual_selected_conditions:
                mismatches.append(
                    f"{line_number}: selected={state_expression} "
                    f"visual={'; '.join(visual_selected_conditions)}"
                )
        search_from = end + 1
    return mismatches


def _unlabeled_text_inputs(content: str) -> list[str]:
    missing: list[str] = []
    for index, part in enumerate(content.split("<TextInput")[1:], start=1):
        tag = part.split("/>", maxsplit=1)[0].split(">", maxsplit=1)[0]
        if "accessibilityLabel=" not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"TextInput #{index}: {compact}")
    return missing


def _text_inputs_missing_max_length(content: str) -> list[str]:
    missing: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        if "maxLength=" not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _editable_text_inputs_missing_disabled_state(content: str) -> list[str]:
    missing: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        if "editable=" in tag and "accessibilityState=" not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _editable_text_inputs_mismatched_disabled_state(content: str) -> list[str]:
    mismatches: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        editable_expression = _extract_jsx_brace_expression(tag, "editable")
        if editable_expression is None:
            continue
        state_expression = _extract_disabled_state_expression(tag)
        if state_expression is None:
            continue
        normalized_editable = _normalize_jsx_expression(editable_expression)
        expected_disabled = normalized_editable[1:].strip() if normalized_editable.startswith("!") else None
        if expected_disabled is None:
            continue
        if _normalize_jsx_expression(expected_disabled) != state_expression:
            mismatches.append(
                f"{line_number}: editable={normalized_editable} state={state_expression}"
            )
    return mismatches


def _text_inputs_missing_keyboard_normalization(content: str) -> list[str]:
    missing: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        if 'autoCapitalize="none"' not in tag or "autoCorrect={false}" not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _numeric_text_inputs_missing_numeric_keyboard(content: str) -> list[str]:
    missing: list[str] = []
    numeric_value_names = {
        "previewEditFields.glucoseValue",
        "previewEditFields.exerciseMinutes",
        "manualRecordFields.glucoseValue",
        "manualRecordFields.exerciseMinutes",
        "recordEditFields.glucoseValue",
        "recordEditFields.exerciseMinutes",
    }
    for line_number, tag in _text_input_opening_tags(content):
        value_match = re.search(r"\bvalue=\{([^}]+)\}", tag)
        if not value_match:
            continue
        value_source = value_match.group(1).strip()
        if value_source in numeric_value_names and 'keyboardType="numeric"' not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _multiline_text_inputs_missing_top_alignment(content: str) -> list[str]:
    missing: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        if "multiline" in tag and 'textAlignVertical="top"' not in tag:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _multiline_text_inputs_missing_named_style(content: str) -> list[str]:
    missing: list[str] = []
    allowed_style_names = set(MULTILINE_TEXT_INPUT_STYLE_RULES)
    for line_number, tag in _text_input_opening_tags(content):
        if "multiline" not in tag:
            continue
        style_match = re.search(r"style=\{\[styles\.input,\s*styles\.([A-Za-z][A-Za-z0-9_]*)\]\}", tag)
        if style_match is None or style_match.group(1) not in allowed_style_names:
            compact = " ".join(tag.split())[:180]
            missing.append(f"{line_number}: {compact}")
    return missing


def _text_input_opening_tags(content: str) -> list[tuple[int, str]]:
    tags: list[tuple[int, str]] = []
    for match in re.finditer(r"<TextInput\b[\s\S]*?/>", content):
        line_number = content.count("\n", 0, match.start()) + 1
        tags.append((line_number, match.group(0)))
    return tags


def _assert_exact(name: str, actual: set[str], expected: set[str]) -> None:
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing or extra:
        detail = []
        if missing:
            detail.append("missing: " + ", ".join(missing))
        if extra:
            detail.append("extra: " + ", ".join(extra))
        raise AssertionError(f"{name} mismatch ({'; '.join(detail)}).")


def _assert_mapping_exact(name: str, actual: dict[str, str], expected: dict[str, str]) -> None:
    missing = sorted(set(expected) - set(actual))
    extra = sorted(set(actual) - set(expected))
    mismatched = sorted(
        key
        for key in set(expected) & set(actual)
        if actual[key] != expected[key]
    )
    if missing or extra or mismatched:
        detail = []
        if missing:
            detail.append("missing: " + ", ".join(missing))
        if extra:
            detail.append("extra: " + ", ".join(extra))
        if mismatched:
            detail.append(
                "mismatched: "
                + ", ".join(
                    f"{key} expected {expected[key]!r} got {actual[key]!r}"
                    for key in mismatched
                )
            )
        raise AssertionError(f"{name} mismatch ({'; '.join(detail)}).")


def _assert_contains(name: str, haystack: str, needle: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"{name} missing expected guard: {needle}")


def _assert_not_contains(name: str, haystack: str, needle: str) -> None:
    if needle in haystack:
        raise AssertionError(f"{name} should not contain nested-panel style: {needle}")


def _assert_screen_setter_boundary(content: str) -> None:
    occurrences = [
        content.count("\n", 0, match.start()) + 1
        for match in re.finditer(r"\bsetCurrentScreen\(", content)
    ]
    if len(occurrences) != 1:
        raise AssertionError(
            "screen setter boundary must route through openScreen only; "
            f"found setCurrentScreen at lines {occurrences}"
        )
    _assert_contains(
        "screen setter boundary helper body",
        content,
        "function openScreen(screen: AppScreen) {\n    setCurrentScreen(screen);\n  }",
    )


def _assert_inline_press_callbacks_use_press_wrappers(content: str) -> None:
    offenders: list[str] = []
    for match in re.finditer(r'onPress=\{\(\) =>\s*([A-Za-z_][A-Za-z0-9_]*)\(', content):
        callback_name = match.group(1)
        if not callback_name.startswith("press"):
            line_number = content.count("\n", 0, match.start()) + 1
            offenders.append(f"{line_number}:{callback_name}")
    if offenders:
        raise AssertionError(
            "Inline JSX onPress callbacks must call press* wrappers; found "
            + ", ".join(offenders)
        )


def _assert_inline_press_callbacks_use_display_args(content: str) -> None:
    allowed_args = {
        "category",
        "index",
        "item",
        "model",
        "option",
        "product",
        "profile",
        "row",
        "screen",
        "type",
    }
    offenders: list[str] = []
    for match in re.finditer(
        r'onPress=\{\(\) =>\s*(press[A-Za-z0-9_]*)\(([^)]*)\)\}',
        content,
    ):
        callback_name = match.group(1)
        arguments = [argument.strip() for argument in match.group(2).split(",") if argument.strip()]
        line_number = content.count("\n", 0, match.start()) + 1
        if not arguments:
            offenders.append(f"{line_number}:{callback_name}()")
            continue
        for argument in arguments:
            if argument not in allowed_args:
                offenders.append(f"{line_number}:{callback_name}({argument})")
    if offenders:
        raise AssertionError(
            "Inline JSX press* callbacks must pass render-prepared display arguments; found "
            + ", ".join(offenders)
        )


def _assert_text_input_change_handlers_use_update_wrappers(content: str) -> None:
    offenders: list[str] = []
    for match in re.finditer(r"onChangeText=\{([^}]+)\}", content):
        binding = match.group(1).strip()
        line_number = content.count("\n", 0, match.start()) + 1
        if "=>" in binding:
            offenders.append(f"{line_number}:inline callback")
            continue
        if not re.fullmatch(r"update[A-Za-z0-9_]*", binding):
            offenders.append(f"{line_number}:{binding}")
    if offenders:
        raise AssertionError(
            "TextInput onChangeText bindings must call named update* wrappers; found "
            + ", ".join(offenders)
        )


def _assert_text_inputs_use_bounded_state_values(content: str) -> None:
    offenders: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        match = re.search(r"\bvalue=\{([^}]+)\}", tag)
        if match is None:
            offenders.append(f"{line_number}:missing value")
            continue
        binding = match.group(1).strip()
        is_state_reference = re.fullmatch(
            r"[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?",
            binding,
        )
        is_record_edit_field_value = re.fullmatch(
            r'recordEditFieldValue\((manualRecordFields|previewEditFields|recordEditFields), "[A-Za-z_][A-Za-z0-9_]*"\)',
            binding,
        )
        if not (is_state_reference or is_record_edit_field_value):
            offenders.append(f"{line_number}:{binding}")
    if offenders:
        raise AssertionError(
            "TextInput value bindings must be controlled state or state-field references; found "
            + ", ".join(offenders)
        )


def _assert_text_input_placeholders_are_static_and_bounded(content: str) -> None:
    offenders: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        expression_match = re.search(r"\bplaceholder=\{", tag)
        if expression_match is not None:
            offenders.append(f"{line_number}:placeholder expression")
            continue
        placeholder_match = re.search(r'\bplaceholder="([^"]*)"', tag)
        if placeholder_match is None:
            continue
        placeholder = placeholder_match.group(1)
        if len(placeholder) > MAX_TEXT_INPUT_PLACEHOLDER_LENGTH:
            offenders.append(f"{line_number}:placeholder length {len(placeholder)}")
    if offenders:
        raise AssertionError(
            "TextInput placeholders must be static and bounded; found "
            + ", ".join(offenders)
        )


def _assert_text_input_accessibility_labels_are_bounded(content: str) -> None:
    offenders: list[str] = []
    for line_number, tag in _text_input_opening_tags(content):
        expression_match = re.search(r"\baccessibilityLabel=\{([^}]+)\}", tag)
        static_match = re.search(r'\baccessibilityLabel="([^"]*)"', tag)
        if expression_match is None and static_match is None:
            offenders.append(f"{line_number}:missing accessibilityLabel")
            continue
        if expression_match is not None:
            label_binding = expression_match.group(1).strip()
            if not re.fullmatch(r"auxiliaryDisplayLabels\.[A-Za-z0-9_]+", label_binding):
                offenders.append(f"{line_number}:{label_binding}")
            continue
        if static_match is not None:
            label = static_match.group(1)
            if len(label) > MAX_TEXT_INPUT_ACCESSIBILITY_LABEL_LENGTH:
                offenders.append(f"{line_number}:static label length {len(label)}")
    if offenders:
        raise AssertionError(
            "TextInput accessibilityLabel must be short static text or auxiliaryDisplayLabels.*; found "
            + ", ".join(offenders)
        )


def main() -> int:
    content = APP_PATH.read_text(encoding="utf-8")
    _assert_screen_setter_boundary(content)
    api_client_content = API_CLIENT_PATH.read_text(encoding="utf-8")
    app_types_content = APP_TYPES_PATH.read_text(encoding="utf-8")
    app_runtime_config_content = APP_RUNTIME_CONFIG_PATH.read_text(encoding="utf-8")
    navigation_content = NAVIGATION_CONFIG_PATH.read_text(encoding="utf-8")
    record_display_content = RECORD_DISPLAY_PATH.read_text(encoding="utf-8")
    record_edit_transforms_content = RECORD_EDIT_TRANSFORMS_PATH.read_text(encoding="utf-8")
    record_bounds_content = RECORD_BOUNDS_PATH.read_text(encoding="utf-8")
    record_save_transforms_content = RECORD_SAVE_TRANSFORMS_PATH.read_text(encoding="utf-8")
    daily_transcript_content = DAILY_TRANSCRIPT_TRANSFORMS_PATH.read_text(encoding="utf-8")
    recording_copy_content = RECORDING_COPY_PATH.read_text(encoding="utf-8")
    record_workflow_copy_content = RECORD_WORKFLOW_COPY_PATH.read_text(encoding="utf-8")
    record_status_copy_content = RECORD_STATUS_COPY_PATH.read_text(encoding="utf-8")
    report_status_copy_content = REPORT_STATUS_COPY_PATH.read_text(encoding="utf-8")
    native_status_copy_content = NATIVE_STATUS_COPY_PATH.read_text(encoding="utf-8")
    first_version_flow_copy_content = FIRST_VERSION_FLOW_COPY_PATH.read_text(encoding="utf-8")
    history_copy_content = HISTORY_COPY_PATH.read_text(encoding="utf-8")
    history_screen_data_content = HISTORY_SCREEN_DATA_PATH.read_text(encoding="utf-8")
    analysis_copy_content = ANALYSIS_COPY_PATH.read_text(encoding="utf-8")
    analysis_data_content = ANALYSIS_DATA_TRANSFORMS_PATH.read_text(encoding="utf-8")
    analysis_metric_content = ANALYSIS_METRIC_TRANSFORMS_PATH.read_text(encoding="utf-8")
    analysis_screen_data_content = ANALYSIS_SCREEN_DATA_PATH.read_text(encoding="utf-8")
    settings_copy_content = SETTINGS_COPY_PATH.read_text(encoding="utf-8")
    settings_screen_data_content = SETTINGS_SCREEN_DATA_PATH.read_text(encoding="utf-8")
    settings_choice_display_content = SETTINGS_CHOICE_DISPLAY_PATH.read_text(encoding="utf-8")
    model_transforms_content = MODEL_TRANSFORMS_PATH.read_text(encoding="utf-8")
    subscription_copy_content = SUBSCRIPTION_COPY_PATH.read_text(encoding="utf-8")
    subscription_transforms_content = SUBSCRIPTION_TRANSFORMS_PATH.read_text(encoding="utf-8")
    account_copy_content = ACCOUNT_COPY_PATH.read_text(encoding="utf-8")
    account_transforms_content = ACCOUNT_TRANSFORMS_PATH.read_text(encoding="utf-8")
    ai_model_transforms_content = AI_MODEL_TRANSFORMS_PATH.read_text(encoding="utf-8")
    auth_transforms_content = AUTH_TRANSFORMS_PATH.read_text(encoding="utf-8")
    auth_request_headers_content = AUTH_REQUEST_HEADERS_PATH.read_text(encoding="utf-8")
    auth_session_display_content = AUTH_SESSION_DISPLAY_PATH.read_text(encoding="utf-8")
    auth_status_copy_content = AUTH_STATUS_COPY_PATH.read_text(encoding="utf-8")
    shared_display_items_content = SHARED_DISPLAY_ITEMS_PATH.read_text(encoding="utf-8")
    future_module_display_content = FUTURE_MODULE_DISPLAY_PATH.read_text(encoding="utf-8")
    year_review_share_file_content = YEAR_REVIEW_SHARE_FILE_PATH.read_text(encoding="utf-8")
    daily_record_detail_row_content = DAILY_RECORD_DETAIL_ROW_PATH.read_text(encoding="utf-8")
    delete_confirm_preview_block_content = DELETE_CONFIRM_PREVIEW_BLOCK_PATH.read_text(encoding="utf-8")
    history_calendar_month_picker_content = HISTORY_CALENDAR_MONTH_PICKER_PATH.read_text(encoding="utf-8")
    history_daily_record_section_card_content = HISTORY_DAILY_RECORD_SECTION_CARD_PATH.read_text(encoding="utf-8")
    history_daily_summary_card_content = HISTORY_DAILY_SUMMARY_CARD_PATH.read_text(encoding="utf-8")
    history_daily_summary_table_content = HISTORY_DAILY_SUMMARY_TABLE_PATH.read_text(encoding="utf-8")
    history_detail_mode_tabs_content = HISTORY_DETAIL_MODE_TABS_PATH.read_text(encoding="utf-8")
    history_intro_status_blocks_content = HISTORY_INTRO_STATUS_BLOCKS_PATH.read_text(encoding="utf-8")
    history_no_range_records_card_content = HISTORY_NO_RANGE_RECORDS_CARD_PATH.read_text(encoding="utf-8")
    history_no_record_status_block_content = HISTORY_NO_RECORD_STATUS_BLOCK_PATH.read_text(encoding="utf-8")
    history_raw_transcript_card_content = HISTORY_RAW_TRANSCRIPT_CARD_PATH.read_text(encoding="utf-8")
    history_selected_date_header_content = HISTORY_SELECTED_DATE_HEADER_PATH.read_text(encoding="utf-8")
    history_selected_date_panel_content = HISTORY_SELECTED_DATE_PANEL_PATH.read_text(encoding="utf-8")
    history_selected_summary_card_content = HISTORY_SELECTED_SUMMARY_CARD_PATH.read_text(encoding="utf-8")
    history_sync_boundary_block_content = HISTORY_SYNC_BOUNDARY_BLOCK_PATH.read_text(encoding="utf-8")
    field_label_content = FIELD_LABEL_PATH.read_text(encoding="utf-8")
    detail_row_content = DETAIL_ROW_PATH.read_text(encoding="utf-8")
    highlight_bullet_row_content = HIGHLIGHT_BULLET_ROW_PATH.read_text(encoding="utf-8")
    highlight_detail_row_content = HIGHLIGHT_DETAIL_ROW_PATH.read_text(encoding="utf-8")
    manual_record_create_preview_action_content = MANUAL_RECORD_CREATE_PREVIEW_ACTION_PATH.read_text(
        encoding="utf-8"
    )
    manual_record_confirm_footer_actions_content = MANUAL_RECORD_CONFIRM_FOOTER_ACTIONS_PATH.read_text(
        encoding="utf-8"
    )
    manual_record_confirm_preview_block_content = MANUAL_RECORD_CONFIRM_PREVIEW_BLOCK_PATH.read_text(
        encoding="utf-8"
    )
    manual_record_date_time_fields_content = MANUAL_RECORD_DATE_TIME_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_exercise_fields_content = MANUAL_RECORD_EXERCISE_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_glucose_fields_content = MANUAL_RECORD_GLUCOSE_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_header_intro_content = MANUAL_RECORD_HEADER_INTRO_PATH.read_text(encoding="utf-8")
    manual_record_meal_fields_content = MANUAL_RECORD_MEAL_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_medication_fields_content = MANUAL_RECORD_MEDICATION_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_note_fields_content = MANUAL_RECORD_NOTE_FIELDS_PATH.read_text(encoding="utf-8")
    manual_record_type_selector_content = MANUAL_RECORD_TYPE_SELECTOR_PATH.read_text(encoding="utf-8")
    metric_card_content = METRIC_CARD_PATH.read_text(encoding="utf-8")
    record_detail_action_panel_content = RECORD_DETAIL_ACTION_PANEL_PATH.read_text(encoding="utf-8")
    record_detail_info_panel_content = RECORD_DETAIL_INFO_PANEL_PATH.read_text(encoding="utf-8")
    record_edit_footer_actions_content = RECORD_EDIT_FOOTER_ACTIONS_PATH.read_text(encoding="utf-8")
    record_edit_header_fields_content = RECORD_EDIT_HEADER_FIELDS_PATH.read_text(encoding="utf-8")
    date_time_transforms_content = DATE_TIME_TRANSFORMS_PATH.read_text(encoding="utf-8")
    mobile_bounds_content = MOBILE_BOUNDS_PATH.read_text(encoding="utf-8")
    errors: list[str] = []

    try:
        _assert_inline_press_callbacks_use_press_wrappers(content)
        _assert_inline_press_callbacks_use_display_args(content)
        _assert_text_input_change_handlers_use_update_wrappers(content)
        _assert_text_inputs_use_bounded_state_values(content)
        _assert_text_input_placeholders_are_static_and_bounded(content)
        _assert_text_input_accessibility_labels_are_bounded(content)

        screens = _screen_union(navigation_content)
        chrome_keys = _screen_chrome_keys(navigation_content)
        checked_screens = _current_screen_checks(content)
        menu_destinations = _menu_destinations(navigation_content)
        menu_labels = _menu_labels(navigation_content)
        future_targets = _future_targets(future_module_display_content)

        _assert_exact("screenChrome keys", chrome_keys, screens)
        missing_checks = sorted(screens - checked_screens)
        if missing_checks:
            raise AssertionError(
                "AppScreen values without current-screen checks: " + ", ".join(missing_checks)
            )

        _assert_exact("menu destinations", menu_destinations, EXPECTED_MENU_DESTINATIONS)
        _assert_mapping_exact("menu labels", menu_labels, EXPECTED_MENU_LABELS)
        if not EXPECTED_FUTURE_TARGETS.issubset(future_targets):
            missing = sorted(EXPECTED_FUTURE_TARGETS - future_targets)
            raise AssertionError("future module targets missing: " + ", ".join(missing))

        _verify_achievement_contract(content, future_module_display_content)
        _verify_food_community_category_contract(content, future_module_display_content)
        for label, marker in (
            ("api client json request", "export async function requestJson<T>("),
            ("api client no-content request", "export async function requestNoContent(apiBaseUrl: string, path: string, init?: RequestInit)"),
            ("api client content type header", '"Content-Type": "application/json"'),
            ("api client status failure", "throw new Error(`${path} failed: ${response.status}`);"),
        ):
            _assert_contains(label, api_client_content, marker)
        for label, marker in (
            ("auth request headers wrapper", "export function protectedRequestHeaders(accountId: string, accessToken: string): Record<string, string>"),
            ("auth request headers dev auth flag", "allowMobileDevAuth"),
            ("auth request headers builder call", "return buildProtectedRequestHeaders(accountId, accessToken, allowMobileDevAuth);"),
        ):
            _assert_contains(label, auth_request_headers_content, marker)
        for label, marker in (
            ("app runtime default API base URL", "export const defaultApiBaseUrl ="),
            ("app runtime debug flag", "export const enableDebugTools = process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS === \"true\";"),
            ("app runtime dev auth flag", "export const allowMobileDevAuth = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH === \"true\";"),
            ("app runtime visual smoke route", "export const initialVisualSmokeScreen = normalizeVisualSmokeInitialRoute("),
            ("app runtime sample transcript", "export const sampleText ="),
            ("app runtime record sync limit", "export const mobileRecordSyncLimit = 100;"),
            ("app runtime record cache limit", "export const maxMobileRecordCacheLimit = 500;"),
            ("app runtime report query limit", "export const mobileReportQueryLimit = 500;"),
        ):
            _assert_contains(label, app_runtime_config_content, marker)
        for label, marker in (
            ("mobile bounds url normalizer", "export function normalizeApiBaseUrl(value: string)"),
            ("mobile bounds ui message", "export function boundUiMessage(value: string)"),
            ("mobile bounds display text", "export function boundDisplayText(value: string, maxLength = maxDisplayTextLength)"),
            ("mobile bounds identifier", "export function boundIdentifier(value: string)"),
            ("mobile bounds clamp number", "export function clampNumber(value: number, min: number, max: number)"),
            ("mobile bounds nullable clamp", "export function clampNullableNumber(value: number | null | undefined, min: number, max: number)"),
            ("mobile bounds transcript length", "export const maxTranscriptTextLength = 1200"),
            ("mobile bounds backend url length", "export const maxBackendUrlLength = 256"),
        ):
            _assert_contains(label, mobile_bounds_content, marker)
        for label, marker in (
            ("shared auxiliary labels helper", "export function auxiliarySectionLabels()"),
            ("shared auxiliary visual smoke copy", "visualSmokeRouteCopy: boundDisplayText("),
            ("shared auxiliary transcript input label", 'transcriptInputAccessibility: boundDisplayText("紀錄文字輸入", maxDisplayTextLength)'),
            ("shared auxiliary store cart checkout label", 'storeCartCheckoutAccessibility: boundDisplayText("結帳尚未開放，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("shared auxiliary store point mall badge", 'storePreview: boundDisplayText("點數商城", maxDisplayTextLength)'),
            ("shared auxiliary year review source label", 'yearReviewSource: boundDisplayText("年度回顧來源", maxDisplayTextLength)'),
            ("shared auxiliary food community share food name label", 'foodCommunityShareFoodNameAccessibility: boundDisplayText("輸入食物名稱", maxDisplayTextLength),'),
            ("shared auxiliary food community share eaten date label", 'foodCommunityShareEatenDateAccessibility: boundDisplayText("輸入食物分享食用日期", maxDisplayTextLength),'),
            ("shared auxiliary food community share eaten time label", 'foodCommunityShareEatenTimeAccessibility: boundDisplayText("輸入食物分享食用時間", maxDisplayTextLength),'),
            ("shared auxiliary food community share before glucose label", 'foodCommunityShareBeforeGlucoseAccessibility: boundDisplayText("輸入食用前血糖", maxDisplayTextLength),'),
            ("shared auxiliary food community share after glucose label", 'foodCommunityShareAfterGlucoseAccessibility: boundDisplayText("輸入食用後血糖", maxDisplayTextLength),'),
            ("shared auxiliary food community share note label", 'foodCommunityShareNoteAccessibility: boundDisplayText("輸入食物分享備註心得", maxDisplayTextLength),'),
            ("shared auxiliary community public display name label", 'communityPublicDisplayNameAccessibility: boundDisplayText("輸入社群公開顯示名稱", maxDisplayTextLength),'),
        ):
            _assert_contains(label, shared_display_items_content, marker)
        for label, marker in (
            ("daily record detail row component", "export function DailyRecordDetailRow({ label, value }: DailyRecordDetailRowProps)"),
            ("daily record detail row label", "<Text style={styles.confidence}>{label}</Text>"),
            ("daily record detail row value", "<Text style={styles.evidence}>{value}</Text>"),
            ("daily record detail row style", "detailRow: {"),
            ("daily record detail row background", 'backgroundColor: "#F7FCFA"'),
            ("daily record detail row evidence line height", "lineHeight: 19"),
        ):
            _assert_contains(label, daily_record_detail_row_content, marker)
        for label, marker in (
            ("delete confirm preview block component", "export function DeleteConfirmPreviewBlock({"),
            ("delete confirm preview danger label", "<Text style={styles.previewModeBadge}>{dangerLabel}</Text>"),
            ("delete confirm preview intro text", "<Text style={styles.evidence}>{introText}</Text>"),
            ("delete confirm preview danger icon", "<Text style={styles.successIconText}>!</Text>"),
            ("delete confirm preview record type", "<Text style={styles.recordType}>{recordTypeLabel}</Text>"),
            ("delete confirm preview record summary", "<Text style={styles.recordContent}>{recordSummary}</Text>"),
            ("delete confirm preview record meta", "<Text style={styles.evidence}>{recordMetaText}</Text>"),
            ("delete confirm preview card style", "emptyStateCard: {"),
            ("delete confirm preview danger icon style", 'backgroundColor: "#C85D5D"'),
        ):
            _assert_contains(label, delete_confirm_preview_block_content, marker)
        for label, marker in (
            ("history calendar month picker component", "export function HistoryCalendarMonthPicker<TDay extends HistoryCalendarDayItem>({"),
            ("history calendar month picker title", "<Text style={styles.recordContent}>{title}</Text>"),
            ("history calendar month picker lit-date legend", "亮燈日期有紀錄"),
            ("history calendar month picker previous accessibility", "accessibilityLabel={previousMonthAccessibilityLabel}"),
            ("history calendar month picker previous press", "onPress={onPreviousMonthPress}"),
            ("history calendar month picker next accessibility", "accessibilityLabel={nextMonthAccessibilityLabel}"),
            ("history calendar month picker next press", "onPress={onNextMonthPress}"),
            ("history calendar month picker selected state", "accessibilityState={{ selected: item.isSelected }}"),
            ("history calendar month picker day press", "onPress={() => onDayPress(item)}"),
            ("history calendar month picker has-records style", "item.hasRecords ? styles.historyCalendarDayHasRecords : styles.historyCalendarDayMuted"),
            ("history calendar month picker selected style", "item.isSelected ? styles.historyCalendarDaySelected : null"),
            ("history calendar month picker record dot", "item.hasRecords ? <View style={styles.historyCalendarDot} /> : null"),
            ("history calendar month picker grid style", "historyCalendarGrid: {"),
        ):
            _assert_contains(label, history_calendar_month_picker_content, marker)
        for label, marker in (
            ("history daily record section card component", "export function HistoryDailyRecordSectionCard<TEntry extends HistoryDailyRecordEntryItem>({"),
            ("history daily record section card title", "<Text style={styles.label}>{section.title}</Text>"),
            ("history daily record section card count", "<Text style={styles.countText}>{section.countLabel}</Text>"),
            ("history daily record section card helper copy", "可新增多筆；每筆可點進詳情修改。"),
            ("history daily record section card entry press", "onPress={() => onEntryPress(item)}"),
            ("history daily record detail row key helper", "function historyDailyRecordDetailRowKey<TEntry extends HistoryDailyRecordEntryItem>("),
            ("history daily record detail row key helper item type", "item: TEntry,"),
            ("history daily record detail row key helper fields", "return `${item.key}-${row.label}`;"),
            ("history daily record detail row label helper", "function historyDailyRecordDetailRowLabel(row: HistoryDailyRecordDetailRow)"),
            ("history daily record detail row label helper fields", "return row.label;"),
            ("history daily record detail row value helper", "function historyDailyRecordDetailRowValue(row: HistoryDailyRecordDetailRow)"),
            ("history daily record detail row value helper fields", "return row.value;"),
            ("history daily record section card detail row", "item.detailRows.map((row) => (\n                <DailyRecordDetailRow\n                  key={historyDailyRecordDetailRowKey(item, row)}\n                  label={historyDailyRecordDetailRowLabel(row)}\n                  value={historyDailyRecordDetailRowValue(row)}"),
            ("history daily record section card empty copy", "<Text style={styles.evidence}>{section.emptyCopy}</Text>"),
            ("history daily record section card section style", "dailyRecordSectionCard: {"),
            ("history daily record section card entry style", "dailyRecordEntryCard: {"),
        ):
            _assert_contains(label, history_daily_record_section_card_content, marker)
        _assert_not_contains(
            "history daily record direct detail row binding",
            history_daily_record_section_card_content,
            "item.detailRows.map((row) => (\n                <DailyRecordDetailRow key={`${item.key}-${row.label}`} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "history daily record direct detail row label binding",
            history_daily_record_section_card_content,
            "item.detailRows.map((row) => (\n                <DailyRecordDetailRow\n                  key={historyDailyRecordDetailRowKey(item, row)}\n                  label={row.label}\n                  value={historyDailyRecordDetailRowValue(row)}",
        )
        _assert_not_contains(
            "history daily record direct detail row value binding",
            history_daily_record_section_card_content,
            "item.detailRows.map((row) => (\n                <DailyRecordDetailRow\n                  key={historyDailyRecordDetailRowKey(item, row)}\n                  label={historyDailyRecordDetailRowLabel(row)}\n                  value={row.value}",
        )
        for label, marker in (
            ("history daily summary card component", "export function HistoryDailySummaryCard({"),
            ("history daily summary card accessibility role", 'accessibilityRole="button"'),
            ("history daily summary card selected state", "accessibilityState={{ selected }}"),
            ("history daily summary card press handler", "onPress={onPress}"),
            ("history daily summary card selected style", "selected ? styles.historyDailySummaryCardSelected : null"),
            ("history daily summary card sync pill", "<Text style={styles.historyStatusPill}>{syncLabel}</Text>"),
            ("history daily summary card source pill", "<Text style={styles.historyStatusPillMuted}>{sourceLabel}</Text>"),
            ("history daily summary card storage label", "<Text style={styles.confidence}>{storageLabel}</Text>"),
        ):
            _assert_contains(label, history_daily_summary_card_content, marker)
        for label, marker in (
            ("history daily summary table component", "export function HistoryDailySummaryTable<TItem extends HistoryDailySummaryTableItem>({"),
            ("history daily summary table title", "每日摘要表"),
            ("history daily summary table helper", "點日期查看完整每日紀錄、同步狀態與各分類內容。"),
            ("history daily summary table map", "items.map((item) => ("),
            ("history daily summary table selected prop", "selected={item.value === selectedDate}"),
            ("history daily summary table press binding", "onPress={() => onSummaryPress(item)}"),
            ("history daily summary table empty card", "<HistoryNoRangeRecordsCard body={emptyBody} title={emptyTitle} />"),
            ("history daily summary table style", "historyDailySummaryTable: {"),
        ):
            _assert_contains(label, history_daily_summary_table_content, marker)
        for label, marker in (
            ("history detail mode tabs component", "export function HistoryDetailModeTabs<T extends HistoryDetailModeTabItem>({"),
            ("history detail mode tabs selected state", "accessibilityState={{ selected: isSelected }}"),
            ("history detail mode tabs press wrapper", "onPress={() => onPress(item)}"),
            ("history detail mode tabs active style", "isSelected ? styles.segmentActive : null"),
            ("history detail mode tabs active text style", "isSelected ? styles.segmentTextActive : null"),
            ("history detail mode tabs pill min height", "minHeight: 44"),
            ("history detail mode tabs active color", 'backgroundColor: "#3FA67F"'),
        ):
            _assert_contains(label, history_detail_mode_tabs_content, marker)
        for label, marker in (
            ("history intro status blocks component", "export function HistoryIntroStatusBlocks({"),
            ("history intro status sync title", "<Text style={styles.label}>{syncTitle}</Text>"),
            ("history intro status sync body", "<Text style={styles.evidence}>{syncBody}</Text>"),
            ("history intro status boundary title", "<Text style={styles.label}>{boundaryTitle}</Text>"),
            ("history intro status boundary bullets", "boundaryItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
            ("history intro status inline style", "inlineInfoBlock: {"),
            ("history intro status evidence line height", "lineHeight: 19"),
        ):
            _assert_contains(label, history_intro_status_blocks_content, marker)
        for label, marker in (
            ("history no-range records card component", "export function HistoryNoRangeRecordsCard({ body, title }: HistoryNoRangeRecordsCardProps)"),
            ("history no-range records card icon", "<Text>📅</Text>"),
            ("history no-range records card title", "<Text style={styles.recordContent}>{title}</Text>"),
            ("history no-range records card body", "<Text style={styles.evidence}>{body}</Text>"),
            ("history no-range records card style", "emptyStateCard: {"),
            ("history no-range records card background", 'backgroundColor: "#F7FCFA"'),
            ("history no-range records card border", 'borderColor: "#D6EEE4"'),
        ):
            _assert_contains(label, history_no_range_records_card_content, marker)
        for label, marker in (
            ("history no-record status component", "export function HistoryNoRecordStatusBlock({ body, title }: HistoryNoRecordStatusBlockProps)"),
            ("history no-record status title", "<Text style={styles.label}>{title}</Text>"),
            ("history no-record status body", "<Text style={styles.evidence}>{body}</Text>"),
            ("history no-record status style", "inlineInfoBlock: {"),
            ("history no-record status label color", 'color: "#0F3F37"'),
            ("history no-record status evidence line height", "lineHeight: 19"),
        ):
            _assert_contains(label, history_no_record_status_block_content, marker)
        for label, marker in (
            ("history raw transcript card component", "export function HistoryRawTranscriptCard({"),
            ("history raw transcript card type label", "<Text style={styles.recordType}>{typeLabel}</Text>"),
            ("history raw transcript card time label", "<Text style={styles.confidence}>{timeLabel}</Text>"),
            ("history raw transcript card source label", "<Text style={styles.previewModeBadge}>{sourceStatusLabel}</Text>"),
            ("history raw transcript card raw text", "<Text style={styles.evidence}>{rawText}</Text>"),
            ("history raw transcript card style", "historyRawCard: {"),
            ("history raw transcript card border", 'borderColor: "#E3E8E5"'),
        ):
            _assert_contains(label, history_raw_transcript_card_content, marker)
        for label, marker in (
            ("history selected date header component", "export function HistorySelectedDateHeader({ dateLabel, storageLabel }: HistorySelectedDateHeaderProps)"),
            ("history selected date header date label", "<Text style={styles.label}>{dateLabel}</Text>"),
            ("history selected date header storage label", "<Text style={styles.evidence}>{storageLabel}</Text>"),
            ("history selected date header section style", "sectionHeader: {"),
            ("history selected date header label color", 'color: "#0F3F37"'),
            ("history selected date header evidence line height", "lineHeight: 19"),
        ):
            _assert_contains(label, history_selected_date_header_content, marker)
        for label, marker in (
            ("history selected date panel component", "export function HistorySelectedDatePanel<"),
            ("history selected date panel header", "<HistorySelectedDateHeader dateLabel={selectedDateLabel} storageLabel={selectedStorageLabel} />"),
            ("history selected date panel summary source", "sourceLabel={selectedSourceLabel}"),
            ("history selected date panel tabs", "<HistoryDetailModeTabs activeValue={detailMode} options={detailModeOptions} onPress={onDetailModePress} />"),
            ("history selected date panel empty card", "<HistoryNoRangeRecordsCard body={emptyBody} title={emptyTitle} />"),
            ("history selected date panel structured branch", 'detailMode === "structured"'),
            ("history selected date panel section list", "sectionItems.map((section) => ("),
            ("history selected date panel entry press", "onEntryPress={onEntryPress}"),
            ("history selected date panel raw list", "rawItems.map((item) => ("),
            ("history selected date panel raw card", "<HistoryRawTranscriptCard"),
            ("history selected date panel style", "historySelectedDatePanel: {"),
        ):
            _assert_contains(label, history_selected_date_panel_content, marker)
        for label, marker in (
            ("history selected summary card component", "export function HistorySelectedSummaryCard({ sourceLabel, summaryText, syncLabel }: HistorySelectedSummaryCardProps)"),
            ("history selected summary card title", "<Text style={styles.previewModeBadge}>AI今日摘要</Text>"),
            ("history selected summary card summary text", "<Text style={styles.recordContent}>{summaryText}</Text>"),
            ("history selected summary card sync pill", "<Text style={styles.historyStatusPill}>{syncLabel}</Text>"),
            ("history selected summary card source pill", "<Text style={styles.historyStatusPillMuted}>{sourceLabel}</Text>"),
            ("history selected summary card style", "dailySummaryCard: {"),
            ("history selected summary card background", 'backgroundColor: "#FFFFFF"'),
        ):
            _assert_contains(label, history_selected_summary_card_content, marker)
        for label, marker in (
            ("history sync boundary component", "export function HistorySyncBoundaryBlock({"),
            ("history sync boundary title", "<Text style={styles.label}>{title}</Text>"),
            ("history sync boundary body", "<Text style={styles.evidence}>{body}</Text>"),
            ("history sync boundary accessibility", "accessibilityLabel={loadMoreAccessibilityLabel}"),
            ("history sync boundary disabled state", "accessibilityState={{ disabled: !canLoadMoreRecords }}"),
            ("history sync boundary disabled prop", "disabled={!canLoadMoreRecords}"),
            ("history sync boundary press handler", "onPress={onLoadMore}"),
            ("history sync boundary button label", "<Text style={styles.secondaryButtonText}>{loadMoreLabel}</Text>"),
        ):
            _assert_contains(label, history_sync_boundary_block_content, marker)
        for label, marker in (
            ("field label component", "export function FieldLabel({ icon, label }: FieldLabelProps)"),
            ("field label row style", "fieldLabelRow: {"),
            ("field label icon style", "fieldLabelIcon: {"),
            ("field label text style", "fontWeight: \"800\""),
        ):
            _assert_contains(label, field_label_content, marker)
        for label, marker in (
            ("detail row component", "export function DetailRow({ label, value }: DetailRowProps)"),
            ("detail row string label fallback", 'typeof label === "string" ? <Text style={styles.label}>{label}</Text> : label'),
            ("detail row style", "detailRow: {"),
            ("detail row card background", 'backgroundColor: "#F7FCFA"'),
            ("detail row card padding", "padding: 14"),
            ("detail row record content style", "recordContent: {"),
            ("detail row record content color", 'color: "#1E1E1E"'),
            ("detail row record content line height", "lineHeight: 22"),
        ):
            _assert_contains(label, detail_row_content, marker)
        for label, marker in (
            ("highlight bullet row component", "export function HighlightBulletRow({ text }: HighlightBulletRowProps)"),
            ("highlight bullet row bullet", "<Text style={styles.recordType}>•</Text>"),
            ("highlight bullet row style", "highlightRow: {"),
            ("highlight bullet record type color", 'color: "#3FA67F"'),
            ("highlight bullet evidence line height", "lineHeight: 19"),
            ("record detail boundary highlight bullet row", "boundaryItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
            ("delete confirm highlight bullet row", "deleteConfirmChecklistItems.map((item) => (\n                <HighlightBulletRow key={insightFlowChecklistItemKey(item)} text={insightFlowChecklistItemText(item)} />"),
            ("record update highlight bullet row", "checklistItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
            ("manual submit highlight bullet row", "checklistItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
            ("transcript review highlight bullet row", "transcriptReviewCostBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={recordFlowChecklistItemKey(item)} text={recordFlowChecklistItemText(item)} />"),
            ("ai review highlight bullet row", "aiReviewCostBoundaryChecklistItems.map((item) => (\n                  <HighlightBulletRow key={aiFlowChecklistItemKey(item)} text={aiFlowChecklistItemText(item)} />"),
            ("ai save confirm highlight bullet row", "aiSaveConfirmChecklistItems.map((item) => (\n                <HighlightBulletRow key={aiFlowChecklistItemKey(item)} text={aiFlowChecklistItemText(item)} />"),
            ("save success highlight bullet row", "saveSuccessBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={outcomeChecklistItemKey(item)} text={outcomeChecklistItemText(item)} />"),
            ("delete success highlight bullet row", "deleteSuccessBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={outcomeChecklistItemKey(item)} text={outcomeChecklistItemText(item)} />"),
            ("update success highlight bullet row", "updateSuccessBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={outcomeChecklistItemKey(item)} text={outcomeChecklistItemText(item)} />"),
            ("history boundary highlight bullet row", "boundaryItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
            ("analysis boundary highlight bullet row", "analysisBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={insightFlowChecklistItemKey(item)} text={insightFlowChecklistItemText(item)} />"),
            ("record entry settings highlight bullet row", "recordEntrySettingsChecklistItems.map((item) => (\n                  <HighlightBulletRow key={recordFlowChecklistItemKey(item)} text={recordFlowChecklistItemText(item)} />"),
            ("ai candidate remove highlight bullet row", "aiCandidateRemoveChecklistItems.map((item) => (\n                <HighlightBulletRow key={aiFlowChecklistItemKey(item)} text={aiFlowChecklistItemText(item)} />"),
            ("ai save failure highlight bullet row", "aiSaveFailureChecklistItems.map((item) => (\n                <HighlightBulletRow key={aiFlowChecklistItemKey(item)} text={aiFlowChecklistItemText(item)} />"),
            ("auth boundary highlight bullet row", "authBoundaryChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("profile readiness highlight bullet row", "profileReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("quota readiness highlight bullet row", "quotaReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("reminder readiness highlight bullet row", "reminderReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("privacy readiness highlight bullet row", "privacyReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("tutorial safety highlight bullet row", "tutorialSafetyChecklistItems.map((item) => (\n                <HighlightBulletRow key={settingsChecklistItemKey(item)} text={settingsChecklistItemText(item)} />"),
            ("detailed report notes highlight bullet row", "detailedReportNoteItems.map((item) => (\n                <HighlightBulletRow key={insightFlowChecklistItemKey(item)} text={insightFlowChecklistItemText(item)} />"),
            ("subscription readiness highlight bullet row", "subscriptionReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={subscriptionChecklistItemKey(item)} text={subscriptionChecklistItemText(item)} />"),
            ("subscription management readiness highlight bullet row", "subscriptionManagementReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={subscriptionChecklistItemKey(item)} text={subscriptionChecklistItemText(item)} />"),
            ("doctor share readiness highlight bullet row", "doctorShareReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={futureReadinessChecklistItemKey(item)} text={futureReadinessChecklistItemText(item)} />"),
            ("health integration readiness highlight bullet row", "healthIntegrationReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={futureReadinessChecklistItemKey(item)} text={futureReadinessChecklistItemText(item)} />"),
            ("community readiness highlight bullet row", "communityReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow\n                  key={communityReadinessChecklistItemKey(item)}\n                  text={communityReadinessChecklistItemText(item)}"),
            ("ranking readiness highlight bullet row", "rankingReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={rankingReadinessChecklistItemKey(item)} text={rankingReadinessChecklistItemText(item)} />"),
            ("store checkout readiness highlight bullet row", "storeCheckoutReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={commerceReadinessChecklistItemKey(item)} text={commerceReadinessChecklistItemText(item)} />"),
            ("food photo empty result highlight bullet row", "foodPhotoEmptyResultChecklistItems.map((item) => (\n                <HighlightBulletRow key={commerceReadinessChecklistItemKey(item)} text={commerceReadinessChecklistItemText(item)} />"),
            ("food photo readiness highlight bullet row", "foodPhotoReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={commerceReadinessChecklistItemKey(item)} text={commerceReadinessChecklistItemText(item)} />"),
            ("future module card requirements highlight bullet row", "futureModuleCardRequirements(item).map((requirement) => (\n                      <HighlightBulletRow key={futureModuleRequirementKey(requirement)} text={futureModuleRequirementText(requirement)} />"),
            ("future module detail requirements highlight bullet row", "selectedFutureModuleDisplay.requirements.map((requirement) => (\n                <HighlightBulletRow key={futureModuleRequirementKey(requirement)} text={futureModuleRequirementText(requirement)} />"),
        ):
            if label.startswith("history boundary "):
                target_content = history_intro_status_blocks_content
            elif label.startswith("record detail "):
                target_content = record_detail_info_panel_content
            elif label.startswith("record update "):
                target_content = record_edit_footer_actions_content
            elif label.startswith("manual submit "):
                target_content = manual_record_confirm_footer_actions_content
            elif label.startswith(("delete confirm ", "transcript review ", "ai review ", "ai save confirm ", "save success ", "delete success ", "update success ", "analysis boundary ", "record entry settings ", "ai candidate remove ", "ai save failure ", "auth boundary ", "profile readiness ", "quota readiness ", "reminder readiness ", "privacy readiness ", "tutorial safety ", "detailed report notes ", "subscription readiness ", "subscription management readiness ", "doctor share readiness ", "health integration readiness ", "community readiness ", "ranking readiness ", "store checkout readiness ", "food photo empty result ", "food photo readiness ", "future module card requirements ", "future module detail requirements ")):
                target_content = content
            else:
                target_content = highlight_bullet_row_content
            _assert_contains(label, target_content, marker)
        for label, marker in (
            ("highlight detail row component", "export function HighlightDetailRow({ label, value }: HighlightDetailRowProps)"),
            ("highlight detail row label", "<Text style={styles.recordType}>{label}</Text>"),
            ("highlight detail row value", "<Text style={styles.evidence}>{value}</Text>"),
            ("highlight detail row style", "highlightRow: {"),
            ("highlight detail record type color", 'color: "#3FA67F"'),
            ("highlight detail evidence line height", "lineHeight: 19"),
        ):
            _assert_contains(label, highlight_detail_row_content, marker)
        for label, marker in (
            ("food community share field highlight detail row", "foodCommunityShareFieldRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityShareFieldRowKey(row)}\n                  label={foodCommunityShareFieldRowLabel(row)}\n                  value={foodCommunityShareFieldRowValue(row)}"),
            ("food community ranking highlight detail row", "foodCommunityRankingRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityRankingRowKey(row)}\n                  label={foodCommunityRankingRowLabel(row)}\n                  value={foodCommunityRankingRowValue(row)}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("metric card component", "export function MetricCard({ label, value }: MetricCardProps)"),
            ("metric card label", "<Text style={styles.confidence}>{label}</Text>"),
            ("metric card value", "<Text style={styles.metricValue}>{value}</Text>"),
            ("metric card style", "metricCard: {"),
            ("metric card value color", 'color: "#3FA67F"'),
            ("metric card minimum width", 'minWidth: "46%"'),
        ):
            _assert_contains(label, metric_card_content, marker)
        for label, marker in (
            ("record detail action panel component", "export function RecordDetailActionPanel({"),
            ("record detail action panel fallback copy", "請從今日或歷史頁選擇真實紀錄；未選擇時不可編輯或刪除。"),
            ("record detail action panel edit accessibility", "accessibilityLabel={editAccessibilityLabel}"),
            ("record detail action panel edit press", "onPress={onEditPress}"),
            ("record detail action panel delete accessibility", "accessibilityLabel={deleteAccessibilityLabel}"),
            ("record detail action panel delete disabled state", "accessibilityState={{ disabled }}"),
            ("record detail action panel delete disabled prop", "disabled={disabled}"),
            ("record detail action panel delete press", "onPress={onDeletePress}"),
            ("record detail action panel delete label", "<Text style={styles.dangerButtonText}>刪除</Text>"),
        ):
            _assert_contains(label, record_detail_action_panel_content, marker)
        for label, marker in (
            ("record detail info panel component", "export function RecordDetailInfoPanel({"),
            ("record detail info panel hero date time", "<Text style={styles.confidence}>{dateTimeLabel}</Text>"),
            ("record detail info panel hero summary", "<Text style={styles.detailValue}>{payloadSummary}</Text>"),
            ("record detail info panel date row", 'label={<FieldLabel icon={"📅"} label={dateLabel} />}'),
            ("record detail info panel time row", 'label={<FieldLabel icon={"🕒"} label={timeLabel} />}'),
            ("record detail info panel type row", 'label={<FieldLabel icon={"🏷"} label={typeLabel} />}'),
            ("record detail info panel mapped rows", "detailRows.map((row) => ("),
            ("record detail info row key helper", "function recordDetailInfoRowKey(row: RecordDetailInfoRow)"),
            ("record detail info row key helper fields", "return row.label;"),
            ("record detail info row key helper binding", "key={recordDetailInfoRowKey(row)}"),
            ("record detail info row label helper", "function recordDetailInfoRowLabel(row: RecordDetailInfoRow)"),
            ("record detail info row label helper fields", "return row.label;"),
            ("record detail info row label helper binding", "label={recordDetailInfoRowLabel(row)}"),
            ("record detail info row value helper", "function recordDetailInfoRowValue(row: RecordDetailInfoRow)"),
            ("record detail info row value helper fields", "return row.value;"),
            ("record detail info row value helper binding", "value={recordDetailInfoRowValue(row)}"),
            ("record detail info panel source row", "<DetailRow label={sourceTitle} value={sourceValue} />"),
            ("record detail info panel exercise row", 'label={<FieldLabel icon={"🚶"} label={"運動"} />}'),
            ("record detail info panel medication row", 'label={<FieldLabel icon={"💊"} label={"用藥"} />}'),
            ("record detail info panel boundary bullets", "boundaryItems.map((item) => (\n          <HighlightBulletRow key={item} text={item} />"),
        ):
            _assert_contains(label, record_detail_info_panel_content, marker)
        _assert_not_contains(
            "record detail info direct row binding",
            record_detail_info_panel_content,
            "detailRows.map((row) => (\n          <DetailRow key={row.label} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "record detail info direct row label binding",
            record_detail_info_panel_content,
            "detailRows.map((row) => (\n          <DetailRow key={recordDetailInfoRowKey(row)} label={row.label} value={recordDetailInfoRowValue(row)} />",
        )
        _assert_not_contains(
            "record detail info direct row value binding",
            record_detail_info_panel_content,
            "detailRows.map((row) => (\n          <DetailRow key={recordDetailInfoRowKey(row)} label={recordDetailInfoRowLabel(row)} value={row.value} />",
        )
        for label, marker in (
            ("record edit header fields component", "export function RecordEditHeaderFields({"),
            ("record edit header date label", '<FieldLabel icon={"📅"} label={"日期"} />'),
            ("record edit header date accessibility", "accessibilityLabel={dateAccessibilityLabel}"),
            ("record edit header date value", "value={dateValue}"),
            ("record edit header date handler", "onChangeText={onDateChange}"),
            ("record edit header date max length", "maxLength={dateMaxLength}"),
            ("record edit header time label", '<FieldLabel icon={"🕒"} label={"時間"} />'),
            ("record edit header time accessibility", "accessibilityLabel={timeAccessibilityLabel}"),
            ("record edit header time handler", "onChangeText={onTimeChange}"),
            ("record edit header type label", '<FieldLabel icon={"🏷"} label={"類型"} />'),
            ("record edit header type display", "<Text style={styles.recordContent}>{typeLabel}</Text>"),
        ):
            _assert_contains(label, record_edit_header_fields_content, marker)
        for label, marker in (
            ("manual record create preview action component", "export function ManualRecordCreatePreviewAction({"),
            ("manual record create preview action accessibility", "accessibilityLabel={accessibilityLabel}"),
            ("manual record create preview action role", 'accessibilityRole="button"'),
            ("manual record create preview action disabled state", "accessibilityState={{ disabled }}"),
            ("manual record create preview action disabled prop", "disabled={disabled}"),
            ("manual record create preview action press", "onPress={onPress}"),
            ("manual record create preview action label", "<Text style={styles.primaryButtonText}>{label}</Text>"),
            ("manual record create preview action warning", "warningText ? <Text style={styles.warningText}>{warningText}</Text> : null"),
            ("manual record create preview full button style", "primaryButtonFull: {"),
        ):
            _assert_contains(label, manual_record_create_preview_action_content, marker)
        for label, marker in (
            ("manual record header intro component", "export function ManualRecordHeaderIntro({"),
            ("manual record header title", "<Text style={styles.sectionTitle}>{title}</Text>"),
            ("manual record header back accessibility", "accessibilityLabel={backAccessibilityLabel}"),
            ("manual record header back role", 'accessibilityRole="button"'),
            ("manual record header back press", "onPress={onBackPress}"),
            ("manual record header back label", "<Text style={styles.secondaryButtonText}>{backLabel}</Text>"),
            ("manual record header intro text", "<Text style={styles.evidence}>{introText}</Text>"),
            ("manual record header section style", "sectionHeader: {"),
            ("manual record header evidence style", "evidence: {"),
        ):
            _assert_contains(label, manual_record_header_intro_content, marker)
        for label, marker in (
            ("manual record date time fields component", "export function ManualRecordDateTimeFields({"),
            ("manual record date field label", '<FieldLabel icon={"📅"} label={"日期"} />'),
            ("manual record date accessibility", "accessibilityLabel={dateAccessibilityLabel}"),
            ("manual record date value", "value={dateValue}"),
            ("manual record date handler", "onChangeText={onDateChange}"),
            ("manual record date max length", "maxLength={dateMaxLength}"),
            ("manual record time field label", '<FieldLabel icon={"🕒"} label={"時間"} />'),
            ("manual record time accessibility", "accessibilityLabel={timeAccessibilityLabel}"),
            ("manual record time value", "value={timeValue}"),
            ("manual record time handler", "onChangeText={onTimeChange}"),
            ("manual record time max length", "maxLength={timeMaxLength}"),
            ("manual record date time row style", "dateTimeRow: {"),
            ("manual record date time input style", "input: {"),
        ):
            _assert_contains(label, manual_record_date_time_fields_content, marker)
        for label, marker in (
            ("manual record type selector component", "export function ManualRecordTypeSelector"),
            ("manual record type selector options map", "options.map((type) => ("),
            ("manual record type selector accessibility", "accessibilityLabel={type.accessibilityLabel}"),
            ("manual record type selector role", 'accessibilityRole="button"'),
            ("manual record type selector selected state", "accessibilityState={{ selected: selectedValue === type.value }}"),
            ("manual record type selector press", "onPress={() => onTypePress(type)}"),
            ("manual record type selector label", "{type.label}"),
            ("manual record type selector segment row style", "segmentRow: {"),
            ("manual record type selector active style", "segmentActive: {"),
        ):
            _assert_contains(label, manual_record_type_selector_content, marker)
        for label, marker in (
            ("manual record glucose fields component", "export function ManualRecordGlucoseFields"),
            ("manual record glucose value label", '<FieldLabel icon={"💧"} label={"血糖數值"} />'),
            ("manual record glucose value accessibility", "accessibilityLabel={glucoseValueAccessibilityLabel}"),
            ("manual record glucose value binding", "value={glucoseValue}"),
            ("manual record glucose value handler", "onChangeText={onGlucoseValueChange}"),
            ("manual record glucose keyboard", 'keyboardType="numeric"'),
            ("manual record glucose max length", "maxLength={glucoseValueMaxLength}"),
            ("manual record glucose unit options", "unitOptions.map((option) => ("),
            ("manual record glucose unit selected", "accessibilityState={{ selected: glucoseUnit === option.value }}"),
            ("manual record glucose unit press", "onPress={() => onUnitPress(option)}"),
            ("manual record glucose timing label", '<FieldLabel icon={"◌"} label={"情境"} />'),
            ("manual record glucose timing options", "timingOptions.map((option) => ("),
            ("manual record glucose timing selected", "accessibilityState={{ selected: glucoseTiming === option.value }}"),
            ("manual record glucose timing press", "onPress={() => onTimingPress(option)}"),
            ("manual record glucose input style", "input: {"),
        ):
            _assert_contains(label, manual_record_glucose_fields_content, marker)
        for label, marker in (
            ("manual record meal fields component", "export function ManualRecordMealFields"),
            ("manual record meal type label", '<FieldLabel icon={"🥣"} label={"餐別"} />'),
            ("manual record meal type options", "mealTypeOptions.map((option) => ("),
            ("manual record meal type accessibility", "accessibilityLabel={option.accessibilityLabel}"),
            ("manual record meal type role", 'accessibilityRole="button"'),
            ("manual record meal type selected", "accessibilityState={{ selected: mealType === option.value }}"),
            ("manual record meal type press", "onPress={() => onMealTypePress(option)}"),
            ("manual record food items label", '<FieldLabel icon={"🍽"} label={"飲食內容"} />'),
            ("manual record food items accessibility", "accessibilityLabel={foodItemsAccessibilityLabel}"),
            ("manual record food items value", "value={foodItems}"),
            ("manual record food items handler", "onChangeText={onFoodItemsChange}"),
            ("manual record food items max length", "maxLength={foodItemsMaxLength}"),
            ("manual record food items multiline", "multiline"),
            ("manual record food items text align", 'textAlignVertical="top"'),
            ("manual record meal input style", "input: {"),
            ("manual record meal multiline style", "multilineField: {"),
        ):
            _assert_contains(label, manual_record_meal_fields_content, marker)
        for label, marker in (
            ("manual record exercise fields component", "export function ManualRecordExerciseFields"),
            ("manual record exercise activity label", '<FieldLabel icon={"🚶"} label={"運動"} />'),
            ("manual record exercise activity accessibility", "accessibilityLabel={activityAccessibilityLabel}"),
            ("manual record exercise activity value", "value={activity}"),
            ("manual record exercise activity handler", "onChangeText={onActivityChange}"),
            ("manual record exercise activity max length", "maxLength={activityMaxLength}"),
            ("manual record exercise activity placeholder", 'placeholder="走路"'),
            ("manual record exercise minutes label", '<FieldLabel icon={"⏱"} label={"時長（分鐘）"} />'),
            ("manual record exercise minutes accessibility", "accessibilityLabel={minutesAccessibilityLabel}"),
            ("manual record exercise minutes value", "value={minutes}"),
            ("manual record exercise minutes handler", "onChangeText={onMinutesChange}"),
            ("manual record exercise minutes keyboard", 'keyboardType="numeric"'),
            ("manual record exercise minutes max length", "maxLength={minutesMaxLength}"),
            ("manual record exercise minutes placeholder", 'placeholder="20"'),
            ("manual record exercise input style", "input: {"),
        ):
            _assert_contains(label, manual_record_exercise_fields_content, marker)
        for label, marker in (
            ("manual record medication fields component", "export function ManualRecordMedicationFields"),
            ("manual record medication name label", '<FieldLabel icon={"💊"} label={"用藥"} />'),
            ("manual record medication name accessibility", "accessibilityLabel={nameAccessibilityLabel}"),
            ("manual record medication name value", "value={name}"),
            ("manual record medication name handler", "onChangeText={onNameChange}"),
            ("manual record medication name max length", "maxLength={nameMaxLength}"),
            ("manual record medication name placeholder", 'placeholder="藥名或胰島素描述"'),
            ("manual record medication dose label", '<FieldLabel icon={"▣"} label={"劑量"} />'),
            ("manual record medication dose accessibility", "accessibilityLabel={doseAccessibilityLabel}"),
            ("manual record medication dose value", "value={dose}"),
            ("manual record medication dose handler", "onChangeText={onDoseChange}"),
            ("manual record medication dose max length", "maxLength={doseMaxLength}"),
            ("manual record medication dose placeholder", 'placeholder="例如：1 顆、8u"'),
            ("manual record medication input style", "input: {"),
        ):
            _assert_contains(label, manual_record_medication_fields_content, marker)
        for label, marker in (
            ("manual record note fields component", "export function ManualRecordNoteFields"),
            ("manual record note kind label", '<FieldLabel icon={"📝"} label={"備註類型"} />'),
            ("manual record note kind accessibility", "accessibilityLabel={kindAccessibilityLabel}"),
            ("manual record note kind value", "value={kind}"),
            ("manual record note kind handler", "onChangeText={onKindChange}"),
            ("manual record note kind max length", "maxLength={kindMaxLength}"),
            ("manual record note kind placeholder", 'placeholder="symptom"'),
            ("manual record note tags label", '<FieldLabel icon={"#"} label={"標籤"} />'),
            ("manual record note tags accessibility", "accessibilityLabel={tagsAccessibilityLabel}"),
            ("manual record note tags value", "value={tags}"),
            ("manual record note tags handler", "onChangeText={onTagsChange}"),
            ("manual record note tags max length", "maxLength={tagsMaxLength}"),
            ("manual record note tags multiline", "multiline"),
            ("manual record note tags text align", 'textAlignVertical="top"'),
            ("manual record note tags placeholder", 'placeholder="頭暈、疲倦"'),
            ("manual record note input style", "input: {"),
            ("manual record note multiline style", "multilineField: {"),
        ):
            _assert_contains(label, manual_record_note_fields_content, marker)
        for label, marker in (
            ("record edit footer actions component", "export function RecordEditFooterActions({"),
            ("record edit footer precheck title", "<Text style={styles.label}>{preCheckTitle}</Text>"),
            ("record edit footer checklist", "checklistItems.map((item) => ("),
            ("record edit footer cancel accessibility", "accessibilityLabel={cancelAccessibilityLabel}"),
            ("record edit footer cancel press", "onPress={onCancelPress}"),
            ("record edit footer submit accessibility", "accessibilityLabel={submitAccessibilityLabel}"),
            ("record edit footer disabled state", "accessibilityState={{ disabled }}"),
            ("record edit footer disabled prop", "disabled={disabled}"),
            ("record edit footer submit press", "onPress={onSubmitPress}"),
            ("record edit footer validation text", "validationText ? <Text style={styles.warningText}>{validationText}</Text> : null"),
        ):
            _assert_contains(label, record_edit_footer_actions_content, marker)
        for label, marker in (
            ("manual record confirm footer actions component", "export function ManualRecordConfirmFooterActions({"),
            ("manual record confirm footer precheck title", "<Text style={styles.label}>{preCheckTitle}</Text>"),
            ("manual record confirm footer checklist", "checklistItems.map((item) => ("),
            ("manual record confirm footer return accessibility", "accessibilityLabel={returnAccessibilityLabel}"),
            ("manual record confirm footer return disabled state", "accessibilityState={{ disabled: returnDisabled }}"),
            ("manual record confirm footer return disabled prop", "disabled={returnDisabled}"),
            ("manual record confirm footer return press", "onPress={onReturnPress}"),
            ("manual record confirm footer submit accessibility", "accessibilityLabel={submitAccessibilityLabel}"),
            ("manual record confirm footer submit disabled state", "accessibilityState={{ disabled: submitDisabled }}"),
            ("manual record confirm footer submit disabled prop", "disabled={submitDisabled}"),
            ("manual record confirm footer submit press", "onPress={onSubmitPress}"),
            ("manual record confirm footer warning text", "warningText ? <Text style={styles.warningText}>{warningText}</Text> : null"),
        ):
            _assert_contains(label, manual_record_confirm_footer_actions_content, marker)
        for label, marker in (
            ("manual record confirm preview block component", "export function ManualRecordConfirmPreviewBlock({"),
            ("manual record confirm preview badge", "<Text style={styles.previewModeBadge}>{badgeLabel}</Text>"),
            ("manual record confirm preview intro", "<Text style={styles.evidence}>{introText}</Text>"),
            ("manual record confirm preview icon", "<Text>{icon}</Text>"),
            ("manual record confirm preview type label", "<Text style={styles.recordType}>{typeLabel}</Text>"),
            ("manual record confirm preview payload summary", "<Text style={styles.recordContent}>{payloadSummary}</Text>"),
            ("manual record confirm preview source line", "<Text style={styles.evidence}>{sourceLine}</Text>"),
            ("manual record confirm preview card style", "emptyStateCard: {"),
            ("manual record confirm preview badge style", "previewModeBadge: {"),
        ):
            _assert_contains(label, manual_record_confirm_preview_block_content, marker)
        for label, marker in (
            ("analysis metric card render", "analysisMetricRows.map((row) => (\n                <MetricCard key={analysisMetricRowKey(row)} label={analysisMetricRowLabel(row)} value={analysisMetricRowValue(row)} />"),
            ("detailed report metric card render", "detailedReportMetricRows.map((row) => (\n                <MetricCard key={detailedReportMetricRowKey(row)} label={detailedReportMetricRowLabel(row)} value={detailedReportMetricRowValue(row)} />"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("record detail checklist helper binding", "const recordDetailBoundaryChecklistItems = recordDetailBoundaryChecklistDisplayItems();"),
            ("record detail info panel binding", "<RecordDetailInfoPanel\n              boundaryItems={recordDetailBoundaryChecklistItems}"),
            ("record detail mapped detail row binding", "detailRows={selectedRecordDetailRows}"),
            ("record detail source detail row binding", "sourceTitle={coreFlowDisplayLabels.source}"),
            ("record detail selected datetime helper", "function selectedRecordDetailDateTimeLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected datetime helper fields", 'return item?.dateTimeLabel ?? "尚未選擇紀錄";'),
            ("record detail selected datetime helper binding", "dateTimeLabel={selectedRecordDetailDateTimeLabel(selectedRecordDisplayItem)}"),
            ("record detail selected rows helper", "function selectedRecordDetailDisplayRows(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected rows helper fields", "return item?.detailRows ?? [];"),
            ("record detail selected rows helper binding", "const selectedRecordDetailRows = selectedRecordDetailDisplayRows(selectedRecordDisplayItem);"),
            ("record detail selected date helper", "function selectedRecordDetailDateLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected date helper fields", 'return item?.dateLabel ?? "尚無";'),
            ("record detail selected date helper binding", "dateValue={selectedRecordDetailDateLabel(selectedRecordDisplayItem)}"),
            ("record detail selected exercise helper", "function selectedRecordDetailExerciseSummary(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected exercise helper fields", 'return item?.exerciseSummary ?? "無";'),
            ("record detail selected exercise helper binding", "exerciseValue={selectedRecordDetailExerciseSummary(selectedRecordDisplayItem)}"),
            ("record detail selected medication helper", "function selectedRecordDetailMedicationSummary(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected medication helper fields", 'return item?.medicationSummary ?? "無";'),
            ("record detail selected medication helper binding", "medicationValue={selectedRecordDetailMedicationSummary(selectedRecordDisplayItem)}"),
            ("record detail selected payload helper", "function selectedRecordDetailPayloadSummary(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected payload helper fields", 'return item?.payloadSummary ?? "沒有資料";'),
            ("record detail selected payload helper binding", "payloadSummary={selectedRecordDetailPayloadSummary(selectedRecordDisplayItem)}"),
            ("record detail selected source helper", "function selectedRecordDetailSourceLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected source helper fields", 'return item?.sourceLabel ?? "尚無";'),
            ("record detail selected source helper binding", "sourceValue={selectedRecordDetailSourceLabel(selectedRecordDisplayItem)}"),
            ("record detail selected time helper", "function selectedRecordDetailTimeLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected time helper fields", 'return item?.timeLabel ?? "尚無";'),
            ("record detail selected time helper binding", "timeValue={selectedRecordDetailTimeLabel(selectedRecordDisplayItem)}"),
            ("record detail selected type helper", "function selectedRecordDetailTypeLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record detail selected type helper fields", 'return item?.typeLabel ?? "請從今日或歷史紀錄選擇一筆真實紀錄。";'),
            ("record detail selected type helper binding", "typeValue={selectedRecordDetailTypeLabel(selectedRecordDisplayItem)}"),
            ("preview edit type label helper", "function previewRecordEditTypeLabel(item: ReturnType<typeof pendingRecordDisplayItem> | null)"),
            ("preview edit type label helper fields", 'return item?.typeLabel ?? "紀錄";'),
            ("preview edit type label helper binding", "{previewRecordEditTypeLabel(selectedPreviewRecordDisplayItem)}"),
            ("record edit header type label helper", "function recordEditHeaderTypeLabel(item: ReturnType<typeof recordDetailDisplayItem> | null)"),
            ("record edit header type label helper fields", 'return item?.typeLabel ?? "紀錄";'),
            ("record edit header type label helper binding", "typeLabel={recordEditHeaderTypeLabel(selectedRecordDisplayItem)}"),
        ):
            _assert_contains(label, content, marker)
        record_detail_screen_block = _match_block(
            content,
            r'(currentScreen === "recordDetail"[\s\S]*?<RecordDetailActionPanel)',
            "record detail screen render block",
        )
        for label, marker in (
            ("record detail direct rows fallback binding", "selectedRecordDisplayItem?.detailRows ?? []"),
            ("record detail direct datetime fallback binding", 'selectedRecordDisplayItem?.dateTimeLabel ?? "尚未選擇紀錄"'),
            ("record detail direct date fallback binding", 'selectedRecordDisplayItem?.dateLabel ?? "尚無"'),
            ("record detail direct exercise fallback binding", 'selectedRecordDisplayItem?.exerciseSummary ?? "無"'),
            ("record detail direct medication fallback binding", 'selectedRecordDisplayItem?.medicationSummary ?? "無"'),
            ("record detail direct payload fallback binding", 'selectedRecordDisplayItem?.payloadSummary ?? "沒有資料"'),
            ("record detail direct source fallback binding", 'selectedRecordDisplayItem?.sourceLabel ?? "尚無"'),
            ("record detail direct time fallback binding", 'selectedRecordDisplayItem?.timeLabel ?? "尚無"'),
            ("record detail direct type fallback binding", 'selectedRecordDisplayItem?.typeLabel ?? "請從今日或歷史紀錄選擇一筆真實紀錄。"'),
        ):
            _assert_not_contains(label, record_detail_screen_block, marker)
        for block_label, pattern, marker in (
            (
                "preview edit type label render block",
                r'(currentScreen === "editPreviewRecord"[\s\S]*?<Text style=\{styles\.recordContent\}>\{previewRecordEditTypeLabel\(selectedPreviewRecordDisplayItem\)\}</Text>)',
                'selectedPreviewRecordDisplayItem?.typeLabel ?? "紀錄"',
            ),
            (
                "record edit header render block",
                r'(currentScreen === "editRecord"[\s\S]*?<RecordEditHeaderFields[\s\S]*?onTimeChange=\{updateRecordEditTimeInput\})',
                'selectedRecordDisplayItem?.typeLabel ?? "紀錄"',
            ),
        ):
            edit_type_label_block = _match_block(content, pattern, block_label)
            _assert_not_contains(f"{block_label} direct fallback binding", edit_type_label_block, marker)
        manual_confirm_preview_block = _match_block(
            content,
            r'(currentScreen === "manualRecordConfirm"[\s\S]*?<ManualRecordConfirmFooterActions)',
            "manual record confirm preview render block",
        )
        for label, marker in (
            ("manual confirm direct icon binding", "icon={manualRecordConfirmDisplay.icon}"),
            ("manual confirm direct payload binding", "payloadSummary={manualRecordConfirmDisplay.payloadSummary}"),
            ("manual confirm direct source binding", "sourceLine={manualRecordConfirmDisplay.sourceLine}"),
            ("manual confirm direct type binding", "typeLabel={manualRecordConfirmDisplay.typeLabel}"),
        ):
            _assert_not_contains(label, manual_confirm_preview_block, marker)
        for label, marker in (
            ("app types account alias", "export type Account = AccountTransformSource;"),
            ("app types profile alias", "export type Profile = ProfileTransformSource;"),
            ("app types AI model options alias", "export type AiModelOptions = AiModelOptionsTransformSource<AiModelOption>;"),
            ("app types voice quota alias", "export type VoiceQuota = VoiceQuotaTransformSource;"),
            ("app types auth token alias", "export type AuthTokenResponse = AuthTokenResponseTransformSource;"),
            ("app types auth session alias", "export type AuthSessionItem = AuthSessionDisplaySource;"),
            ("app types basic report alias", "export type BasicReport = BasicReportTransformSource;"),
            ("app types save-entry method alias", 'export type SaveEntryMethod = "ai" | "manual" | null;'),
        ):
            _assert_contains(label, app_types_content, marker)
        _assert_contains(
            "daily record save response type",
            daily_transcript_content,
            "export type DailyRecordSaveResponse = {",
        )
        for label, marker in (
            ("app local api url normalizer", "function normalizeApiBaseUrl(value: string)"),
            ("app local ui message bound", "function boundUiMessage(value: string)"),
            ("app local display bound", "function boundDisplayText(value: string, maxLength = maxDisplayTextLength)"),
            ("app local number clamp", "function clampNumber(value: number, min: number, max: number)"),
            ("app local auxiliary labels helper", "function auxiliarySectionLabels()"),
            ("app local account type block", "type Account = {\n  id: string;"),
            ("app local profile type block", "type Profile = {\n  id: string;"),
            ("app local AI model option type block", "type AiModelOption = {\n  id: string;"),
            ("app local voice quota type block", "type VoiceQuota = {\n  plan_code: string;"),
            ("app local auth token type block", "type AuthTokenResponse = {\n  access_token: string;"),
            ("app local daily record save response type block", "type DailyRecordSaveResponse = {\n  daily_record: {"),
            ("app local auth session type block", "type AuthSessionItem = {\n  id: string;"),
            ("app local basic report type block", "type BasicReport = {\n  profile_id: string;"),
            ("app local account type alias", "type Account = AccountTransformSource;"),
            ("app local profile type alias", "type Profile = ProfileTransformSource;"),
            ("app local AI model option type alias", "type AiModelOption = AiModelOptionTransformSource;"),
            ("app local AI model options type alias", "type AiModelOptions = AiModelOptionsTransformSource<AiModelOption>;"),
            ("app local voice quota type alias", "type VoiceQuota = VoiceQuotaTransformSource;"),
            ("app local auth token type alias", "type AuthTokenResponse = AuthTokenResponseTransformSource;"),
            ("app local auth session type alias", "type AuthSessionItem = AuthSessionDisplaySource;"),
            ("app local basic report type alias", "type BasicReport = BasicReportTransformSource;"),
            ("app local save-entry method alias", 'type SaveEntryMethod = "ai" | "manual" | null;'),
            ("app local field label renderer", "function renderFieldLabel(icon: string, label: string)"),
            ("app local field label row style", "fieldLabelRow: {"),
            ("app local field label icon style", "fieldLabelIcon: {"),
            ("app local json request wrapper", "async function requestJson<T>("),
            ("app local no-content request wrapper", "async function requestNoContent(apiBaseUrl: string, path: string, init?: RequestInit)"),
            ("app local protected request headers wrapper", "function protectedRequestHeaders(accountId: string, accessToken: string): Record<string, string>"),
            ("app local default API base URL", "const defaultApiBaseUrl ="),
            ("app local debug flag", "const enableDebugTools = process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS"),
            ("app local dev auth flag", "const allowMobileDevAuth = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH"),
            ("app local sample transcript", "const sampleText ="),
            ("app local record sync limit", "const mobileRecordSyncLimit = 100;"),
            ("app local record cache limit", "const maxMobileRecordCacheLimit = 500;"),
            ("app local report query limit", "const mobileReportQueryLimit = 500;"),
            ("app local year review share file helper", "async function writeYearReviewShareAssetFile(asset: YearReviewApiShareAsset)"),
            ("app local filesystem import", 'import * as FileSystem from "expo-file-system";'),
        ):
            _assert_not_contains(label, content, marker)
        _verify_daily_record_contract(content, daily_transcript_content)
        _verify_basic_report_contract()

        _assert_contains(
            "header menu action",
            content,
            'headerBackTarget === "menu" && currentScreen !== "menu" && !currentChrome.actionLabel',
        )
        _assert_contains(
            "header fallback screen opener binding",
            content,
            "openScreen(headerBackTarget);",
        )
        _assert_contains(
            "header back target helper binding",
            content,
            "const headerBackTarget = headerBackTargetForScreen(currentScreen, currentChrome, {",
        )
        _assert_contains(
            "header back target helper",
            navigation_content,
            "function headerBackTargetForScreen(",
        )
        _assert_contains(
            "header back target state type",
            navigation_content,
            "type HeaderBackTargetState = {",
        )
        _assert_contains(
            "header back target settings subpage set",
            navigation_content,
            "const settingsSubpageScreens = new Set<AppScreen>([",
        )
        _assert_contains(
            "settings subpage screen helper",
            navigation_content,
            "export function isSettingsSubpageScreen(screen: AppScreen)",
        )
        _assert_contains(
            "settings subpage screen helper set binding",
            navigation_content,
            "return settingsSubpageScreens.has(screen);",
        )
        _assert_contains(
            "header back target settings fallback",
            navigation_content,
            'if (isSettingsSubpageScreen(currentScreen)) {\n    return "settings";\n  }',
        )
        _assert_contains(
            "header back target chrome fallback",
            navigation_content,
            'return chrome.backTo ?? "menu";',
        )
        _assert_contains(
            "MVP flow stepper state helper",
            navigation_content,
            "function mvpFlowStepperState(value: {",
        )
        _assert_contains(
            "MVP flow failure maps to save confirm",
            navigation_content,
            'const currentFlowScreen = value.currentScreen === "aiSaveFailure" ? "aiSaveConfirm" : value.currentScreen;',
        )
        _assert_contains(
            "MVP flow stepper hides today",
            navigation_content,
            'value.currentScreen !== "today" &&',
        )
        _assert_contains(
            "MVP flow manual save success condition",
            navigation_content,
            'value.currentScreen !== "saveSuccess" || value.lastSaveEntryMethod !== "manual" || value.hasUnsavedPreviewRecords',
        )
        _assert_contains(
            "primary tab navigation state helper",
            navigation_content,
            "function primaryTabNavigationState(value: { currentScreen: AppScreen; isAnyRequestInFlight: boolean })",
        )
        _assert_contains(
            "primary tab current state helper",
            navigation_content,
            "const isCurrent = value.currentScreen === screen.id;",
        )
        _assert_contains(
            "primary tab locked state helper",
            navigation_content,
            "isLocked: value.isAnyRequestInFlight && !isCurrent",
        )
        _assert_contains(
            "primary tab hide today helper",
            navigation_content,
            'show: value.currentScreen !== "today" && items.some((item) => item.isCurrent)',
        )
        _assert_contains(
            "transcript review return target helper",
            navigation_content,
            "function transcriptReviewReturnTargetForScreen(currentScreen: AppScreen)",
        )
        _assert_contains(
            "transcript review today return helper",
            navigation_content,
            'return currentScreen === "today" ? "today" : "record";',
        )
        _assert_contains(
            "minimal home chrome keeps menu fallback",
            navigation_content,
            'today: { subtitle: "" }',
        )
        for label, marker in (
            ("deepseek initial llm model state", 'const [llmModelId, setLlmModelId] = useState("deepseek-chat");'),
            (
                "deepseek preferred model helper",
                "function preferredLlmModelOption(modelOptions: AiModelOptions)",
            ),
            (
                "deepseek preferred model helper priority",
                'modelOptions.llm_models.find((model) => model.id === "deepseek-chat" && model.available) ??',
            ),
            (
                "default STT model helper",
                "function defaultSttModelOption(modelOptions: AiModelOptions)",
            ),
            (
                "boot default STT helper binding",
                "const defaultStt = defaultSttModelOption(modelOptions);",
            ),
            (
                "boot preferred LLM helper binding",
                "const preferredLlm = preferredLlmModelOption(modelOptions);",
            ),
            ("deepseek record parse request binding", "llm_model_id: llmModelId"),
            ("selected model display label helper", "function selectedModelDisplayLabel(model: { label: string } | null | undefined, fallbackId: string)"),
            ("selected model display label helper fields", "return model?.label ?? fallbackId;"),
            ("selected model runtime label helper", "function selectedModelRuntimeDisplayLabel("),
            ("selected model runtime label helper fields", "return modelRuntimeLabel(model?.runtime);"),
            ("deepseek selected model status render", "LLM：{selectedModelDisplayLabel(selectedLlmModel, llmModelId)}"),
            ("record STT selected model status render", "STT：{selectedModelDisplayLabel(selectedSttModel, sttModelId)}"),
            ("screen opener helper", "function openScreen(screen: AppScreen) {\n    setCurrentScreen(screen);\n  }"),
            ("screen status opener delegates to screen opener", "function openScreenWithStatus(screen: AppScreen, statusMessage: string) {\n    openScreen(screen);\n    setStatus(statusMessage);"),
            ("transcript review return target helper binding", "setTranscriptReviewReturnScreen(transcriptReviewReturnTargetForScreen(currentScreen));"),
            ("transcript review open status helper binding", 'openScreenWithStatus("transcriptReview", transcriptReviewReadyStatusMessage());'),
            ("transcript review edit return status helper binding", 'openScreenWithStatus("transcriptReview", transcriptReturnEditStatusMessage());'),
            ("home recording timer state", "const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);"),
            ("home recording timer interval", "const timer = setInterval(() => {"),
            ("home recording timer clamp", "setRecordingElapsedSeconds(clampNumber(nextElapsedSeconds, 0, limitSeconds));"),
            ("home recording auto stop at limit", 'void finishRecordingPreview("limit");'),
            ("home recording secondary hint render", "<Text style={styles.homeHintSecondary}>{homeRecordingSecondaryHintDisplayText}</Text>"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "home recording secondary hint active copy",
            recording_copy_content,
            "已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒，放開即結束",
        )
        _assert_not_contains(
            "home recording must not render a third timer line",
            content,
            '<Text style={styles.homeRecordingTimer}>{recordingElapsedSecondsDisplayText}</Text>',
        )
        _assert_not_contains(
            "home recording timer style must not exist",
            content,
            "homeRecordingTimer: {",
        )
        for label, marker in (
            ("record settings direct LLM label fallback", "selectedLlmModel?.label ?? llmModelId"),
            ("record settings direct LLM runtime fallback", "modelRuntimeLabel(selectedLlmModel?.runtime)"),
            ("record settings direct STT label fallback", "selectedSttModel?.label ?? sttModelId"),
            ("record settings direct STT runtime fallback", "modelRuntimeLabel(selectedSttModel?.runtime)"),
        ):
            _assert_not_contains(label, content, marker)
        default_stt_helper_marker = "const defaultStt = defaultSttModelOption(modelOptions);"
        if content.count(default_stt_helper_marker) < 2:
            raise AssertionError("Default STT helper must be used in both boot and dev reconnect model selection paths.")
        preferred_llm_helper_marker = "const preferredLlm = preferredLlmModelOption(modelOptions);"
        if content.count(preferred_llm_helper_marker) < 2:
            raise AssertionError("Preferred LLM helper must be used in both boot and dev reconnect model selection paths.")
        _assert_not_contains(
            "direct default STT boot fallback",
            content,
            "const defaultStt = modelOptions.stt_models.find((model) => model.available) ?? modelOptions.stt_models[0];",
        )
        _assert_not_contains(
            "minimal home chrome must not override hamburger action",
            navigation_content,
            'today: { subtitle: "", backTo:',
        )
        _assert_not_contains(
            "minimal home chrome must not set close/back action label",
            navigation_content,
            'today: { subtitle: "", actionLabel:',
        )
        _assert_contains(
            "header hamburger fallback glyph",
            content,
            '<Text style={styles.menuButtonText}>{currentChrome.actionLabel ?? "☰"}</Text>',
        )
        primary_screens_block = _match_block(
            navigation_content,
            r"const primaryScreens: Array<\{ id: AppScreen; label: string \}> = \[([\s\S]*?)\n\];",
            "primaryScreens block",
        )
        for label, marker in (
            ("primary tab today", '{ id: "today", label: "今日" }'),
            ("primary tab record", '{ id: "record", label: "記錄" }'),
            ("primary tab menu", '{ id: "menu", label: "選單" }'),
        ):
            _assert_contains(label, primary_screens_block, marker)
        for label, marker in (
            ("history primary tab", 'id: "history"'),
            ("analysis primary tab", 'id: "analysis"'),
            ("achievements primary tab", 'id: "achievements"'),
        ):
            _assert_not_contains(label, primary_screens_block, marker)
        screen_chrome_block = navigation_content
        for label, marker in (
            ("history uses hamburger chrome fallback", 'history: { subtitle: "查詢過去的血糖、飲食與運動紀錄。" }'),
            ("analysis uses hamburger chrome fallback", 'analysis: { subtitle: "查看最近血糖趨勢與簡單摘要。" }'),
        ):
            _assert_contains(label, screen_chrome_block, marker)
        _assert_contains(
            "primary menu return",
            content,
            'setMenuReturnScreen(returnScreen === "menu" ? "today" : returnScreen);',
        )
        _assert_contains(
            "primary menu screen opener binding",
            content,
            'setMenuReturnScreen(returnScreen === "menu" ? "today" : returnScreen);\n    openScreen("menu");',
        )

        for target in sorted(EXPECTED_MENU_BACK_TARGETS):
            _assert_contains(
                f"{target} back-to-menu chrome",
                navigation_content,
                f'{target}: {{ subtitle: ',
            )

        _assert_contains(
            "destination-aware return labels",
            first_version_flow_copy_content,
            "function returnDestinationButtonLabel(destination: AppScreen)",
        )
        for label, marker in (
            ("destination return future modules label", "返回未來擴充"),
            ("destination return menu label", "返回功能選單"),
            ("destination return previous label", "返回上一頁"),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for screen in sorted(EXPECTED_PREVIEW_RETURN_CTA_SCREENS):
            label_name = f"{screen}ReturnButtonDisplayLabel"
            return_state_name = f"{screen}ReturnScreen"
            _assert_contains(
                f"{screen} return label",
                content,
                f"const {label_name} = returnDestinationButtonLabel({return_state_name});",
            )
            direct_return_marker = f"setCurrentScreen({return_state_name})"
            helper_return_marker = f"returnFromFuturePreviewScreen({return_state_name})"
            if direct_return_marker not in content and helper_return_marker not in content:
                raise AssertionError(
                    f"{screen} return handler missing expected guard: "
                    f"{direct_return_marker} or {helper_return_marker}"
                )
            _assert_contains(
                f"{screen} return CTA render",
                content,
                f"{{{label_name}}}",
            )

        _assert_contains(
            "header accessibility helper",
            first_version_flow_copy_content,
            "function headerActionAccessibilityLabel(chrome: { actionLabel?: string })",
        )
        for label, marker in (
            ("header accessibility close copy", "關閉目前頁面"),
            ("header accessibility back copy", "返回上一頁"),
            ("header accessibility menu copy", "開啟功能選單"),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        _assert_contains(
            "header accessibility label binding",
            content,
            "accessibilityLabel={headerActionDisplayAccessibilityLabel}",
        )
        _assert_contains(
            "primary tab accessibility helper",
            first_version_flow_copy_content,
            "function primaryTabAccessibilityLabel(label: string)",
        )
        _assert_contains(
            "primary tab accessibility copy",
            first_version_flow_copy_content,
            "只切換 App 內頁面",
        )
        _assert_contains(
            "primary tab accessibility binding",
            content,
            "accessibilityLabel={primaryTabAccessibility}",
        )
        _assert_contains(
            "primary tab selected accessibility state",
            content,
            "accessibilityState={{ disabled: isPrimaryTabLocked, selected: isCurrentPrimaryTab }}",
        )
        _assert_contains(
            "primary tab item render helper binding",
            content,
            "primaryTabItems.map((screen) => {",
        )
        _assert_contains(
            "primary tab current helper binding",
            content,
            "const isCurrentPrimaryTab = primaryTabIsCurrent(screen);",
        )
        _assert_contains(
            "primary tab locked helper binding",
            content,
            "const isPrimaryTabLocked = primaryTabIsLocked(screen);",
        )
        _assert_contains(
            "close-button accessibility label copy",
            shared_display_items_content,
            "closeReturn: boundDisplayText(\"關閉並返回\", maxDisplayTextLength)",
        )
        unlabeled_close_buttons = _unlabeled_close_buttons(content)
        if unlabeled_close_buttons:
            raise AssertionError(
                "close buttons missing accessibilityLabel: "
                + " | ".join(unlabeled_close_buttons[:3])
            )
        unlabeled_pressables = _unlabeled_pressables(content)
        if unlabeled_pressables:
            raise AssertionError(
                "Pressables missing accessibilityLabel: "
                + " | ".join(unlabeled_pressables[:5])
            )
        pressable_label_source_errors = _pressable_label_source_errors(content)
        if pressable_label_source_errors:
            raise AssertionError(
                "Pressable accessibilityLabel must be static or bounded display sources: "
                + " | ".join(pressable_label_source_errors[:5])
            )
        pressables_missing_role = _pressables_missing_button_role(content)
        if pressables_missing_role:
            raise AssertionError(
                "Pressables missing accessibilityRole button: "
                + " | ".join(pressables_missing_role[:5])
            )
        disabled_pressables_missing_state = _disabled_pressables_missing_state(content)
        if disabled_pressables_missing_state:
            raise AssertionError(
                "Disabled Pressables missing accessibilityState: "
                + " | ".join(disabled_pressables_missing_state[:5])
            )
        disabled_pressables_mismatched_state = _disabled_pressables_mismatched_state(content)
        if disabled_pressables_mismatched_state:
            raise AssertionError(
                "Disabled Pressables accessibilityState does not match disabled prop: "
                + " | ".join(disabled_pressables_mismatched_state[:5])
            )
        selected_pressables_mismatched_state = _selected_pressables_mismatched_state(content)
        if selected_pressables_mismatched_state:
            raise AssertionError(
                "Selected Pressables accessibilityState does not match selected visual state: "
                + " | ".join(selected_pressables_mismatched_state[:5])
            )
        _assert_contains(
            "recording accessibility helper",
            first_version_flow_copy_content,
            "function recordingButtonAccessibilityLabel(isRecording: boolean)",
        )
        for label, marker in (
            ("recording active accessibility copy", "錄音預覽進行中，放開結束"),
            ("recording idle accessibility copy", "按住開始錄音預覽"),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        _assert_contains(
            "recording accessibility binding",
            content,
            "accessibilityLabel={recordingButtonDisplayAccessibilityLabel}",
        )
        _assert_contains(
            "recording result primary action helper",
            content,
            "function handleRecordingResultPrimaryAction(returnScreen: AppScreen)",
        )
        _assert_contains(
            "parser preview state clear helper",
            content,
            "function clearParserPreviewState()",
        )
        _assert_contains(
            "transcript draft state clear helper",
            content,
            "function clearTranscriptDraftState()",
        )
        _assert_contains(
            "transcript draft state clear helper internals",
            content,
            "function clearTranscriptDraftState() {\n    setTranscript(\"\");\n    setTranscriptVoiceSeconds(0);\n    setIsTranscriptSample(false);",
        )
        _assert_contains(
            "transcript retry clears draft helper binding",
            content,
            "function retryTranscriptInput() {\n    setIsRecordingPreview(false);\n    setRecordingStartedAt(null);\n    setRecordingElapsedSeconds(0);\n    clearTranscriptDraftState();",
        )
        _assert_contains(
            "parser preview state clear helper internals",
            content,
            "function clearParserPreviewState() {\n    setPreview(null);\n    setParserRecoveryMessage(\"\");",
        )
        _assert_contains(
            "daily record draft organization clear helper",
            content,
            "function clearDailyRecordDraftOrganizationState()",
        )
        _assert_contains(
            "daily record draft organization clear helper internals",
            content,
            "function clearDailyRecordDraftOrganizationState() {\n    setDailyTranscriptEntries([]);\n    setDailyRecordOrganizationRevision(0);\n    setDailyRecordOrganizationReason(null);",
        )
        _assert_contains(
            "transcript draft update clears parser preview helper binding",
            content,
            "setTranscriptVoiceSeconds(\n      source === \"voice\" && boundedValue.trim().length > 0\n        ? clampNumber(voiceSeconds, 0, maxMobileCountValue)\n        : 0\n    );\n    clearParserPreviewState();",
        )
        _assert_contains(
            "recording runtime clear helper",
            content,
            "function clearRecordingPreviewRuntime(elapsedSeconds = 0)",
        )
        _assert_contains(
            "recording runtime clear helper internals",
            content,
            "function clearRecordingPreviewRuntime(elapsedSeconds = 0) {\n    setIsRecordingPreview(false);\n    setRecordingStartedAt(null);\n    setRecordingElapsedSeconds(elapsedSeconds);",
        )
        _assert_contains(
            "recording reset uses runtime clear helper",
            content,
            "function resetRecordingPreview() {\n    audioRecordingRef.current = null;\n    clearRecordingPreviewRuntime();",
        )
        recording_result_action_block = _function_block(content, "handleRecordingResultPrimaryAction")
        for label, marker in (
            ("recording short result bound", "const boundedSeconds = clampNumber(recordingElapsedSeconds, 0, maxMobileCountValue);"),
            ("recording short result reset guard", "if (boundedSeconds <= 1) {"),
            ("recording short result reset action", "resetRecordingPreview();"),
            ("recording short result no transcription", "return;"),
            ("recording text fallback runtime clear", "clearRecordingPreviewRuntime();"),
            ("recording text fallback open status helper binding", 'openScreenWithStatus("record", recordingTextFallbackStatusMessage());'),
        ):
            _assert_contains(label, recording_result_action_block, marker)
        finish_recording_block = _function_block(content, "finishRecordingPreview")
        _assert_contains(
            "home recording finish runtime clear with elapsed seconds",
            finish_recording_block,
            "clearRecordingPreviewRuntime(elapsedSeconds);",
        )
        _assert_contains(
            "home recording finish enters transcript review for non-trivial audio",
            finish_recording_block,
            "if (shouldOpenTodayRecordingTranscriptReview(currentScreen, elapsedSeconds)) {",
        )
        _assert_contains(
            "native whisper success runtime clear helper binding",
            content,
            'updateTranscriptDraft(boundedText, "voice", voiceSeconds);\n      clearRecordingPreviewRuntime();\n      setPreview(null);\n      setTranscriptReviewReturnScreen(returnScreen);\n      openScreenWithStatus("transcriptReview", recordingWhisperSuccessStatusMessage());',
        )
        _assert_contains(
            "parse transcript progress clears parser preview helper binding",
            content,
            "const existingDailyPreview = preview;\n    clearParserPreviewState();\n    setStatus(parserProgressStatusMessage());",
        )
        _assert_contains(
            "parser recovery message helper",
            content,
            "function openParserRecoveryMessage(message: string)",
        )
        _assert_contains(
            "parser recovery message helper fields",
            content,
            'setParserRecoveryMessage(message);\n    openScreenWithStatus("transcriptReview", message);',
        )
        _assert_contains(
            "parser backend unavailable recovery helper binding",
            content,
            "const boundedMessage = parserBackendUnavailableStatusMessage(protectedBackendUnavailableMessage);\n      openParserRecoveryMessage(boundedMessage);",
        )
        _assert_contains(
            "parser model unavailable recovery helper binding",
            content,
            "const boundedMessage = parserModelUnavailableStatusMessage(parserModelUnavailableMessage);\n      openParserRecoveryMessage(boundedMessage);",
        )
        _assert_contains(
            "mobile session clear transcript draft helper binding",
            content,
            "clearDailyRecordDraftOrganizationState();\n    clearTranscriptDraftState();\n    setSelectedRecord(null);",
        )
        _assert_contains(
            "AI save success clears transcript draft helper binding",
            content,
            "setPreview(null);\n      clearTranscriptDraftState();\n      clearDailyRecordDraftOrganizationState();",
        )
        _assert_contains(
            "transcript review return clears parser preview helper binding",
            content,
            "function returnFromTranscriptReviewWithStatus(statusMessage: string) {\n    clearParserPreviewState();",
        )
        _assert_contains(
            "transcript review return status helper fields",
            content,
            "clearPreviewSelectionState();\n    openScreenWithStatus(transcriptReviewReturnScreen, statusMessage);",
        )
        _assert_contains(
            "transcript review back status helper binding",
            content,
            "returnFromTranscriptReviewWithStatus(transcriptReviewBackStatusMessage());",
        )
        _assert_contains(
            "transcript retry status helper binding",
            content,
            "clearTranscriptDraftState();\n    returnFromTranscriptReviewWithStatus(transcriptClearedStatusMessage());",
        )
        _assert_contains(
            "recording start failure runtime clear helper binding",
            content,
            "audioRecordingRef.current = null;\n      clearRecordingPreviewRuntime();\n      setStatus(recordingStartFailureStatusMessage(error));",
        )
        _assert_contains(
            "home recording finish transcript helper",
            recording_copy_content,
            "function shouldOpenTodayRecordingTranscriptReview(currentScreen: AppScreen, elapsedSeconds: number)",
        )
        _assert_contains(
            "home recording finish transcript helper condition",
            recording_copy_content,
            'return currentScreen === "today" && elapsedSeconds > 1;',
        )
        _assert_contains(
            "home recording optional whisper handoff guard",
            finish_recording_block,
            "if (capturedAudioPath && whisperModelPath.trim()) {",
        )
        _assert_contains(
            "recording result home fallback action",
            content,
            "function useTodayRecordingResultTextFallback()",
        )
        _assert_contains(
            "recording result record fallback action",
            content,
            "function useRecordRecordingResultTextFallback()",
        )
        _assert_not_contains(
            "recording result home fallback binding",
            content,
            "onPress={useTodayRecordingResultTextFallback}",
        )
        _assert_contains(
            "recording result record fallback binding",
            content,
            "onPress={useRecordRecordingResultTextFallback}",
        )
        _assert_not_contains(
            "recording result direct home fallback binding",
            content,
            'onPress={() => handleRecordingResultPrimaryAction("today")}',
        )
        _assert_not_contains(
            "recording result direct record fallback binding",
            content,
            'onPress={() => handleRecordingResultPrimaryAction("record")}',
        )
        _assert_contains(
            "recording text fallback status",
            recording_copy_content,
            "function recordingTextFallbackStatusMessage()",
        )
        _assert_contains(
            "transcript review back handler",
            content,
            "function returnFromTranscriptReview()",
        )
        _assert_contains(
            "transcript review retry handler",
            content,
            "function retryTranscriptInput()",
        )
        _assert_contains(
            "transcript review back binding",
            content,
            "onPress={returnFromTranscriptReview}",
        )
        _assert_contains(
            "transcript review back accessibility binding",
            content,
            "accessibilityLabel={coreFlowDisplayLabels.backAccessibility}",
        )
        _assert_contains(
            "transcript review retry binding",
            content,
            "onPress={retryTranscriptInput}",
        )
        _assert_contains(
            "record manual entry handler",
            content,
            "function openRecordManualRecord()",
        )
        _assert_contains(
            "manual record status helper",
            content,
            "function openManualRecordWithStatus(returnScreen: AppScreen, statusMessage: string)",
        )
        _assert_contains(
            "manual record status helper fields",
            content,
            "openManualRecord(returnScreen);\n    setStatus(statusMessage);",
        )
        _assert_contains(
            "record manual entry status helper binding",
            content,
            'openManualRecordWithStatus("record", recordManualEntryStatusMessage());',
        )
        _assert_contains(
            "AI review manual entry handler",
            content,
            "function openAiReviewManualRecord()",
        )
        _assert_contains(
            "AI review manual entry status helper binding",
            content,
            'openManualRecordWithStatus("aiReview", aiReviewManualEntryStatusMessage());',
        )
        _assert_contains(
            "AI review manual entry clears selection before helper",
            content,
            'function openAiReviewManualRecord() {\n    clearPreviewSelectionState();\n    openManualRecordWithStatus("aiReview", aiReviewManualEntryStatusMessage());',
        )
        _assert_contains(
            "transcript review manual entry handler",
            content,
            "function openTranscriptReviewManualRecord()",
        )
        _assert_contains(
            "transcript review manual entry status helper binding",
            content,
            'openManualRecordWithStatus("transcriptReview", transcriptReviewManualEntryStatusMessage());',
        )
        _assert_contains(
            "transcript review manual entry clears selection before helper",
            content,
            'function openTranscriptReviewManualRecord() {\n    clearPreviewSelectionState();\n    openManualRecordWithStatus("transcriptReview", transcriptReviewManualEntryStatusMessage());',
        )
        _assert_contains(
            "record manual entry binding",
            content,
            "onPress={openRecordManualRecord}",
        )
        _assert_contains(
            "AI review manual entry binding",
            content,
            "onPress={openAiReviewManualRecord}",
        )
        _assert_contains(
            "AI review no-preview return binding",
            content,
            "onPress={returnToTranscriptEdit}",
        )
        _assert_contains(
            "transcript review manual entry binding",
            content,
            "onPress={openTranscriptReviewManualRecord}",
        )
        _assert_contains(
            "manual record return handler",
            content,
            "function returnFromManualRecord()",
        )
        _assert_contains(
            "manual record open screen opener binding",
            content,
            'seedManualRecordDateTimeForNow();\n    setManualRecordReturnScreen(returnScreen);\n    openScreen("manualRecord");',
        )
        _assert_contains(
            "core screen status opener helper",
            content,
            "function openScreenWithStatus(screen: AppScreen, statusMessage: string)",
        )
        _assert_contains(
            "manual record return status helper binding",
            content,
            "openScreenWithStatus(manualRecordReturnScreen, manualRecordReturnStatusMessage(manualRecordReturnScreen));",
        )
        _assert_contains(
            "record detail return handler",
            content,
            "function returnFromRecordDetail()",
        )
        _assert_contains(
            "record detail return status helper binding",
            content,
            "openScreenWithStatus(recordDetailReturnScreen, recordDetailReturnStatusMessage(recordDetailReturnScreen));",
        )
        _assert_contains(
            "tutorial record entry handler",
            content,
            "function openTutorialRecordEntry()",
        )
        _assert_contains(
            "tutorial record entry status helper binding",
            content,
            'openScreenWithStatus("record", tutorialRecordEntryStatusMessage());',
        )
        _assert_contains(
            "tutorial manual entry handler",
            content,
            "function openTutorialManualRecord()",
        )
        _assert_contains(
            "tutorial manual entry status helper binding",
            content,
            'openManualRecordWithStatus("tutorial", tutorialManualEntryStatusMessage());',
        )
        _assert_contains(
            "manual record return binding",
            content,
            "onBackPress={returnFromManualRecord}",
        )
        _assert_contains(
            "record detail return binding",
            content,
            "onPress={returnFromRecordDetail}",
        )
        _assert_contains(
            "tutorial record entry binding",
            content,
            "onPress={openTutorialRecordEntry}",
        )
        _assert_contains(
            "tutorial manual entry binding",
            content,
            "onPress={openTutorialManualRecord}",
        )
        for label, marker in (
            ("tutorial start accessibility label", 'tutorialStartAccessibility: boundDisplayText("開始使用並前往記錄頁，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("tutorial manual accessibility label", 'tutorialManualAccessibility: boundDisplayText("從教學改用手動新增，不呼叫 AI、LLM 或 STT", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, shared_display_items_content, marker)
        for label, marker in (
            ("tutorial start accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.tutorialStartAccessibility}"),
            ("tutorial manual accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.tutorialManualAccessibility}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "AI save confirm enter handler",
            content,
            "function enterAiSaveConfirm()",
        )
        _assert_contains(
            "AI save confirm return handler",
            content,
            "function returnFromAiSaveConfirm()",
        )
        _assert_contains(
            "AI review enter save confirm binding",
            content,
            "onPress={enterAiSaveConfirm}",
        )
        _assert_contains(
            "AI review checklist helper binding",
            content,
            "const aiReviewCostBoundaryChecklistItems = aiReviewCostBoundaryChecklistDisplayItems();",
        )
        _assert_contains(
            "AI review display helper binding",
            content,
            "const aiReviewDisplay = aiReviewDisplayTexts();",
        )
        _assert_contains(
            "AI review no candidate title display binding",
            content,
            "const aiReviewNoCandidateTitleDisplayText = aiReviewDisplay.noCandidateTitle;",
        )
        _assert_contains(
            "AI review backend required display binding",
            content,
            "const aiReviewBackendRequiredDisplayText = aiReviewDisplay.backendRequired;",
        )
        _assert_contains(
            "AI save confirm display helper binding",
            content,
            "const aiSaveConfirmDisplay = aiSaveConfirmDisplayTexts(",
        )
        _assert_contains(
            "AI save confirm intro display binding",
            content,
            "const aiSaveConfirmIntroDisplayText = aiSaveConfirmDisplay.intro;",
        )
        _assert_contains(
            "AI save confirm submit display binding",
            content,
            "const aiSaveConfirmSubmitDisplayLabel = aiSaveConfirmDisplay.submit;",
        )
        _assert_contains(
            "transcript review checklist helper binding",
            content,
            "const transcriptReviewCostBoundaryChecklistItems = transcriptReviewCostBoundaryChecklistDisplayItems(",
        )
        _assert_contains(
            "transcript review display helper binding",
            content,
            "const transcriptReviewDisplay = transcriptReviewDisplayTexts();",
        )
        _assert_contains(
            "transcript status display helper binding",
            content,
            "const transcriptStatusDisplay = transcriptReviewStatusDisplayTexts({",
        )
        for label, marker in (
            ("parser availability display helper binding", "const parserAvailabilityDisplay = parserAvailabilityDisplayMessages({"),
            ("parser model unavailable display binding", "const parserModelUnavailableDisplayMessage = parserAvailabilityDisplay.parserModelUnavailable;"),
            ("protected backend unavailable display binding", "const protectedBackendUnavailableDisplayMessage = parserAvailabilityDisplay.protectedBackendUnavailable;"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "transcript validation display helper binding",
            content,
            "const transcriptValidationDisplayText = transcriptStatusDisplay.transcriptValidation;",
        )
        _assert_contains(
            "transcript review validation display helper binding",
            content,
            "const transcriptReviewValidationDisplayText = transcriptStatusDisplay.transcriptReviewValidation;",
        )
        _assert_contains(
            "transcript backend unavailable display helper binding",
            content,
            "const transcriptBackendUnavailableDisplayText = transcriptStatusDisplay.backendUnavailable;",
        )
        _assert_contains(
            "transcript model unavailable display helper binding",
            content,
            "const transcriptModelUnavailableDisplayText = transcriptStatusDisplay.modelUnavailable;",
        )
        _assert_contains(
            "transcript review intro display binding",
            content,
            "const transcriptReviewIntroDisplayText = transcriptReviewDisplay.intro;",
        )
        _assert_contains(
            "transcript review preflight display binding",
            content,
            "const transcriptReviewPreflightPassedDisplayText = transcriptReviewDisplay.preflightPassed;",
        )
        _assert_contains(
            "record entry settings checklist helper binding",
            content,
            "const recordEntrySettingsChecklistItems = recordEntrySettingsChecklistDisplayItems(protectedBackendReady);",
        )
        _assert_contains(
            "AI save failure checklist helper binding",
            content,
            "const aiSaveFailureChecklistItems = aiSaveFailureChecklistDisplayItems(unsavedPreviewRecordDisplayCount);",
        )
        _assert_contains(
            "save success checklist helper binding",
            content,
            "const saveSuccessBoundaryChecklistItems = saveSuccessBoundaryChecklistDisplayItems(",
        )
        _assert_contains(
            "save result display helper binding",
            content,
            "const saveResultDisplay = saveResultDisplayTexts({",
        )
        _assert_contains(
            "last saved summary display binding",
            content,
            "const lastSavedSummaryDisplayText = saveResultDisplay.lastSavedSummary;",
        )
        _assert_contains(
            "AI save backend blocked display binding",
            content,
            "const aiSaveBackendBlockedDisplayText = saveResultDisplay.aiSaveBackendBlocked;",
        )
        _assert_contains(
            "analysis boundary checklist helper binding",
            content,
            "const analysisBoundaryChecklistItems = analysisBoundaryChecklistDisplayItems(",
        )
        _assert_contains(
            "history boundary checklist helper binding",
            content,
            "const historyBoundaryChecklistItems = historyBoundaryChecklistDisplayItems(",
        )
        _assert_contains(
            "auth boundary checklist helper binding",
            content,
            "const authBoundaryChecklistItems = authBoundaryChecklistDisplayItems();",
        )
        _assert_contains(
            "profile readiness checklist helper binding",
            content,
            "const profileReadinessChecklistItems = profileReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "doctor share readiness checklist helper binding",
            content,
            "const doctorShareReadinessChecklistItems = doctorShareReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "health integration readiness checklist helper binding",
            content,
            "healthIntegrationReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "community readiness checklist helper binding",
            content,
            "const communityReadinessChecklistItems = communityReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "ranking readiness checklist helper binding",
            content,
            "const rankingReadinessChecklistItems = rankingReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "store checkout readiness checklist helper binding",
            content,
            "const storeCheckoutReadinessChecklistItems = storeCheckoutReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "food photo readiness checklist helper binding",
            content,
            "const foodPhotoReadinessChecklistItems = foodPhotoReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "quota readiness checklist helper binding",
            content,
            "const quotaReadinessChecklistItems = quotaReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "reminder readiness checklist helper binding",
            content,
            "const reminderReadinessChecklistItems = reminderReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "privacy readiness checklist helper binding",
            content,
            "const privacyReadinessChecklistItems = privacyReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "tutorial safety checklist helper binding",
            content,
            "const tutorialSafetyChecklistItems = tutorialSafetyChecklistDisplayItems();",
        )
        _assert_contains(
            "tutorial display steps helper binding",
            content,
            "const tutorialDisplaySteps = useMemo(() => buildTutorialDisplaySteps(), []);",
        )
        _assert_contains(
            "subscription readiness checklist helper binding",
            content,
            "const subscriptionReadinessChecklistItems = subscriptionReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "subscription comparison display rows helper binding",
            content,
            "const subscriptionComparisonDisplayRows = useMemo(\n    () => buildSubscriptionComparisonDisplayRows(),",
        )
        _assert_contains(
            "subscription management readiness checklist helper binding",
            content,
            "subscriptionManagementReadinessChecklistDisplayItems();",
        )
        _assert_contains(
            "subscription management display rows helper binding",
            content,
            "const subscriptionManagementDisplayRows = useMemo(\n    () => buildSubscriptionManagementDisplayRows(),",
        )
        _assert_contains(
            "privacy control display rows helper binding",
            content,
            "const privacyControlDisplayRows = useMemo(() => buildPrivacyControlDisplayRows(), []);",
        )
        _assert_contains(
            "production auth readiness display rows helper binding",
            content,
            "const productionAuthReadinessDisplayRows = useMemo(\n    () => buildProductionAuthReadinessDisplayRows(),",
        )
        _assert_contains(
            "session management display items helper binding",
            content,
            "const sessionManagementDisplayItems = useMemo(\n    () => buildSessionManagementDisplayItems(),",
        )
        _assert_contains(
            "auth provider display items helper binding",
            content,
            "const authProviderDisplayItems = useMemo(() => buildAuthProviderDisplayItems(), []);",
        )
        _assert_contains(
            "membership feature display rows helper binding",
            content,
            "const membershipFeatureRows = membershipFeatureDisplayRows();",
        )
        for label, marker in (
            ("membership feature row key helper", "function membershipFeatureRowKey(row: (typeof membershipFeatureRows)[number])"),
            ("membership feature row key helper fields", "return row.label;"),
            ("membership feature row key helper binding", "key={membershipFeatureRowKey(row)}"),
            ("membership feature row label helper", "function membershipFeatureRowLabel(row: (typeof membershipFeatureRows)[number])"),
            ("membership feature row label helper fields", "return row.label;"),
            ("membership feature row label helper binding", "{membershipFeatureRowLabel(row)}"),
            ("membership feature row value helper", "function membershipFeatureRowValue(row: (typeof membershipFeatureRows)[number])"),
            ("membership feature row value helper fields", "return row.value;"),
            ("membership feature row value helper binding", "{membershipFeatureRowValue(row)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "subscription membership display helper binding",
            content,
            "const subscriptionMembershipDisplay = subscriptionMembershipDisplayTexts(",
        )
        _assert_contains(
            "subscription plan display text binding",
            content,
            "const subscriptionPlanDisplayText = subscriptionMembershipDisplay.subscriptionPlan;",
        )
        _assert_contains(
            "membership trial days display text binding",
            content,
            "const membershipTrialDaysDisplayText = subscriptionMembershipDisplay.trialDays;",
        )
        _assert_contains(
            "quota display texts helper binding",
            content,
            "const quotaDisplay = quotaDisplayTexts(voiceQuota);",
        )
        _assert_contains(
            "quota used display text binding",
            content,
            "const quotaUsedDisplayText = quotaDisplay.used;",
        )
        _assert_contains(
            "quota remaining display text binding",
            content,
            "const quotaRemainingDisplayText = quotaDisplay.remaining;",
        )
        _assert_contains(
            "subscription quota daily limit display text binding",
            content,
            "const subscriptionQuotaDailyLimitDisplayText = quotaDisplay.subscriptionDailyLimit;",
        )
        _assert_contains(
            "settings quota helper display text binding",
            content,
            "const settingsQuotaHelperDisplayText = quotaDisplay.settingsHelper;",
        )
        _assert_contains(
            "reminder preview display rows helper binding",
            content,
            "const reminderPreviewDisplayItems = buildReminderPreviewDisplayItems();",
        )
        _assert_contains(
            "doctor share boundary rows helper binding",
            content,
            "const doctorShareBoundaryRows = doctorShareBoundaryDisplayRows();",
        )
        _assert_contains(
            "health integration boundary rows helper binding",
            content,
            "const healthIntegrationBoundaryRows = healthIntegrationBoundaryDisplayRows();",
        )
        _assert_contains(
            "ranking boundary rows helper binding",
            content,
            "const rankingBoundaryRows = rankingBoundaryDisplayRows();",
        )
        _assert_contains(
            "privacy boundary rows helper binding",
            content,
            "const privacyBoundaryRows = privacyBoundaryDisplayRows();",
        )
        _assert_contains(
            "detailed report boundary rows helper binding",
            content,
            "const detailedReportBoundaryRows = detailedReportBoundaryDisplayRows(",
        )
        _assert_contains(
            "AI save confirm boundary rows helper binding",
            content,
            "const aiSaveConfirmBoundaryRows = aiSaveConfirmBoundaryDisplayRows(",
        )
        _assert_contains(
            "recording quota boundary rows helper binding",
            content,
            "const recordingQuotaBoundaryRows = recordingQuotaBoundaryDisplayRows(voiceQuota, quotaRemainingLow);",
        )
        _assert_contains(
            "account security boundary rows helper binding",
            content,
            "const accountSecurityBoundaryRows = accountSecurityBoundaryDisplayRowsForState({",
        )
        _assert_contains(
            "profile settings boundary rows helper binding",
            content,
            "const profileSettingsBoundaryRows = profileSettingsBoundaryDisplayRowsForState({",
        )
        _assert_contains(
            "community boundary rows helper binding",
            content,
            "const communityBoundaryRows = communityBoundaryDisplayRows(",
        )
        _assert_contains(
            "AI save confirm guarded return binding",
            content,
            "onPress={requestDailyRecordLeaveGuard}",
        )
        _assert_contains(
            "preview selection state clear helper",
            content,
            "function clearPreviewSelectionState()",
        )
        _assert_contains(
            "preview selection state clear helper selected index",
            content,
            "function clearPreviewSelectionState() {\n    setSelectedPreviewIndex(null);",
        )
        _assert_contains(
            "preview selection state clear helper remove index",
            content,
            "setPendingPreviewRemoveIndex(null);\n    setPreviewEditFields(emptyRecordEditFields());",
        )
        _assert_contains(
            "preview action state clear helper",
            content,
            "function clearPreviewActionState()",
        )
        _assert_contains(
            "preview action state clear selection helper binding",
            content,
            "function clearPreviewActionState() {\n    clearPreviewSelectionState();",
        )
        _assert_contains(
            "AI review cleared status helper",
            content,
            "function returnToAiReviewWithClearedPreviewStatus(statusMessage: string)",
        )
        _assert_contains(
            "AI review cleared status helper fields",
            content,
            'clearPreviewActionState();\n    openScreenWithStatus("aiReview", statusMessage);',
        )
        _assert_contains(
            "AI save confirm return cleared status helper binding",
            content,
            "returnToAiReviewWithClearedPreviewStatus(aiSaveConfirmReturnStatusMessage());",
        )
        _assert_contains(
            "AI save confirm enter clear selection helper binding",
            content,
            'clearPreviewSelectionState();\n    setLastSaveErrorSummary("");\n    openScreenWithStatus("aiSaveConfirm", aiSaveConfirmReadyStatusMessage());',
        )
        _assert_contains(
            "AI save confirm enter empty preview screen opener fallback",
            content,
            'if (!preview || preview.records.length === 0) {\n      openScreen("aiReview");\n      return;',
        )
        _assert_contains(
            "save success unsaved candidate handler",
            content,
            "function processUnsavedPreviewRecords()",
        )
        _assert_contains(
            "save success unsaved empty preview screen opener fallback",
            content,
            'if (!preview || preview.records.length === 0) {\n      openScreen("today");\n      return;',
        )
        _assert_contains(
            "save success process clear helper binding",
            content,
            "returnToAiReviewWithClearedPreviewStatus(saveSuccessProcessUnsavedStatusMessage());",
        )
        _assert_contains(
            "save success destination handler",
            content,
            "function openSaveSuccessDestination(target: AppScreen)",
        )
        _assert_contains(
            "save success destination clear helper binding",
            content,
            "clearPreviewActionState();\n    openScreenWithStatus(target, saveSuccessDestinationStatusMessage(target));",
        )
        _assert_contains(
            "save success destination card handler",
            content,
            "function openSaveSuccessDestinationCard(target: AppScreen)",
        )
        _assert_contains(
            "save success destination helper binding",
            content,
            "const saveSuccessDestinationItems = saveSuccessDestinationDisplayItems(hasUnsavedPreviewRecords);",
        )
        _assert_contains(
            "result destination accessibility item",
            shared_display_items_content,
            "accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)",
        )
        _assert_contains(
            "save success destination card press handler",
            content,
            "function pressSaveSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>)",
        )
        _assert_contains(
            "destination card target helper",
            content,
            "function destinationCardTarget(item: ReturnType<typeof destinationCardDisplayItem>)",
        )
        _assert_contains(
            "destination card target helper fields",
            content,
            "return item.target;",
        )
        for label, marker in (
            ("destination card key helper", "function destinationCardKey(item: ReturnType<typeof destinationCardDisplayItem>)"),
            ("destination card key helper fields", "return `${item.target}-${item.label}`;"),
            ("destination card key binding", "key={destinationCardKey(item)}"),
            ("destination card accessibility helper", "function destinationCardAccessibilityLabel(item: ReturnType<typeof destinationCardDisplayItem>)"),
            ("destination card accessibility helper fields", "return item.accessibilityLabel;"),
            ("destination card accessibility binding", "accessibilityLabel={destinationCardAccessibilityLabel(item)}"),
            ("destination card icon helper", "function destinationCardIcon(item: ReturnType<typeof destinationCardDisplayItem>)"),
            ("destination card icon helper fields", "return item.icon;"),
            ("destination card icon binding", "{destinationCardIcon(item)}"),
            ("destination card label helper", "function destinationCardLabel(item: ReturnType<typeof destinationCardDisplayItem>)"),
            ("destination card label helper fields", "return item.label;"),
            ("destination card label binding", "{destinationCardLabel(item)}"),
            ("destination card helper helper", "function destinationCardHelper(item: ReturnType<typeof destinationCardDisplayItem>)"),
            ("destination card helper helper fields", "return item.helper;"),
            ("destination card helper binding", "{destinationCardHelper(item)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "save success destination card target helper binding",
            content,
            "openSaveSuccessDestinationCard(destinationCardTarget(item));",
        )
        _assert_contains(
            "save success destination card binding",
            content,
            "onPress={() => pressSaveSuccessDestinationCard(item)}",
        )
        _assert_contains(
            "save success destination card accessibility binding",
            content,
            "accessibilityLabel={destinationCardAccessibilityLabel(item)}",
        )
        _assert_contains(
            "save success destination card button role",
            content,
            'accessibilityRole="button"\n                  style={styles.postSaveCard}',
        )
        _assert_not_contains(
            "save success direct destination card binding",
            content,
            "onPress={() => openSaveSuccessDestinationCard(item.target)}",
        )
        _assert_not_contains(
            "save success direct destination binding",
            content,
            "onPress={() => openSaveSuccessDestination(item.target)}",
        )
        _assert_contains(
            "save success manual continue handler",
            content,
            "function openSaveSuccessManualContinue()",
        )
        _assert_contains(
            "save success record entry handler",
            content,
            "function openSaveSuccessRecordEntry()",
        )
        _assert_contains(
            "save success record entry status helper binding",
            content,
            'openScreenWithStatus("record", saveSuccessRecordEntryStatusMessage());',
        )
        _assert_contains(
            "save success detail handler",
            content,
            "function openSaveSuccessRecordDetail()",
        )
        _assert_contains(
            "save success today return handler",
            content,
            "function returnFromSaveSuccessToToday()",
        )
        _assert_contains(
            "save success manual continue binding",
            content,
            "onPress={openSaveSuccessManualContinue}",
        )
        _assert_contains(
            "save success record entry binding",
            content,
            "onPress={openSaveSuccessRecordEntry}",
        )
        _assert_contains(
            "save success detail binding",
            content,
            "onPress={openSaveSuccessRecordDetail}",
        )
        _assert_contains(
            "save success today return binding",
            content,
            "onPress={returnFromSaveSuccessToToday}",
        )
        _assert_contains(
            "save success unsaved CTA binding",
            content,
            "onPress={processUnsavedPreviewRecords}",
        )
        _assert_contains(
            "save success unsaved destination first",
            first_version_flow_copy_content,
            '...(hasUnsavedPreviewRecords\n      ? [["⚠", "返回確認", "處理尚未儲存的候選紀錄", "aiReview"] as const]\n      : [])',
        )
        _assert_contains(
            "save success manual continue hidden while unsaved",
            content,
            'lastSaveEntryMethod === "manual" && !hasUnsavedPreviewRecords',
        )
        _assert_contains(
            "save success record entry hidden while unsaved",
            content,
            ') : !hasUnsavedPreviewRecords ? (',
        )
        _assert_contains(
            "save success unsaved entry pause copy",
            content,
            "請先處理未儲存 AI 候選；新增入口會在候選處理後恢復。",
        )
        _assert_contains(
            "save success unsaved primary CTA",
            content,
            "hasUnsavedPreviewRecords ? (\n                <Pressable",
        )
        for label, marker in (
            ("save success manual continue accessibility label", 'saveSuccessManualContinueAccessibility: boundDisplayText("繼續手動新增，不呼叫 AI 或 parser", maxDisplayDetailTextLength)'),
            ("save success record entry accessibility label", 'saveSuccessRecordEntryAccessibility: boundDisplayText("繼續語音或文字記錄，不自動呼叫 AI 或 STT", maxDisplayDetailTextLength)'),
            ("save success detail accessibility label", 'saveSuccessDetailAccessibility: boundDisplayText("查看剛儲存紀錄詳情，不重送 save request", maxDisplayDetailTextLength)'),
            ("save success unsaved accessibility label", 'saveSuccessProcessUnsavedAccessibility: boundDisplayText("處理未儲存 AI 候選，不自動重試儲存", maxDisplayDetailTextLength)'),
            ("save success today accessibility label", 'saveSuccessReturnTodayAccessibility: boundDisplayText("回今日紀錄，只查看目前已載入清單", maxDisplayDetailTextLength)'),
            ("tutorial safety checklist helper", "function tutorialSafetyChecklistDisplayItems()"),
            ("tutorial safety candidate copy", "AI 只整理成候選紀錄，確認前不會寫入資料庫。"),
            ("tutorial safety parser cost copy", "文字為空時不送 parser，避免不必要的 API 與 LLM 成本。"),
            ("tutorial safety no diagnosis copy", "儲存後會回到今日、歷史與分析；不提供診療建議。"),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("save success manual continue accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.saveSuccessManualContinueAccessibility}"),
            ("save success record entry accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.saveSuccessRecordEntryAccessibility}"),
            ("save success detail accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.saveSuccessDetailAccessibility}"),
            ("save success unsaved accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.saveSuccessProcessUnsavedAccessibility}"),
            ("save success today accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.saveSuccessReturnTodayAccessibility}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "AI save failure manual fallback handler",
            content,
            "function openAiSaveFailureManualFallback()",
        )
        _assert_contains(
            "AI save failure manual fallback clear selection binding",
            content,
            "function openAiSaveFailureManualFallback() {\n    clearPreviewSelectionState();",
        )
        _assert_contains(
            "AI save failure back AI review handler",
            content,
            "function returnFromAiSaveFailureToAiReview()",
        )
        _assert_contains(
            "AI save failure back AI review clear action binding",
            content,
            "returnToAiReviewWithClearedPreviewStatus(aiSaveFailureBackAiReviewStatusMessage());",
        )
        _assert_contains(
            "AI save confirm status helper",
            content,
            "function openAiSaveConfirmWithStatus(statusMessage: string)",
        )
        _assert_contains(
            "AI save confirm status helper fields",
            content,
            'openScreenWithStatus("aiSaveConfirm", statusMessage);',
        )
        _assert_contains(
            "AI save failure return save confirm handler",
            content,
            "function returnFromAiSaveFailureToSaveConfirm()",
        )
        _assert_contains(
            "AI save failure return save confirm clear action binding",
            content,
            "returnToAiReviewWithClearedPreviewStatus(aiSaveFailureBackAiReviewStatusMessage());\n      return;\n    }\n    clearPreviewActionState();\n    openAiSaveConfirmWithStatus(aiSaveFailureReturnSaveConfirmStatusMessage());",
        )
        _assert_contains(
            "AI save failure back AI review binding",
            content,
            "onPress={returnFromAiSaveFailureToAiReview}",
        )
        _assert_contains(
            "AI save failure return save confirm binding",
            content,
            "onPress={returnFromAiSaveFailureToSaveConfirm}",
        )
        _assert_contains(
            "AI save failure manual fallback binding",
            content,
            "onPress={openAiSaveFailureManualFallback}",
        )
        _assert_contains(
            "AI candidate remove-confirm return handler",
            content,
            "function returnFromPreviewRemoveConfirm()",
        )
        _assert_contains(
            "AI candidate edit action handler",
            content,
            "function editAiCandidateRecord(index: number)",
        )
        _assert_contains(
            "AI candidate edit action press handler",
            content,
            "function pressAiCandidateEditAction(item: ReturnType<typeof pendingRecordDisplayItem>)",
        )
        _assert_contains(
            "AI candidate action target helper",
            content,
            "function aiCandidateActionTarget(item: ReturnType<typeof pendingRecordDisplayItem>)",
        )
        _assert_contains(
            "AI candidate action target helper fields",
            content,
            "return item.index;",
        )
        _assert_contains(
            "AI candidate edit action target helper binding",
            content,
            "editAiCandidateRecord(aiCandidateActionTarget(item));",
        )
        _assert_contains(
            "AI candidate remove action handler",
            content,
            "function removeAiCandidateRecord(index: number)",
        )
        _assert_contains(
            "AI candidate remove action press handler",
            content,
            "function pressAiCandidateRemoveAction(item: ReturnType<typeof pendingRecordDisplayItem>)",
        )
        _assert_contains(
            "AI candidate remove action target helper binding",
            content,
            "removeAiCandidateRecord(aiCandidateActionTarget(item));",
        )
        for label, marker in (
            ("AI candidate display item helper", "function pendingRecordDisplayItem(record: PendingRecord, index: number, keyPrefix = \"candidate\")"),
            ("AI candidate display items helper", "function pendingRecordDisplayItems(records: PendingRecord[], keyPrefix = \"candidate\")"),
            ("AI candidate source display helper", "function pendingRecordSourceDisplayText(record: PendingRecord)"),
            ("AI candidate confidence display helper", "function confidencePercentDisplay(value: unknown)"),
            ("AI candidate decision trace helper", "function shortDecisionTrace(trace?: string)"),
            ("AI candidate edit accessibility item", "editAccessibilityLabel: boundDisplayText(`修改${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength)"),
            ("AI candidate remove accessibility item", "removeAccessibilityLabel: boundDisplayText(`移除${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength)"),
            ("AI candidate source fallback", "等待使用者確認"),
            ("AI candidate low confidence threshold", "const lowConfidence = (record.confidence ?? 1) < 0.7;"),
            ("AI candidate reason display", "boundDisplayText(`建立理由：${decisionTrace}`, maxDisplayDetailTextLength)"),
            ("AI rejected reason label helper", "function rejectedReasonLabel(reason?: string)"),
            ("AI rejected reason negative label", "這句像是否定或未量測事件"),
            ("AI rejected reason invalid label", "內容不符合可儲存紀錄格式"),
            ("AI rejected reason duplicate label", "可能與既有候選重複"),
            ("AI rejected reason unsupported label", "目前尚未支援這類紀錄"),
            ("AI rejected reason unknown label", "無法判斷可儲存紀錄類型"),
            ("AI rejected preview display items helper", "function rejectedPreviewDisplayItems(events: RejectedEvent[])"),
            ("AI rejected preview id bound", "id: boundIdentifier(event.segment_id)"),
            ("AI rejected preview source bound", "sourceText: boundDisplayText(event.source_text, maxDisplayDetailTextLength)"),
            ("AI rejected preview reason copy", "reasonDisplayText: aiReviewRejectedReasonCopy(reasonLabel)"),
        ):
            _assert_contains(label, record_display_content, marker)
        for label, marker in (
            ("AI rejected preview key helper", "function rejectedPreviewEventKey(event: ReturnType<typeof buildRejectedPreviewDisplayItems>[number])"),
            ("AI rejected preview key helper fields", "return event.id;"),
            ("AI rejected preview key helper binding", "key={rejectedPreviewEventKey(event)}"),
            ("AI rejected preview source helper", "function rejectedPreviewEventSourceText(event: ReturnType<typeof buildRejectedPreviewDisplayItems>[number])"),
            ("AI rejected preview source helper fields", "return event.sourceText;"),
            ("AI rejected preview source helper binding", "{rejectedPreviewEventSourceText(event)}"),
            ("AI rejected preview reason helper", "function rejectedPreviewEventReasonText(event: ReturnType<typeof buildRejectedPreviewDisplayItems>[number])"),
            ("AI rejected preview reason helper fields", "return event.reasonDisplayText;"),
            ("AI rejected preview reason helper binding", "{rejectedPreviewEventReasonText(event)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "AI rejected preview list helper binding",
            content,
            "const rejectedPreviewDisplayItems = preview ? buildRejectedPreviewDisplayItems(preview.rejected_events) : [];",
        )
        _assert_not_contains(
            "AI rejected preview inline event mapping",
            content,
            "preview?.rejected_events.map((event) => ({",
        )
        _assert_contains(
            "AI review candidate list helper binding",
            content,
            'const previewRecordDisplayItems = preview ? pendingRecordDisplayItems(preview.records, "review") : [];',
        )
        rejected_preview_render_block = _match_block(
            content,
            r"rejectedPreviewDisplayItems\.map\(\(event\) => \(([\s\S]*?rejectedPreviewEventReasonText\(event\)[\s\S]*?</View>)",
            "AI rejected preview render block",
        )
        for label, marker in (
            ("direct AI rejected preview key binding", "key={event.id}"),
            ("direct AI rejected preview source binding", "{event.sourceText}"),
            ("direct AI rejected preview reason binding", "{event.reasonDisplayText}"),
        ):
            _assert_not_contains(label, rejected_preview_render_block, marker)
        _assert_contains(
            "AI save-confirm candidate list helper binding",
            content,
            'const previewSaveConfirmDisplayItems = preview ? pendingRecordDisplayItems(preview.records, "save-confirm") : [];',
        )
        _assert_not_contains(
            "AI review inline candidate mapping",
            content,
            'preview?.records.map((record, index) => pendingRecordDisplayItem(record, index, "review"))',
        )
        _assert_not_contains(
            "AI save-confirm inline candidate mapping",
            content,
            'preview?.records.map((record, index) => pendingRecordDisplayItem(record, index, "save-confirm"))',
        )
        _assert_contains(
            "AI candidate edit action binding",
            content,
            "onPress={() => pressAiCandidateEditAction(item)}",
        )
        _assert_contains(
            "AI candidate remove action binding",
            content,
            "onPress={() => pressAiCandidateRemoveAction(item)}",
        )
        _assert_contains(
            "AI candidate edit accessibility binding",
            content,
            "accessibilityLabel={aiCandidateEditAccessibilityLabel(item)}",
        )
        _assert_contains(
            "AI candidate remove accessibility binding",
            content,
            "accessibilityLabel={aiCandidateRemoveAccessibilityLabel(item)}",
        )
        for label, marker in (
            ("AI candidate display key helper", "function aiCandidateDisplayKey(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display key helper fields", "return item.key;"),
            ("AI candidate display key binding", "key={aiCandidateDisplayKey(item)}"),
            ("AI candidate display icon helper", "function aiCandidateDisplayIcon(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display icon helper fields", "return item.icon;"),
            ("AI candidate display icon binding", "{aiCandidateDisplayIcon(item)}"),
            ("AI candidate display type helper", "function aiCandidateDisplayTypeLabel(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display type helper fields", "return item.typeLabel;"),
            ("AI candidate display type binding", "{aiCandidateDisplayTypeLabel(item)}"),
            ("AI candidate display payload helper", "function aiCandidateDisplayPayloadSummary(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display payload helper fields", "return item.payloadSummary;"),
            ("AI candidate display payload binding", "{aiCandidateDisplayPayloadSummary(item)}"),
            ("AI candidate display confidence helper", "function aiCandidateDisplayConfidencePercent(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display confidence helper fields", "return item.confidencePercent;"),
            ("AI candidate display confidence binding", "{aiCandidateDisplayConfidencePercent(item)}%"),
            ("AI candidate display source helper", "function aiCandidateDisplaySourceText(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate display source helper fields", "return item.sourceText;"),
            ("AI candidate display source binding", "{aiCandidateDisplaySourceText(item)}"),
            ("AI candidate low confidence helper", "function aiCandidateDisplayIsLowConfidence(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate low confidence helper fields", "return item.lowConfidence;"),
            ("AI candidate low confidence binding", "{aiCandidateDisplayIsLowConfidence(item) ? ("),
            ("AI candidate decision trace helper", "function aiCandidateDisplayDecisionTrace(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate decision trace helper fields", "return item.decisionTraceDisplayText;"),
            ("AI candidate decision trace binding", "{aiCandidateDisplayDecisionTrace(item) ? ("),
            ("AI candidate edit accessibility helper", "function aiCandidateEditAccessibilityLabel(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate edit accessibility helper fields", "return item.editAccessibilityLabel;"),
            ("AI candidate remove accessibility helper", "function aiCandidateRemoveAccessibilityLabel(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("AI candidate remove accessibility helper fields", "return item.removeAccessibilityLabel;"),
        ):
            _assert_contains(label, content, marker)
        ai_candidate_card_render_block = _match_block(
            content,
            r"previewRecordDisplayItems\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "AI candidate card render block",
        )
        for label, marker in (
            ("direct AI candidate key binding", "key={item.key}"),
            ("direct AI candidate icon binding", "<Text>{item.icon}</Text>"),
            ("direct AI candidate type binding", "<Text style={styles.confidence}>{item.typeLabel}</Text>"),
            ("direct AI candidate payload binding", "<Text style={styles.recordContent}>{item.payloadSummary}</Text>"),
            ("direct AI candidate confidence binding", "{item.confidencePercent}%"),
            ("direct AI candidate source binding", "<Text style={styles.evidence}>{item.sourceText}</Text>"),
            ("direct AI candidate low confidence binding", "{item.lowConfidence ? ("),
            ("direct AI candidate decision trace binding", "{item.decisionTraceDisplayText ? ("),
            ("direct AI candidate decision trace text", "<Text style={styles.evidence}>{item.decisionTraceDisplayText}</Text>"),
            ("direct AI candidate edit accessibility binding", "accessibilityLabel={item.editAccessibilityLabel}"),
            ("direct AI candidate remove accessibility binding", "accessibilityLabel={item.removeAccessibilityLabel}"),
        ):
            _assert_not_contains(label, ai_candidate_card_render_block, marker)
        _assert_contains(
            "AI candidate edit button role",
            content,
            'accessibilityRole="button"\n                        style={styles.secondaryButton}',
        )
        _assert_contains(
            "AI candidate remove button role",
            content,
            'accessibilityRole="button"\n                        style={styles.dangerButton}',
        )
        _assert_not_contains(
            "AI candidate direct edit action binding",
            content,
            "onPress={() => editAiCandidateRecord(item.index)}",
        )
        _assert_not_contains(
            "AI candidate direct remove action binding",
            content,
            "onPress={() => removeAiCandidateRecord(item.index)}",
        )
        _assert_not_contains(
            "AI candidate direct edit opener binding",
            content,
            "onPress={() => openPreviewRecordEdit(item.index)}",
        )
        _assert_not_contains(
            "AI candidate direct remove opener binding",
            content,
            "onPress={() => openPreviewRecordRemoveConfirm(item.index)}",
        )
        _assert_not_contains(
            "AI candidate direct edit handler index binding",
            content,
            "editAiCandidateRecord(item.index);",
        )
        _assert_not_contains(
            "AI candidate direct remove handler index binding",
            content,
            "removeAiCandidateRecord(item.index);",
        )
        _assert_contains(
            "AI candidate remove-confirm return binding",
            content,
            "onPress={returnFromPreviewRemoveConfirm}",
        )
        _assert_contains(
            "AI candidate remove checklist helper binding",
            content,
            "const aiCandidateRemoveChecklistItems = aiCandidateRemoveChecklistDisplayItems();",
        )
        _assert_contains(
            "AI candidate edit return handler",
            content,
            "function returnFromPreviewRecordEdit()",
        )
        _assert_contains(
            "AI candidate edit seed from record helper",
            content,
            "function seedPreviewEditStateFromRecord(record: PendingRecord)",
        )
        _assert_contains(
            "AI candidate edit seed from record fields",
            content,
            "setPreviewEditFields(recordPayloadToEditFields(record));",
        )
        _assert_contains(
            "AI candidate edit draft field clear helper",
            content,
            "function clearPreviewEditDraftFields()",
        )
        _assert_contains(
            "AI candidate edit draft field clear helper internals",
            content,
            "function clearPreviewEditDraftFields() {\n    setPreviewEditFields(emptyRecordEditFields());",
        )
        _assert_contains(
            "AI candidate selected edit draft clear helper",
            content,
            "function clearSelectedPreviewEditDraft()",
        )
        _assert_contains(
            "AI candidate selected edit draft clear helper internals",
            content,
            "function clearSelectedPreviewEditDraft() {\n    setSelectedPreviewIndex(null);\n    clearPreviewEditDraftFields();",
        )
        _assert_contains(
            "AI candidate edit seed empty now helper",
            content,
            "function seedEmptyPreviewEditStateForNow()",
        )
        _assert_contains(
            "AI candidate edit seed empty uses field clear helper",
            content,
            "function seedEmptyPreviewEditStateForNow() {\n    clearPreviewEditDraftFields();",
        )
        _assert_contains(
            "daily record entry menu clear helper",
            content,
            "function clearDailyRecordEntryMenu()",
        )
        _assert_contains(
            "daily record entry menu clear helper internals",
            content,
            "function clearDailyRecordEntryMenu() {\n    setDailyRecordMenuIndex(null);",
        )
        _assert_contains(
            "AI candidate menu selection index clear helper",
            content,
            "function clearPreviewMenuSelectionIndexes()",
        )
        _assert_contains(
            "AI candidate menu selection index clear helper internals",
            content,
            "function clearPreviewMenuSelectionIndexes() {\n    setSelectedPreviewIndex(null);\n    setPendingPreviewRemoveIndex(null);\n    clearDailyRecordEntryMenu();",
        )
        _assert_contains(
            "AI candidate edit index selection helper",
            content,
            "function selectPreviewEditIndex(index: number)",
        )
        _assert_contains(
            "AI candidate edit index selection helper internals",
            content,
            "function selectPreviewEditIndex(index: number) {\n    clearDailyRecordEntryMenu();\n    setPendingPreviewRemoveIndex(null);\n    setSelectedPreviewIndex(index);",
        )
        _assert_contains(
            "AI candidate remove index selection helper",
            content,
            "function selectPreviewRemoveIndex(index: number)",
        )
        _assert_contains(
            "AI candidate remove index selection helper internals",
            content,
            "function selectPreviewRemoveIndex(index: number) {\n    clearDailyRecordEntryMenu();\n    setSelectedPreviewIndex(null);\n    setPendingPreviewRemoveIndex(index);",
        )
        _assert_contains(
            "AI candidate edit open seed helper binding",
            content,
            "selectPreviewEditIndex(index);\n    seedPreviewEditStateFromRecord(record);",
        )
        _assert_contains(
            "AI candidate edit open status helper binding",
            content,
            'openScreenWithStatus("editPreviewRecord", aiCandidateEditOpenStatusMessage());',
        )
        _assert_contains(
            "AI candidate remove confirm selection helper binding",
            content,
            'selectPreviewRemoveIndex(index);\n    openScreenWithStatus("aiRemoveConfirm", aiCandidateRemoveConfirmStatusMessage());',
        )
        _assert_contains(
            "AI candidate remove confirm missing record screen opener fallback",
            content,
            "if (!record) {\n      openScreen(returnScreen);\n      return;",
        )
        _assert_contains(
            "AI candidate edit return index clear helper binding",
            content,
            "clearPreviewMenuSelectionIndexes();\n    seedEmptyPreviewEditStateForNow();",
        )
        _assert_contains(
            "AI candidate edit return empty seed helper binding",
            content,
            "seedEmptyPreviewEditStateForNow();\n    openScreenWithStatus(previewActionReturnScreen, aiCandidateEditCancelStatusMessage());",
        )
        _assert_contains(
            "AI candidate remove return index clear helper binding",
            content,
            "function returnFromPreviewRemoveConfirm() {\n    clearPreviewMenuSelectionIndexes();",
        )
        _assert_contains(
            "AI candidate remove return field clear helper binding",
            content,
            "clearPreviewMenuSelectionIndexes();\n    clearPreviewEditDraftFields();",
        )
        _assert_contains(
            "AI candidate remove return status helper binding",
            content,
            "openScreenWithStatus(previewActionReturnScreen, aiCandidateRemoveCancelStatusMessage());",
        )
        _assert_contains(
            "AI candidate edit save success field clear helper binding",
            content,
            "clearSelectedPreviewEditDraft();\n      clearDailyRecordEntryMenu();",
        )
        _assert_contains(
            "AI candidate edit missing draft screen opener fallback",
            content,
            'if (!preview || selectedPreviewIndex === null || !selectedPreviewRecord) {\n      openScreen("aiReview");\n      return;',
        )
        _assert_contains(
            "AI candidate edit save success screen opener binding",
            content,
            "clearSelectedPreviewEditDraft();\n      clearDailyRecordEntryMenu();\n      openScreen(previewActionReturnScreen);",
        )
        _assert_contains(
            "AI candidate remove confirm missing pending screen opener fallback",
            content,
            "if (pendingPreviewRemoveIndex === null || !pendingPreviewRemoveRecord) {\n      setPendingPreviewRemoveIndex(null);\n      openScreen(previewActionReturnScreen);\n      return;",
        )
        _assert_contains(
            "AI candidate remove confirm success screen opener binding",
            content,
            "removePreviewRecord(pendingPreviewRemoveIndex);\n    openScreen(previewActionReturnScreen);",
        )
        _assert_contains(
            "transcript edit return selected draft clear helper binding",
            content,
            'setPreview(null);\n    clearSelectedPreviewEditDraft();\n    openScreenWithStatus("transcriptReview", transcriptReturnEditStatusMessage());',
        )
        _assert_contains(
            "AI candidate edit return binding",
            content,
            "onPress={returnFromPreviewRecordEdit}",
        )
        for label, marker in (
            ("AI candidate preview edit return accessibility label", 'previewEditReturnAccessibility: boundDisplayText("取消候選修改並返回 AI 確認，不寫入正式紀錄", maxDisplayDetailTextLength)'),
            ("AI candidate preview edit apply accessibility label", 'previewEditApplyAccessibility: boundDisplayText("套用未儲存候選修改，不送 backend save request", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("AI candidate preview edit return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.previewEditReturnAccessibility}"),
            ("AI candidate preview edit apply accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.previewEditApplyAccessibility}"),
            ("AI candidate preview edit disabled state", "accessibilityState={{ disabled: Boolean(previewRecordEditValidationError) }}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "manual record confirm enter handler",
            content,
            "function enterManualRecordConfirm()",
        )
        _assert_contains(
            "manual record confirm validation return helper binding",
            content,
            'openScreenWithStatus("manualRecord", validationError);',
        )
        _assert_contains(
            "manual record unavailable helper",
            content,
            "function openManualRecordUnavailable(screen: AppScreen)",
        )
        _assert_contains(
            "manual record unavailable helper fields",
            content,
            "openScreenWithStatus(screen, manualRecordCreateUnavailableStatusMessage(protectedBackendUnavailableMessage));",
        )
        _assert_contains(
            "manual record confirm unavailable helper binding",
            content,
            'openManualRecordUnavailable("manualRecord");',
        )
        _assert_contains(
            "manual record create unavailable helper binding",
            content,
            'openManualRecordUnavailable("manualRecordConfirm");',
        )
        _assert_contains(
            "manual record date-time now seed helper",
            content,
            "function seedManualRecordDateTimeForNow()",
        )
        _assert_contains(
            "manual record seed from record helper",
            content,
            "function seedManualRecordStateFromRecord(record: RecordItem)",
        )
        _assert_contains(
            "manual record empty now seed helper",
            content,
            "function seedEmptyManualRecordStateForNow()",
        )
        _assert_contains(
            "manual record open seed helper binding",
            content,
            "seedManualRecordDateTimeForNow();\n    setManualRecordReturnScreen(returnScreen);",
        )
        _assert_contains(
            "manual record confirm return handler",
            content,
            "function returnFromManualRecordConfirm()",
        )
        _assert_contains(
            "manual record confirm ready status helper binding",
            content,
            'openScreenWithStatus("manualRecordConfirm", manualRecordConfirmReadyStatusMessage());',
        )
        _assert_contains(
            "manual record confirm return status helper binding",
            content,
            'openScreenWithStatus("manualRecord", manualRecordConfirmReturnStatusMessage());',
        )
        _assert_contains(
            "manual record confirm enter binding",
            content,
            "onPress={enterManualRecordConfirm}",
        )
        _assert_contains(
            "manual record confirm return binding",
            content,
            "onPress={returnFromManualRecordConfirm}",
        )
        for label, marker in (
            ("transcript parse submit handler", "function submitTranscriptParse()"),
            ("AI save submit handler", "function submitAiSaveConfirm()"),
            ("manual record create submit handler", "function submitManualRecordCreate()"),
            ("record update submit handler", "function submitRecordUpdate()"),
            ("record delete submit handler", "function submitRecordDelete()"),
            ("dev reset menu submit handler", "function resetDevelopmentDataFromMenu()"),
            ("transcript parse submit binding", "onPress={submitTranscriptParse}"),
            ("AI save submit binding", "onPress={submitAiSaveConfirm}"),
            ("manual record create submit binding", "onSubmitPress={submitManualRecordCreate}"),
            ("record update submit binding", "onSubmitPress={submitRecordUpdate}"),
            ("record delete submit binding", "onPress={submitRecordDelete}"),
            ("dev reset menu submit binding", "onPress={resetDevelopmentDataFromMenu}"),
        ):
            _assert_contains(label, content, marker)
        dev_api_content = DEV_API_PATH.read_text(encoding="utf-8")
        dev_reset_tests_content = (REPO_ROOT / "backend" / "tests" / "test_dev_reset.py").read_text(encoding="utf-8")
        for label, marker in (
            ("dev reset includes year review share packages", "YearReviewSharePackage,"),
            ("dev reset includes year review snapshots", "YearReviewSnapshot,"),
            ("dev reset includes achievement unlocks", "AchievementUnlock,"),
        ):
            _assert_contains(label, dev_api_content, marker)
        for label, marker in (
            ("dev reset tests achievement deleted count", 'body["deleted_counts"]["achievement_unlocks"] >= 1'),
            ("dev reset tests year review package deleted count", 'body["deleted_counts"]["year_review_share_packages"] >= 1'),
            ("dev reset tests year review snapshot deleted count", 'body["deleted_counts"]["year_review_snapshots"] >= 1'),
        ):
            _assert_contains(label, dev_reset_tests_content, marker)
        _assert_contains(
            "delete confirm open handler",
            content,
            "function openDeleteConfirm()",
        )
        _assert_contains(
            "delete confirm open status helper binding",
            content,
            'openScreenWithStatus("deleteConfirm", deleteConfirmReadyStatusMessage());',
        )
        _assert_contains(
            "record action missing selection return helper",
            content,
            "function returnToRecordDetailForMissingSelection()",
        )
        _assert_contains(
            "record action missing selection return helper fields",
            content,
            'openScreen("recordDetail");',
        )
        _assert_contains(
            "delete confirm missing selection screen opener fallback",
            content,
            'if (!selectedRecord) {\n      returnToRecordDetailForMissingSelection();\n      return;\n    }\n    openScreenWithStatus("deleteConfirm", deleteConfirmReadyStatusMessage());',
        )
        _assert_contains(
            "delete confirm return handler",
            content,
            "function returnFromDeleteConfirm()",
        )
        _assert_contains(
            "delete confirm return status helper binding",
            content,
            'openScreenWithStatus("recordDetail", deleteConfirmReturnStatusMessage());',
        )
        _assert_contains(
            "delete confirm open binding",
            content,
            "onDeletePress={openDeleteConfirm}",
        )
        _assert_contains(
            "delete confirm return binding",
            content,
            "onPress={returnFromDeleteConfirm}",
        )
        _assert_contains(
            "record edit open handler",
            content,
            "function openRecordEdit()",
        )
        _assert_contains(
            "record edit seed from record helper",
            content,
            "function seedRecordEditStateFromRecord(record: RecordItem)",
        )
        _assert_contains(
            "record edit seed from record fields",
            content,
            "setRecordEditFields(recordPayloadToEditFields(record));",
        )
        _assert_contains(
            "record result select helper",
            content,
            "function selectRecordForResult(record: RecordItem)",
        )
        _assert_contains(
            "record result select helper fields",
            content,
            "setSelectedRecord(record);\n    setRecordEditFields(recordPayloadToEditFields(record));",
        )
        _assert_contains(
            "ai save result selected record helper binding",
            content,
            "if (createdRecords[0]) {\n        selectRecordForResult(createdRecords[0]);\n      }",
        )
        _assert_contains(
            "record update result selected record helper binding",
            content,
            "setRecords((current) => boundRecordsList(current.map((record) => (record.id === updated.id ? updated : record))));\n      selectRecordForResult(updated);",
        )
        _assert_contains(
            "manual create result selected record helper binding",
            content,
            "setRecords((current) => boundRecordsList([created, ...current]));\n      selectRecordForResult(created);",
        )
        _assert_contains(
            "save success result helper",
            content,
            "function openSaveSuccessResult(summary: string, entryMethod: SaveEntryMethod, returnScreen: AppScreen)",
        )
        _assert_contains(
            "save success result helper fields",
            content,
            'setLastSavedSummary(summary);\n    setLastSaveEntryMethod(entryMethod);\n    setSaveSuccessReturnScreen(returnScreen);\n    openScreen("saveSuccess");',
        )
        _assert_contains(
            "ai save success result helper binding",
            content,
            "setLastSaveErrorSummary(\"\");\n      openSaveSuccessResult(aiSaveSuccessSummaryMessage(savedCount), \"ai\", \"today\");",
        )
        _assert_contains(
            "manual create save success result helper binding",
            content,
            "seedEmptyManualRecordStateForNow();\n      openSaveSuccessResult(manualRecordCreateSummaryMessage(1), \"manual\", manualRecordReturnScreen);",
        )
        _assert_contains(
            "AI save failure result helper",
            content,
            "function openAiSaveFailureResult(message: string)",
        )
        _assert_contains(
            "AI save failure result helper fields",
            content,
            'setLastSaveErrorSummary(message);\n    setLastSaveEntryMethod("ai");\n    openScreen("aiSaveFailure");',
        )
        _assert_contains(
            "AI save failure result helper binding",
            content,
            "const message = aiSaveFailureStatusMessage(error);\n      openAiSaveFailureResult(message);\n      setStatus(message);",
        )
        _assert_contains(
            "record summary result helper",
            content,
            'function openRecordSummaryResult(\n    summary: string,\n    screen: "updateSuccess" | "deleteSuccess",',
        )
        _assert_contains(
            "record summary result helper fields",
            content,
            "setSummary(summary);\n    openScreen(screen);",
        )
        _assert_contains(
            "record update success result helper",
            content,
            "function openUpdateSuccessResult(summary: string)",
        )
        _assert_contains(
            "record update success result helper fields",
            content,
            'openRecordSummaryResult(summary, "updateSuccess", setLastUpdatedSummary);',
        )
        _assert_contains(
            "record update success result helper binding",
            content,
            "setRecords((current) => boundRecordsList(current.map((record) => (record.id === updated.id ? updated : record))));\n      selectRecordForResult(updated);\n      openUpdateSuccessResult(recordUpdateSummaryMessage(1));",
        )
        _assert_contains(
            "record delete success result helper",
            content,
            "function openDeleteSuccessResult(summary: string)",
        )
        _assert_contains(
            "record delete success result helper fields",
            content,
            'openRecordSummaryResult(summary, "deleteSuccess", setLastDeletedSummary);',
        )
        _assert_contains(
            "record edit seed empty now helper",
            content,
            "function seedEmptyRecordEditStateForNow()",
        )
        _assert_contains(
            "record edit open seed helper binding",
            content,
            'seedRecordEditStateFromRecord(record);\n    openScreenWithStatus("editRecord", recordEditOpenStatusMessage());',
        )
        _assert_contains(
            "record edit missing selection screen opener fallback",
            content,
            'const record = selectedRecord;\n    if (!record) {\n      returnToRecordDetailForMissingSelection();\n      return;\n    }\n    seedRecordEditStateFromRecord(record);',
        )
        _assert_contains(
            "record edit return empty seed helper binding",
            content,
            'seedEmptyRecordEditStateForNow();\n    }\n    openScreenWithStatus("recordDetail", recordEditCancelStatusMessage());',
        )
        _assert_contains(
            "record delete success empty edit seed helper binding",
            content,
            "setSelectedRecord(null);\n      seedEmptyRecordEditStateForNow();\n      openDeleteSuccessResult(recordDeleteSummaryMessage(1));",
        )
        _assert_contains(
            "record detail screen helper",
            content,
            "function openRecordDetailScreen(record: RecordItem, returnScreen: AppScreen)",
        )
        _assert_contains(
            "record detail screen helper fields",
            content,
            'setRecordDetailReturnScreen(returnScreen);\n    seedRecordEditStateFromRecord(record);\n    openScreen("recordDetail");',
        )
        _assert_contains(
            "record detail open helper binding",
            content,
            "setSelectedRecord(record);\n    openRecordDetailScreen(record, returnScreen);",
        )
        _assert_contains(
            "selected record detail open helper binding",
            content,
            "openRecordDetailScreen(selectedRecord, returnScreen);",
        )
        _assert_contains(
            "record edit return handler",
            content,
            "function returnFromRecordEdit()",
        )
        _assert_contains(
            "record edit open binding",
            content,
            "onEditPress={openRecordEdit}",
        )
        _assert_contains(
            "record edit return binding",
            content,
            "onCancelPress={returnFromRecordEdit}",
        )
        _assert_contains(
            "delete success destination handler",
            content,
            "function openDeleteSuccessDestination(target: AppScreen)",
        )
        _assert_contains(
            "record result destination helper",
            content,
            'function openRecordResultDestination(kind: "delete" | "update", target: AppScreen)',
        )
        _assert_contains(
            "record result destination helper fields",
            content,
            "openScreenWithStatus(target, recordResultDestinationStatusMessage(kind, target));",
        )
        _assert_contains(
            "delete success destination result helper binding",
            content,
            'openRecordResultDestination("delete", target);',
        )
        _assert_contains(
            "update success destination handler",
            content,
            "function openUpdateSuccessDestination(target: AppScreen)",
        )
        _assert_contains(
            "update success destination detail special case",
            content,
            "if (target === \"recordDetail\") {\n      openSelectedRecordDetail(\"updateSuccess\");\n      setStatus(recordResultDestinationStatusMessage(\"update\", target));\n      return;\n    }",
        )
        _assert_contains(
            "update success destination result helper binding",
            content,
            'openRecordResultDestination("update", target);',
        )
        _assert_contains(
            "delete success destination card handler",
            content,
            "function openDeleteSuccessDestinationCard(target: AppScreen)",
        )
        _assert_contains(
            "delete success destination card press handler",
            content,
            "function pressDeleteSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>)",
        )
        _assert_contains(
            "delete success destination card target helper binding",
            content,
            "openDeleteSuccessDestinationCard(destinationCardTarget(item));",
        )
        _assert_contains(
            "delete success history destination handler",
            content,
            "function openDeleteSuccessHistoryDestination()",
        )
        _assert_contains(
            "update success destination card handler",
            content,
            "function openUpdateSuccessDestinationCard(target: AppScreen)",
        )
        _assert_contains(
            "update success destination card press handler",
            content,
            "function pressUpdateSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>)",
        )
        _assert_contains(
            "update success destination card target helper binding",
            content,
            "openUpdateSuccessDestinationCard(destinationCardTarget(item));",
        )
        _assert_contains(
            "updated record detail handler",
            content,
            "function openUpdatedRecordDetail()",
        )
        _assert_contains(
            "delete success return handler",
            content,
            "function returnFromDeleteSuccess()",
        )
        _assert_contains(
            "update success return handler",
            content,
            "function returnFromUpdateSuccess()",
        )
        _assert_contains(
            "record action unavailable helper",
            content,
            "function openRecordActionUnavailable(screen: AppScreen, statusMessage: string)",
        )
        _assert_contains(
            "record action unavailable helper fields",
            content,
            "openScreenWithStatus(screen, statusMessage);",
        )
        _assert_contains(
            "record update unavailable helper binding",
            content,
            'openRecordActionUnavailable("editRecord", recordUpdateUnavailableStatusMessage(protectedBackendUnavailableMessage));',
        )
        _assert_contains(
            "record delete unavailable helper binding",
            content,
            'openRecordActionUnavailable("deleteConfirm", recordDeleteUnavailableStatusMessage(protectedBackendUnavailableMessage));',
        )
        _assert_contains(
            "delete success destination card binding",
            content,
            "onPress={() => pressDeleteSuccessDestinationCard(item)}",
        )
        _assert_contains(
            "delete success destination helper binding",
            content,
            "const deleteSuccessDestinationItems = deleteSuccessDestinationDisplayItems();",
        )
        _assert_contains(
            "delete success checklist helper binding",
            content,
            "deleteSuccessBoundaryChecklistDisplayItems(mobileRecordSyncDisplayLimit)",
        )
        _assert_contains(
            "delete success destination card accessibility binding",
            content,
            "accessibilityLabel={destinationCardAccessibilityLabel(item)}",
        )
        _assert_contains(
            "delete success destination card button role",
            content,
            'accessibilityRole="button"\n                  style={styles.postSaveCard}',
        )
        _assert_contains(
            "delete success history destination binding",
            content,
            "onPress={openDeleteSuccessHistoryDestination}",
        )
        _assert_contains(
            "update success destination card binding",
            content,
            "onPress={() => pressUpdateSuccessDestinationCard(item)}",
        )
        _assert_contains(
            "update success destination helper binding",
            content,
            "const updateSuccessDestinationItems = updateSuccessDestinationDisplayItems(Boolean(selectedRecord));",
        )
        _assert_contains(
            "update success checklist helper binding",
            content,
            "updateSuccessBoundaryChecklistDisplayItems(mobileRecordSyncDisplayLimit)",
        )
        _assert_contains(
            "update success destination card accessibility binding",
            content,
            "accessibilityLabel={destinationCardAccessibilityLabel(item)}",
        )
        _assert_contains(
            "update success destination card button role",
            content,
            'accessibilityRole="button"\n                    style={styles.postSaveCard}',
        )
        _assert_not_contains(
            "delete success direct destination card press binding",
            content,
            "onPress={() => openDeleteSuccessDestinationCard(item.target)}",
        )
        _assert_not_contains(
            "update success direct destination card press binding",
            content,
            "onPress={() => openUpdateSuccessDestinationCard(item.target)}",
        )
        _assert_not_contains(
            "delete success direct destination card binding",
            content,
            "onPress={() => openDeleteSuccessDestination(item.target)}",
        )
        _assert_not_contains(
            "delete success direct history destination binding",
            content,
            'onPress={() => openDeleteSuccessDestination("history")}',
        )
        _assert_not_contains(
            "update success direct destination card binding",
            content,
            "onPress={() => openUpdateSuccessDestination(item.target)}",
        )
        for block_label, pattern in (
            (
                "save success destination card render block",
                r"saveSuccessDestinationItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            ),
            (
                "delete success destination card render block",
                r"deleteSuccessDestinationItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            ),
            (
                "update success destination card render block",
                r"updateSuccessDestinationItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            ),
        ):
            destination_card_render_block = _match_block(content, pattern, block_label)
            for label, marker in (
                ("direct destination card key binding", "key={`${item.target}-${item.label}`}"),
                ("direct destination card accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
                ("direct destination card icon binding", "<Text>{item.icon}</Text>"),
                ("direct destination card label binding", "<Text style={styles.recordType}>{item.label}</Text>"),
                ("direct destination card helper binding", "<Text style={styles.evidence}>{item.helper}</Text>"),
            ):
                _assert_not_contains(f"{block_label} {label}", destination_card_render_block, marker)
        _assert_contains(
            "updated record detail binding",
            content,
            "onPress={openUpdatedRecordDetail}",
        )
        _assert_contains(
            "delete success return binding",
            content,
            "onPress={returnFromDeleteSuccess}",
        )
        _assert_contains(
            "update success return binding",
            content,
            "onPress={returnFromUpdateSuccess}",
        )
        _assert_contains(
            "menu card accessibility item",
            shared_display_items_content,
            "accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)",
        )
        _assert_contains(
            "menu card accessibility binding",
            content,
            "accessibilityLabel={menuDestinationAccessibilityLabel(item)}",
        )
        _assert_contains(
            "menu card button role",
            content,
            'accessibilityRole="button"\n                  style={styles.menuCard}',
        )
        _assert_contains(
            "menu return handler",
            content,
            "function returnFromMenu()",
        )
        _assert_contains(
            "menu return status helper binding",
            content,
            "openScreenWithStatus(menuReturnScreen, menuReturnStatusMessage(menuReturnScreen));",
        )
        _assert_contains(
            "menu destination handler",
            content,
            "function openMenuDestination(target: AppScreen)",
        )
        _assert_contains(
            "menu target route handler",
            content,
            "function openMenuTargetRoute(target: AppScreen)",
        )
        _assert_contains(
            "menu target route community binding",
            content,
            'openCommunity("menu");',
        )
        _assert_contains(
            "menu target route fallback",
            content,
            "return false;\n  }\n\n  function openMenuDestination(target: AppScreen)",
        )
        _assert_contains(
            "menu target route helper binding",
            content,
            "if (openMenuTargetRoute(target)) {",
        )
        _assert_contains(
            "menu destination fallback screen opener binding",
            content,
            "if (openMenuTargetRoute(target)) {\n      return;\n    }\n    openScreen(target);",
        )
        _assert_contains(
            "menu destination press wrapper",
            content,
            "function pressMenuDestination(item: ReturnType<typeof menuScreenDisplayItem>)",
        )
        _assert_contains(
            "menu destination target helper",
            content,
            "function menuDestinationTarget(item: ReturnType<typeof menuScreenDisplayItem>)",
        )
        _assert_contains(
            "menu destination target helper fields",
            content,
            "return item.target;",
        )
        for label, marker in (
            ("menu destination key helper", "function menuDestinationKey(item: ReturnType<typeof menuScreenDisplayItem>)"),
            ("menu destination key helper fields", "return item.target;"),
            ("menu destination key binding", "key={menuDestinationKey(item)}"),
            ("menu destination accessibility helper", "function menuDestinationAccessibilityLabel(item: ReturnType<typeof menuScreenDisplayItem>)"),
            ("menu destination accessibility helper fields", "return item.accessibilityLabel;"),
            ("menu destination accessibility binding", "accessibilityLabel={menuDestinationAccessibilityLabel(item)}"),
            ("menu destination icon helper", "function menuDestinationIcon(item: ReturnType<typeof menuScreenDisplayItem>)"),
            ("menu destination icon helper fields", "return item.icon;"),
            ("menu destination icon binding", "{menuDestinationIcon(item)}"),
            ("menu destination label helper", "function menuDestinationLabel(item: ReturnType<typeof menuScreenDisplayItem>)"),
            ("menu destination label helper fields", "return item.label;"),
            ("menu destination label binding", "{menuDestinationLabel(item)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "menu destination target helper binding",
            content,
            "openMenuDestination(menuDestinationTarget(item));",
        )
        _assert_contains(
            "menu return binding",
            content,
            "onPress={returnFromMenu}",
        )
        _assert_contains(
            "menu destination binding",
            content,
            "onPress={() => pressMenuDestination(item)}",
        )
        _assert_not_contains(
            "menu direct destination binding",
            content,
            "onPress={() => openMenuDestination(item.target)}",
        )
        _assert_not_contains(
            "menu direct destination handler target binding",
            content,
            "openMenuDestination(item.target);",
        )
        menu_destination_render_block = _match_block(
            content,
            r"menuDisplayItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "menu destination render block",
        )
        for label, marker in (
            ("direct menu destination key binding", "key={item.target}"),
            ("direct menu destination accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct menu destination icon binding", "<Text style={styles.menuIconText}>{item.icon}</Text>"),
            ("direct menu destination label binding", "<Text style={styles.menuLabel}>{item.label}</Text>"),
        ):
            _assert_not_contains(label, menu_destination_render_block, marker)
        _assert_contains(
            "more action accessibility",
            content,
            "accessibilityLabel={auxiliaryDisplayLabels.showMoreFeaturesAccessibility}",
        )
        _assert_contains(
            "more action button role",
            content,
            'accessibilityRole="button"\n                style={styles.moreButton}',
        )
        _assert_contains(
            "dev reset accessibility",
            content,
            "accessibilityLabel={auxiliaryDisplayLabels.devResetAccessibility}",
        )
        _assert_contains(
            "visual smoke route jump list",
            navigation_content,
            "const visualSmokeRouteJumps",
        )
        _assert_contains(
            "visual smoke route id list helper",
            navigation_content,
            "const visualSmokeRouteJumpIds = visualSmokeRouteJumps.map((route) => route.id)",
        )
        _assert_contains(
            "visual smoke initial route normalizer",
            navigation_content,
            "function normalizeVisualSmokeInitialRoute(",
        )
        _assert_contains(
            "visual smoke deep link route helper",
            navigation_content,
            "function visualSmokeRouteFromDeepLinkUrl(",
        )
        _assert_contains(
            "visual smoke record list route helper",
            navigation_content,
            "export function isVisualSmokeRecordListScreen(screen: AppScreen)",
        )
        _assert_contains(
            "visual smoke record list route helper condition",
            navigation_content,
            'return screen === "today" || screen === "history" || screen === "analysis";',
        )
        _assert_contains(
            "visual smoke ai preview route helper",
            navigation_content,
            "export function isVisualSmokeAiPreviewScreen(screen: AppScreen)",
        )
        _assert_contains(
            "visual smoke ai preview route helper condition",
            navigation_content,
            'return screen === "aiReview" || screen === "aiSaveConfirm";',
        )
        _assert_contains(
            "visual smoke subscription status route helper",
            navigation_content,
            "export function isVisualSmokeSubscriptionStatusScreen(screen: AppScreen)",
        )
        _assert_contains(
            "visual smoke subscription status route helper condition",
            navigation_content,
            'return screen === "subscriptionManagement" || screen === "membershipStatus";',
        )
        _assert_contains(
            "visual smoke settings menu route helper",
            navigation_content,
            "export function isVisualSmokeSettingsMenuScreen(screen: AppScreen)",
        )
        _assert_contains(
            "visual smoke settings menu route helper condition",
            navigation_content,
            'return screen === "settings" || isSettingsSubpageScreen(screen) || screen === "menu";',
        )
        _assert_contains(
            "visual smoke boot skipped display helper",
            navigation_content,
            "function visualSmokeBootSkippedDisplayMessages()",
        )
        _assert_contains(
            "visual smoke boot ignored display helper",
            navigation_content,
            "function visualSmokeBootIgnoredDisplayMessages()",
        )
        _assert_contains(
            "visual smoke deep link status helper",
            navigation_content,
            "function visualSmokeDeepLinkStatusMessage(route: AppScreen)",
        )
        _assert_contains(
            "visual smoke shared auth status helper",
            navigation_content,
            "function visualSmokePreviewAuthStatusMessage()",
        )
        _assert_contains(
            "visual smoke boot skipped no backend copy",
            navigation_content,
            "Visual smoke 本機路由預覽；已跳過 backend boot，不會呼叫 API 或寫入資料。",
        )
        _assert_contains(
            "visual smoke boot ignored no clear copy",
            navigation_content,
            "Visual smoke 本機路由預覽；backend boot 結果已忽略，不清除本機 demo records。",
        )
        _assert_contains(
            "visual smoke deep link no write copy",
            navigation_content,
            "Visual smoke deep link opened ${route}; 本機路由預覽不呼叫 API 或寫入資料。",
        )
        _assert_contains(
            "visual smoke auth status copy",
            navigation_content,
            "Visual smoke demo state only; no dev-login, token, backend, AI, STT, Vision, payment, or database writes.",
        )
        _assert_contains(
            "visual smoke route helper debug gate",
            navigation_content,
            "if (!enableDebugTools || !allowMobileDevAuth)",
        )
        _assert_contains(
            "visual smoke route jump debug gate",
            content,
            "allowMobileDevAuth && enableDebugTools",
        )
        _assert_contains(
            "visual smoke route jump guarded handler",
            content,
            "if (!enableDebugTools || !allowMobileDevAuth)",
        )
        _assert_contains(
            "visual smoke seeded record route handler",
            content,
            "function openVisualSmokeRecordSeedRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke demo records seed helper",
            content,
            "function seedVisualSmokeDemoRecords()",
        )
        _assert_contains(
            "visual smoke demo records seed helper fields",
            content,
            "setRecords(visualSmokeDemoRecords());",
        )
        _assert_contains(
            "visual smoke demo preview seed helper",
            content,
            "function seedVisualSmokeDemoPreview()",
        )
        _assert_contains(
            "visual smoke demo preview seed helper fields",
            content,
            "setPreview(visualSmokeDemoPreview());",
        )
        _assert_contains(
            "visual smoke selected record seed helper",
            content,
            "function seedVisualSmokeSelectedRecord(record: RecordItem)",
        )
        _assert_contains(
            "visual smoke selected record seed helper fields",
            content,
            "seedVisualSmokeDemoRecords();\n    setSelectedRecord(record);",
        )
        _assert_contains(
            "visual smoke history record selection helper",
            content,
            "function seedVisualSmokeHistoryRecordSelection(record: RecordItem)",
        )
        _assert_contains(
            "visual smoke history record selection helper fields",
            content,
            "seedVisualSmokeSelectedRecord(record);\n    setRecordDetailReturnScreen(\"history\");",
        )
        _assert_contains(
            "visual smoke history record screen helper",
            content,
            "function openVisualSmokeHistoryRecordScreen(record: RecordItem, screen: AppScreen)",
        )
        _assert_contains(
            "visual smoke history record screen helper fields",
            content,
            "seedVisualSmokeHistoryRecordSelection(record);\n    openScreen(screen);",
        )
        _assert_contains(
            "visual smoke save success selected record helper binding",
            content,
            "seedVisualSmokeSelectedRecord(demoRecord);\n      setLastSavedSummary(\"Visual smoke demo save result.\");",
        )
        _assert_contains(
            "visual smoke record list demo records seed helper binding",
            content,
            "if (isVisualSmokeRecordListScreen(target)) {\n      seedVisualSmokeDemoRecords();\n      openScreen(target);",
        )
        _assert_contains(
            "visual smoke record detail selection helper binding",
            content,
            'openVisualSmokeHistoryRecordScreen(demoRecord, "recordDetail");',
        )
        _assert_contains(
            "visual smoke delete confirm selection helper binding",
            content,
            'openVisualSmokeHistoryRecordScreen(demoRecord, "deleteConfirm");',
        )
        _assert_contains(
            "visual smoke seeded record route save summary",
            content,
            'setLastSavedSummary("Visual smoke demo save result.");',
        )
        _assert_contains(
            "visual smoke seeded record route save screen opener",
            content,
            'setLastSaveEntryMethod("ai");\n      openScreen("saveSuccess");',
        )
        _assert_contains(
            "visual smoke seeded record route edit seed helper",
            content,
            'seedVisualSmokeSelectedRecord(demoRecord);\n      seedRecordEditStateFromRecord(demoRecord);\n      openScreen("editRecord");',
        )
        _assert_contains(
            "visual smoke seeded record route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeWorkflowSeedRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke workflow seed route handler",
            content,
            "function openVisualSmokeWorkflowSeedRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke workflow seed route manual fields",
            content,
            "seedManualRecordStateFromRecord(demoRecord);",
        )
        _assert_contains(
            "visual smoke workflow seed route manual screen opener",
            content,
            'setManualRecordReturnScreen("menu");\n      openScreen("manualRecordConfirm");',
        )
        _assert_contains(
            "visual smoke workflow seed route report",
            content,
            "setBasicReport(visualSmokeDemoReport());",
        )
        _assert_contains(
            "visual smoke workflow seed route report screen opener",
            content,
            'setReportStatus(visualSmokeRecordSyncStatusMessage());\n      openScreen("detailedReport");',
        )
        _assert_contains(
            "visual smoke workflow seed route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeAiSeedRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke ai seed route handler",
            content,
            "function openVisualSmokeAiSeedRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke ai seed route failure result helper binding",
            content,
            'seedVisualSmokeDemoPreview();\n      openAiSaveFailureResult("Visual smoke demo save failure.");',
        )
        _assert_contains(
            "visual smoke AI preview seed helper binding",
            content,
            "if (isVisualSmokeAiPreviewScreen(target)) {\n      seedVisualSmokeDemoPreview();\n      openScreen(target);",
        )
        _assert_contains(
            "visual smoke ai seed route edit seed helper",
            content,
            'seedPreviewEditStateFromRecord(demoRecord);\n      openScreen("editPreviewRecord");',
        )
        _assert_contains(
            "visual smoke ai seed route remove index",
            content,
            "setPendingPreviewRemoveIndex(0);",
        )
        _assert_contains(
            "visual smoke ai seed route remove screen opener",
            content,
            'setPendingPreviewRemoveIndex(0);\n      openScreen("aiRemoveConfirm");',
        )
        _assert_contains(
            "visual smoke ai seed route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeMenuReturnRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke menu return route handler",
            content,
            "function openVisualSmokeMenuReturnRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke menu return route manual binding",
            content,
            'openManualRecord("menu");',
        )
        _assert_contains(
            "visual smoke menu return route store cart binding",
            content,
            'setStoreReturnScreen("menu");\n      openStoreCart();',
        )
        _assert_contains(
            "visual smoke menu return route food photo binding",
            content,
            'openFoodPhoto("menu");',
        )
        _assert_contains(
            "visual smoke menu return route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeFutureModuleRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke future module route handler",
            content,
            "function openVisualSmokeFutureModuleRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke future module route detail seed",
            content,
            "openFutureModuleDetailResult(futureModuleCards[0] ?? null);",
        )
        _assert_contains(
            "future module detail result helper",
            content,
            "function openFutureModuleDetailResult(module: FutureModuleCard | null)",
        )
        _assert_contains(
            "future module detail result helper fields",
            content,
            'setSelectedFutureModule(module);\n    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());\n    openScreen("futureModuleDetail");',
        )
        _assert_contains(
            "future module detail handler helper binding",
            content,
            "function openFutureModuleDetail(module: FutureModuleCard) {\n    openFutureModuleDetailResult(module);",
        )
        _assert_contains(
            "future preview return screen helper",
            content,
            "function futurePreviewReturnScreen(returnScreen: AppScreen, selfScreen: AppScreen)",
        )
        _assert_contains(
            "future preview return screen helper fields",
            content,
            'return returnScreen === selfScreen ? "futureModules" : returnScreen;',
        )
        _assert_contains(
            "future preview action clear status helper",
            content,
            "function futurePreviewActionClearStatusMessage()",
        )
        _assert_contains(
            "future preview action clear status helper fields",
            content,
            "return previewActionClearStatusMessage();",
        )
        _assert_contains(
            "future preview screen opener helper",
            content,
            "function openFuturePreviewScreen(\n    screen: AppScreen,\n    returnScreen: AppScreen,",
        )
        _assert_contains(
            "future preview screen opener helper fields",
            content,
            "setReturnScreen(futurePreviewReturnScreen(returnScreen, screen));\n    setActionStatus(futurePreviewActionClearStatusMessage());\n    openScreen(screen);",
        )
        _assert_contains(
            "future preview return action helper",
            content,
            "function returnFromFuturePreviewScreen(returnScreen: AppScreen)",
        )
        _assert_contains(
            "future preview return action helper fields",
            content,
            "openScreenWithStatus(returnScreen, futurePreviewReturnStatusMessage(returnScreen));",
        )
        _assert_contains(
            "future modules open action helper binding",
            content,
            "function openFutureModulesFromMenu() {\n    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());",
        )
        _assert_contains(
            "future modules open status helper binding",
            content,
            'openScreenWithStatus("futureModules", futureModulesOpenStatusMessage());',
        )
        _assert_contains(
            "future modules return menu status helper binding",
            content,
            'openScreenWithStatus("menu", futureModulesReturnMenuStatusMessage());',
        )
        _assert_contains(
            "future module detail return status helper binding",
            content,
            'openScreenWithStatus("futureModules", futureModuleDetailReturnStatusMessage());',
        )
        _assert_contains(
            "future module destination action helper binding",
            content,
            "function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard) {\n    setFutureModuleActionStatus(futurePreviewActionClearStatusMessage());",
        )
        _assert_contains(
            "doctor share future preview opener helper binding",
            content,
            'openFuturePreviewScreen("doctorShare", returnScreen, setDoctorShareReturnScreen, setDoctorShareActionStatus);',
        )
        _assert_contains(
            "health integration future preview opener helper binding",
            content,
            'openFuturePreviewScreen(\n      "healthIntegration",\n      returnScreen,\n      setHealthIntegrationReturnScreen,\n      setHealthIntegrationActionStatus\n    );',
        )
        _assert_contains(
            "community future preview opener helper binding",
            content,
            'openFuturePreviewScreen("community", returnScreen, setCommunityReturnScreen, setCommunityActionStatus);',
        )
        _assert_contains(
            "community screen opener keeps sync calls binding",
            content,
            'openFuturePreviewScreen("community", returnScreen, setCommunityReturnScreen, setCommunityActionStatus);\n    void loadCommunityPublicSettings();\n    void loadFoodCommunityCategories();\n    void loadCommunityFoods();',
        )
        _assert_contains(
            "ranking future preview opener helper binding",
            content,
            'openFuturePreviewScreen("ranking", returnScreen, setRankingReturnScreen, setRankingActionStatus);',
        )
        _assert_contains(
            "ranking screen opener keeps leaderboard sync binding",
            content,
            'openFuturePreviewScreen("ranking", returnScreen, setRankingReturnScreen, setRankingActionStatus);\n    void loadCommunityLeaderboards();',
        )
        _assert_contains(
            "doctor share future preview return action helper binding",
            content,
            "returnFromFuturePreviewScreen(doctorShareReturnScreen);",
        )
        _assert_contains(
            "food photo future preview return action helper binding",
            content,
            "returnFromFuturePreviewScreen(foodPhotoReturnScreen);",
        )
        _assert_contains(
            "visual smoke future module route doctor binding",
            content,
            'openDoctorShare("futureModules");',
        )
        _assert_contains(
            "visual smoke future module route ranking binding",
            content,
            'openRanking("futureModules");',
        )
        _assert_contains(
            "visual smoke future module route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeTranscriptRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke transcript route handler",
            content,
            "function openVisualSmokeTranscriptRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke transcript route return screen",
            content,
            'setTranscriptReviewReturnScreen("record");',
        )
        _assert_contains(
            "visual smoke transcript route sample draft",
            content,
            'updateTranscriptDraft(sampleText, "sample");',
        )
        _assert_contains(
            "visual smoke transcript route screen opener",
            content,
            'updateTranscriptDraft(sampleText, "sample");\n      openScreen("transcriptReview");',
        )
        _assert_contains(
            "visual smoke transcript route fallback",
            content,
            "return false;\n  }\n\n  function openVisualSmokeRoute(target: AppScreen)",
        )
        _assert_contains(
            "visual smoke record list helper binding",
            content,
            "if (isVisualSmokeRecordListScreen(target)) {",
        )
        _assert_contains(
            "visual smoke record list screen opener binding",
            content,
            "if (isVisualSmokeRecordListScreen(target)) {\n      seedVisualSmokeDemoRecords();\n      openScreen(target);",
        )
        _assert_contains(
            "visual smoke record direct screen opener binding",
            content,
            'if (target === "record") {\n      openScreen("record");\n      return;',
        )
        _assert_contains(
            "visual smoke transcript route helper binding",
            content,
            "if (openVisualSmokeTranscriptRoute(target)) {",
        )
        _assert_contains(
            "visual smoke ai preview helper binding",
            content,
            "if (isVisualSmokeAiPreviewScreen(target)) {",
        )
        _assert_contains(
            "visual smoke AI preview screen opener binding",
            content,
            "if (isVisualSmokeAiPreviewScreen(target)) {\n      seedVisualSmokeDemoPreview();\n      openScreen(target);",
        )
        _assert_contains(
            "visual smoke ai seed route helper binding",
            content,
            "if (openVisualSmokeAiSeedRoute(target)) {",
        )
        _assert_contains(
            "visual smoke seeded record route helper binding",
            content,
            "if (openVisualSmokeRecordSeedRoute(target)) {",
        )
        _assert_contains(
            "visual smoke workflow seed route helper binding",
            content,
            "if (openVisualSmokeWorkflowSeedRoute(target)) {",
        )
        _assert_contains(
            "visual smoke menu return route helper binding",
            content,
            "if (openVisualSmokeMenuReturnRoute(target)) {",
        )
        _assert_contains(
            "visual smoke subscription status helper binding",
            content,
            "if (isVisualSmokeSubscriptionStatusScreen(target)) {",
        )
        _assert_contains(
            "visual smoke subscription status screen opener binding",
            content,
            "if (isVisualSmokeSubscriptionStatusScreen(target)) {\n      openScreen(target);\n      return;",
        )
        _assert_contains(
            "visual smoke deep link status binding",
            content,
            "setStatus(visualSmokeDeepLinkStatusMessage(deepLinkRoute));",
        )
        _assert_contains(
            "visual smoke settings subpage helper binding",
            content,
            "if (isVisualSmokeSettingsMenuScreen(target)) {",
        )
        _assert_contains(
            "visual smoke settings subpage screen opener binding",
            content,
            "if (isVisualSmokeSettingsMenuScreen(target)) {\n      openScreen(target);\n      return;",
        )
        _assert_contains(
            "visual smoke future module route helper binding",
            content,
            "if (openVisualSmokeFutureModuleRoute(target)) {",
        )
        _assert_contains(
            "visual smoke fallback screen opener binding",
            content,
            "if (openVisualSmokeFutureModuleRoute(target)) {\n      return;\n    }\n    openScreen(target);",
        )
        _assert_contains(
            "visual smoke boot skipped display binding",
            content,
            "const display = visualSmokeBootSkippedDisplayMessages();",
        )
        _assert_contains(
            "visual smoke boot ignored display binding",
            content,
            "const display = visualSmokeBootIgnoredDisplayMessages();",
        )
        _assert_contains(
            "visual smoke route press wrapper",
            content,
            "function pressVisualSmokeRoute(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)",
        )
        _assert_contains(
            "visual smoke route target helper",
            content,
            "function visualSmokeRouteTarget(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)",
        )
        _assert_contains(
            "visual smoke route target helper fields",
            content,
            "return item.target;",
        )
        for label, marker in (
            ("visual smoke route key helper", "function visualSmokeRouteKey(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)"),
            ("visual smoke route key helper fields", "return item.target;"),
            ("visual smoke route key binding", "key={visualSmokeRouteKey(item)}"),
            ("visual smoke route accessibility helper", "function visualSmokeRouteAccessibilityLabel(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)"),
            ("visual smoke route accessibility helper fields", "return item.accessibilityLabel;"),
            ("visual smoke route accessibility binding", "accessibilityLabel={visualSmokeRouteAccessibilityLabel(item)}"),
            ("visual smoke route label helper", "function visualSmokeRouteLabel(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)"),
            ("visual smoke route label helper fields", "return item.label;"),
            ("visual smoke route label binding", "{visualSmokeRouteLabel(item)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "visual smoke route target helper binding",
            content,
            "openVisualSmokeRoute(visualSmokeRouteTarget(item));",
        )
        _assert_contains(
            "visual smoke route press binding",
            content,
            "onPress={() => pressVisualSmokeRoute(item)}",
        )
        _assert_not_contains(
            "visual smoke direct route binding",
            content,
            "onPress={() => openVisualSmokeRoute(item.target)}",
        )
        _assert_not_contains(
            "visual smoke direct route handler target binding",
            content,
            "openVisualSmokeRoute(item.target);",
        )
        visual_smoke_route_render_block = _match_block(
            content,
            r"visualSmokeRouteJumpDisplayItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "visual smoke route render block",
        )
        for label, marker in (
            ("direct visual smoke route key binding", "key={item.target}"),
            ("direct visual smoke route accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct visual smoke route label binding", "<Text style={styles.visualSmokeRouteChipText}>{item.label}</Text>"),
        ):
            _assert_not_contains(label, visual_smoke_route_render_block, marker)
        _assert_contains(
            "visual smoke initial route env",
            app_runtime_config_content,
            "EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE",
        )
        _assert_contains(
            "visual smoke initial route uses current screen",
            content,
            'useState<AppScreen>(initialVisualSmokeScreen ?? "today")',
        )
        _assert_contains(
            "visual smoke detail seed module",
            content,
            'initialVisualSmokeScreen === "futureModuleDetail" ? futureModuleCards[0] ?? null : null',
        )
        _assert_contains(
            "visual smoke route jump accessibility binding",
            content,
            "accessibilityLabel={visualSmokeRouteAccessibilityLabel(item)}",
        )
        _assert_contains(
            "store product action accessibility",
            content,
            "accessibilityLabel={storeProductActionAccessibilityLabel(product)}",
        )
        _assert_contains(
            "food photo upload accessibility",
            content,
            "accessibilityLabel={auxiliaryDisplayLabels.foodPhotoUploadAccessibility}",
        )
        scroll_views_missing_keyboard_tap_handling = _scroll_views_missing_keyboard_tap_handling(content)
        if scroll_views_missing_keyboard_tap_handling:
            raise AssertionError(
                "ScrollViews missing keyboard tap handling: "
                + " | ".join(scroll_views_missing_keyboard_tap_handling[:5])
            )
        keyboard_avoiding_view_errors = _keyboard_avoiding_view_errors(content)
        if keyboard_avoiding_view_errors:
            raise AssertionError(
                "KeyboardAvoidingView contract missing: "
                + " | ".join(keyboard_avoiding_view_errors)
            )
        unlabeled_text_inputs = _unlabeled_text_inputs(content)
        if unlabeled_text_inputs:
            raise AssertionError(
                "TextInputs missing accessibilityLabel: "
                + " | ".join(unlabeled_text_inputs[:3])
            )
        text_inputs_missing_max_length = _text_inputs_missing_max_length(content)
        if text_inputs_missing_max_length:
            raise AssertionError(
                "TextInputs missing maxLength: "
                + " | ".join(text_inputs_missing_max_length[:3])
            )
        editable_text_inputs_missing_disabled_state = _editable_text_inputs_missing_disabled_state(content)
        if editable_text_inputs_missing_disabled_state:
            raise AssertionError(
                "Editable TextInputs missing disabled accessibilityState: "
                + " | ".join(editable_text_inputs_missing_disabled_state[:3])
            )
        editable_text_inputs_mismatched_disabled_state = _editable_text_inputs_mismatched_disabled_state(content)
        if editable_text_inputs_mismatched_disabled_state:
            raise AssertionError(
                "Editable TextInputs accessibilityState does not match editable prop: "
                + " | ".join(editable_text_inputs_mismatched_disabled_state[:3])
            )
        text_inputs_missing_keyboard_normalization = _text_inputs_missing_keyboard_normalization(content)
        if text_inputs_missing_keyboard_normalization:
            raise AssertionError(
                "TextInputs missing keyboard normalization: "
                + " | ".join(text_inputs_missing_keyboard_normalization[:3])
            )
        numeric_text_inputs_missing_numeric_keyboard = _numeric_text_inputs_missing_numeric_keyboard(content)
        if numeric_text_inputs_missing_numeric_keyboard:
            raise AssertionError(
                "Numeric TextInputs missing numeric keyboard: "
                + " | ".join(numeric_text_inputs_missing_numeric_keyboard[:3])
            )
        multiline_text_inputs_missing_top_alignment = _multiline_text_inputs_missing_top_alignment(content)
        if multiline_text_inputs_missing_top_alignment:
            raise AssertionError(
                "Multiline TextInputs missing top alignment: "
                + " | ".join(multiline_text_inputs_missing_top_alignment[:3])
            )
        multiline_text_inputs_missing_named_style = _multiline_text_inputs_missing_named_style(content)
        if multiline_text_inputs_missing_named_style:
            raise AssertionError(
                "Multiline TextInputs missing approved height-bound style: "
                + " | ".join(multiline_text_inputs_missing_named_style[:3])
            )
        for style_name, minimum_height in MULTILINE_TEXT_INPUT_STYLE_RULES.items():
            block = _style_block(content, style_name)
            actual_min_height = _numeric_style_value(block, "minHeight")
            actual_line_height = _numeric_style_value(block, "lineHeight")
            if actual_min_height is None or actual_min_height < minimum_height:
                raise AssertionError(
                    f"{style_name}.minHeight must be >= {minimum_height}; "
                    f"found {actual_min_height if actual_min_height is not None else 'missing'}."
                )
            if actual_line_height is None or actual_line_height < 20:
                raise AssertionError(
                    f"{style_name}.lineHeight must be >= 20; "
                    f"found {actual_line_height if actual_line_height is not None else 'missing'}."
                )
        for style_name, (property_name, minimum_value) in MIN_TOUCH_TARGET_STYLE_RULES.items():
            block = _style_block(content, style_name)
            actual_value = _numeric_style_value(block, property_name)
            if actual_value is None or actual_value < minimum_value:
                raise AssertionError(
                    f"{style_name}.{property_name} must be >= {minimum_value}; "
                    f"found {actual_value if actual_value is not None else 'missing'}."
                )
        for style_name, minimum_width in MIN_TOUCH_TARGET_WIDTH_STYLE_RULES.items():
            block = _style_block(content, style_name)
            actual_width = _numeric_style_value(block, "width")
            if actual_width is None or actual_width < minimum_width:
                raise AssertionError(
                    f"{style_name}.width must be >= {minimum_width}; "
                    f"found {actual_width if actual_width is not None else 'missing'}."
                )
        for style_name, (property_name, expected_value) in READABILITY_STYLE_RULES.items():
            block = _style_block(content, style_name)
            _assert_contains(
                f"{style_name}.{property_name}",
                block,
                f"{property_name}: {expected_value}",
            )
        for label, marker in (
            ("primary tab navigation state helper binding", "const primaryTabNavigation = primaryTabNavigationState({ currentScreen, isAnyRequestInFlight });"),
            ("primary tab items binding", "const primaryTabItems = primaryTabNavigation.items;"),
            ("primary tab show binding", "const showPrimaryTabs = primaryTabNavigation.show;"),
            ("MVP flow stepper state helper binding", "const mvpFlowStepper = mvpFlowStepperState({"),
            ("MVP flow stepper index binding", "const mvpFlowStepIndex = mvpFlowStepper.stepIndex;"),
            ("MVP flow stepper show binding", "const showMvpFlowStepper = mvpFlowStepper.show;"),
            ("minimal home section style", "styles.homeMinimalSection"),
            ("minimal home mic button style", "styles.homeMicButton"),
            ("minimal home active mic style", "styles.homeMicButtonActive"),
            ("guided home tagline", "想說什麼就說什麼"),
            ("guided home tagline cue style", "styles.homeTaglineCue"),
            ("guided home tagline row style", "styles.homeTaglineRow"),
            ("guided home info icon style", "styles.homeGuidanceInfoIcon"),
            ("guided home info icon text", "<Text style={styles.homeGuidanceInfoIconText}>i</Text>"),
            ("guided home info row style", "styles.homeGuidanceInfoRow"),
            ("guided home non-button copy", "上面這排不是按鈕喔"),
            ("guided home flexible format copy", "想說什麼就說什麼，不用照固定格式"),
            ("guided home examples title", "範例（怎麼說都可以）"),
            ("guided home example carousel state", "const [homeExampleIndex, setHomeExampleIndex] = useState(0);"),
            ("guided home example carousel interval", "setHomeExampleIndex((value) => (value + 1) % homeSpeechExamples.length);"),
            ("guided home example meta row", "styles.homeExampleMetaRow"),
            ("guided home example pagination", "styles.homeExamplePagination"),
            ("guided home example active pagination dot", "styles.homeExampleDotActive"),
            ("minimal home primary hint", "按住開始說話記錄"),
            ("minimal home recording seconds display value", "const homeRecordingSecondaryHintDisplayText = homeRecordingSecondaryHint("),
            ("minimal home recording model status display value", "const homeRecordingModelStatusDisplayText = homeRecordingModelStatusCopy(Boolean(whisperModelPath.trim()));"),
            ("minimal home mic accessibility binding", "accessibilityLabel={recordingButtonDisplayAccessibilityLabel}"),
            ("minimal home mic press in", "onPressIn={startRecordingPreview}"),
            ("minimal home mic press out", "onPressOut={releaseRecordingPreview}"),
            ("recording release wrapper", "function releaseRecordingPreview()"),
            ("minimal home conditional subtitle", "{currentChrome.subtitle ? <Text style={styles.subtitle}>{currentChrome.subtitle}</Text> : null}"),
            ("native audio import", 'import { Audio } from "expo-av";'),
            ("native audio recording ref", "const audioRecordingRef = useRef<Audio.Recording | null>(null);"),
            ("native recording start guard", "const recordingStartInFlight = useRef(false);"),
            ("native recording stop guard", "const recordingStopInFlight = useRef(false);"),
            ("recording limit display copy", "const recordingLimitDisplayText = recordingLimitCopy(recordingEffectiveLimitDisplaySeconds);"),
            ("recording limit rendered in record page", "<Text style={styles.evidence}>{recordingLimitDisplayText}</Text>"),
            ("recording interval limit clamp", "setRecordingElapsedSeconds(clampNumber(nextElapsedSeconds, 0, limitSeconds));"),
            ("recording interval auto stop", 'void finishRecordingPreview("limit");'),
            ("recording finish effective limit clamp", "recordingEffectiveLimitSeconds(voiceQuota)"),
            ("native microphone permission request", "await Audio.requestPermissionsAsync();"),
            ("native recording mode", "await Audio.setAudioModeAsync({"),
            ("native recording instance", "const recording = new Audio.Recording();"),
            ("native recording options", "Audio.RecordingOptionsPresets.HIGH_QUALITY"),
            ("native recording start", "await recording.startAsync();"),
            ("native recording stop unload", "await recording.stopAndUnloadAsync();"),
            ("native recording uri bounded", "capturedAudioPath = uri ? boundNativeDebugInput(uri) : \"\";"),
            ("native recording transcribe helper", "async function transcribeRecordingToReview("),
            ("native recording whisper call", "const text = await transcribeWithNativeWhisper({"),
            ("native recording bounded transcript", "const boundedText = text.slice(0, maxTranscriptTextLength);"),
            ("native recording voice seconds state", "const [transcriptVoiceSeconds, setTranscriptVoiceSeconds] = useState(0);"),
            ("native recording transcript source", 'source: "user" | "sample" | "voice" = "user"'),
            ("native recording voice seconds draft", "setTranscriptVoiceSeconds("),
            ("native recording transcript confirmation", 'openScreenWithStatus("transcriptReview", recordingWhisperSuccessStatusMessage());'),
            ("home recording whisper handoff", 'void transcribeRecordingToReview("today", capturedAudioPath, elapsedSeconds);'),
            ("home recording fallback transcript review", 'setTranscriptReviewReturnScreen("today");\n      openScreenWithStatus("transcriptReview", recordingTextFallbackStatusMessage());'),
            ("parse request voice seconds", "voice_seconds: parserVoiceSeconds"),
            ("parse success clears voice seconds", "setTranscriptVoiceSeconds(0);"),
            ("parse success screen opener binding", 'setTranscriptVoiceSeconds(0);\n      openScreen("aiReview");'),
            ("parse success refreshes quota", "void loadVoiceQuota(account.id);"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("guided home direction time config", "{ icon: \"🕒\", label: \"時間\" }"),
            ("guided home direction glucose config", "{ icon: \"🩸\", label: \"血糖\" }"),
            ("guided home direction food config", "{ icon: \"🍽️\", label: \"飲食\" }"),
            ("guided home direction exercise config", "{ icon: \"🏃\", label: \"運動\" }"),
            ("guided home direction medication config", "{ icon: \"💊\", label: \"用藥紀錄\" }"),
            ("guided home direction body status config", "{ icon: \"😊\", label: \"身體狀況\" }"),
            ("guided home examples config", "export const homeSpeechExamples = ["),
            ("guided home first speech example", "今天6月28號，早上起床空腹血糖105"),
        ):
            _assert_contains(label, recording_copy_content, marker)
        today_home_block = _today_home_render_block(content)
        if today_home_block.count("<Pressable") != 1:
            raise AssertionError("Today/Home render block must contain exactly one Pressable mic control.")
        for label, marker in (
            ("guided home block tagline row", "styles.homeTaglineRow"),
            ("guided home block tagline cue", "styles.homeTaglineCue"),
            ("guided home block tagline", "<Text style={styles.homeTagline}>想說什麼就說什麼</Text>"),
            ("guided home block direction panel", "styles.homeGuidancePanel"),
            ("guided home block direction items", "homeGuidanceDirections.map"),
            ("guided home item key binding", "key={homeGuidanceItemKey(item)}"),
            ("guided home item icon binding", "{homeGuidanceItemIcon(item)}"),
            ("guided home item label binding", "{homeGuidanceItemLabel(item)}"),
            ("guided home block info row", "styles.homeGuidanceInfoRow"),
            ("guided home block non-button copy", "上面這排不是按鈕喔"),
            ("minimal home block primary hint", "<Text style={styles.homeHint}>按住開始說話記錄</Text>"),
            ("minimal home block secondary hint", "<Text style={styles.homeHintSecondary}>{homeRecordingSecondaryHintDisplayText}</Text>"),
            ("minimal home block model status", "<Text style={styles.homeModelStatus}>{homeRecordingModelStatusDisplayText}</Text>"),
            ("guided home block example panel", "styles.homeExamplePanel"),
            ("guided home block example title", "<Text style={styles.homeExampleTitle}>範例（怎麼說都可以）</Text>"),
            ("guided home block example pagination", "styles.homeExamplePagination"),
        ):
            _assert_contains(label, today_home_block, marker)
        for label, marker in (
            ("guided home row key helper", "function homeGuidanceRowKey(rowIndex: number)"),
            ("guided home row key helper fields", "return `home-guidance-row-${rowIndex}`;"),
            ("guided home row key helper binding", "key={homeGuidanceRowKey(rowIndex)}"),
            ("guided home item key helper", "function homeGuidanceItemKey(item: (typeof homeGuidanceDirections)[number][number])"),
            ("guided home item key helper fields", "return item.key;"),
            ("guided home item icon helper", "function homeGuidanceItemIcon(item: (typeof homeGuidanceDirections)[number][number])"),
            ("guided home item icon helper fields", "return item.icon;"),
            ("guided home item label helper", "function homeGuidanceItemLabel(item: (typeof homeGuidanceDirections)[number][number])"),
            ("guided home item label helper fields", "return item.label;"),
            ("guided home example label helper", "function homeSpeechExampleLabel(example: (typeof homeSpeechExamples)[number])"),
            ("guided home example label helper fields", "return example.label;"),
            ("guided home example label helper binding", "{homeSpeechExampleLabel(homeCurrentSpeechExample)}"),
            ("guided home example text helper", "function homeSpeechExampleText(example: (typeof homeSpeechExamples)[number])"),
            ("guided home example text helper fields", "return example.text;"),
            ("guided home example text helper binding", "{homeSpeechExampleText(homeCurrentSpeechExample)}"),
            ("guided home example dot key helper", "function homeSpeechExampleDotKey(example: (typeof homeSpeechExamples)[number])"),
            ("guided home example dot key helper fields", "return `${example.key}-dot`;"),
            ("guided home example dot key helper binding", "key={homeSpeechExampleDotKey(example)}"),
            ("guided home example dot active helper", "function homeSpeechExampleDotIsActive(index: number, currentIndex: number)"),
            ("guided home example dot active helper fields", "return index === currentIndex;"),
            ("guided home example dot active helper binding", "homeSpeechExampleDotIsActive(index, homeExampleIndex) ? styles.homeExampleDotActive : null"),
            ("guided home example pagination accessibility helper", "function homeSpeechExamplePaginationAccessibilityLabel(currentIndex: number, totalCount: number)"),
            ("guided home example pagination accessibility helper binding", "accessibilityLabel={homeSpeechExamplePaginationAccessibilityLabel("),
        ):
            _assert_contains(label, content, marker)
        home_guidance_row_block = _match_block(
            today_home_block,
            r"row\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "home guidance item render block",
        )
        _assert_not_contains(
            "direct home guidance row key binding",
            today_home_block,
            "key={`home-guidance-row-${rowIndex}`}",
        )
        for label, marker in (
            ("direct home guidance item key binding", "key={item.key}"),
            ("direct home guidance item icon binding", "<Text style={styles.homeGuidanceIcon}>{item.icon}</Text>"),
            ("direct home guidance item label binding", "<Text style={styles.homeGuidanceLabel}>{item.label}</Text>"),
        ):
            _assert_not_contains(label, home_guidance_row_block, marker)
        home_example_block = _match_block(
            today_home_block,
            r"<View style=\{styles\.homeExamplePanel\}>([\s\S]*?homeSpeechExampleText\(homeCurrentSpeechExample\)[\s\S]*?</View>)",
            "home example render block",
        )
        for label, marker in (
            ("direct home example label binding", "homeCurrentSpeechExample.label"),
            ("direct home example text binding", "homeCurrentSpeechExample.text"),
            ("direct home example dot key binding", "`${example.key}-dot`"),
            ("direct home example dot active binding", "index === homeExampleIndex"),
            ("direct home example pagination accessibility binding", "`目前第 ${homeExampleIndex + 1} 個範例，共 ${homeSpeechExamples.length} 個`"),
        ):
            _assert_not_contains(label, home_example_block, marker)
        _assert_contains("minimal home starts near top", _style_block(content, "homeMinimalSection"), 'justifyContent: "flex-start"')
        _assert_contains("minimal home reduced top padding", _style_block(content, "homeMinimalSection"), "paddingTop: 14")
        _assert_contains("minimal home model status style", _style_block(content, "homeModelStatus"), "fontSize: 12")
        for style_name in ("homeExampleTitle", "homeExampleIndex", "homeExampleText"):
            _assert_contains(
                f"{style_name} left aligned",
                _style_block(content, style_name),
                'textAlign: "left"',
            )
        _assert_not_contains(
            "minimal home block no active recording timer condition",
            today_home_block,
            "isRecordingPreview ? (",
        )
        _assert_not_contains(
            "minimal home block no separate recording timer binding",
            today_home_block,
            "<Text style={styles.homeRecordingTimer}",
        )
        _assert_contains(
            "recording elapsed seconds display helper",
            recording_copy_content,
            "function recordingElapsedSecondsCopy(elapsedSeconds: number)",
        )
        for label, marker in (
            ("transcript review intro copy helper", "function transcriptReviewIntroCopy()"),
            ("transcript review pre-parse guidance helper", "function transcriptReviewPreParseGuidanceCopy()"),
            ("transcript review sample warning helper", "function transcriptReviewSampleWarningCopy()"),
            ("transcript review preflight passed helper", "function transcriptReviewPreflightPassedCopy()"),
            ("transcript review display texts helper", "function transcriptReviewDisplayTexts()"),
            ("transcript review display texts intro binding", "intro: transcriptReviewIntroCopy()"),
            ("transcript review display texts guidance binding", "preParseGuidance: transcriptReviewPreParseGuidanceCopy()"),
            ("transcript review display texts warning binding", "sampleWarning: transcriptReviewSampleWarningCopy()"),
            ("transcript review display texts preflight binding", "preflightPassed: transcriptReviewPreflightPassedCopy()"),
            ("transcript review status display texts helper", "function transcriptReviewStatusDisplayTexts(value: {"),
            ("transcript review status validation binding", "transcriptValidation: boundUiMessage("),
            ("transcript review empty status copy", "請先輸入文字，或按「填入範例」查看確認 UI；範例不會送 parser。"),
            ("transcript review status review validation binding", "transcriptReviewValidation: boundUiMessage("),
            ("transcript review status parser recovery binding", "parserRecovery: boundUiMessage(value.parserRecoveryMessage)"),
            ("transcript review status backend unavailable binding", "backendUnavailable: boundUiMessage(`${value.protectedBackendUnavailableMessage}，才可送出 parser。`)"),
            ("transcript review status model unavailable binding", "modelUnavailable: boundUiMessage(`${value.parserModelUnavailableMessage}，請先在設定選擇可用模型。`)"),
            ("transcript review cost boundary checklist helper", "function transcriptReviewCostBoundaryChecklistDisplayItems("),
            ("transcript review empty parser guard copy", "空文字、過長文字或範例文字不會送 parser。"),
            ("transcript review no batch history copy", "下一步整理只送目前這段文字一次，不會批次載入歷史紀錄。"),
            ("transcript validation helper", "function validateTranscriptForParser(value: string)"),
            ("transcript validation numeric density helper", "function countNumericValues(value: string)"),
            ("transcript validation max length copy", "文字過長，請縮短到 ${maxTranscriptTextLength} 字內，或分批整理"),
            ("transcript validation numeric density copy", "數字太多，請分批整理，避免 parser 成本過高"),
            ("transcript review intro copy", "確認目前輸入或本機 Whisper 轉出的紀錄文字"),
            ("transcript review sample warning copy", "避免不必要的 parser / LLM 成本"),
        ):
            _assert_contains(label, recording_copy_content, marker)
        for label, marker in (
            ("minimal home no quick-entry rail", "styles.quickEntryRail"),
            ("minimal home no quick-entry map", "quickEntryModeDisplayItemsForRender.map"),
            ("minimal home no text input", "<TextInput"),
            ("minimal home no analysis CTA", "openTodayAnalysis"),
            ("minimal home no manual CTA", "openTodayManualEntry"),
            ("minimal home no record entry CTA", "openTodayRecordEntry"),
            ("minimal home no quick-entry press wrapper", "pressTodayQuickEntryItem"),
            ("minimal home no record cards", "todayRecordDisplayItems.map"),
            ("minimal home no primary button", "styles.primaryButton"),
            ("minimal home no secondary button", "styles.secondaryButton"),
            ("minimal home no section title", "styles.sectionTitle"),
            ("minimal home no evidence/status copy", "styles.evidence"),
            ("minimal home no inline info block", "styles.inlineInfoBlock"),
            ("minimal home no card surface", "styles.recordCard"),
            ("minimal home no timeline surface", "styles.timelineCard"),
        ):
            _assert_not_contains(label, today_home_block, marker)
        home_mic_style = _style_block(content, "homeMicButton")
        for property_name, minimum_value in (("height", 200), ("width", 200), ("borderRadius", 100)):
            actual_value = _numeric_style_value(home_mic_style, property_name)
            if actual_value is None or actual_value < minimum_value:
                raise AssertionError(
                    f"homeMicButton.{property_name} must be >= {minimum_value}; "
                    f"found {actual_value if actual_value is not None else 'missing'}."
                )
        _assert_not_contains(
            "old home summary pill render",
            content,
            '<Text style={styles.summaryPillText}>\n                📅 {todayRecordSummaryDisplayText}',
        )
        _assert_not_contains(
            "old home transcript input render",
            content,
            "style={[styles.input, styles.homeTranscriptInput]}",
        )
        _assert_not_contains(
            "old home analysis CTA render",
            content,
            "accessibilityLabel={coreFlowDisplayLabels.viewAnalysisAccessibility}\n                accessibilityRole=\"button\"\n                style={styles.primaryButtonFull}\n                onPress={openTodayAnalysis}",
        )
        _assert_contains(
            "record quick-entry helper",
            first_version_flow_copy_content,
            "function quickEntryModeDisplayItems()",
        )
        for label in ("語音預覽", "文字整理", "手動新增"):
            _assert_contains(
                f"record quick-entry {label}",
                first_version_flow_copy_content,
                f'label: boundDisplayText("{label}", maxDisplayTextLength)',
            )
        for label, marker in (
            ("busy action status helper", "function busyActionStatusMessage()"),
            ("busy action status copy", "目前仍在處理上一個動作，請稍候"),
            ("preview action clear status helper", "function previewActionClearStatusMessage()"),
            ("today record summary helper", "function todayRecordSummaryText(recordCount: number)"),
            ("today record summary empty copy", "今日尚未載入紀錄"),
            ("today record summary count copy", "今日已記錄 ${clampNumber(recordCount, 0, maxMobileCountValue)} 筆"),
            ("AI save failure back AI review status helper", "function aiSaveFailureBackAiReviewStatusMessage()"),
            ("AI save failure return save confirm status helper", "function aiSaveFailureReturnSaveConfirmStatusMessage()"),
            ("AI save failure manual fallback status helper", "function aiSaveFailureManualFallbackStatusMessage()"),
            ("save success unsaved process status helper", "function saveSuccessProcessUnsavedStatusMessage()"),
            ("save success destination status helper", "function saveSuccessDestinationStatusMessage(target: AppScreen)"),
            ("save success destination display helper", "function saveSuccessDestinationDisplayItems(hasUnsavedPreviewRecords: boolean)"),
            ("save success unsaved destination copy", "處理尚未儲存的候選紀錄"),
            ("save success today destination copy", "查看剛剛新增的資料"),
            ("delete success destination display helper", "function deleteSuccessDestinationDisplayItems()"),
            ("delete success history destination copy", "確認指定日期紀錄"),
            ("update success destination display helper", "function updateSuccessDestinationDisplayItems(hasSelectedRecord: boolean)"),
            ("update success detail destination guard", 'target !== "recordDetail" || hasSelectedRecord'),
            ("update success analysis destination copy", "查看摘要是否更新"),
            ("save success manual continue status helper", "function saveSuccessManualContinueStatusMessage()"),
            ("save success record entry status helper", "function saveSuccessRecordEntryStatusMessage()"),
            ("save success view detail status helper", "function saveSuccessViewDetailStatusMessage()"),
            ("save success no extra calls copy", "成功頁不會自動新增 backend、AI 或 STT 呼叫"),
            ("AI save failure no retry copy", "不會自動重試或重新呼叫 AI"),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        _assert_contains(
            "record quick-entry rail render",
            content,
            "styles.quickEntryRail",
        )
        _assert_contains(
            "record quick-entry item render",
            content,
            "styles.quickEntryItem",
        )
        _assert_contains(
            "quick-entry action helper",
            content,
            "function handleQuickEntryMode(mode: QuickEntryMode",
        )
        _assert_contains(
            "quick-entry text mode status helper binding",
            content,
            'openScreenWithStatus("record", quickEntryTextModeStatusMessage());',
        )
        _assert_contains(
            "record quick-entry wrapper",
            content,
            "function handleRecordQuickEntryMode(mode: QuickEntryMode)",
        )
        _assert_contains(
            "quick-entry mode target helper",
            content,
            "function quickEntryModeTarget(item: ReturnType<typeof quickEntryModeDisplayItems>[number])",
        )
        _assert_contains(
            "quick-entry mode target helper fields",
            content,
            "return item.key;",
        )
        for label, marker in (
            ("quick-entry render key helper", "function quickEntryModeRenderKey(item: ReturnType<typeof quickEntryModeDisplayItems>[number])"),
            ("quick-entry render key helper fields", "return `record-${item.key}`;"),
            ("quick-entry render key binding", "key={quickEntryModeRenderKey(item)}"),
            ("quick-entry accessibility helper", "function quickEntryModeAccessibilityLabel(item: ReturnType<typeof quickEntryModeDisplayItems>[number])"),
            ("quick-entry accessibility helper fields", "return item.accessibilityLabel;"),
            ("quick-entry accessibility helper binding", "accessibilityLabel={quickEntryModeAccessibilityLabel(item)}"),
            ("quick-entry icon helper", "function quickEntryModeIcon(item: ReturnType<typeof quickEntryModeDisplayItems>[number])"),
            ("quick-entry icon helper fields", "return item.icon;"),
            ("quick-entry icon helper binding", "{quickEntryModeIcon(item)}"),
            ("quick-entry label helper", "function quickEntryModeLabel(item: ReturnType<typeof quickEntryModeDisplayItems>[number])"),
            ("quick-entry label helper fields", "return item.label;"),
            ("quick-entry label helper binding", "{quickEntryModeLabel(item)}"),
            ("quick-entry copy helper", "function quickEntryModeCopy(item: ReturnType<typeof quickEntryModeDisplayItems>[number])"),
            ("quick-entry copy helper fields", "return item.copy;"),
            ("quick-entry copy helper binding", "{quickEntryModeCopy(item)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "record quick-entry item press wrapper",
            content,
            "function pressRecordQuickEntryItem(item: ReturnType<typeof quickEntryModeDisplayItems>[number])",
        )
        _assert_contains(
            "record quick-entry target helper binding",
            content,
            "handleRecordQuickEntryMode(quickEntryModeTarget(item));",
        )
        _assert_contains(
            "quick-entry accessibility labels",
            content,
            "accessibilityLabel={quickEntryModeAccessibilityLabel(item)}",
        )
        _assert_contains(
            "quick-entry button role",
            content,
            'accessibilityRole="button"',
        )
        for label, marker in (
            ("core rerecord accessibility label", 'rerecordAccessibility: boundDisplayText("重新錄音，只重置本機錄音預覽狀態", maxDisplayDetailTextLength)'),
            ("core recording text accessibility label", 'useRecordingTextAccessibility: boundDisplayText("使用錄音結果轉文字，可呼叫本機 Whisper，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("core sample accessibility label", 'fillSampleAccessibility: boundDisplayText("填入範例文字，只供確認 UI 預覽，不送 parser", maxDisplayDetailTextLength)'),
            ("core manual accessibility label", 'manualAddAccessibility: boundDisplayText("改用手動新增，不呼叫 AI、LLM 或 STT", maxDisplayDetailTextLength)'),
            ("core next organize accessibility label", 'nextOrganizeAccessibility: boundDisplayText("前往文字確認，尚未送出 AI 整理", maxDisplayDetailTextLength)'),
            ("core text record accessibility label", 'textRecordAccessibility: boundDisplayText("前往文字記錄輸入，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("core analysis accessibility label", 'viewAnalysisAccessibility: boundDisplayText("查看基本分析，只使用已載入紀錄", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("core rerecord accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.rerecordAccessibility}"),
            ("core recording text accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.useRecordingTextAccessibility}"),
            ("core sample accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.fillSampleAccessibility}"),
            ("core manual accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualAddAccessibility}"),
            ("core next accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.nextOrganizeAccessibility}"),
            ("core next disabled accessibility state", "accessibilityState={{ disabled: Boolean(transcriptValidationError) || isBusy }}"),
            ("core entry button role", 'accessibilityRole="button"'),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("confirmation return edit accessibility label", 'returnEditAccessibility: boundDisplayText("返回文字修改，保留目前輸入且不重新呼叫 AI", maxDisplayDetailTextLength)'),
            ("confirmation save confirm accessibility label", 'enterSaveConfirmAccessibility: boundDisplayText("進入每日紀錄頁，不儲存也不重新呼叫 AI", maxDisplayDetailTextLength)'),
            ("confirmation return text accessibility label", 'returnTextConfirmAccessibility: boundDisplayText("回文字確認，不送 parser 或寫入資料", maxDisplayDetailTextLength)'),
            ("confirmation return confirm accessibility label", 'returnConfirmAccessibility: boundDisplayText("返回確認，保留每日紀錄草稿且不送 backend", maxDisplayDetailTextLength)'),
            ("confirmation submit save accessibility label", 'submitAiSaveAccessibility: boundDisplayText("儲存今日紀錄，送 backend 驗證與 audit", maxDisplayDetailTextLength)'),
            ("confirmation cancel accessibility label", 'cancelAccessibility: boundDisplayText("取消並返回確認，不刪除正式紀錄", maxDisplayDetailTextLength)'),
            ("confirmation remove accessibility label", 'confirmRemoveAccessibility: boundDisplayText("確認移除未儲存候選，不呼叫刪除 API", maxDisplayDetailTextLength)'),
            ("confirmation failure return accessibility label", 'returnSaveConfirmAccessibility: boundDisplayText("返回儲存確認，不自動重試 backend save", maxDisplayDetailTextLength)'),
            ("confirmation transcript parse accessibility label", 'submitTranscriptParseAccessibility: boundDisplayText("送出文字整理，僅在 backend 和模型 ready 時呼叫 parser", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("confirmation return edit accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.returnEditAccessibility}"),
            ("confirmation enter save accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.enterSaveConfirmAccessibility}"),
            ("confirmation return text accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.returnTextConfirmAccessibility}"),
            ("confirmation return confirm accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.returnConfirmAccessibility}"),
            ("confirmation submit save accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.submitAiSaveAccessibility}"),
            ("confirmation cancel accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.cancelAccessibility}"),
            ("confirmation remove accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.confirmRemoveAccessibility}"),
            ("confirmation back AI accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.backAiConfirmAccessibility}"),
            ("confirmation return save accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.returnSaveConfirmAccessibility}"),
            ("confirmation transcript back accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.backAccessibility}"),
            ("confirmation retry accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.retryInputAccessibility}"),
            ("confirmation parse accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.submitTranscriptParseAccessibility}"),
            ("confirmation manual fallback accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.switchManualAddAccessibility}"),
            ("confirmation save disabled state", "accessibilityState={{ disabled: isBusy || !account }}"),
            ("confirmation transcript parse disabled state", "accessibilityState={{\n                  disabled:\n                    Boolean(transcriptValidationError) ||"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "daily record section definitions",
            record_display_content,
            "export const dailyRecordSectionDefinitions: DailyRecordSectionDefinition[] = [",
        )
        for label, marker in (
            ("daily record summary title", "<Text style={styles.previewModeBadge}>AI今日摘要</Text>"),
            ("daily record transcript title", "<Text style={styles.label}>今日錄音文字</Text>"),
            ("daily record transcript handler", "function openTodayTranscriptText()"),
            ("daily record transcript expanded status binding", "setStatus(todayTranscriptExpandedStatusMessage());"),
            ("daily record section renderer", "dailyRecordSectionItems.map"),
            ("daily record section key helper", "function dailyRecordSectionKey(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section key helper fields", "return section.id;"),
            ("daily record section key binding", "key={dailyRecordSectionKey(section)}"),
            ("daily record section icon helper", "function dailyRecordSectionIcon(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section icon helper fields", "return section.icon;"),
            ("daily record section icon binding", "{dailyRecordSectionIcon(section)}"),
            ("daily record section title helper", "function dailyRecordSectionTitle(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section title helper fields", "return section.title;"),
            ("daily record section title binding", "{dailyRecordSectionTitle(section)}"),
            ("daily record section count helper", "function dailyRecordSectionCountLabel(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section count helper fields", "return section.countLabel;"),
            ("daily record section count binding", "{dailyRecordSectionCountLabel(section)}"),
            ("daily record section entries helper", "function dailyRecordSectionEntries(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section entries helper fields", "return section.entries;"),
            ("daily record section entries binding", "dailyRecordSectionEntries(section).map((item) => ("),
            ("daily record section has entries helper", "function dailyRecordSectionHasEntries(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section has entries helper fields", "return dailyRecordSectionEntries(section).length > 0;"),
            ("daily record section has entries binding", "dailyRecordSectionHasEntries(section) ? ("),
            ("daily record section empty helper", "function dailyRecordSectionEmptyCopy(section: ReturnType<typeof buildDailyRecordSectionDisplayItems>[number])"),
            ("daily record section empty helper fields", "return section.emptyCopy;"),
            ("daily record section empty binding", "{dailyRecordSectionEmptyCopy(section)}"),
            ("daily record detail row component binding", "dailyRecordEntryDetailRows(item).map((row) => (\n                            <DailyRecordDetailRow key={dailyRecordDetailRowKey(item, row)} label={dailyRecordDetailRowLabel(row)} value={dailyRecordDetailRowValue(row)} />"),
            ("daily record entry management handler", "function pressDailyRecordEntryMenu(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry target helper", "function dailyRecordEntryTarget(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry target helper fields", "return item.index;"),
            ("daily record entry type label helper", "function dailyRecordEntryTypeLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry type label helper fields", "return item.typeLabel;"),
            ("daily record entry key helper", "function dailyRecordEntryKey(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry key helper fields", "return item.key;"),
            ("daily record entry key binding", "key={dailyRecordEntryKey(item)}"),
            ("daily record entry time helper", "function dailyRecordEntryTimeLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry time helper fields", "return item.timeLabel;"),
            ("daily record entry time binding", "{dailyRecordEntryTimeLabel(item)}"),
            ("daily record entry payload helper", "function dailyRecordEntryPayloadSummary(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry payload helper fields", "return item.payloadSummary;"),
            ("daily record entry payload binding", "{dailyRecordEntryPayloadSummary(item)}"),
            ("daily record entry accessibility helper", "function dailyRecordEntryAccessibilityLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry accessibility helper fields", "return item.accessibilityLabel;"),
            ("daily record entry accessibility binding", "accessibilityLabel={dailyRecordEntryAccessibilityLabel(item)}"),
            ("daily record entry manage label helper", "function dailyRecordEntryManageLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry manage label helper fields", "return item.manageLabel;"),
            ("daily record entry manage label binding", "{dailyRecordEntryManageLabel(item)}"),
            ("daily record entry edit accessibility helper", "function dailyRecordEntryEditAccessibilityLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry edit accessibility helper fields", "return item.editAccessibilityLabel;"),
            ("daily record entry edit accessibility binding", "accessibilityLabel={dailyRecordEntryEditAccessibilityLabel(item)}"),
            ("daily record entry remove accessibility helper", "function dailyRecordEntryRemoveAccessibilityLabel(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry remove accessibility helper fields", "return item.removeAccessibilityLabel;"),
            ("daily record entry remove accessibility binding", "accessibilityLabel={dailyRecordEntryRemoveAccessibilityLabel(item)}"),
            ("daily record entry detail rows helper", "function dailyRecordEntryDetailRows(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry detail rows helper fields", "return item.detailRows;"),
            ("daily record entry detail rows helper binding", "dailyRecordEntryDetailRows(item).map((row) => ("),
            ("daily record detail row key helper", "function dailyRecordDetailRowKey("),
            ("daily record detail row key helper item type", "item: ReturnType<typeof dailyRecordEntryDisplayItem>,"),
            ("daily record detail row key helper row type", 'row: ReturnType<typeof dailyRecordEntryDisplayItem>["detailRows"][number]'),
            ("daily record detail row key helper fields", "return `${item.key}-${row.label}`;"),
            ("daily record detail row key helper binding", "key={dailyRecordDetailRowKey(item, row)}"),
            ("daily record detail row label helper", 'function dailyRecordDetailRowLabel(row: ReturnType<typeof dailyRecordEntryDisplayItem>["detailRows"][number])'),
            ("daily record detail row label helper fields", "return row.label;"),
            ("daily record detail row label helper binding", "label={dailyRecordDetailRowLabel(row)}"),
            ("daily record detail row value helper", 'function dailyRecordDetailRowValue(row: ReturnType<typeof dailyRecordEntryDisplayItem>["detailRows"][number])'),
            ("daily record detail row value helper fields", "return row.value;"),
            ("daily record detail row value helper binding", "value={dailyRecordDetailRowValue(row)}"),
            ("daily record entry menu target helper binding", "const target = dailyRecordEntryTarget(item);"),
            ("daily record entry menu index target binding", "setDailyRecordMenuIndex((current) => (current === target ? null : target));"),
            ("daily record entry menu open status binding", "setStatus(dailyRecordEntryMenuOpenStatusMessage(dailyRecordEntryTypeLabel(item)));"),
            ("daily record entry management binding", "onPress={() => pressDailyRecordEntryMenu(item)}"),
            ("daily record entry edit handler", "function pressDailyRecordEntryEdit(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry delete handler", "function pressDailyRecordEntryDelete(item: ReturnType<typeof dailyRecordEntryDisplayItem>)"),
            ("daily record entry edit binding", "onPress={() => pressDailyRecordEntryEdit(item)}"),
            ("daily record entry delete binding", "onPress={() => pressDailyRecordEntryDelete(item)}"),
            ("daily record entry edit return target", 'openPreviewRecordEdit(dailyRecordEntryTarget(item), "aiSaveConfirm")'),
            ("daily record entry delete return target", 'openPreviewRecordRemoveConfirm(dailyRecordEntryTarget(item), "aiSaveConfirm")'),
            ("daily record delete confirm display helper binding", "const aiRemoveConfirmDisplay = aiRemoveConfirmDisplayTexts("),
            ("daily record delete confirm title binding", "const aiRemoveConfirmTitleDisplayText = aiRemoveConfirmDisplay.title;"),
            ("daily record delete submit binding", "const aiRemoveConfirmSubmitDisplayText = aiRemoveConfirmDisplay.submit;"),
            ("pending remove icon helper", "function pendingRemoveDisplayIcon(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("pending remove icon helper fields", "return item.icon;"),
            ("pending remove icon helper binding", "{pendingRemoveDisplayIcon(pendingPreviewRemoveDisplayItem)}"),
            ("pending remove type helper", "function pendingRemoveDisplayTypeLabel(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("pending remove type helper fields", "return item.typeLabel;"),
            ("pending remove type helper binding", "{pendingRemoveDisplayTypeLabel(pendingPreviewRemoveDisplayItem)}"),
            ("pending remove payload helper", "function pendingRemoveDisplayPayloadSummary(item: ReturnType<typeof pendingRecordDisplayItem>)"),
            ("pending remove payload helper fields", "return item.payloadSummary;"),
            ("pending remove payload helper binding", "{pendingRemoveDisplayPayloadSummary(pendingPreviewRemoveDisplayItem)}"),
            ("daily record leave guard request handler", "function requestDailyRecordLeaveGuard()"),
            ("daily record leave guard cancel handler", "function cancelDailyRecordLeaveGuard()"),
            ("daily record leave guard confirm handler", "function confirmDailyRecordLeaveGuard()"),
            ("daily record leave guard visible state", "const [dailyRecordLeaveGuardVisible, setDailyRecordLeaveGuardVisible] = useState(false);"),
            ("daily record leave guard header branch", "if (hasUnsavedDailyRecordDraft)"),
            ("daily record leave guard android back import", "BackHandler,"),
            ("daily record leave guard android back listener", 'BackHandler.addEventListener("hardwareBackPress"'),
            ("daily record leave guard android handled", "return true;"),
            ("daily record leave guard render card", "styles.dailyLeaveGuardCard"),
            ("daily record leave guard cancel binding", "onPress={cancelDailyRecordLeaveGuard}"),
            ("daily record leave guard confirm binding", "onPress={confirmDailyRecordLeaveGuard}"),
            ("daily record leave guard display helper binding", "const dailyRecordLeaveGuardDisplay = dailyRecordLeaveGuardDisplayTexts();"),
            ("daily record leave guard title display binding", "const dailyRecordLeaveGuardTitleDisplayText = dailyRecordLeaveGuardDisplay.title;"),
            ("daily record leave guard cancel accessibility binding", "const dailyRecordLeaveGuardCancelAccessibilityLabel = dailyRecordLeaveGuardDisplay.cancelAccessibility;"),
            ("daily record draft screen helper binding", "const dailyRecordDraftScreen = dailyRecordDraftScreenState({"),
            ("daily record fixed save visible helper binding", "const isDailyRecordFixedSaveVisible = dailyRecordDraftScreen.isFixedSaveVisible;"),
            ("daily record unsaved draft helper binding", "const hasUnsavedDailyRecordDraft = dailyRecordDraftScreen.hasUnsavedDraft;"),
            ("daily record transcript retained state", "const [dailyTranscriptEntries, setDailyTranscriptEntries] = useState<DailyTranscriptEntry[]>([]);"),
            ("daily record parse existing draft capture", "const existingDailyPreview = preview;"),
            ("daily record parse occurred timestamp", "const parseOccurredAt = new Date().toISOString();"),
            ("daily record parse sends shared timestamp", "occurred_at: parseOccurredAt"),
            ("daily record parse merges same-day draft", "const mergedDailyPreview = mergeSameDayParsePreviewDraft(existingDailyPreview, boundedPreview);"),
            ("daily record parse appends transcript entry", "setDailyTranscriptEntries((current) => boundDailyTranscriptEntries([...current, transcriptEntry]));"),
            ("daily record transcript display bundle binding", "const todayTranscriptDisplay = dailyTranscriptDisplayBundle(preview, dailyTranscriptEntries);"),
            ("daily record transcript display items binding", "const todayTranscriptDisplayItems = todayTranscriptDisplay.items;"),
            ("daily record transcript display accessibility binding", "const todayTranscriptAccessibilityLabel = todayTranscriptDisplay.accessibilityLabel;"),
            ("daily record transcript item key helper", "function todayTranscriptItemKey(item: (typeof todayTranscriptDisplayItems)[number])"),
            ("daily record transcript item key helper fields", "return item.key;"),
            ("daily record transcript item key binding", "key={todayTranscriptItemKey(item)}"),
            ("daily record transcript item time helper", "function todayTranscriptItemTimeLabel(item: (typeof todayTranscriptDisplayItems)[number])"),
            ("daily record transcript item time helper fields", "return item.timeLabel;"),
            ("daily record transcript item time binding", "{todayTranscriptItemTimeLabel(item)}"),
            ("daily record transcript item source helper", "function todayTranscriptItemSourceText(item: (typeof todayTranscriptDisplayItems)[number])"),
            ("daily record transcript item source helper fields", "return item.sourceText;"),
            ("daily record transcript item source binding", "{todayTranscriptItemSourceText(item)}"),
            ("daily record reorganization revision state", "const [dailyRecordOrganizationRevision, setDailyRecordOrganizationRevision] = useState(0);"),
            ("daily record reorganization reason state", "const [dailyRecordOrganizationReason, setDailyRecordOrganizationReason] ="),
            ("daily record reorganization apply helper", "function reorganizeDailyRecordDraftAfterChange("),
            ("daily record reorganization add binding", 'reorganizeDailyRecordDraftAfterChange(\n        mergedDailyPreview,\n        "add",'),
            ("daily record reorganization edit binding", 'reorganizeDailyRecordDraftAfterChange({ ...preview, records: nextRecords }, "edit");'),
            ("daily record reorganization delete binding", 'reorganizeDailyRecordDraftAfterChange({ ...preview, records: nextRecords }, "delete");'),
            ("daily record reorganization summary display", "const dailyRecordReorganizationDisplay = dailyRecordReorganizationDisplayText("),
            ("daily record reorganization summary render", "<Text style={styles.evidence}>{dailyRecordReorganizationDisplay}</Text>"),
            ("daily record save checklist helper binding", "const aiSaveConfirmChecklistItems = aiSaveConfirmChecklistDisplayItems(unsavedPreviewRecordDisplayCount);"),
            ("daily record save unavailable confirm helper binding", "openAiSaveConfirmWithStatus(aiSaveUnavailableStatusMessage(protectedBackendUnavailableMessage));"),
            ("daily record save endpoint", '"/daily-records/save"'),
            ("daily record save payload binding", "body: JSON.stringify(buildDailyRecordSaveRequest(preview, recordsToSave, dailyTranscriptEntries))"),
            ("daily record save clears retained transcripts", "clearDailyRecordDraftOrganizationState();"),
            ("daily record fixed save visible flag", "const isDailyRecordFixedSaveVisible = dailyRecordDraftScreen.isFixedSaveVisible;"),
            ("daily record fixed save scroll padding style", "const mainScrollContainerStyle = isDailyRecordFixedSaveVisible"),
            ("daily record fixed save scroll binding", "contentContainerStyle={mainScrollContainerStyle}"),
            ("daily record fixed save dock render", "{isDailyRecordFixedSaveVisible && preview ? ("),
            ("daily record fixed save dock style", "styles.fixedSaveBarDock"),
            ("daily record fixed save bar", "styles.fixedSaveBar"),
            ("daily record category blank copy", "沒有提到的欄位保持空白"),
        ):
            _assert_contains(label, content, marker)
        daily_transcript_render_block = _match_block(
            content,
            r"todayTranscriptDisplayItems\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "daily transcript item render block",
        )
        for label, marker in (
            ("direct daily transcript item key binding", "key={item.key}"),
            ("direct daily transcript item time binding", "<Text style={styles.confidence}>{item.timeLabel}</Text>"),
            ("direct daily transcript item source binding", "<Text style={styles.evidence}>{item.sourceText}</Text>"),
        ):
            _assert_not_contains(label, daily_transcript_render_block, marker)
        daily_record_section_render_block = _match_block(
            content,
            r"dailyRecordSectionItems\.map\(\(section\) => \(([\s\S]*?dailyRecordSectionEmptyCopy\(section\)[\s\S]*?</View>)",
            "daily record section render block",
        )
        for label, marker in (
            ("direct daily record section key binding", "key={section.id}"),
            ("direct daily record section icon binding", "{section.icon}"),
            ("direct daily record section title binding", "{section.title}"),
            ("direct daily record section count binding", "{section.countLabel}"),
            ("direct daily record section entries length binding", "section.entries.length"),
            ("direct daily record section entries map binding", "section.entries.map"),
            ("direct daily record section empty copy binding", "{section.emptyCopy}"),
        ):
            _assert_not_contains(label, daily_record_section_render_block, marker)
        daily_record_entry_render_block = _match_block(
            content,
            r"dailyRecordSectionEntries\(section\)\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "daily record entry render block",
        )
        for label, marker in (
            ("direct daily record entry key binding", "key={item.key}"),
            ("direct daily record entry time binding", "<Text style={styles.confidence}>{item.timeLabel}</Text>"),
            ("direct daily record entry payload binding", "<Text style={styles.recordContent}>{item.payloadSummary}</Text>"),
            ("direct daily record entry accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct daily record entry manage label binding", "<Text style={styles.editGlyph}>{item.manageLabel}</Text>"),
            ("direct daily record entry edit accessibility binding", "accessibilityLabel={item.editAccessibilityLabel}"),
            ("direct daily record entry remove accessibility binding", "accessibilityLabel={item.removeAccessibilityLabel}"),
        ):
            _assert_not_contains(label, daily_record_entry_render_block, marker)
        for label, marker in (
            ("AI review no-candidate title helper", "function aiReviewNoCandidateTitleCopy()"),
            ("AI review no-candidate body helper", "function aiReviewNoCandidateBodyCopy()"),
            ("AI review no-candidate boundary helper", "function aiReviewNoCandidateBoundaryCopy()"),
            ("AI review no-preview title helper", "function aiReviewNoPreviewTitleCopy()"),
            ("AI review no-preview body helper", "function aiReviewNoPreviewBodyCopy()"),
            ("AI review intro helper", "function aiReviewIntroCopy()"),
            ("AI review low-confidence helper", "function aiReviewLowConfidenceCopy()"),
            ("AI review rejected-events helper", "function aiReviewRejectedEventsCopy()"),
            ("AI review rejected reason helper", "function aiReviewRejectedReasonCopy(reasonLabel: string)"),
            ("AI review backend-required helper", "function aiReviewBackendRequiredCopy()"),
            ("AI review display texts helper", "function aiReviewDisplayTexts()"),
            ("AI review display texts no candidate title binding", "noCandidateTitle: aiReviewNoCandidateTitleCopy()"),
            ("AI review display texts no preview body binding", "noPreviewBody: aiReviewNoPreviewBodyCopy()"),
            ("AI review display texts rejected events binding", "rejectedEvents: aiReviewRejectedEventsCopy()"),
            ("AI review display texts backend required binding", "backendRequired: aiReviewBackendRequiredCopy()"),
            ("AI review cost boundary checklist helper", "function aiReviewCostBoundaryChecklistDisplayItems()"),
            ("AI review cost boundary parser copy", "此頁只顯示 parser 已回傳的候選紀錄。"),
            ("AI review cost boundary no rerun copy", "逐筆編輯、移除或進入儲存確認都不會重新呼叫 AI。"),
            ("record entry settings checklist helper", "function recordEntrySettingsChecklistDisplayItems(isBackendReady: boolean)"),
            ("record entry settings manual parser copy", "手動新增可完全避開 AI parser，適合補登明確紀錄。"),
            ("record entry settings no history copy", "文字整理每次只送出目前文字一次，不批次載入歷史紀錄。"),
            ("AI save confirm intro helper", "function aiSaveConfirmIntroCopy()"),
            ("AI save confirm ready status helper", "function aiSaveConfirmReadyStatusMessage()"),
            ("AI save confirm return status helper", "function aiSaveConfirmReturnStatusMessage()"),
            ("AI save confirm submit label helper", "function aiSaveConfirmSubmitLabel(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean)"),
            ("AI save confirm display texts helper", "function aiSaveConfirmDisplayTexts(isBusy: boolean, isBlockedByBackend: boolean, hasWarnings: boolean)"),
            ("AI save confirm display texts intro binding", "intro: aiSaveConfirmIntroCopy()"),
            ("AI save confirm display texts submit binding", "submit: aiSaveConfirmSubmitLabel(isBusy, isBlockedByBackend, hasWarnings)"),
            ("AI save confirm checklist helper", "function aiSaveConfirmChecklistDisplayItems(unsavedPreviewRecordCount: number)"),
            ("AI save confirm boundary rows helper", "function aiSaveConfirmBoundaryDisplayRows("),
            ("AI save confirm checklist max candidate copy", "本次最多送出 ${boundedCount} 筆候選 payload，不會批次載入完整歷史。"),
            ("AI save confirm checklist backend payload copy", "送往 backend 的內容以確認後資料為主，不會附帶整段紀錄歷史或模型 debug trace。"),
            ("AI save confirm checklist no auto parser copy", "不會儲存未建立片段，也不會自動重新呼叫 AI。"),
            ("AI save confirm boundary rows extra AI cost copy", "額外 AI 成本"),
            ("AI save failure checklist helper", "function aiSaveFailureChecklistDisplayItems(unsavedPreviewRecordCount: number)"),
            ("AI save failure no retry copy", "系統不會自動重試，也不會重新呼叫 parser / AI。"),
            ("AI save failure manual fallback copy", "若 backend 持續不可用，可改用手動新增單筆明確紀錄。"),
            ("save result display helper", "function saveResultDisplayTexts(value: {"),
            ("save result display default saved summary", "lastSavedSummary: boundUiMessage(value.lastSavedSummary || \"紀錄已加入今日紀錄與歷史紀錄。\")"),
            ("save result display rejected warning", "rejectedPreviewWarning: boundUiMessage("),
            ("save result display backend blocked", "aiSaveBackendBlocked: boundUiMessage("),
            ("save success boundary checklist helper", "function saveSuccessBoundaryChecklistDisplayItems("),
            ("save success no retry copy", "沒有未儲存候選需要自動重試；下一步只做頁面導覽。"),
            ("save success no backend request copy", "成功頁不新增 backend request，除非使用者主動進入其他頁面觸發既有同步。"),
            ("manual submit checklist helper", "function manualSubmitChecklistDisplayItems()"),
            ("manual submit checklist no AI copy", "不會呼叫 AI 或 LLM，成本為 0。"),
            ("manual submit checklist single payload copy", "只會送出 1 筆手動紀錄 payload，不會批次載入完整歷史。"),
            ("manual submit checklist backend validation copy", "日期、時間、類型與欄位會送到後端再次驗證。"),
            ("daily record leave guard title helper", "function dailyRecordLeaveGuardTitleCopy()"),
            ("daily record leave guard body helper", "function dailyRecordLeaveGuardBodyCopy()"),
            ("daily record leave guard question helper", "function dailyRecordLeaveGuardQuestionCopy()"),
            ("daily record leave guard display helper", "function dailyRecordLeaveGuardDisplayTexts()"),
            ("daily record leave guard display cancel accessibility", "cancelAccessibility: boundDisplayText(\"取消離開，保留每日紀錄草稿\", maxDisplayDetailTextLength)"),
            ("daily record leave guard display confirm accessibility", "confirmAccessibility: boundDisplayText(\"離開每日紀錄頁，今天未儲存修改不會保留\", maxDisplayDetailTextLength)"),
            ("daily record leave guard prompt status helper", "function dailyRecordLeaveGuardPromptStatusMessage()"),
            ("daily record leave guard cancel status helper", "function dailyRecordLeaveGuardCancelStatusMessage()"),
            ("daily record leave guard confirm status helper", "function dailyRecordLeaveGuardConfirmStatusMessage()"),
            ("AI remove confirm boundary label helper", "function aiRemoveConfirmBoundaryLabel(isDailyRecordDelete = false)"),
            ("AI remove confirm boundary copy helper", "function aiRemoveConfirmBoundaryCopy(isDailyRecordDelete = false)"),
            ("AI remove confirm source copy helper", "function aiRemoveConfirmSourceCopy(confidencePercent: number)"),
            ("AI remove confirm display helper", "function aiRemoveConfirmDisplayTexts(isDailyRecordDelete: boolean, confidencePercent: number | null)"),
            ("AI remove confirm display title copy", 'title: boundDisplayText(isDailyRecordDelete ? "刪除此筆紀錄" : "移除候選紀錄", maxDisplayTextLength)'),
            ("AI remove confirm display submit copy", 'submit: boundDisplayText(isDailyRecordDelete ? "刪除" : "確認移除", maxDisplayTextLength)'),
            ("AI remove confirm display boundary helper", "boundaryLabel: aiRemoveConfirmBoundaryLabel(isDailyRecordDelete)"),
            ("AI remove confirm display source helper", 'source: confidencePercent === null ? "" : aiRemoveConfirmSourceCopy(confidencePercent)'),
            ("AI candidate remove checklist helper", "function aiCandidateRemoveChecklistDisplayItems()"),
            ("AI candidate remove checklist scope copy", "只影響目前 AI 整理確認清單。"),
            ("AI candidate remove checklist saved record copy", "已經儲存的正式紀錄不受影響。"),
            ("daily record delete confirm copy", "確定要刪除這筆紀錄嗎？"),
            ("daily record delete irreversible copy", "刪除後無法復原。"),
            ("AI remove confirm source marker", "source: AI candidate"),
            ("preview record edit boundary copy helper", "function previewRecordEditBoundaryCopy()"),
            ("manual record confirm intro helper", "function manualRecordConfirmIntroCopy()"),
            ("manual record confirm submit label helper", "function manualRecordConfirmSubmitLabel(isBusy: boolean)"),
            ("manual record confirm display texts helper", "function manualRecordConfirmDisplayTexts(isBusy: boolean)"),
            ("manual record confirm display texts intro binding", "intro: manualRecordConfirmIntroCopy()"),
            ("manual record confirm display texts submit binding", "submit: manualRecordConfirmSubmitLabel(isBusy)"),
            ("manual record confirm ready status helper", "function manualRecordConfirmReadyStatusMessage()"),
            ("manual record confirm return status helper", "function manualRecordConfirmReturnStatusMessage()"),
            ("manual record return status helper", "function manualRecordReturnStatusMessage(target: AppScreen)"),
            ("record detail return status helper", "function recordDetailReturnStatusMessage(target: AppScreen)"),
            ("record detail boundary checklist helper", "function recordDetailBoundaryChecklistDisplayItems()"),
            ("tutorial record entry status helper", "function tutorialRecordEntryStatusMessage()"),
            ("tutorial manual entry status helper", "function tutorialManualEntryStatusMessage()"),
            ("parser model unavailable text helper", "function parserModelUnavailableText("),
            ("parser model unavailable llm missing copy", "LLM 模型尚未載入"),
            ("parser model unavailable stt missing copy", "STT 模型尚未載入"),
            ("parser model unavailable disabled copy", "尚未啟用"),
            ("parser availability display helper", "function parserAvailabilityDisplayMessages(value: {"),
            ("parser availability parser binding", "parserModelUnavailable: boundUiMessage(value.parserModelUnavailableMessage)"),
            ("parser availability backend binding", "protectedBackendUnavailable: boundUiMessage(value.protectedBackendUnavailableMessage)"),
            ("preview record edit boundary copy", "這裡只修改待確認候選紀錄"),
            ("manual record confirm no AI copy", "這筆紀錄不經 AI parser"),
            ("manual record return no create copy", "未送出 create request，也未呼叫 AI"),
            ("record detail return no AI copy", "只使用已載入紀錄，不呼叫 AI"),
            ("record detail boundary single record copy", "只顯示目前已載入的單筆紀錄，不額外查詢完整歷史。"),
            ("record detail boundary edit delete copy", "編輯與刪除必須進入各自確認流程，詳情頁本身不直接寫入資料。"),
            ("daily record leave guard title copy", "尚未儲存今天的紀錄"),
            ("daily record leave guard body copy", "離開後，今天的修改將不會保留。"),
            ("daily record leave guard question copy", "是否仍要離開？"),
            ("daily record one-day summary copy", "AI 已整理成今天唯一的每日紀錄草稿"),
            ("daily record save warning label", "? \"了解提醒並儲存今日紀錄\""),
        ):
            _assert_contains(label, record_workflow_copy_content, marker)
        for label, marker in (
            ("daily record same-day merge helper", "function mergeSameDayParsePreviewDraft("),
            ("daily record draft screen state helper", "function dailyRecordDraftScreenState(value: {"),
            ("daily record draft fixed save condition", 'isFixedSaveVisible: value.currentScreen === "aiSaveConfirm" && value.hasPreview'),
            ("daily record draft unsaved condition", 'hasUnsavedDraft: value.currentScreen === "aiSaveConfirm" && value.hasUnsavedPreviewRecords'),
            ("daily record same-day merge key current", "const currentKey = dailyRecordKeyFromRecords(current.records);"),
            ("daily record same-day merge key incoming", "const incomingKey = dailyRecordKeyFromRecords(incoming.records);"),
            ("daily record same-day merge records", "records: [...current.records, ...incoming.records].slice(0, maxMobilePreviewRecords)"),
            ("daily record same-day merge rejected events", "rejected_events: [...current.rejected_events, ...incoming.rejected_events].slice(0, maxMobileRejectedEvents)"),
            ("daily record same-day merge segments", "segments: [...current.segments, ...incoming.segments].slice(0, maxListItems)"),
            ("ai review date label helper", "function aiReviewDateLabel(records: PendingRecord[])"),
            ("ai review date label empty copy", "尚未解析日期時間"),
            ("ai review date label multiple times copy", "等 ${uniqueLabels.length} 個時間"),
            ("daily record date label helper", "function dailyRecordDateLabel(records: PendingRecord[])"),
            ("daily record date label fallback copy", "今日紀錄"),
            ("daily record reorganization reason type", 'export type DailyRecordReorganizationReason = "add" | "edit" | "delete";'),
            ("daily record reorganization reason helper", "function dailyRecordReorganizationReasonText(reason: DailyRecordReorganizationReason | null)"),
            ("daily record reorganization status helper", "function dailyRecordReorganizationStatusMessage("),
            ("daily record reorganization status count bound", "maxMobilePreviewRecords"),
            ("daily record reorganization status ui bound", "maxUiMessageLength"),
            ("daily record reorganization display helper", "function dailyRecordReorganizationDisplayText("),
            ("daily record transcript expanded status helper", "function todayTranscriptExpandedStatusMessage()"),
            ("daily record transcript expanded status copy", "今日錄音文字已在下方展開；不重新呼叫 STT、AI 或 backend。"),
            ("daily record entry menu open status helper", "function dailyRecordEntryMenuOpenStatusMessage(typeLabel: string)"),
            ("daily record entry menu type label bound", "boundDisplayText(typeLabel, maxDisplayTextLength)"),
            ("daily record entry menu status copy", "單筆管理；可選擇編輯或刪除，尚未寫入 backend。"),
        ):
            _assert_contains(label, daily_transcript_content, marker)
        for label, marker in (
            ("daily record transcript entry type", "type DailyTranscriptEntry = {"),
            ("daily record transcript create helper", "function createDailyTranscriptEntry("),
            ("daily record transcript bound helper", "function boundDailyTranscriptEntries(entries: DailyTranscriptEntry[]): DailyTranscriptEntry[]"),
            ("daily record transcript display retained entries", "function dailyTranscriptDisplayItems(\n  preview: ParsePreviewResponse | null,\n  entries: DailyTranscriptEntry[]"),
            ("daily record transcript display bundle helper", "function dailyTranscriptDisplayBundle("),
            ("daily record transcript display bundle count", "const countText = boundDisplayText(`${clampNumber(items.length, 0, maxListItems)} 段`, 20);"),
            ("daily record transcript display bundle accessibility", "accessibilityLabel: boundDisplayText(`查看今日錄音文字，共 ${countText}`, maxDisplayDetailTextLength)"),
            ("daily record save payload helper", "function buildDailyRecordSaveRequest("),
        ):
            _assert_contains(label, daily_transcript_content, marker)
        _assert_contains(
            "daily record fixed save outside scroll",
            content,
            "</ScrollView>\n      {isDailyRecordFixedSaveVisible && preview ? (",
        )
        for label, marker in (
            ("core flow section labels helper", "function coreFlowSectionLabels()"),
            ("record delete success history accessibility label", 'deleteSuccessHistoryAccessibility: boundDisplayText("前往歷史紀錄，只查看已載入清單，不重送 delete request", maxDisplayDetailTextLength)'),
            ("record result return accessibility label", 'recordResultReturnAccessibility: boundDisplayText("返回紀錄頁面，只切換畫面，不重送 backend request", maxDisplayDetailTextLength)'),
            ("record updated detail accessibility label", 'updatedRecordDetailAccessibility: boundDisplayText("查看更新後紀錄詳情，不重送 update request", maxDisplayDetailTextLength)'),
            ("manual return accessibility label", 'manualReturnAccessibility: boundDisplayText("返回上一頁，不建立手動紀錄或呼叫 AI", maxDisplayDetailTextLength)'),
            ("manual create preview accessibility label", 'manualCreatePreviewAccessibility: boundDisplayText("進入手動紀錄確認，尚未送 backend create request", maxDisplayDetailTextLength)'),
            ("manual confirm return accessibility label", 'manualConfirmReturnAccessibility: boundDisplayText("返回手動紀錄編輯，不送 create request", maxDisplayDetailTextLength)'),
            ("manual create submit accessibility label", 'manualCreateSubmitAccessibility: boundDisplayText("送出手動紀錄建立，走 backend 驗證與 audit，不呼叫 AI", maxDisplayDetailTextLength)'),
            ("history apply accessibility label", 'historyApplyRangeAccessibility: boundDisplayText("套用歷史日期範圍，只篩選已載入紀錄", maxDisplayDetailTextLength)'),
            ("history return today accessibility label", 'historyReturnTodayAccessibility: boundDisplayText("回今日紀錄，不查詢 backend 或建立紀錄", maxDisplayDetailTextLength)'),
            ("record detail return accessibility label", 'recordDetailReturnAccessibility: boundDisplayText("返回紀錄清單，不更新或刪除紀錄", maxDisplayDetailTextLength)'),
            ("record edit open accessibility label", 'recordEditOpenAccessibility: boundDisplayText("開啟編輯紀錄，不送 update request", maxDisplayDetailTextLength)'),
            ("record delete open accessibility label", 'recordDeleteOpenAccessibility: boundDisplayText("開啟刪除確認，不送 delete request", maxDisplayDetailTextLength)'),
            ("record delete return accessibility label", 'recordDeleteReturnAccessibility: boundDisplayText("返回紀錄詳情，不送 delete request", maxDisplayDetailTextLength)'),
            ("record delete cancel accessibility label", 'recordDeleteCancelAccessibility: boundDisplayText("取消刪除並返回詳情，不送 delete request", maxDisplayDetailTextLength)'),
            ("record delete submit accessibility label", 'recordDeleteSubmitAccessibility: boundDisplayText("確認刪除正式紀錄，送 backend delete request 與 audit", maxDisplayDetailTextLength)'),
            ("record edit return accessibility label", 'recordEditReturnAccessibility: boundDisplayText("取消編輯並返回詳情，不送 update request", maxDisplayDetailTextLength)'),
            ("record update submit accessibility label", 'recordUpdateSubmitAccessibility: boundDisplayText("儲存修改，送 backend update request 與 audit", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("delete success history accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.deleteSuccessHistoryAccessibility}"),
            ("record result return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}"),
            ("updated record detail accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.updatedRecordDetailAccessibility}"),
            ("manual return accessibility binding", "backAccessibilityLabel={coreFlowDisplayLabels.manualReturnAccessibility}"),
            ("manual create preview accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualCreatePreviewAccessibility}"),
            ("manual confirm return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualConfirmReturnAccessibility}"),
            ("manual create submit accessibility binding", "submitAccessibilityLabel={coreFlowDisplayLabels.manualCreateSubmitAccessibility}"),
            ("record detail return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDetailReturnAccessibility}"),
            ("record edit open accessibility binding", "editAccessibilityLabel={coreFlowDisplayLabels.recordEditOpenAccessibility}"),
            ("record delete open accessibility binding", "deleteAccessibilityLabel={coreFlowDisplayLabels.recordDeleteOpenAccessibility}"),
            ("record delete return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteReturnAccessibility}"),
            ("record delete cancel accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteCancelAccessibility}"),
            ("record delete submit accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteSubmitAccessibility}"),
            ("record edit return accessibility binding", "cancelAccessibilityLabel={coreFlowDisplayLabels.recordEditReturnAccessibility}"),
            ("record update submit accessibility binding", "submitAccessibilityLabel={coreFlowDisplayLabels.recordUpdateSubmitAccessibility}"),
            ("manual create preview disabled state", "disabled={Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady}"),
            ("record update submit disabled state", "disabled={Boolean(selectedRecordEditValidationError) || isBusy}"),
            ("record delete disabled state", "disabled={isBusy}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("delete confirm intro copy helper", "function deleteConfirmIntroCopy()"),
            ("delete confirm record meta copy helper", "function deleteConfirmRecordMetaCopy(dateTimeLabel: string, sourceLabel: string)"),
            ("delete confirm submit label helper", "function deleteConfirmSubmitLabel(isBusy: boolean)"),
            ("delete confirm display texts helper", "function deleteConfirmDisplayTexts("),
            ("delete confirm display texts intro binding", "intro: deleteConfirmIntroCopy()"),
            ("delete confirm display texts record meta binding", "deleteConfirmRecordMetaCopy(selectedRecordDisplayItem.dateTimeLabel, selectedRecordDisplayItem.sourceLabel)"),
            ("delete confirm display texts submit binding", "submit: deleteConfirmSubmitLabel(isBusy)"),
            ("delete confirm ready status helper", "function deleteConfirmReadyStatusMessage()"),
            ("delete confirm return status helper", "function deleteConfirmReturnStatusMessage()"),
            ("delete confirm checklist helper", "function deleteConfirmChecklistDisplayItems()"),
            ("delete confirm intro copy", "刪除後會從目前清單移除"),
            ("delete confirm no request copy", "按下確認刪除前不會送出 delete request"),
            ("delete confirm cancel status copy", "已取消刪除；紀錄保留"),
            ("delete confirm single record copy", "只會刪除目前選取的這一筆紀錄。"),
            ("delete confirm no undo copy", "目前沒有本機 undo；刪除成功後會進入刪除完成頁。"),
            ("record edit intro copy helper", "function recordEditIntroCopy()"),
            ("record edit display texts helper", "function recordEditDisplayTexts(validationError: string | null)"),
            ("record edit display texts intro binding", "intro: recordEditIntroCopy()"),
            ("record edit display texts validation binding", 'validation: boundUiMessage(validationError || "")'),
            ("preview record edit validation display helper", "function previewRecordEditValidationDisplayText(validationError: string | null)"),
            ("record edit open status helper", "function recordEditOpenStatusMessage()"),
            ("record edit cancel status helper", "function recordEditCancelStatusMessage()"),
            ("record sync boundary display texts helper", "function recordSyncBoundaryDisplayTexts(value: {"),
            ("record sync boundary cache limit binding", "recordsAtCacheLimit = boundedRecordCount >= boundedCacheLimit"),
            ("record sync boundary load-more binding", "canLoadMoreRecords:"),
            ("record sync boundary history cache-limit copy", "已達本機紀錄上限 ${boundedCacheLimit} 筆"),
            ("record sync boundary history pagination copy", "目前已同步 ${boundedRecordCount} 筆；可用 cursor pagination 載入更早紀錄。"),
            ("record sync boundary analysis copy", "本機分析使用目前已同步紀錄，最多保留 ${boundedCacheLimit} 筆"),
            ("record update checklist helper", "function recordUpdateChecklistDisplayItems()"),
            ("record update checklist single record copy", "只會更新目前選取的這一筆紀錄。"),
            ("record update checklist payload copy", "只送出確認後的結構化 payload，不批次載入完整歷史。"),
            ("record result destination status helper", 'function recordResultDestinationStatusMessage(kind: "delete" | "update", target: AppScreen)'),
            ("delete success boundary checklist helper", "function deleteSuccessBoundaryChecklistDisplayItems(recordSyncLimit: number)"),
            ("update success boundary checklist helper", "function updateSuccessBoundaryChecklistDisplayItems(recordSyncLimit: number)"),
            ("record edit intro copy", "欄位會轉成後端結構化 payload"),
            ("record edit no update copy", "按下儲存修改前不會送出 update request"),
            ("record result destination no retry copy", "不會重新送出 backend request 或呼叫 AI"),
            ("delete success no restore copy", "成功頁不保留被刪除紀錄的本機復原副本。"),
            ("update success selected record copy", "成功頁只反映目前已更新的選取紀錄與本機清單。"),
            ("manual record create display texts helper", "function manualRecordCreateDisplayTexts(value: {"),
            ("manual record create validation display binding", 'validation: boundUiMessage(value.validationError || "")'),
            ("manual record create backend unavailable display binding", "backendUnavailable: boundUiMessage(`${value.backendUnavailableMessage}，才可建立手動紀錄。`)"),
        ):
            _assert_contains(label, record_status_copy_content, marker)
        for label, marker in (
            ("delete confirm checklist helper binding", "const deleteConfirmChecklistItems = deleteConfirmChecklistDisplayItems();"),
            ("delete confirm display helper binding", "const deleteConfirmDisplay = deleteConfirmDisplayTexts(selectedRecordDisplayItem, isBusy);"),
            ("delete confirm intro display binding", "const deleteConfirmIntroDisplayText = deleteConfirmDisplay.intro;"),
            ("delete confirm record meta display binding", "const deleteConfirmRecordMetaDisplayText = deleteConfirmDisplay.recordMeta;"),
            ("delete confirm submit display binding", "const deleteConfirmSubmitDisplayLabel = deleteConfirmDisplay.submit;"),
            ("delete confirm preview block binding", "<DeleteConfirmPreviewBlock\n              dangerLabel={auxiliaryDisplayLabels.dangerOperation}"),
            ("delete confirm preview intro binding", "introText={deleteConfirmIntroDisplayText}"),
            ("delete confirm preview record meta binding", "recordMetaText={deleteConfirmRecordMetaDisplayText}"),
            ("delete confirm preview record summary binding", "recordSummary={selectedRecordDisplayItem.payloadSummary}"),
            ("delete confirm preview record type binding", "recordTypeLabel={selectedRecordDisplayItem.typeLabel}"),
            ("record edit display helper binding", "const recordEditDisplay = recordEditDisplayTexts(selectedRecordEditValidationError);"),
            ("record edit intro display binding", "const recordEditIntroDisplayText = recordEditDisplay.intro;"),
            ("record edit validation display binding", "const selectedRecordEditValidationDisplayText = recordEditDisplay.validation;"),
            ("preview record edit validation display helper binding", "const previewRecordEditValidationDisplay = previewRecordEditValidationDisplayText(previewRecordEditValidationError);"),
            ("preview record edit validation render binding", "{previewRecordEditValidationDisplay}"),
            ("record sync boundary display helper binding", "const recordSyncBoundaryDisplay = recordSyncBoundaryDisplayTexts({"),
            ("record sync boundary records-at-limit binding", "const recordsAtCacheLimit = recordSyncBoundaryDisplay.recordsAtCacheLimit;"),
            ("record sync boundary load-more binding", "const canLoadMoreRecords = recordSyncBoundaryDisplay.canLoadMoreRecords;"),
            ("record sync boundary history display binding", "const historySyncBoundaryDisplayText = recordSyncBoundaryDisplay.history;"),
            ("record sync boundary analysis display binding", "const analysisSyncBoundaryDisplayText = recordSyncBoundaryDisplay.analysis;"),
            ("record collection state helper", "function recordCollectionState(\n  records: readonly RecordItem[],\n  syncLimit: number,\n  cacheLimit: number,\n  displayLimit: number\n)"),
            ("record collection display count binding", "displayCount: clampNumber(recordCount, 0, displayLimit)"),
            ("record collection has records flag", "hasRecords: recordCount > 0"),
            ("record collection empty flag", "isEmpty: recordCount === 0"),
            ("record collection cache limit flag", "isAtCacheLimit: recordCount >= cacheLimit"),
            ("record collection sync boundary flag", "isAtSyncBoundary: recordCount >= syncLimit"),
            ("record collection last record binding", "lastRecord: records[recordCount - 1] ?? null"),
            ("record display state helper display limit binding", "const recordDisplayState = recordCollectionState(\n    recordsForDisplay,\n    mobileRecordSyncLimit,\n    maxMobileRecordCacheLimit,\n    maxMobileCountValue\n  );"),
            ("analysis preview mode record state binding", "const analysisPreviewMode = recordDisplayState.isEmpty;"),
            ("history boundary record state binding", "recordDisplayState.hasRecords"),
            ("history record display count state binding", "const historyRecordDisplayCount = recordDisplayState.displayCount;"),
            ("record sync boundary state count binding", "recordCount: recordDisplayState.recordCount,"),
            ("load more record state guard", "if (!account || !activeProfileId || recordDisplayState.isEmpty || recordDisplayState.isAtCacheLimit)"),
            ("load more cursor record state binding", "const cursorRecord = recordDisplayState.lastRecord;"),
            ("history empty record state render binding", "{recordDisplayState.isEmpty ? ("),
            ("history sync boundary record state render binding", "{recordDisplayState.isAtSyncBoundary ? ("),
            ("analysis sync boundary record state render binding", "{recordDisplayState.isAtSyncBoundary ? ("),
            ("record sync pagination status clear helper", "function clearRecordSyncPaginationStatus(statusMessage: string)"),
            ("record sync pagination status clear helper internals", "function clearRecordSyncPaginationStatus(statusMessage: string) {\n    setRecordsStatus(statusMessage);\n    setRecordsHasMore(false);"),
            ("record sync initial clear helper binding", "clearRecordSyncPaginationStatus(recordSyncInitialStatusMessage());"),
            ("record sync failure clear helper binding", "clearRecordSyncPaginationStatus(recordSyncFailureStatusMessage());"),
            ("records status display helper binding", "const recordsStatusDisplay = recordsStatusDisplayTexts(recordsStatus);"),
            ("records status display text binding", "const recordsStatusDisplayText = recordsStatusDisplay.records;"),
            ("manual record create display helper binding", "const manualRecordCreateDisplay = manualRecordCreateDisplayTexts({"),
            ("manual record validation display binding", "const manualRecordValidationDisplayText = manualRecordCreateDisplay.validation;"),
            ("manual record backend unavailable display binding", "const manualRecordBackendUnavailableDisplayText = manualRecordCreateDisplay.backendUnavailable;"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("analysis preview mode direct records length guard", "const analysisPreviewMode = recordsForDisplay.length === 0;"),
            ("history boundary direct records length guard", "recordsForDisplay.length > 0"),
            ("load more direct empty/cache guard", "recordsForDisplay.length === 0 || recordsForDisplay.length >= maxMobileRecordCacheLimit"),
            ("load more direct cursor record binding", "recordsForDisplay[recordsForDisplay.length - 1]"),
            ("history direct empty render guard", "{recordsForDisplay.length === 0 ? ("),
            ("history direct sync boundary render guard", "{recordsForDisplay.length >= mobileRecordSyncLimit ? ("),
            ("history direct record count binding", "const historyRecordDisplayCount = clampNumber(historyRecords.length, 0, maxMobileCountValue);"),
            ("record sync boundary direct count binding", "recordCount: recordsForDisplay.length,"),
        ):
            _assert_not_contains(label, content, marker)
        for label, marker in (
            ("records status display texts helper", "function recordsStatusDisplayTexts(recordsStatus: string)"),
            ("records status display binding", "records: boundUiMessage(recordsStatus)"),
        ):
            _assert_contains(label, record_status_copy_content, marker)
        for label, marker in (
            ("report source display helper", "function reportSourceDisplayItem(report: unknown | null, localRecordCount: number, queryLimit: number)"),
            ("report source backend label", "Backend 報表"),
            ("report source backend copy", "資料來自 /reports/basic"),
            ("report source local fallback", "backend 報表暫未使用"),
            ("report source empty fallback", "此頁只顯示空摘要"),
            ("report generated-at display helper", "function reportGeneratedAtDisplayText(generatedAt?: string | null)"),
            ("report generated-at record datetime binding", "recordDateTimeDisplay(generatedAt)"),
            ("report generated-at fallback copy", "以 mobile 目前已載入資料計算。"),
            ("report status display texts helper", "function reportStatusDisplayTexts(value: {"),
            ("report status display report binding", "report: boundUiMessage(value.reportStatus)"),
            ("quota status display binding", "quota: boundUiMessage(value.quotaStatus)"),
        ):
            _assert_contains(label, report_status_copy_content, marker)
        for label, marker in (
            ("minimal home recording seconds helper", "function homeRecordingSecondaryHint(isRecording: boolean, elapsedSeconds: number)"),
            ("minimal home secondary hint", "放開即結束"),
            ("minimal home recording seconds copy", "已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒，放開即結束"),
            ("minimal home recording model status helper", "function homeRecordingModelStatusCopy(hasWhisperModel: boolean)"),
            ("minimal home recording model whisper copy", "目前語音識別：本機 Whisper"),
            ("minimal home recording model fallback copy", "目前語音識別：內建文字確認"),
            ("recording limit reached status", "function recordingLimitReachedStatusMessage(limitSeconds: number)"),
            ("native recording no direct parser boundary", "確認後再交給 AI 整理"),
        ):
            _assert_contains(label, recording_copy_content, marker)
        _assert_contains("minimal home empty subtitle", navigation_content, 'today: { subtitle: "" }')
        _assert_not_contains(
            "home quick-entry action",
            content,
            "onPress={() => pressTodayQuickEntryItem(item)}",
        )
        _assert_not_contains(
            "home quick-entry direct source wrapper binding",
            content,
            "onPress={() => handleTodayQuickEntryMode(item.key)}",
        )
        _assert_contains(
            "today quick-entry target helper binding",
            content,
            "handleTodayQuickEntryMode(quickEntryModeTarget(item));",
        )
        _assert_not_contains(
            "home quick-entry direct return-screen binding",
            content,
            'onPress={() => handleQuickEntryMode(item.key, "today")}',
        )
        _assert_contains(
            "today manual entry handler",
            content,
            "function openTodayManualRecord()",
        )
        _assert_contains(
            "today manual entry status helper binding",
            content,
            'openManualRecordWithStatus("today", todayManualEntryStatusMessage());',
        )
        _assert_contains(
            "today record entry handler",
            content,
            "function openTodayRecordEntry()",
        )
        _assert_contains(
            "today record entry status helper binding",
            content,
            'openScreenWithStatus("record", todayRecordEntryStatusMessage());',
        )
        _assert_contains(
            "today record detail handler",
            content,
            "function openTodayRecordDetail(record: RecordItem)",
        )
        _assert_contains(
            "today record detail status helper binding",
            content,
            'openRecordDetailWithStatus(record, "today", todayRecordDetailStatusMessage());',
        )
        _assert_contains(
            "today record detail card handler",
            content,
            "function openTodayRecordDetailCard(record: RecordItem)",
        )
        _assert_contains(
            "record detail card target helper",
            content,
            "function recordDetailCardTarget(item: { record: RecordItem })",
        )
        _assert_contains(
            "record detail card target helper fields",
            content,
            "return item.record;",
        )
        _assert_contains(
            "today record detail card press handler",
            content,
            "function pressTodayRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>)",
        )
        _assert_contains(
            "today record detail card target helper binding",
            content,
            "openTodayRecordDetailCard(recordDetailCardTarget(item));",
        )
        _assert_contains(
            "today record display items helper binding",
            content,
            "const todayRecordDisplayItems = useMemo(\n    () => recordListDisplayItems(todayRecords, \"today\"),",
        )
        _assert_contains(
            "record list accessibility item",
            record_display_content,
            "accessibilityLabel: boundDisplayText(`查看${typeLabel}紀錄：${payloadSummary}，時間 ${timeLabel}`, maxDisplayDetailTextLength)",
        )
        _assert_contains(
            "record list display item helper",
            record_display_content,
            "function recordListDisplayItem(record: RecordItem, keyPrefix = \"record\")",
        )
        _assert_contains(
            "record list display items helper",
            record_display_content,
            "function recordListDisplayItems(records: RecordItem[], keyPrefix = \"record\")",
        )
        _assert_contains(
            "record list display items map",
            record_display_content,
            "return records.map((record) => recordListDisplayItem(record, keyPrefix));",
        )
        _assert_contains(
            "grouped history record display sections helper binding",
            content,
            "const groupedHistoryRecordDisplaySections = useMemo(\n    () => groupedRecordListDisplaySections(groupedHistoryRecords),",
        )
        _assert_contains(
            "grouped record list display sections helper",
            record_display_content,
            "function groupedRecordListDisplaySections(groupedRecords: Array<readonly [string, RecordItem[]]>)",
        )
        _assert_contains(
            "grouped record list section key",
            record_display_content,
            "key: `history-section-${boundIdentifier(date)}-${clampNumber(sectionIndex, 0, maxMobileCountValue)}`",
        )
        _assert_contains(
            "grouped record list section history records",
            record_display_content,
            'records: recordListDisplayItems(sectionRecords, "history")',
        )
        _assert_contains(
            "record time display helper",
            record_display_content,
            "function recordTimeDisplay(value?: string)",
        )
        for label, marker in (
            ("record detail display item helper", "function recordDetailDisplayItem(record: RecordItem)"),
            ("record detail date display helper", "function recordDateDisplay(value?: string)"),
            ("record detail datetime display helper", "function recordDateTimeDisplay(value?: string)"),
            ("record detail source display helper", "function recordSourceDisplay(value?: string)"),
            ("record detail exercise summary", 'record.record_type === "exercise"'),
            ("record detail medication summary", 'record.record_type === "medication"'),
            ("record detail rows", "recordPayloadDetailRows(record.record_type, record.payload_json).map((row) => ({"),
        ):
            _assert_contains(label, record_display_content, marker)
        for label, marker in (
            ("manual record confirm display helper", "function manualRecordConfirmDisplayItem("),
            ("manual record confirm missing payload copy", "尚未完成必填欄位"),
            ("manual record confirm source line", "source: manual"),
        ):
            _assert_contains(label, record_display_content, marker)
        for label, marker in (
            ("manual record type config type", 'export type ManualRecordType = "glucose" | "meal" | "exercise" | "medication" | "note"'),
            ("manual record type options config", "export const manualRecordTypes: Array<{ id: ManualRecordType; label: string }> = ["),
            ("record edit fields type", "export type RecordEditFields = {"),
            ("glucose unit option config", 'export const glucoseUnitOptions = ["mg/dL", "mmol/L"] as const'),
            ("glucose timing option config", "export const glucoseTimingOptions = ["),
            ("meal type option config", "export const mealTypeOptions = ["),
            ("record edit field max length helper", "function recordEditFieldMaxLength(field: keyof RecordEditFields)"),
            ("record edit field bound helper", "function boundRecordEditField<K extends keyof RecordEditFields>("),
            ("empty record edit fields helper", "function emptyRecordEditFields(): RecordEditFields"),
            ("record payload to edit fields helper", "function recordPayloadToEditFields(record: { record_type: string; payload_json: Record<string, unknown> }): RecordEditFields"),
            ("record edit fallback json", 'fields.fallbackJson = boundRecordEditField("fallbackJson", JSON.stringify(payload, null, 2));'),
            ("record edit food item import", "const amount = textValue(candidate.amount);"),
            ("record edit note tags import", ".filter((tag): tag is string => typeof tag === \"string\")"),
            ("record edit split list helper", "function splitListText(value: string)"),
            ("record edit validation helper", "function validateRecordForm("),
            ("record edit validation date parse", "parseLocalDateTimeInput(dateText, timeText);"),
            ("record edit glucose validation", "血糖數值需介於 20 到 600"),
            ("record edit meal validation", "請至少輸入一項飲食內容"),
            ("record edit exercise validation", "運動時長需介於 0 到 1440 分鐘"),
            ("record edit medication validation", "請輸入藥名或胰島素描述"),
            ("record edit note validation", "備註需至少輸入類型或標籤"),
            ("record edit fallback json validation", "payload_json 不是有效 JSON"),
            ("record edit payload builder helper", "function buildPayloadFromEditFields(recordType: string, fields: RecordEditFields)"),
            ("record edit meal payload builder", "food_items: splitListText(fields.foodItems).map((name) => ({ name }))"),
            ("record edit exercise minutes payload builder", "minutes: fields.exerciseMinutes.trim() ? Number(fields.exerciseMinutes) : undefined"),
            ("record edit note tags payload builder", "const tags = splitListText(fields.noteTags);"),
            ("record edit fallback json payload builder", "return JSON.parse(fields.fallbackJson) as Record<string, unknown>;"),
        ):
            _assert_contains(label, record_edit_transforms_content, marker)
        for label, marker in (
            ("record payload sanitizer", "function boundRecordPayload(recordType: string, payload: Record<string, unknown>): Record<string, unknown>"),
            ("record payload value sanitizer", "function boundRecordPayloadValue(value: unknown, depth = 0): unknown"),
            ("record payload raw key guard", "function isRawPayloadKey(key: string)"),
            ("record payload raw key lowercase guard", "const normalized = key.toLowerCase();"),
            ("record payload key limit", ".slice(0, maxListItems)\n      .map(([key, item]) => [boundIdentifier(key), boundRecordPayloadValue(item, depth + 1)] as const)"),
            ("record payload string bound", "return boundDisplayText(value, maxDisplayDetailTextLength);"),
            ("record payload nonfinite number guard", "return Number.isFinite(value) ? clampNumber(value, -maxMobileCountValue, maxMobileCountValue) : undefined;"),
            ("record payload depth guard", "if (depth >= 2)"),
            ("record glucose value clamp", 'if (recordType === "glucose" && typeof result.value === "number")'),
            ("record exercise minutes clamp", 'if (recordType === "exercise" && typeof result.minutes === "number")'),
            ("record item payload boundary", "payload_json: boundRecordPayload(recordType, value.payload_json)"),
        ):
            _assert_contains(label, record_bounds_content, marker)
        _assert_contains(
            "today analysis handler",
            content,
            "function openTodayAnalysis()",
        )
        _assert_contains(
            "today analysis status helper binding",
            content,
            'openScreenWithStatus("analysis", todayAnalysisStatusMessage());',
        )
        _assert_not_contains(
            "today manual entry binding",
            content,
            "onPress={openTodayManualRecord}",
        )
        _assert_not_contains(
            "today record entry binding",
            content,
            "onPress={openTodayRecordEntry}",
        )
        _assert_contains(
            "transcript sample fill handler",
            content,
            "function fillTranscriptSampleDraft()",
        )
        _assert_contains(
            "transcript sample fill binding",
            content,
            "onPress={fillTranscriptSampleDraft}",
        )
        _assert_not_contains(
            "transcript sample direct JSX updater",
            content,
            'onPress={() => updateTranscriptDraft(sampleText, "sample")}',
        )
        _assert_not_contains(
            "today record detail card binding",
            content,
            "onPress={() => pressTodayRecordDetailCard(item)}",
        )
        _assert_not_contains(
            "today direct record detail card binding",
            content,
            "onPress={() => openTodayRecordDetailCard(item.record)}",
        )
        _assert_not_contains(
            "today direct record detail binding",
            content,
            "onPress={() => openTodayRecordDetail(item.record)}",
        )
        _assert_not_contains(
            "today analysis binding",
            content,
            "onPress={openTodayAnalysis}",
        )
        _assert_contains(
            "record quick-entry shared render",
            content,
            "quickEntryModeDisplayItemsForRender.map((item) =>",
        )
        _assert_contains(
            "record quick-entry key prefix",
            content,
            "key={quickEntryModeRenderKey(item)}",
        )
        _assert_contains(
            "record quick-entry action",
            content,
            "onPress={() => pressRecordQuickEntryItem(item)}",
        )
        quick_entry_render_block = _match_block(
            content,
            r"quickEntryModeDisplayItemsForRender\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "record quick-entry render block",
        )
        for label, marker in (
            ("direct quick-entry key binding", 'key={`record-${item.key}`}'),
            ("direct quick-entry accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct quick-entry icon binding", "<Text style={styles.quickEntryIcon}>{item.icon}</Text>"),
            ("direct quick-entry label binding", "<Text style={styles.quickEntryLabel}>{item.label}</Text>"),
            ("direct quick-entry copy binding", "<Text style={styles.quickEntryCopy}>{item.copy}</Text>"),
        ):
            _assert_not_contains(label, quick_entry_render_block, marker)
        _assert_not_contains(
            "record quick-entry direct source wrapper binding",
            content,
            "onPress={() => handleRecordQuickEntryMode(item.key)}",
        )
        _assert_not_contains(
            "record quick-entry direct return-screen binding",
            content,
            'onPress={() => handleQuickEntryMode(item.key, "record")}',
        )
        for style_name in (
            "historyDailySummaryTable",
        ):
            _assert_contains(f"{style_name} style", content, f"{style_name}: {{")
        _assert_contains(
            "history source text preserved during save",
            record_save_transforms_content,
            "const sanitizedMetadata = boundMetadata(record.metadata_json, true);",
        )
        for label, marker in (
            ("history selected date state", "const [selectedHistoryDate, setSelectedHistoryDate] = useState(formatLocalDateInput(new Date()))"),
            ("history detail mode state", 'const [historyDetailMode, setHistoryDetailMode] = useState<HistoryDetailMode>("structured")'),
            ("history calendar date resets structured mode", 'setHistoryDetailMode("structured");'),
            ("history daily summary items", "const historyDailySummaryDisplayItems = useMemo("),
            ("history selected daily summary", "const selectedHistoryDailySummary = useMemo("),
            ("history selected daily sections", "const selectedHistoryDailySectionItems = useMemo("),
            ("history raw display items helper binding", "const selectedHistoryRawDisplayItems = useMemo(\n    () => historyRawRecordDisplayItems(selectedHistoryRecords),"),
            ("history calendar month offset handler", "function selectHistoryCalendarMonthOffset(offset: number)"),
            ("history calendar previous month handler", "function openPreviousHistoryMonth()"),
            ("history calendar next month handler", "function openNextHistoryMonth()"),
            ("history calendar display helper binding", "const historyCalendarDisplay = historyCalendarDisplayTexts(historyCalendarMonthStart, selectedHistoryDate);"),
            ("history calendar title display binding", "const historyCalendarTitle = historyCalendarDisplay.title;"),
            ("history calendar previous month accessibility binding", "const historyPreviousMonthAccessibilityLabel = historyCalendarDisplay.previousMonthAccessibility;"),
            ("history records by date map", "const historyRecordsByDate = useMemo(() => {"),
            ("history calendar display items", "const historyCalendarDisplayItems = useMemo(() => {"),
            ("history calendar component binding", "<HistoryCalendarMonthPicker\n              days={historyCalendarDisplayItems}"),
            ("history calendar previous month binding", "onPreviousMonthPress={openPreviousHistoryMonth}"),
            ("history calendar next month binding", "onNextMonthPress={openNextHistoryMonth}"),
            ("history date target helper", "function historyDateTarget(item: { value: string })"),
            ("history date target helper fields", "return item.value;"),
            ("history calendar day press handler", "function pressHistoryCalendarDay(item: ReturnType<typeof historyCalendarDayDisplayItem>)"),
            ("history calendar day target helper binding", "selectHistoryCalendarDate(historyDateTarget(item));"),
            ("history calendar day binding", "onDayPress={pressHistoryCalendarDay}"),
            ("history daily summary press handler", "function pressHistoryDailySummary(item: ReturnType<typeof historyDailySummaryDisplayItem>)"),
            ("history daily summary target helper binding", "selectHistoryCalendarDate(historyDateTarget(item));"),
            ("history daily summary binding", "onSummaryPress={pressHistoryDailySummary}"),
            ("history daily entry press handler", "function pressHistoryDailyEntry("),
            ("history daily entry binding", "onEntryPress={pressHistoryDailyEntry}"),
            ("history calendar selected state", "onDayPress={pressHistoryCalendarDay}"),
            ("history detail mode display options helper binding", "const historyDetailModeDisplayOptions = useMemo(() => historyDetailModeDisplayItems(historyDetailModes), []);"),
            ("history detail mode target helper", "function historyDetailModeTarget(item: ReturnType<typeof historyDetailModeDisplayItem>)"),
            ("history detail mode target helper fields", "return item.value;"),
            ("history detail mode press handler", "function pressHistoryDetailModeOption(item: ReturnType<typeof historyDetailModeDisplayItem>)"),
            ("history detail mode target helper binding", "selectHistoryDetailMode(historyDetailModeTarget(item));"),
            ("history selected date panel binding", "<HistorySelectedDatePanel\n              detailMode={historyDetailMode}"),
            ("history detail mode tabs options binding", "detailModeOptions={historyDetailModeDisplayOptions}"),
            ("history detail mode tabs press binding", "onDetailModePress={pressHistoryDetailModeOption}"),
            ("history cursor before query", "before: cursorRecord.occurred_at,"),
            ("history cursor created_at query", "before_created_at: cursorRecord.created_at"),
            ("history load more handler", "async function loadMoreRecords()"),
            ("history load more availability", "const canLoadMoreRecords ="),
            ("history daily summary table render", "<HistoryDailySummaryTable\n              emptyBody={historyNoRangeRecordsBodyDisplayText}"),
            ("history selected daily summary render", "selectedHistoryDailySummary.summaryText"),
            ("history structured section render", "sectionItems={selectedHistoryDailySectionItems}"),
            ("history raw records render", "rawItems={selectedHistoryRawDisplayItems}"),
        ):
            _assert_contains(label, content, marker)
        _assert_not_contains(
            "history direct date item value binding",
            content,
            "selectHistoryCalendarDate(item.value);",
        )
        _assert_not_contains(
            "history direct detail-mode item value binding",
            content,
            "selectHistoryDetailMode(item.value);",
        )
        for label, marker in (
            ("history calendar display helper", "function historyCalendarDisplayTexts(monthStart: Date, selectedDate: string)"),
            ("history calendar display title", "title: boundDisplayText(`${monthStart.getFullYear()} 年 ${monthStart.getMonth() + 1} 月`, 40)"),
            ("history calendar display selected date", "selectedDate: boundDisplayText(selectedDate, 40)"),
            ("history calendar previous month label", 'previousMonthLabel: boundDisplayText("上一月", 20)'),
            ("history calendar next month accessibility", 'nextMonthAccessibility: boundDisplayText("查看下一個月份月曆，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, history_copy_content, marker)
        _assert_contains(
            "history record cursor created_at field",
            record_bounds_content,
            "created_at: string;",
        )
        _assert_contains(
            "history load more accessibility label",
            first_version_flow_copy_content,
            'historyLoadMoreAccessibility: boundDisplayText("使用 cursor 載入更早紀錄，不呼叫 AI 或修改資料", maxDisplayDetailTextLength)',
        )
        _assert_contains(
            "history detail mode display item",
            history_screen_data_content,
            "function historyDetailModeDisplayItem(value: { id: HistoryDetailMode; label: string; accessibilityCopy: string })",
        )
        _assert_contains(
            "history detail mode display items helper",
            history_screen_data_content,
            "function historyDetailModeDisplayItems(values: ReadonlyArray<{ id: HistoryDetailMode; label: string; accessibilityCopy: string }>)",
        )
        _assert_contains(
            "history detail mode display items map",
            history_screen_data_content,
            "return values.map(historyDetailModeDisplayItem);",
        )
        _assert_contains(
            "history calendar day display item",
            history_screen_data_content,
            "function historyCalendarDayDisplayItem(",
        )
        for label, marker in (
            ("history boundary checklist helper", "function historyBoundaryChecklistDisplayItems("),
            ("history calendar loaded-only copy", "月曆選取日期只套用在 mobile 目前已載入的紀錄。"),
            ("history cursor pagination copy", "載入更多使用 backend cursor pagination，只追加更早紀錄並以 id 去重。"),
            ("history loaded record action copy", "點擊真實紀錄可查看詳情並進行編輯或刪除。"),
        ):
            _assert_contains(label, history_copy_content, marker)
        for label, marker in (
            ("history pending record adapter", "function pendingRecordFromRecordItem(record: RecordItem): PendingRecord"),
            ("history daily sync summary helper", "function historyDailySyncSummary(records: RecordItem[], isLocalPreview: boolean)"),
            ("history daily summary display item", "function historyDailySummaryDisplayItem(dateKey: string, records: RecordItem[], isLocalPreview: boolean)"),
            ("history daily section display helper", "function buildHistoryDailyRecordSectionDisplayItems(records: RecordItem[])"),
            ("history daily summary copy", "summaryText: dailyRecordSummaryText(pendingRecords)"),
            ("history daily section record accessibility", "accessibilityLabel: recordListDisplayItem(record, `history-daily-${index}`).accessibilityLabel"),
            ("history raw record display item", "function historyRawRecordDisplayItem(record: RecordItem, index: number)"),
            ("history raw record display items helper", "function historyRawRecordDisplayItems(records: RecordItem[])"),
            ("history raw record display items map", "return records.map(historyRawRecordDisplayItem);"),
            ("history raw source metadata lookup", "const sourceText = record.metadata_json?.source_text;"),
            ("history raw source type guard", 'const hasSourceText = typeof sourceText === "string" && sourceText.trim().length > 0;'),
            ("history raw bounded source text", "boundDisplayText(sourceText, maxDisplayDetailTextLength)"),
            ("history raw fallback assignment", ': "尚無原始逐字稿；此筆紀錄只保留結構化資料。";'),
            ("history raw status label", 'sourceStatusLabel: boundDisplayText(hasSourceText ? "原始逐字稿" : "僅結構化", 40)'),
            ("history local sync label", "本機 0 筆待同步"),
            ("history unsynced local label", "尚未同步"),
            ("history synced cloud label", "已同步"),
        ):
            _assert_contains(label, history_screen_data_content, marker)
        _assert_contains(
            "history cursor merge helper",
            record_bounds_content,
            "function mergeRecordsByCursorOrder(current: RecordItem[], incoming: RecordItem[])",
        )
        for label, marker in (
            ("daily section time detail label helper", "function dailyRecordTimeDetailLabel(recordType: string)"),
            ("daily section entry display item helper", "function dailyRecordEntryDisplayItem(record: PendingRecord, index: number)"),
            ("daily section display item builder", "function buildDailyRecordSectionDisplayItems(records: PendingRecord[])"),
            ("daily section entry management label", "可編輯或刪除"),
            ("daily section meal time label", "用餐時間"),
            ("daily section glucose context label", "測量情境"),
            ("daily section glucose value label", "血糖值"),
            ("daily section exercise duration label", "運動時長"),
            ("daily section body measurement support", 'acceptedRecordTypes: ["weight", "body_measurement"]'),
        ):
            _assert_contains(label, record_display_content, marker)
        history_calendar_day_block = _function_block(history_screen_data_content, "historyCalendarDayDisplayItem")
        for label, marker in (
            ("history calendar date key", "const dateKey = formatLocalDateInput(date);"),
            ("history calendar date record count", "const recordCount = clampNumber(recordsByDate.get(dateKey)?.length ?? 0, 0, maxMobileCountValue);"),
            ("history calendar has records flag", "hasRecords: recordCount > 0"),
            ("history calendar selected flag", "isSelected: dateKey === selectedDateKey"),
            ("history calendar accessibility has/no records", '${dateKey}，${recordCount > 0 ? `有 ${recordCount} 筆紀錄` : "沒有紀錄"}，點擊查看日期'),
        ):
            _assert_contains(label, history_calendar_day_block, marker)
        history_block = _history_render_block(content)
        history_calendar_index = history_block.find("<HistoryCalendarMonthPicker")
        history_summary_index = history_block.find("<HistoryDailySummaryTable")
        history_detail_index = history_block.find("<HistorySelectedDatePanel")
        history_structured_index = history_selected_date_panel_content.find('detailMode === "structured"')
        history_raw_index = history_selected_date_panel_content.find("rawItems.map((item) =>")
        if history_calendar_index == -1 or history_detail_index == -1 or history_calendar_index > history_detail_index:
            raise AssertionError("History calendar must render before selected-date details.")
        if history_summary_index == -1 or history_calendar_index > history_summary_index or history_summary_index > history_detail_index:
            raise AssertionError("History daily summary table must render between calendar and selected-date details.")
        if history_structured_index == -1 or history_raw_index == -1 or history_structured_index > history_raw_index:
            raise AssertionError("History structured AI-organized records must render before raw transcript branch.")
        for label, marker in (
            ("history intro status blocks binding", "<HistoryIntroStatusBlocks\n              boundaryItems={historyBoundaryChecklistItems}"),
            ("history intro status boundary title binding", "boundaryTitle={coreFlowDisplayLabels.historyDataBoundary}"),
            ("history intro status sync body binding", "syncBody={recordsStatusDisplayText}"),
            ("history intro status sync title binding", "syncTitle={coreFlowDisplayLabels.recordSyncStatus}"),
            ("history calendar component binding", "<HistoryCalendarMonthPicker\n              days={historyCalendarDisplayItems}"),
            ("history calendar title binding", "title={historyCalendarTitle}"),
            ("history calendar day press binding", "onDayPress={pressHistoryCalendarDay}"),
            ("history calendar previous month binding", "onPreviousMonthPress={openPreviousHistoryMonth}"),
            ("history calendar next month binding", "onNextMonthPress={openNextHistoryMonth}"),
            ("history daily summary table binding", "<HistoryDailySummaryTable\n              emptyBody={historyNoRangeRecordsBodyDisplayText}"),
            ("history daily summary table items binding", "items={historyDailySummaryDisplayItems}"),
            ("history daily summary table selected binding", "selectedDate={selectedHistoryDate}"),
            ("history daily summary press binding", "onSummaryPress={pressHistoryDailySummary}"),
            ("history summary no-range records body binding", "emptyBody={historyNoRangeRecordsBodyDisplayText}"),
            ("history summary no-range records title binding", "emptyTitle={historyNoRangeRecordsTitleDisplayText}"),
            ("history no-record status binding", "<HistoryNoRecordStatusBlock\n                body={historyNoRealRecordHealthValueDisplayText}"),
            ("history no-record status title binding", "title={coreFlowDisplayLabels.historyDataStatus}"),
            ("history selected date panel binding", "<HistorySelectedDatePanel\n              detailMode={historyDetailMode}"),
            ("history selected date label binding", "selectedDateLabel={selectedHistoryDateDisplayText}"),
            ("history selected date storage binding", "selectedStorageLabel={selectedHistoryDailySummary.storageLabel}"),
            ("history selected summary source binding", "selectedSourceLabel={selectedHistoryDailySummary.sourceLabel}"),
            ("history selected summary text binding", "selectedSummaryText={selectedHistoryDailySummary.summaryText}"),
            ("history selected sync binding", "selectedSyncLabel={selectedHistoryDailySummary.syncLabel}"),
            ("history selected no-range body binding", "emptyBody={historyNoRangeRecordsBodyDisplayText}"),
            ("history selected no-range title binding", "emptyTitle={historyNoRangeRecordsTitleDisplayText}"),
            ("history selected daily sections binding", "sectionItems={selectedHistoryDailySectionItems}"),
            ("history selected daily section entry press binding", "onEntryPress={pressHistoryDailyEntry}"),
            ("history raw transcript items binding", "rawItems={selectedHistoryRawDisplayItems}"),
            ("history calendar previous month button", "{historyPreviousMonthButtonLabel}"),
            ("history calendar next month button", "{historyNextMonthButtonLabel}"),
            ("history sync boundary component binding", "<HistorySyncBoundaryBlock\n                body={historySyncBoundaryDisplayText}"),
            ("history sync boundary load-more state binding", "canLoadMoreRecords={canLoadMoreRecords}"),
            ("history sync boundary load-more handler binding", "onLoadMore={loadMoreRecords}"),
        ):
            _assert_contains(label, history_block, marker)
        if history_selected_date_panel_content.count("<HistoryNoRangeRecordsCard") != 1:
            raise AssertionError("History selected-date panel must render one no-range records card in its component.")
        if history_daily_summary_table_content.count("<HistoryNoRangeRecordsCard") != 1:
            raise AssertionError("History daily summary table must render one no-range records card in its component.")
        for label, marker in (
            ("history range tabs render", "historyRangeDisplayOptions.map"),
            ("history custom range apply button", "applyHistoryCustomRange"),
            ("history custom start input", "historyCustomStart"),
            ("history custom end input", "historyCustomEnd"),
        ):
            if marker in history_block:
                raise AssertionError(f"History calendar-first render block must not contain {label}.")
        pending_save_block = _function_block(record_save_transforms_content, "pendingRecordForSave")
        _assert_contains(
            "pending save preserves bounded source text",
            pending_save_block,
            "const sanitizedMetadata = boundMetadata(record.metadata_json, true);",
        )
        for label, marker in (
            ("client save batch id helper", "function createClientSaveBatchId()"),
            ("client save batch id timestamp", "const timestamp = Date.now().toString(36);"),
            ("client save batch id prefix", "return `mobile-save-${timestamp}-${randomSuffix}`;"),
        ):
            _assert_contains(label, record_save_transforms_content, marker)
        strip_metadata_block = _function_block(record_bounds_content, "stripRawTextMetadata")
        _assert_not_contains(
            "source text must not be stripped from record metadata",
            strip_metadata_block,
            '"source_text"',
        )
        for label, marker in (
            ("history save strips transcript metadata", '"transcript"'),
            ("history save strips raw transcript metadata", '"raw_transcript"'),
            ("history save strips raw text metadata", '"raw_text"'),
            ("history save strips original text metadata", '"original_text"'),
            ("history save strips normalized text metadata", '"normalized_text"'),
        ):
            _assert_contains(label, strip_metadata_block, marker)
        _assert_contains(
            "history record detail handler",
            content,
            "function openHistoryRecordDetail(record: RecordItem)",
        )
        _assert_contains(
            "history record detail card handler",
            content,
            "function openHistoryRecordDetailCard(record: RecordItem)",
        )
        _assert_contains(
            "history record detail card press handler",
            content,
            "function pressHistoryRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>)",
        )
        _assert_contains(
            "history record detail card target helper binding",
            content,
            "openHistoryRecordDetailCard(recordDetailCardTarget(item));",
        )
        _assert_contains(
            "history record detail card button role",
            content,
            'accessibilityRole="button"',
        )
        _assert_contains(
            "history daily record detail card style",
            content,
            "style={styles.dailyRecordEntryCard}",
        )
        for label, marker in (
            ("history range option press binding", "onPress={() => pressHistoryRangeOption(item)}"),
            ("history custom start input binding", "onChangeText={updateHistoryCustomStartInput}"),
            ("history custom end input binding", "onChangeText={updateHistoryCustomEndInput}"),
            ("history range type dead code", "type HistoryRange"),
            ("history range config dead code", "const historyRanges"),
            ("history range display helper dead code", "function historyRangeDisplayItem"),
            ("history range label dead code", "function historyRangeLabel"),
            ("history range state dead code", "const [historyRange"),
            ("history custom start state dead code", "const [historyCustomStart"),
            ("history custom end state dead code", "const [historyCustomEnd"),
            ("history custom active state dead code", "const [isHistoryCustomActive"),
            ("history custom status state dead code", "const [historyCustomStatus"),
            ("history range display options dead code", "historyRangeDisplayOptions"),
            ("history range select handler dead code", "function selectHistoryRange"),
            ("history range press handler dead code", "function pressHistoryRangeOption"),
            ("history custom start handler dead code", "function updateHistoryCustomStartInput"),
            ("history custom end handler dead code", "function updateHistoryCustomEndInput"),
            ("history custom apply handler dead code", "function applyHistoryCustomRange"),
        ):
            _assert_not_contains(label, content, marker)
        _assert_not_contains(
            "history direct range selection binding",
            content,
            "onPress={() => selectHistoryRange(item.value)}",
        )
        for label, marker in (
            ("history range inline setter block", "onPress={() => {\n                    setHistoryRange(item.value);"),
            ("history custom start inline setter", "onChangeText={(value) => setHistoryCustomStart("),
            ("history custom end inline setter", "onChangeText={(value) => setHistoryCustomEnd("),
        ):
            _assert_not_contains(label, content, marker)
        _assert_contains(
            "history daily record detail card binding",
            content,
            "onEntryPress={pressHistoryDailyEntry}",
        )
        history_daily_entry_block = _match_block(
            content,
            r"function pressHistoryDailyEntry\([\s\S]*?\) \{([\s\S]*?)\n  function openAnalysisManualRecord",
            "history daily entry press block",
        )
        _assert_contains(
            "history daily entry target helper binding",
            history_daily_entry_block,
            "openHistoryRecordDetailCard(recordDetailCardTarget(item));",
        )
        _assert_contains(
            "record detail status opener helper",
            content,
            "function openRecordDetailWithStatus(record: RecordItem, returnScreen: AppScreen, statusMessage: string)",
        )
        _assert_contains(
            "history record detail status helper binding",
            content,
            'openRecordDetailWithStatus(record, "history", historyRecordDetailStatusMessage());',
        )
        _assert_contains(
            "history manual entry status helper binding",
            content,
            'openManualRecordWithStatus("history", historyManualEntryStatusMessage());',
        )
        _assert_not_contains(
            "history direct record detail card binding",
            content,
            "onPress={() => openHistoryRecordDetailCard(item.record)}",
        )
        _assert_not_contains(
            "history direct record detail binding",
            content,
            "onPress={() => openHistoryRecordDetail(item.record)}",
        )
        _assert_not_contains(
            "today direct record detail handler target binding",
            content,
            "openTodayRecordDetailCard(item.record);",
        )
        _assert_not_contains(
            "history direct record detail handler target binding",
            content,
            "openHistoryRecordDetailCard(item.record);",
        )
        chart_card_block = _style_block(content, "chartCard")
        _assert_not_contains(
            "analysis chart open wrapper background",
            chart_card_block,
            "backgroundColor:",
        )
        _assert_not_contains(
            "analysis chart open wrapper border",
            chart_card_block,
            "borderWidth:",
        )
        _assert_contains(
            "analysis manual entry handler",
            content,
            "function openAnalysisManualRecord()",
        )
        _assert_contains(
            "analysis manual entry status helper binding",
            content,
            'openManualRecordWithStatus("analysis", analysisManualEntryStatusMessage());',
        )
        _assert_contains(
            "analysis return today handler",
            content,
            "function returnFromAnalysisToToday()",
        )
        _assert_contains(
            "analysis return today status helper binding",
            content,
            'openScreenWithStatus("today", analysisReturnTodayStatusMessage());',
        )
        _assert_contains(
            "analysis detailed report handler",
            content,
            "function openAnalysisDetailedReport()",
        )
        _assert_contains(
            "detailed report screen opener keeps load binding",
            content,
            'async function openDetailedReport() {\n    openScreen("detailedReport");\n    await loadBasicReportForCurrentRange("detailed");',
        )
        _assert_contains(
            "detailed report return analysis handler",
            content,
            "function returnFromDetailedReportToAnalysis()",
        )
        _assert_contains(
            "detailed report return analysis status helper binding",
            content,
            'openScreenWithStatus("analysis", detailedReportReturnAnalysisStatusMessage());',
        )
        _assert_contains(
            "detailed report manual entry handler",
            content,
            "function openDetailedReportManualRecord()",
        )
        _assert_contains(
            "detailed report manual entry status helper binding",
            content,
            'openManualRecordWithStatus("detailedReport", detailedReportManualEntryStatusMessage());',
        )
        _assert_contains(
            "detailed report return today handler",
            content,
            "function returnFromDetailedReportToToday()",
        )
        _assert_contains(
            "detailed report return today status helper binding",
            content,
            'openScreenWithStatus("today", detailedReportReturnTodayStatusMessage());',
        )
        _assert_contains(
            "manual record type handler",
            content,
            "function selectManualRecordType(type: ManualRecordType)",
        )
        _assert_contains(
            "manual record type option press handler",
            content,
            "function pressManualRecordTypeOption(type: (typeof manualRecordTypeDisplayOptions)[number])",
        )
        _assert_contains(
            "manual record type target helper",
            content,
            "function manualRecordTypeTarget(type: (typeof manualRecordTypeDisplayOptions)[number])",
        )
        _assert_contains(
            "manual record type target helper fields",
            content,
            "return type.value;",
        )
        _assert_contains(
            "manual record type target helper binding",
            content,
            "selectManualRecordType(manualRecordTypeTarget(type));",
        )
        _assert_contains(
            "analysis range handler",
            content,
            "function selectAnalysisRange(range: AnalysisRange)",
        )
        _assert_contains(
            "analysis selected point clear helper",
            content,
            "function clearSelectedAnalysisPoint()",
        )
        _assert_contains(
            "analysis selected point clear helper internals",
            content,
            "function clearSelectedAnalysisPoint() {\n    setSelectedAnalysisPointIndex(null);",
        )
        _assert_contains(
            "analysis range clears selected point helper binding",
            content,
            "setAnalysisRange(range);\n    clearSelectedAnalysisPoint();",
        )
        _assert_contains(
            "analysis range option press handler",
            content,
            "function pressAnalysisRangeOption(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
        _assert_contains(
            "analysis range target helper",
            content,
            "function analysisRangeTarget(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
        _assert_contains(
            "analysis range target helper fields",
            content,
            "return item.value;",
        )
        _assert_contains(
            "analysis range option key helper",
            content,
            "function analysisRangeOptionKey(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
        _assert_contains(
            "analysis range option key helper binding",
            content,
            "key={analysisRangeOptionKey(item)}",
        )
        _assert_contains(
            "analysis range option accessibility helper",
            content,
            "function analysisRangeOptionAccessibilityLabel(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
        _assert_contains(
            "analysis range option accessibility helper fields",
            content,
            "return item.accessibilityLabel;",
        )
        _assert_contains(
            "analysis range option accessibility helper binding",
            content,
            "accessibilityLabel={analysisRangeOptionAccessibilityLabel(item)}",
        )
        _assert_contains(
            "analysis range option label helper",
            content,
            "function analysisRangeOptionLabel(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
        _assert_contains(
            "analysis range option label helper fields",
            content,
            "return item.label;",
        )
        _assert_contains(
            "analysis range option label helper binding",
            content,
            "{analysisRangeOptionLabel(item)}",
        )
        _assert_contains(
            "analysis range option selected helper",
            content,
            "function analysisRangeOptionSelected(item: ReturnType<typeof analysisRangeDisplayItem>, selectedRange: AnalysisRange)",
        )
        _assert_contains(
            "analysis range option selected helper fields",
            content,
            "return analysisRangeTarget(item) === selectedRange;",
        )
        _assert_contains(
            "analysis range option selected helper binding",
            content,
            "analysisRangeOptionSelected(item, analysisRange)",
        )
        _assert_contains(
            "analysis range target helper binding",
            content,
            "selectAnalysisRange(analysisRangeTarget(item));",
        )
        _assert_not_contains(
            "analysis direct range item value binding",
            content,
            "selectAnalysisRange(item.value);",
        )
        _assert_contains(
            "analysis range display options helper binding",
            content,
            "const analysisRangeDisplayOptions = useMemo(() => analysisRangeDisplayItems(analysisRanges), []);",
        )
        analysis_range_option_render_block = _match_block(
            content,
            r"analysisRangeDisplayOptions\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "analysis range option render block",
        )
        for label, marker in (
            ("direct analysis range key binding", "key={item.value}"),
            ("direct analysis range accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct analysis range selected state binding", "analysisRange === item.value"),
            ("direct analysis range label binding", "{item.label}"),
        ):
            _assert_not_contains(label, analysis_range_option_render_block, marker)
        _assert_contains(
            "analysis custom start input handler",
            content,
            "function updateAnalysisCustomStartInput(value: string)",
        )
        _assert_contains(
            "analysis custom end input handler",
            content,
            "function updateAnalysisCustomEndInput(value: string)",
        )
        _assert_contains(
            "analysis custom apply handler",
            content,
            "async function applyAnalysisCustomRange()",
        )
        _assert_contains(
            "analysis custom start clears selected point helper binding",
            content,
            "setAnalysisCustomStart(boundDateInputText(value));\n    clearSelectedAnalysisPoint();",
        )
        _assert_contains(
            "analysis custom end clears selected point helper binding",
            content,
            "setAnalysisCustomEnd(boundDateInputText(value));\n    clearSelectedAnalysisPoint();",
        )
        _assert_contains(
            "analysis custom apply clears selected point helper binding",
            content,
            "clearSelectedAnalysisPoint();\n    setStatus(analysisCustomApplyStatusMessage());",
        )
        for label, marker in (
            ("analysis default month range state", 'const [analysisRange, setAnalysisRange] = useState<AnalysisRange>("month");'),
            ("analysis range display helper binding", "const analysisRangeDisplay = analysisRangeDisplayTexts("),
            ("analysis range display label binding", "const analysisRangeDisplayLabel = analysisRangeDisplay.label;"),
            ("analysis custom range status display binding", "const analysisCustomRangeStatusDisplayText = analysisRangeDisplay.customRangeStatus;"),
            ("analysis selected date bounds", "const analysisSelectedDateBounds = useMemo("),
            ("analysis local records date bounds helper binding", "const analysisRecords = useMemo(\n    () => analysisRecordsInDateRange(recordsForDisplay, analysisSelectedDateBounds),"),
            ("analysis local glucose derives from analysis records", "const analysisGlucoseRecords = useMemo(\n    () => buildAnalysisGlucoseRecords(analysisRecords),"),
            ("analysis local glucose records dependency", "    [analysisRecords]\n  );\n  const analysisGlucoseValues = buildAnalysisGlucoseValues(analysisGlucoseRecords);"),
            ("analysis active backend report guard", "const activeAnalysisReport = basicReportKey === currentBasicReportKey ? basicReport : null;"),
            ("analysis backend report auto sync effect", 'if (currentScreen === "analysis") {\n      void loadBasicReportForCurrentRange("analysis");'),
            ("analysis shared report fetch helper", 'async function loadBasicReportForCurrentRange(mode: "analysis" | "detailed")'),
            ("analysis shared report endpoint", "`/reports/basic?${query.toString()}`"),
            ("analysis report key state", "const [basicReportKey, setBasicReportKey] = useState("),
            ("analysis report cache clear helper", "function clearBasicReportCache()"),
            ("analysis report cache clear helper internals", "function clearBasicReportCache() {\n    setBasicReport(null);\n    setBasicReportKey(\"\");"),
            ("analysis report unavailable clears cache helper binding", "if (!protectedBackendReady) {\n      clearBasicReportCache();"),
            ("analysis report failure clears cache helper binding", "if (latestReportLoadKey.current === reportKey) {\n        clearBasicReportCache();"),
            ("voice quota status clear helper", "function clearVoiceQuotaStatus(statusMessage: string)"),
            ("voice quota status clear helper internals", "function clearVoiceQuotaStatus(statusMessage: string) {\n    setVoiceQuota(null);\n    setQuotaStatus(statusMessage);"),
            ("voice quota unavailable clear helper binding", "clearVoiceQuotaStatus(voiceQuotaUnavailableStatusMessage(protectedAccountBackendUnavailableMessage));"),
            ("voice quota failure clear helper binding", "clearVoiceQuotaStatus(voiceQuotaSyncFailureStatusMessage());"),
            ("analysis report start bound", "const startAt = analysisSelectedDateBounds.start.toISOString();"),
            ("analysis report end bound", "const endAt = analysisSelectedDateBounds.end.toISOString();"),
            ("analysis report status display helper binding", "const reportStatusDisplay = reportStatusDisplayTexts({"),
            ("analysis report status display text binding", "const reportStatusDisplayText = reportStatusDisplay.report;"),
            ("voice quota status display text binding", "const quotaStatusDisplayText = reportStatusDisplay.quota;"),
            ("report generated-at display helper binding", "const reportGeneratedAtDisplayText = reportGeneratedAtDisplayValue(activeAnalysisReport?.generated_at);"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "analysis current report key helper",
            analysis_screen_data_content,
            "function basicReportRequestKey(",
        )
        for label, marker in (
            ("analysis week range option", '{ id: "week", label: "本週" }'),
            ("analysis month range option", '{ id: "month", label: "本月" }'),
            ("analysis custom range option", '{ id: "custom", label: "自訂日期區間" }'),
            ("analysis range display helper", "function analysisRangeDisplayItem(value: { id: AnalysisRange; label: string })"),
            ("analysis range display items helper", "function analysisRangeDisplayItems(values: ReadonlyArray<{ id: AnalysisRange; label: string }>)"),
            ("analysis range display items map", "return values.map(analysisRangeDisplayItem);"),
            ("analysis range accessibility label", "accessibilityLabel: boundDisplayText(`切換分析範圍：${label}，同步 backend bounded report`, maxDisplayDetailTextLength)"),
        ):
            _assert_contains(label, analysis_screen_data_content, marker)
        for label, marker in (
            ("analysis date bounds helper", "function analysisDateBounds(range: AnalysisRange, customStart: string, customEnd: string)"),
            ("analysis custom start inclusive midnight", 'edge === "start" ? "00:00:00.000" : "23:59:59.999"'),
            ("analysis custom end inclusive day", '"23:59:59.999"'),
        ):
            _assert_contains(label, date_time_transforms_content, marker)
        for label, marker in (
            ("analysis no-data status helper", "function analysisNoDataStatusLabel()"),
            ("analysis no-data copy helper", "function analysisNoDataCopy()"),
            ("analysis boundary data copy helper", "function analysisBoundaryDataCopy(isPreviewMode: boolean)"),
            ("analysis boundary checklist helper", "function analysisBoundaryChecklistDisplayItems("),
            ("analysis no-data status copy", "尚無資料"),
            ("analysis no fixed mock glucose copy", "目前不使用固定範例血糖數字"),
            ("analysis backend bounded report copy", "六項統計優先使用 backend bounded report"),
            ("analysis no AI advice copy", "基本分析不呼叫 AI，不會產生診療建議。"),
            ("analysis detailed report query cap copy", "詳細報告會使用 ${boundedReportQueryLimit} 筆上限查詢，避免一次載入過多資料。"),
            ("analysis custom range status helper", "function analysisCustomRangeStatusCopy(range: AnalysisRange, customStart: string, customEnd: string)"),
            ("analysis range display texts helper", "function analysisRangeDisplayTexts("),
            ("analysis range display texts custom label", "range === \"custom\""),
            ("analysis range display texts fallback label", 'ranges.find((item) => item.id === range)?.label ?? "本月"'),
            ("analysis range display texts custom status", "customRangeStatus: analysisCustomRangeStatusCopy(range, customStart, customEnd)"),
            ("analysis custom invalid format status", "自訂日期格式無效；目前改用本月資料。"),
            ("analysis custom invalid order status", "開始日期晚於結束日期；目前改用本月資料。"),
            ("analysis custom valid full-day status", "自訂日期區間已套用，結束日期包含當天完整紀錄。"),
            ("detailed report note helper", "function detailedReportNoteDisplayItems(queryLimit: number)"),
            ("detailed report note bounded item helper", "return boundDisplayText(value, maxDisplayDetailTextLength);"),
            ("detailed report diagnosis boundary copy", "本報告只做紀錄摘要，不提供診斷或治療建議。"),
            ("detailed report backend fallback copy", "backend 報表載入成功時使用 `/reports/basic`，否則使用本機已載入紀錄。"),
            ("detailed report query limit copy", "報表查詢限制 ${boundedLimit} 筆，避免 mobile 與 backend 一次載入過多資料。"),
            ("detailed report boundary rows helper", "function detailedReportBoundaryDisplayRows(reportSourceLabel: string, queryLimit: number)"),
            ("detailed report boundary source row", "資料來源"),
            ("detailed report boundary query cap row", "最多 ${boundedLimit} 筆"),
            ("detailed report boundary no medical advice row", "醫療建議"),
            ("analysis custom apply status", "已套用自訂日期區間並同步 bounded report；不呼叫 AI 或 LLM。"),
        ):
            _assert_contains(label, analysis_copy_content, marker)
        _assert_not_contains(
            "analysis stale independent glucose records memo",
            content,
            "const glucoseRecords = useMemo(",
        )
        _assert_contains(
            "analysis point toggle handler",
            content,
            "function toggleAnalysisPoint(index: number)",
        )
        _assert_contains(
            "analysis chart point press handler",
            content,
            "function pressAnalysisChartPoint(index: number)",
        )
        _assert_contains(
            "analysis manual entry binding",
            content,
            "onPress={openAnalysisManualRecord}",
        )
        _assert_contains(
            "analysis return today binding",
            content,
            "onPress={returnFromAnalysisToToday}",
        )
        _assert_contains(
            "analysis detailed report binding",
            content,
            "onPress={openAnalysisDetailedReport}",
        )
        _assert_contains(
            "detailed report return analysis binding",
            content,
            "onPress={returnFromDetailedReportToAnalysis}",
        )
        for label, marker in (
            ("analysis manual accessibility label", 'analysisManualAccessibility: boundDisplayText("從分析頁改用手動新增，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("analysis today accessibility label", 'analysisReturnTodayAccessibility: boundDisplayText("從分析頁回今日紀錄，不查詢 backend", maxDisplayDetailTextLength)'),
            ("analysis detailed report accessibility label", 'analysisDetailedReportAccessibility: boundDisplayText("查看詳細報告，只在符合條件時查詢 bounded report", maxDisplayDetailTextLength)'),
            ("analysis custom apply accessibility label", 'analysisApplyCustomRangeAccessibility: boundDisplayText("套用分析自訂日期區間並同步 bounded report，不呼叫 AI", maxDisplayDetailTextLength)'),
            ("report return analysis accessibility label", 'reportReturnAnalysisAccessibility: boundDisplayText("返回基本分析，不重新查詢報告", maxDisplayDetailTextLength)'),
            ("report manual accessibility label", 'reportManualAccessibility: boundDisplayText("從詳細報告改用手動新增，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("report today accessibility label", 'reportReturnTodayAccessibility: boundDisplayText("從詳細報告回今日紀錄，不重新查詢 backend", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, first_version_flow_copy_content, marker)
        for label, marker in (
            ("analysis manual accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisManualAccessibility}"),
            ("analysis today accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisReturnTodayAccessibility}"),
            ("analysis detailed report accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisDetailedReportAccessibility}"),
            ("analysis detailed report disabled state", "accessibilityState={{ disabled: isReportLoading }}"),
            ("analysis custom apply accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisApplyCustomRangeAccessibility}"),
            ("analysis custom apply disabled state", "accessibilityState={{ disabled: isReportLoading }}"),
            ("analysis custom apply binding", "onPress={applyAnalysisCustomRange}"),
            ("report return analysis accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportReturnAnalysisAccessibility}"),
            ("report manual accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportManualAccessibility}"),
            ("report today accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportReturnTodayAccessibility}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "manual record type binding",
            content,
            "onTypePress={pressManualRecordTypeOption}",
        )
        _assert_contains(
            "generic option accessibility item",
            shared_display_items_content,
            "accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)",
        )
        _assert_contains(
            "manual record type accessibility item",
            shared_display_items_content,
            "accessibilityLabel: boundDisplayText(`選擇${label}紀錄類型，不呼叫 AI 或 parser`, maxDisplayDetailTextLength)",
        )
        for label, marker in (
            ("manual type chip accessibility binding", "accessibilityLabel={type.accessibilityLabel}"),
            ("shared option chip accessibility binding", "accessibilityLabel={editOptionAccessibilityLabel(option)}"),
            ("store category accessibility binding", "accessibilityLabel={storeCategoryOptionAccessibilityLabel(category)}"),
            ("analysis range accessibility binding", "accessibilityLabel={analysisRangeOptionAccessibilityLabel(item)}"),
            ("manual type chip button role", 'accessibilityRole="button"'),
            ("manual type chip selected state", "accessibilityState={{ selected: selectedValue === type.value }}"),
            ("history calendar selected state", "accessibilityState={{ selected: item.isSelected }}"),
            ("history detail selected state", "accessibilityState={{ selected: isSelected }}"),
            ("analysis range selected state", "accessibilityState={{ selected: analysisRangeOptionSelected(item, analysisRange) }}"),
            ("analysis custom date conditional render", '{analysisRange === "custom" ? ('),
            ("analysis start date accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.analysisStartDateInputAccessibility}"),
            ("analysis end date accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.analysisEndDateInputAccessibility}"),
            ("analysis start date input binding", "onChangeText={updateAnalysisCustomStartInput}"),
            ("analysis end date input binding", "onChangeText={updateAnalysisCustomEndInput}"),
            ("analysis custom range status render", "{analysisCustomRangeStatusDisplayText}"),
            ("analysis custom apply label render", "{coreFlowDisplayLabels.analysisApplyCustomRange}"),
            ("manual glucose unit selected state", "accessibilityState={{ selected: glucoseUnit === option.value }}"),
            ("manual glucose timing selected state", "accessibilityState={{ selected: glucoseTiming === option.value }}"),
            ("manual meal selected state", "accessibilityState={{ selected: mealType === option.value }}"),
            ("preview glucose unit selected state", "const optionSelected = editOptionIsSelected(option, previewEditFields.glucoseUnit);"),
            ("preview glucose timing selected state", "const optionSelected = editOptionIsSelected(option, previewEditFields.glucoseTiming);"),
            ("preview meal selected state", "const optionSelected = editOptionIsSelected(option, previewEditFields.mealType);"),
            ("record edit glucose unit selected state", "const optionSelected = editOptionIsSelected(option, recordEditFields.glucoseUnit);"),
            ("record edit glucose timing selected state", "const optionSelected = editOptionIsSelected(option, recordEditFields.glucoseTiming);"),
            ("record edit meal selected state", "const optionSelected = editOptionIsSelected(option, recordEditFields.mealType);"),
            ("store category selected state", "accessibilityState={{ selected: storeCategoryOptionSelected(category, storeCategory) }}"),
        ):
            if label.startswith("manual glucose "):
                target_content = manual_record_glucose_fields_content
            elif label.startswith("manual meal "):
                target_content = manual_record_meal_fields_content
            elif label.startswith("manual type chip "):
                target_content = manual_record_type_selector_content
            elif label == "history detail selected state":
                target_content = history_detail_mode_tabs_content
            elif label == "history calendar selected state":
                target_content = history_calendar_month_picker_content
            else:
                target_content = content
            _assert_contains(label, target_content, marker)
        _assert_contains(
            "analysis range accessibility item",
            analysis_screen_data_content,
            "accessibilityLabel: boundDisplayText(`切換分析範圍：${label}，同步 backend bounded report`, maxDisplayDetailTextLength)",
        )
        for label, marker in (
            ("preview edit date input handler", "function updatePreviewEditDateInput(value: string)"),
            ("preview edit time input handler", "function updatePreviewEditTimeInput(value: string)"),
            ("preview edit glucose input binding", "onChangeText={updatePreviewEditGlucoseValue}"),
            ("edit option key helper", "function editOptionKey(option: { value: string })"),
            ("edit option key helper fields", "return option.value;"),
            ("edit option key helper binding", "key={editOptionKey(option)}"),
            ("edit option accessibility helper", "function editOptionAccessibilityLabel(option: { accessibilityLabel: string })"),
            ("edit option accessibility helper fields", "return option.accessibilityLabel;"),
            ("edit option accessibility helper binding", "accessibilityLabel={editOptionAccessibilityLabel(option)}"),
            ("edit option label helper", "function editOptionLabel(option: { label: string })"),
            ("edit option label helper fields", "return option.label;"),
            ("edit option label helper binding", "{editOptionLabel(option)}"),
            ("edit option selected helper", "function editOptionIsSelected(option: { value: string }, selectedValue: string)"),
            ("edit option selected helper fields", "return editOptionKey(option) === selectedValue;"),
            ("edit option selected state binding", "accessibilityState={{ selected: optionSelected }}"),
            ("edit option selected style binding", "optionSelected ? styles.segmentActive : null"),
            ("edit option selected text binding", "optionSelected ? styles.segmentTextActive : null"),
            ("record edit field value helper", "function recordEditFieldValue<K extends keyof RecordEditFields>(fields: RecordEditFields, field: K)"),
            ("record edit field value helper fields", "return fields[field];"),
            ("preview edit glucose value helper binding", 'value={recordEditFieldValue(previewEditFields, "glucoseValue")}'),
            ("preview edit food items helper binding", 'value={recordEditFieldValue(previewEditFields, "foodItems")}'),
            ("preview edit fallback json helper binding", 'value={recordEditFieldValue(previewEditFields, "fallbackJson")}'),
            ("record edit glucose value helper binding", 'value={recordEditFieldValue(recordEditFields, "glucoseValue")}'),
            ("record edit food items helper binding", 'value={recordEditFieldValue(recordEditFields, "foodItems")}'),
            ("record edit fallback json helper binding", 'value={recordEditFieldValue(recordEditFields, "fallbackJson")}'),
            ("preview edit option target helper", "function previewEditOptionTarget(option: { value: string })"),
            ("preview edit option target helper fields", "return editOptionKey(option);"),
            ("preview edit unit option press handler", "function pressPreviewEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("preview edit unit option target helper binding", "selectPreviewEditGlucoseUnit(previewEditOptionTarget(option));"),
            ("glucose unit display options helper binding", "const glucoseUnitDisplayOptions = useMemo(() => optionDisplayItems(glucoseUnitOptions), []);"),
            ("glucose timing display options helper binding", "const glucoseTimingDisplayOptions = useMemo(() => valueLabelDisplayItems(glucoseTimingOptions), []);"),
            ("preview edit timing option press handler", "function pressPreviewEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("preview edit timing option target helper binding", "selectPreviewEditGlucoseTiming(previewEditOptionTarget(option));"),
            ("meal type display options helper binding", "const mealTypeDisplayOptions = useMemo(() => valueLabelDisplayItems(mealTypeOptions), []);"),
            ("preview edit meal type option press handler", "function pressPreviewEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("preview edit meal type option target helper binding", "selectPreviewEditMealType(previewEditOptionTarget(option));"),
            ("preview edit unit option press binding", "onPress={() => pressPreviewEditGlucoseUnitOption(option)}"),
            ("preview edit timing option press binding", "onPress={() => pressPreviewEditGlucoseTimingOption(option)}"),
            ("preview edit meal type option press binding", "onPress={() => pressPreviewEditMealTypeOption(option)}"),
            ("preview edit fallback json binding", "onChangeText={updatePreviewEditFallbackJson}"),
            ("manual record date input handler", "function updateManualRecordDateInput(value: string)"),
            ("manual record time input handler", "function updateManualRecordTimeInput(value: string)"),
            ("manual record date time fields binding", "<ManualRecordDateTimeFields\n              dateAccessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}"),
            ("manual record date input binding", "onDateChange={updateManualRecordDateInput}"),
            ("manual record time input binding", "onTimeChange={updateManualRecordTimeInput}"),
            ("manual record type display options helper binding", "const manualRecordTypeDisplayOptions = useMemo(\n    () => manualRecordTypeDisplayItems(manualRecordTypes),"),
            ("menu display items helper binding", "const menuDisplayItems = useMemo(() => menuScreenDisplayItems(menuScreens), []);"),
            ("visual smoke route jump display items helper binding", "const visualSmokeRouteJumpDisplayItems = useMemo(\n    () => buildVisualSmokeRouteJumpDisplayItems(visualSmokeRouteJumps),"),
            ("manual record type selector binding", "<ManualRecordTypeSelector\n              options={manualRecordTypeDisplayOptions}"),
            ("manual record type selector selected binding", "selectedValue={manualRecordType}"),
            ("manual record type selector press binding", "onTypePress={pressManualRecordTypeOption}"),
            ("manual record glucose fields binding", '<ManualRecordGlucoseFields\n                glucoseTiming={recordEditFieldValue(manualRecordFields, "glucoseTiming")}'),
            ("manual record glucose input binding", "onGlucoseValueChange={updateManualRecordGlucoseValue}"),
            ("manual record glucose unit binding", "onUnitPress={pressManualRecordGlucoseUnitOption}"),
            ("manual record glucose timing binding", "onTimingPress={pressManualRecordGlucoseTimingOption}"),
            ("manual record option target helper", "function manualRecordOptionTarget(option: { value: string })"),
            ("manual record option target helper fields", "return option.value;"),
            ("manual record unit option press handler", "function pressManualRecordGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("manual record unit option target helper binding", "selectManualRecordGlucoseUnit(manualRecordOptionTarget(option));"),
            ("manual record timing option press handler", "function pressManualRecordGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("manual record timing option target helper binding", "selectManualRecordGlucoseTiming(manualRecordOptionTarget(option));"),
            ("manual record meal type option press handler", "function pressManualRecordMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("manual record meal type option target helper binding", "selectManualRecordMealType(manualRecordOptionTarget(option));"),
            ("manual record unit option press binding", "onUnitPress={pressManualRecordGlucoseUnitOption}"),
            ("manual record timing option press binding", "onTimingPress={pressManualRecordGlucoseTimingOption}"),
            ("manual record meal fields binding", '<ManualRecordMealFields\n                foodItems={recordEditFieldValue(manualRecordFields, "foodItems")}'),
            ("manual record food items binding", "onFoodItemsChange={updateManualRecordFoodItems}"),
            ("manual record meal type option press binding", "onMealTypePress={pressManualRecordMealTypeOption}"),
            ("manual record exercise fields binding", '<ManualRecordExerciseFields\n                activity={recordEditFieldValue(manualRecordFields, "exerciseActivity")}'),
            ("manual record exercise activity binding", "onActivityChange={updateManualRecordExerciseActivity}"),
            ("manual record exercise minutes binding", "onMinutesChange={updateManualRecordExerciseMinutes}"),
            ("manual record medication fields binding", '<ManualRecordMedicationFields\n                dose={recordEditFieldValue(manualRecordFields, "medicationDose")}'),
            ("manual record medication dose binding", "onDoseChange={updateManualRecordMedicationDose}"),
            ("manual record medication name binding", "onNameChange={updateManualRecordMedicationName}"),
            ("manual record note fields binding", '<ManualRecordNoteFields\n                kind={recordEditFieldValue(manualRecordFields, "noteKind")}'),
            ("manual record note kind binding", "onKindChange={updateManualRecordNoteKind}"),
            ("manual record note tags binding", "onTagsChange={updateManualRecordNoteTags}"),
            ("manual record header intro binding", "<ManualRecordHeaderIntro\n              backAccessibilityLabel={coreFlowDisplayLabels.manualReturnAccessibility}"),
            ("manual record header intro title binding", 'title="手動新增紀錄"'),
            ("manual record header intro press binding", "onBackPress={returnFromManualRecord}"),
            ("manual record create preview action binding", "<ManualRecordCreatePreviewAction\n              accessibilityLabel={coreFlowDisplayLabels.manualCreatePreviewAccessibility}"),
            ("manual record create preview action label binding", "label={coreFlowDisplayLabels.createRecord}"),
            ("manual record create preview action press binding", "onPress={enterManualRecordConfirm}"),
            ("manual record confirm preview block binding", "<ManualRecordConfirmPreviewBlock\n              badgeLabel={auxiliaryDisplayLabels.preSaveConfirmBadge}"),
            ("manual confirm preview icon helper", "function manualConfirmPreviewIcon(item: ReturnType<typeof manualRecordConfirmDisplayItem>)"),
            ("manual confirm preview icon helper fields", "return item.icon;"),
            ("manual record confirm preview icon binding", "icon={manualConfirmPreviewIcon(manualRecordConfirmDisplay)}"),
            ("manual record confirm display helper binding", "const manualRecordConfirmDisplayTextsForState = manualRecordConfirmDisplayTexts(isBusy);"),
            ("manual record confirm intro display binding", "const manualRecordConfirmIntroDisplayText = manualRecordConfirmDisplayTextsForState.intro;"),
            ("manual record confirm submit display binding", "const manualRecordConfirmSubmitDisplayLabel = manualRecordConfirmDisplayTextsForState.submit;"),
            ("manual record confirm preview intro binding", "introText={manualRecordConfirmIntroDisplayText}"),
            ("manual confirm preview payload helper", "function manualConfirmPreviewPayloadSummary(item: ReturnType<typeof manualRecordConfirmDisplayItem>)"),
            ("manual confirm preview payload helper fields", "return item.payloadSummary;"),
            ("manual record confirm preview payload binding", "payloadSummary={manualConfirmPreviewPayloadSummary(manualRecordConfirmDisplay)}"),
            ("manual confirm preview source helper", "function manualConfirmPreviewSourceLine(item: ReturnType<typeof manualRecordConfirmDisplayItem>)"),
            ("manual confirm preview source helper fields", "return item.sourceLine;"),
            ("manual record confirm preview source binding", "sourceLine={manualConfirmPreviewSourceLine(manualRecordConfirmDisplay)}"),
            ("manual confirm preview type helper", "function manualConfirmPreviewTypeLabel(item: ReturnType<typeof manualRecordConfirmDisplayItem>)"),
            ("manual confirm preview type helper fields", "return item.typeLabel;"),
            ("manual record confirm preview type binding", "typeLabel={manualConfirmPreviewTypeLabel(manualRecordConfirmDisplay)}"),
            ("manual record confirm checklist helper binding", "const manualSubmitChecklistItems = manualSubmitChecklistDisplayItems();"),
            ("manual record confirm footer actions binding", "<ManualRecordConfirmFooterActions\n              checklistItems={manualSubmitChecklistItems}"),
            ("record edit date input handler", "function updateRecordEditDateInput(value: string)"),
            ("record edit time input handler", "function updateRecordEditTimeInput(value: string)"),
            ("record edit header fields binding", "<RecordEditHeaderFields\n              dateAccessibilityLabel={auxiliaryDisplayLabels.dateInputAccessibility}"),
            ("record edit date input binding", "onDateChange={updateRecordEditDateInput}"),
            ("record edit time input binding", "onTimeChange={updateRecordEditTimeInput}"),
            ("record edit checklist helper binding", "const recordUpdateChecklistItems = recordUpdateChecklistDisplayItems();"),
            ("record edit footer actions binding", "<RecordEditFooterActions\n              cancelAccessibilityLabel={coreFlowDisplayLabels.recordEditReturnAccessibility}"),
            ("record edit glucose input binding", "onChangeText={updateRecordEditGlucoseValue}"),
            ("record edit option target helper", "function recordEditOptionTarget(option: { value: string })"),
            ("record edit option target helper fields", "return editOptionKey(option);"),
            ("record edit unit option press handler", "function pressRecordEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("record edit unit option target helper binding", "selectRecordEditGlucoseUnit(recordEditOptionTarget(option));"),
            ("record edit timing option press handler", "function pressRecordEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("record edit timing option target helper binding", "selectRecordEditGlucoseTiming(recordEditOptionTarget(option));"),
            ("record edit meal type option press handler", "function pressRecordEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("record edit meal type option target helper binding", "selectRecordEditMealType(recordEditOptionTarget(option));"),
            ("record edit unit option press binding", "onPress={() => pressRecordEditGlucoseUnitOption(option)}"),
            ("record edit timing option press binding", "onPress={() => pressRecordEditGlucoseTimingOption(option)}"),
            ("record edit meal type option press binding", "onPress={() => pressRecordEditMealTypeOption(option)}"),
            ("record edit fallback json binding", "onChangeText={updateRecordEditFallbackJson}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("manual record direct type binding", "onPress={() => onTypePress(type)}"),
            ("manual record direct type handler value binding", "selectManualRecordType(type.value);"),
            ("preview edit direct unit selection binding", "onPress={() => selectPreviewEditGlucoseUnit(option.value)}"),
            ("preview edit direct timing selection binding", "onPress={() => selectPreviewEditGlucoseTiming(option.value)}"),
            ("preview edit direct meal type selection binding", "onPress={() => selectPreviewEditMealType(option.value)}"),
            ("preview edit direct unit handler value binding", "selectPreviewEditGlucoseUnit(option.value);"),
            ("preview edit direct timing handler value binding", "selectPreviewEditGlucoseTiming(option.value);"),
            ("preview edit direct meal handler value binding", "selectPreviewEditMealType(option.value);"),
            ("preview edit date inline setter", "onChangeText={(value) => setPreviewEditDate("),
            ("preview edit time inline setter", "onChangeText={(value) => setPreviewEditTime("),
            ("preview edit direct field updater", 'onChangeText={(value) => updatePreviewEditField("'),
            ("preview edit direct option updater", 'onPress={() => updatePreviewEditField("'),
            ("manual record direct unit selection binding", "onPress={() => onUnitPress(option)}"),
            ("manual record direct timing selection binding", "onPress={() => onTimingPress(option)}"),
            ("manual record direct meal type selection binding", "onPress={() => selectManualRecordMealType(option.value)}"),
            ("manual record direct unit handler value binding", "selectManualRecordGlucoseUnit(option.value);"),
            ("manual record direct timing handler value binding", "selectManualRecordGlucoseTiming(option.value);"),
            ("manual record direct meal handler value binding", "selectManualRecordMealType(option.value);"),
            ("manual record date inline setter", "onChangeText={(value) => setManualRecordDate("),
            ("manual record time inline setter", "onChangeText={(value) => setManualRecordTime("),
            ("manual record direct field updater", 'onChangeText={(value) => updateManualRecordField("'),
            ("manual record direct option updater", 'onPress={() => updateManualRecordField("'),
            ("record edit direct unit selection binding", "onPress={() => selectRecordEditGlucoseUnit(option.value)}"),
            ("record edit direct timing selection binding", "onPress={() => selectRecordEditGlucoseTiming(option.value)}"),
            ("record edit direct meal type selection binding", "onPress={() => selectRecordEditMealType(option.value)}"),
            ("record edit direct unit handler value binding", "selectRecordEditGlucoseUnit(option.value);"),
            ("record edit direct timing handler value binding", "selectRecordEditGlucoseTiming(option.value);"),
            ("record edit direct meal handler value binding", "selectRecordEditMealType(option.value);"),
            ("record edit date inline setter", "onChangeText={(value) => setRecordEditDate("),
            ("record edit time inline setter", "onChangeText={(value) => setRecordEditTime("),
            ("record edit direct field updater", 'onChangeText={(value) => updateRecordEditField("'),
            ("record edit direct option updater", 'onPress={() => updateRecordEditField("'),
            ("edit option direct key binding", "key={option.value}"),
            ("edit option direct accessibility binding", "accessibilityLabel={option.accessibilityLabel}"),
            ("preview edit direct glucose unit selected field", "previewEditFields.glucoseUnit === option.value"),
            ("preview edit direct glucose timing selected field", "previewEditFields.glucoseTiming === option.value"),
            ("preview edit direct meal type selected field", "previewEditFields.mealType === option.value"),
            ("record edit direct glucose unit selected field", "recordEditFields.glucoseUnit === option.value"),
            ("record edit direct glucose timing selected field", "recordEditFields.glucoseTiming === option.value"),
            ("record edit direct meal type selected field", "recordEditFields.mealType === option.value"),
            ("edit option direct label render", "{option.label}"),
            ("preview edit direct glucose value binding", "value={previewEditFields.glucoseValue}"),
            ("preview edit direct food items binding", "value={previewEditFields.foodItems}"),
            ("preview edit direct fallback json binding", "value={previewEditFields.fallbackJson}"),
            ("record edit direct glucose value binding", "value={recordEditFields.glucoseValue}"),
            ("record edit direct food items binding", "value={recordEditFields.foodItems}"),
            ("record edit direct fallback json binding", "value={recordEditFields.fallbackJson}"),
            ("manual record direct glucose value prop", "glucoseValue={manualRecordFields.glucoseValue}"),
            ("manual record direct food items prop", "foodItems={manualRecordFields.foodItems}"),
            ("manual record direct exercise activity prop", "activity={manualRecordFields.exerciseActivity}"),
            ("manual record direct medication dose prop", "dose={manualRecordFields.medicationDose}"),
            ("manual record direct note kind prop", "kind={manualRecordFields.noteKind}"),
        ):
            _assert_not_contains(label, content, marker)
        _assert_contains(
            "analysis range binding",
            content,
            "onPress={() => pressAnalysisRangeOption(item)}",
        )
        _assert_contains(
            "analysis metric rows",
            content,
            "const analysisMetricRows = buildAnalysisMetricRows(analysisMetricInput);",
        )
        _assert_contains(
            "analysis metric input helper binding",
            content,
            "const analysisMetricInput = buildAnalysisMetricInput({",
        )
        _assert_contains(
            "analysis range summary metric input count",
            content,
            "analysisMetricInput.glucoseCount",
        )
        for label, marker in (
            ("analysis metric row key helper", "function analysisMetricRowKey(row: (typeof analysisMetricRows)[number])"),
            ("analysis metric row key helper fields", "return row.label;"),
            ("analysis metric row key helper binding", "key={analysisMetricRowKey(row)}"),
            ("analysis metric row label helper", "function analysisMetricRowLabel(row: (typeof analysisMetricRows)[number])"),
            ("analysis metric row label helper fields", "return row.label;"),
            ("analysis metric row label helper binding", "label={analysisMetricRowLabel(row)}"),
            ("analysis metric row value helper", "function analysisMetricRowValue(row: (typeof analysisMetricRows)[number])"),
            ("analysis metric row value helper fields", "return row.value;"),
            ("analysis metric row value helper binding", "value={analysisMetricRowValue(row)}"),
            ("analysis chart point key helper", "function analysisChartPointKey(point: (typeof analysisChartPoints)[number])"),
            ("analysis chart point key helper fields", "return point.id;"),
            ("analysis chart point key binding", "key={analysisChartPointKey(point)}"),
            ("analysis chart point value helper", "function analysisChartPointValue(point: (typeof analysisChartPoints)[number])"),
            ("analysis chart point value helper fields", "return point.value;"),
            ("analysis chart point label helper", "function analysisChartPointLabel(point: (typeof analysisChartPoints)[number])"),
            ("analysis chart point label helper fields", "return point.label;"),
            ("analysis chart point offset helper", "function analysisChartPointOffset("),
            ("analysis chart point offset helper fields", "const normalized = (analysisChartPointValue(point) - minimum) / range;"),
            ("analysis chart point offset binding", "const pointOffset = analysisChartPointOffset(point, chartMinimum, chartRange);"),
            ("analysis chart point selected helper", "function analysisChartPointIsSelected(index: number, selectedIndex: number | null)"),
            ("analysis chart point selected helper fields", "return selectedIndex === index;"),
            ("analysis chart point selected helper binding", "const isSelected = analysisChartPointIsSelected(index, selectedAnalysisPointIndex);"),
            ("analysis chart point accessibility helper", "function analysisChartPointAccessibilityLabel(point: (typeof analysisChartPoints)[number])"),
            ("analysis chart point accessibility helper binding", "const pointAccessibilityLabel = analysisChartPointAccessibilityLabel(point);"),
            ("analysis axis label helper", "function analysisAxisLabel("),
            ("analysis axis label helper binding", "{analysisAxisLabel(point, index, analysisChartPoints.length)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "detailed report metric input helper binding",
            content,
            "const detailedReportMetricInput = buildDetailedReportMetricInput({",
        )
        _assert_contains(
            "detailed report metric rows helper binding",
            content,
            "const detailedReportMetricRows = buildDetailedReportMetricRows(detailedReportMetricInput);",
        )
        for label, marker in (
            ("detailed report metric row key helper", "function detailedReportMetricRowKey(row: (typeof detailedReportMetricRows)[number])"),
            ("detailed report metric row key helper fields", "return row.label;"),
            ("detailed report metric row key helper binding", "key={detailedReportMetricRowKey(row)}"),
            ("detailed report metric row label helper", "function detailedReportMetricRowLabel(row: (typeof detailedReportMetricRows)[number])"),
            ("detailed report metric row label helper fields", "return row.label;"),
            ("detailed report metric row label helper binding", "label={detailedReportMetricRowLabel(row)}"),
            ("detailed report metric row value helper", "function detailedReportMetricRowValue(row: (typeof detailedReportMetricRows)[number])"),
            ("detailed report metric row value helper fields", "return row.value;"),
            ("detailed report metric row value helper binding", "value={detailedReportMetricRowValue(row)}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("detailed report boundary row key helper", "function detailedReportBoundaryRowKey(row: (typeof detailedReportBoundaryRows)[number])"),
            ("detailed report boundary row key helper fields", "return row.label;"),
            ("detailed report boundary row key helper binding", "key={detailedReportBoundaryRowKey(row)}"),
            ("detailed report boundary row label helper", "function detailedReportBoundaryRowLabel(row: (typeof detailedReportBoundaryRows)[number])"),
            ("detailed report boundary row label helper fields", "return row.label;"),
            ("detailed report boundary row label helper binding", "{detailedReportBoundaryRowLabel(row)}"),
            ("detailed report boundary row value helper", "function detailedReportBoundaryRowValue(row: (typeof detailedReportBoundaryRows)[number])"),
            ("detailed report boundary row value helper fields", "return row.value;"),
            ("detailed report boundary row value helper binding", "{detailedReportBoundaryRowValue(row)}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("detailed report local meal count helper binding", 'localMealCount: recordTypeCount(analysisRecords, "meal")'),
            ("detailed report local exercise count helper binding", 'localExerciseCount: recordTypeCount(analysisRecords, "exercise")'),
            ("detailed report local medication count helper binding", 'localMedicationCount: recordTypeCount(analysisRecords, "medication")'),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("analysis basic report bound helper", "function boundBasicReport<T extends BasicReportTransformSource>(value: T): T"),
            ("analysis basic report generated-at bound", "generated_at: boundDisplayText(value.generated_at, 40)"),
            ("analysis basic report latest glucose bound", "latest_value: clampNullableNumber(value.glucose.latest_value, 0, maxMobileGlucoseValue)"),
            ("analysis basic report lifestyle count bound", "note_count: clampNumber(value.lifestyle.note_count, 0, maxMobileCountValue)"),
            ("analysis normalized glucose timing helper", "function normalizedGlucoseTiming(value: unknown)"),
            ("analysis before timing helper", "function isBeforeMealGlucoseTiming(value: unknown)"),
            ("analysis after timing helper", "function isAfterMealGlucoseTiming(value: unknown)"),
            ("analysis date range records helper", "function analysisRecordsInDateRange(records: RecordItem[], bounds: AnalysisDateBounds)"),
            ("analysis date range start bound", "occurredAt >= bounds.start"),
            ("analysis date range end bound", "occurredAt <= bounds.end"),
            ("analysis before timing helper usage", "isBeforeMealGlucoseTiming(record.payload_json.meal_timing)"),
            ("analysis after timing helper usage", "isAfterMealGlucoseTiming(record.payload_json.meal_timing)"),
            ("analysis record type count helper", "function recordTypeCount(records: RecordItem[], recordType: string)"),
            ("analysis record type count implementation", "records.filter((record) => record.record_type === recordType).length"),
            ("analysis record type counts helper", "function recordTypeCounts(records: RecordItem[])"),
            ("analysis record type counts implementation", "counts.set(record.record_type, (counts.get(record.record_type) ?? 0) + 1)"),
            ("year review records in year helper", "function recordsInYear(records: RecordItem[], targetYear: number)"),
            ("year review records in year validity guard", "!Number.isNaN(occurredAt.getTime()) && occurredAt.getFullYear() === targetYear"),
            ("year review record day count helper", "function recordDayCount(records: RecordItem[])"),
            ("year review record day count implementation", "new Set(records.map((record) => localDateKey(record.occurred_at)).filter(Boolean)).size"),
            ("year review record stats helper", "function yearlyReviewRecordStats(records: RecordItem[], targetYear: number)"),
            ("year review record stats year filter", "const yearlyRecords = recordsInYear(records, targetYear);"),
            ("year review record stats type counts", "const yearlyTypeCounts = recordTypeCounts(yearlyRecords);"),
            ("year review record stats most recorded type", "Array.from(yearlyTypeCounts.entries()).sort((first, second) => second[1] - first[1])[0] ?? null"),
            ("year review record stats longest streak", "longestStreak: longestRecordStreakDays(yearlyRecords)"),
            ("year review record stats glucose average", "glucoseAverage: averageNumber(yearlyGlucoseValues)"),
            ("analysis chart point builder", "function analysisChartPoints(records: AnalysisGlucoseRecord[]): AnalysisChartPoint[]"),
            ("analysis chart bounded sample", "return records.slice(-12).map(({ record, value }) => ({"),
            ("analysis chart range helper", "function analysisChartRange(points: AnalysisChartPoint[])"),
            ("record current streak helper", "export function currentRecordStreakDays(records: RecordItem[])"),
            ("record typed streak helper", "export function currentRecordTypeStreakDays(records: RecordItem[], recordType: string)"),
            ("record unique days helper", "export function uniqueRecordDaysInLast(records: RecordItem[], days: number, predicate: (record: RecordItem) => boolean)"),
            ("record longest streak helper", "export function longestRecordStreakDays(records: RecordItem[])"),
            ("record streak today bound", "for (let offset = 0; offset < 366; offset += 1)"),
            ("record longest streak day gap", "currentTime - previousTime === 86_400_000"),
        ):
            _assert_contains(label, analysis_data_content, marker)
        for label, marker in (
            ("analysis metric input helper", "function analysisMetricInput(value: AnalysisMetricSourceInput): AnalysisMetricInput"),
            ("analysis metric backend average source", "average: value.report?.glucose.average ?? value.localAverage"),
            ("analysis metric backend highest source", "highest: value.report?.glucose.maximum ?? value.localHighest"),
            ("analysis metric backend lowest source", "lowest: value.report?.glucose.minimum ?? value.localLowest"),
            ("analysis metric backend count source", "glucoseCount: value.report?.glucose.count ?? value.localGlucoseCount"),
            ("analysis metric backend before meal source", "beforeMealCount: value.report?.glucose.before_meal_count ?? value.localBeforeMealCount"),
            ("analysis metric backend after meal source", "afterMealCount: value.report?.glucose.after_meal_count ?? value.localAfterMealCount"),
            ("detailed report metric input helper", "function detailedReportMetricInput(value: DetailedReportMetricSourceInput): DetailedReportMetricInput"),
            ("detailed report backend average source", "average: value.report?.glucose.average ?? value.localAverage"),
            ("detailed report backend minimum source", "minimum: value.report?.glucose.minimum ?? value.localMinimum"),
            ("detailed report backend maximum source", "maximum: value.report?.glucose.maximum ?? value.localMaximum"),
            ("detailed report backend before meal source", "beforeMealCount: value.report?.glucose.before_meal_count ?? value.localBeforeMealCount"),
            ("detailed report backend after meal source", "afterMealCount: value.report?.glucose.after_meal_count ?? value.localAfterMealCount"),
            ("detailed report backend meal source", "mealCount: value.report?.meals.count ?? value.localMealCount"),
            ("detailed report backend exercise source", "exerciseCount: value.report?.lifestyle.exercise_count ?? value.localExerciseCount"),
            ("detailed report backend medication source", "medicationCount: value.report?.lifestyle.medication_count ?? value.localMedicationCount"),
            ("analysis highest metric", '["最高血糖", highest === null ? "尚無" : String(highest)]'),
            ("analysis lowest metric", '["最低血糖", lowest === null ? "尚無" : String(lowest)]'),
            ("analysis average metric", '["平均血糖", average === null ? "尚無" : String(average)]'),
            ("analysis glucose record count metric", '["血糖測量總次數", String(glucoseCount)]'),
            ("analysis before meal count metric", '["飯前血糖次數", String(beforeMealCount)]'),
            ("analysis after meal count metric", '["飯後血糖次數", String(afterMealCount)]'),
            ("detailed report before meal metric", '["飯前血糖", `${beforeMealCount} 次`]'),
            ("detailed report after meal metric", '["飯後血糖", `${afterMealCount} 次`]'),
        ):
            _assert_contains(label, analysis_metric_content, marker)
        _assert_contains(
            "analysis metric rows render",
            content,
            "analysisMetricRows.map((row) =>",
        )
        _assert_contains(
            "analysis point toggle binding",
            content,
            "onPress={() => pressAnalysisChartPoint(index)}",
        )
        _assert_contains(
            "analysis chart point accessibility label",
            content,
            "`查看分析圖表點：${analysisChartPointLabel(point)}，血糖 ${analysisChartPointValue(point)}`",
        )
        _assert_contains(
            "analysis chart point selected state",
            content,
            "accessibilityState={{ selected: isSelected }}",
        )
        _assert_contains(
            "analysis chart point selected visual stem",
            content,
            "isSelected ? styles.lineChartStemSelected : null",
        )
        _assert_contains(
            "analysis chart point selected visual point",
            content,
            "isSelected ? styles.lineChartPointSelected : null",
        )
        _assert_not_contains(
            "analysis direct range selection binding",
            content,
            "onPress={() => selectAnalysisRange(item.value)}",
        )
        _assert_not_contains(
            "analysis direct point toggle binding",
            content,
            "onPress={() => toggleAnalysisPoint(index)}",
        )
        analysis_chart_point_render_block = _match_block(
            content,
            r"analysisChartPoints\.map\(\(point, index\) => \{([\s\S]*?pressAnalysisChartPoint\(index\)[\s\S]*?</Pressable>)",
            "analysis chart point render block",
        )
        for label, marker in (
            ("direct analysis chart point normalized binding", "const normalized = (point.value - chartMinimum) / chartRange;"),
            ("direct analysis chart point offset binding", "Math.round((1 - normalized) * 104)"),
            ("direct analysis chart point selected binding", "selectedAnalysisPointIndex === index"),
            ("direct analysis chart point key binding", "key={point.id}"),
            ("direct analysis chart point label binding", "point.label"),
            ("direct analysis chart point value binding", "point.value"),
        ):
            _assert_not_contains(label, analysis_chart_point_render_block, marker)
        analysis_axis_render_block = _match_block(
            content,
            r"analysisChartPoints\.map\(\(point, index\) => \(([\s\S]*?analysisAxisLabel\(point, index, analysisChartPoints\.length\)[\s\S]*?</Text>)",
            "analysis chart axis render block",
        )
        for label, marker in (
            ("direct analysis axis key binding", "key={point.id}"),
            ("direct analysis axis label binding", "point.label"),
            ("direct analysis axis visibility binding", "index === 0 || index === analysisChartPoints.length - 1 || index % 3 === 0"),
        ):
            _assert_not_contains(label, analysis_axis_render_block, marker)
        _assert_contains(
            "detailed report manual entry binding",
            content,
            "onPress={openDetailedReportManualRecord}",
        )
        _assert_contains(
            "detailed report return today binding",
            content,
            "onPress={returnFromDetailedReportToToday}",
        )
        rejected_box_block = _style_block(content, "rejectedBox")
        _assert_not_contains(
            "AI Review rejected open stack background",
            rejected_box_block,
            "backgroundColor:",
        )
        _assert_not_contains(
            "AI Review rejected open stack border",
            rejected_box_block,
            "borderWidth:",
        )
        rejected_event_block = _style_block(content, "rejectedEventCard")
        _assert_contains(
            "AI Review rejected event warning row",
            rejected_event_block,
            'backgroundColor: "#FFF8ED"',
        )
        detail_row_block = _style_block(content, "detailRow")
        _assert_contains(
            "detail row open info background",
            detail_row_block,
            'backgroundColor: "#F7FCFA"',
        )
        _assert_contains(
            "detail row open info border",
            detail_row_block,
            'borderColor: "#D6EEE4"',
        )
        _assert_contains(
            "detail row wrapping",
            detail_row_block,
            'flexWrap: "wrap"',
        )
        settings_list_block = _style_block(content, "settingsList")
        _assert_not_contains(
            "settings list open stack background",
            settings_list_block,
            "backgroundColor:",
        )
        _assert_not_contains(
            "settings list open stack border",
            settings_list_block,
            "borderWidth:",
        )
        settings_row_block = _style_block(content, "settingsRow")
        _assert_contains(
            "settings row single-layer background",
            settings_row_block,
            'backgroundColor: "#FFFFFF"',
        )
        _assert_contains(
            "settings row wrapping",
            settings_row_block,
            'flexWrap: "wrap"',
        )
        _assert_contains(
            "settings account security open handler",
            content,
            "function openAccountSecurityFromSettings()",
        )
        _assert_contains(
            "settings account security status helper binding",
            content,
            'openScreenWithStatus("accountSecurity", settingsAccountSecurityOpenStatusMessage());',
        )
        _assert_contains(
            "settings subpage return handler",
            content,
            "function returnFromSettingsSubpage()",
        )
        _assert_contains(
            "settings account security open binding",
            content,
            "onPress={openAccountSecurityFromSettings}",
        )
        _assert_contains(
            "settings account security accessibility label",
            content,
            "const accountSecurityCardAccessibilityLabel = accountSecurityAuthModeDisplay.cardAccessibilityLabel;",
        )
        for label, marker in (
            ("settings account security auth mode display helper binding", "const accountSecurityAuthModeDisplay = accountSecurityAuthModeDisplayTexts({"),
            ("settings account security auth mode label binding", "const authModeDisplayLabel = accountSecurityAuthModeDisplay.label;"),
            ("settings account security auth mode copy binding", "const authModeDisplayCopy = accountSecurityAuthModeDisplay.copy;"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "settings account security accessibility binding",
            content,
            "accessibilityLabel={accountSecurityCardAccessibilityLabel}",
        )
        _assert_contains(
            "settings account security button role",
            content,
            'accessibilityRole="button"\n              style={styles.accountCard}',
        )
        _assert_contains(
            "settings subpage return binding",
            content,
            "onPress={returnFromSettingsSubpage}",
        )
        _assert_contains(
            "settings row destination handler",
            content,
            "function openSettingsRow(row: SettingsRow)",
        )
        _assert_contains(
            "settings row destination helper binding",
            content,
            "const subpageTarget = settingsRowSubpageTarget(row);",
        )
        _assert_contains(
            "settings row destination helper screen set",
            content,
            "openScreen(subpageTarget);",
        )
        _assert_contains(
            "settings row press wrapper",
            content,
            "function pressSettingsRow(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row key helper",
            content,
            "function settingsDisplayRowKey(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row key helper fields",
            content,
            "return row.id;",
        )
        _assert_contains(
            "settings row key helper binding",
            content,
            "key={settingsDisplayRowKey(row)}",
        )
        _assert_contains(
            "settings row accessibility helper",
            content,
            "function settingsDisplayRowAccessibilityLabel(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row accessibility helper fields",
            content,
            "return row.accessibilityLabel;",
        )
        _assert_contains(
            "settings row accessibility helper binding",
            content,
            "accessibilityLabel={settingsDisplayRowAccessibilityLabel(row)}",
        )
        _assert_contains(
            "settings row icon helper",
            content,
            "function settingsDisplayRowIcon(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row icon helper fields",
            content,
            "return row.icon;",
        )
        _assert_contains(
            "settings row icon helper binding",
            content,
            "{settingsDisplayRowIcon(row)}",
        )
        _assert_contains(
            "settings row label helper",
            content,
            "function settingsDisplayRowLabel(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row label helper fields",
            content,
            "return row.label;",
        )
        _assert_contains(
            "settings row label helper binding",
            content,
            "{settingsDisplayRowLabel(row)}",
        )
        _assert_contains(
            "settings row helper text helper",
            content,
            "function settingsDisplayRowHelperText(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row helper text helper quota branch",
            content,
            'return row.id === "quota" ? settingsQuotaHelperDisplayText : row.helper;',
        )
        _assert_contains(
            "settings row helper text helper binding",
            content,
            "{settingsDisplayRowHelperText(row)}",
        )
        for label, marker in (
            ("preview status row key helper", "function previewStatusRowKey(row: { title: string })"),
            ("preview status row key helper fields", "return row.title;"),
            ("preview status row accessibility helper", "function previewStatusRowAccessibilityLabel(row: { accessibilityLabel: string })"),
            ("preview status row accessibility helper fields", "return row.accessibilityLabel;"),
            ("preview status row icon helper", "function previewStatusRowIcon(row: { icon: string })"),
            ("preview status row icon helper fields", "return row.icon;"),
            ("preview status row title helper", "function previewStatusRowTitle(row: { title: string })"),
            ("preview status row copy helper", "function previewStatusRowCopy(row: { copy: string })"),
            ("preview status row copy helper fields", "return row.copy;"),
            ("preview status row status helper", "function previewStatusRowStatusLabel(row: { statusLabel: string })"),
            ("preview status row status helper fields", "return row.statusLabel;"),
            ("preview keyed row key helper", "function previewKeyedRowKey(row: { key: string })"),
            ("preview keyed row key helper fields", "return row.key;"),
            ("preview last used row helper", "function previewLastUsedRowText(row: { lastUsed: string })"),
            ("preview last used row helper fields", "return row.lastUsed;"),
            ("preview timed row time helper", "function previewTimedRowTime(row: { time: string })"),
            ("preview timed row time helper fields", "return row.time;"),
            ("subscription management preview status row key binding", "subscriptionManagementDisplayRows.map((row) => (\n                <View key={previewStatusRowKey(row)}"),
            ("privacy control preview status row key binding", "privacyControlDisplayRows.map((row) => (\n                <View key={previewStatusRowKey(row)}"),
            ("production auth readiness preview status row key binding", "productionAuthReadinessDisplayRows.map((item) => (\n                <View key={previewStatusRowKey(item)}"),
            ("session management preview status row key binding", "sessionManagementDisplayItems.map((item) => (\n                <Pressable\n                  key={previewStatusRowKey(item)}"),
            ("auth provider preview status row key binding", "authProviderDisplayItems.map((item) => (\n                <Pressable\n                  key={previewStatusRowKey(item)}"),
            ("reminder preview status row key binding", "reminderPreviewDisplayItems.map((item) => (\n                <View key={previewStatusRowKey(item)}"),
            ("auth session display row key binding", "authSessionDisplayItems.map((item) => (\n                  <View key={previewKeyedRowKey(item)}"),
            ("auth provider preview accessibility binding", "accessibilityLabel={previewStatusRowAccessibilityLabel(item)}"),
            ("session management preview accessibility binding", "accessibilityLabel={previewStatusRowAccessibilityLabel(item)}"),
            ("preview status row icon binding", "{previewStatusRowIcon(row)}"),
            ("preview status row title binding", "{previewStatusRowTitle(row)}"),
            ("preview status row copy binding", "{previewStatusRowCopy(row)}"),
            ("preview status row status binding", "{previewStatusRowStatusLabel(row)}"),
            ("auth provider preview status row icon binding", "{previewStatusRowIcon(item)}"),
            ("auth provider preview title helper", "function authProviderPreviewTitleLabel(item: ReturnType<typeof authProviderPreviewDisplayItem>)"),
            ("auth provider preview title helper fields", "return `${previewStatusRowTitle(item)} 登入`;"),
            ("auth provider preview title helper binding", "{authProviderPreviewTitleLabel(item)}"),
            ("auth provider preview status row copy binding", "{previewStatusRowCopy(item)}"),
            ("auth provider preview status row status binding", "{previewStatusRowStatusLabel(item)}"),
            ("production auth readiness preview status row title binding", "{previewStatusRowTitle(item)}"),
            ("production auth readiness preview status row copy binding", "{previewStatusRowCopy(item)}"),
            ("production auth readiness preview status row status binding", "{previewStatusRowStatusLabel(item)}"),
            ("session management preview status row title binding", "{previewStatusRowTitle(item)}"),
            ("session management preview status row copy binding", "{previewStatusRowCopy(item)}"),
            ("session management preview status row status binding", "{previewStatusRowStatusLabel(item)}"),
            ("auth session display last used row binding", "{previewLastUsedRowText(item)}"),
            ("reminder preview status row time binding", "{previewTimedRowTime(item)}"),
            ("settings checklist item key helper", "function settingsChecklistItemKey(item: string)"),
            ("settings checklist item key helper fields", "return item;"),
            ("settings checklist item key binding", "key={settingsChecklistItemKey(item)}"),
            ("settings checklist item text helper", "function settingsChecklistItemText(item: string)"),
            ("settings checklist item text helper fields", "return item;"),
            ("settings checklist item text binding", "text={settingsChecklistItemText(item)}"),
            ("subscription checklist item key helper", "function subscriptionChecklistItemKey(item: string)"),
            ("subscription checklist item key helper fields", "return item;"),
            ("subscription checklist item key binding", "key={subscriptionChecklistItemKey(item)}"),
            ("subscription checklist item text helper", "function subscriptionChecklistItemText(item: string)"),
            ("subscription checklist item text helper fields", "return item;"),
            ("subscription checklist item text binding", "text={subscriptionChecklistItemText(item)}"),
            ("future readiness checklist item key helper", "function futureReadinessChecklistItemKey(item: string)"),
            ("future readiness checklist item key helper fields", "return item;"),
            ("future readiness checklist item key binding", "key={futureReadinessChecklistItemKey(item)}"),
            ("future readiness checklist item text helper", "function futureReadinessChecklistItemText(item: string)"),
            ("future readiness checklist item text helper fields", "return item;"),
            ("future readiness checklist item text binding", "text={futureReadinessChecklistItemText(item)}"),
            ("commerce readiness checklist item key helper", "function commerceReadinessChecklistItemKey(item: string)"),
            ("commerce readiness checklist item key helper fields", "return item;"),
            ("commerce readiness checklist item key binding", "key={commerceReadinessChecklistItemKey(item)}"),
            ("commerce readiness checklist item text helper", "function commerceReadinessChecklistItemText(item: string)"),
            ("commerce readiness checklist item text helper fields", "return item;"),
            ("commerce readiness checklist item text binding", "text={commerceReadinessChecklistItemText(item)}"),
            ("outcome checklist item key helper", "function outcomeChecklistItemKey(item: string)"),
            ("outcome checklist item key helper fields", "return item;"),
            ("outcome checklist item key binding", "key={outcomeChecklistItemKey(item)}"),
            ("outcome checklist item text helper", "function outcomeChecklistItemText(item: string)"),
            ("outcome checklist item text helper fields", "return item;"),
            ("outcome checklist item text binding", "text={outcomeChecklistItemText(item)}"),
            ("ai flow checklist item key helper", "function aiFlowChecklistItemKey(item: string)"),
            ("ai flow checklist item key helper fields", "return item;"),
            ("ai flow checklist item key binding", "key={aiFlowChecklistItemKey(item)}"),
            ("ai flow checklist item text helper", "function aiFlowChecklistItemText(item: string)"),
            ("ai flow checklist item text helper fields", "return item;"),
            ("ai flow checklist item text binding", "text={aiFlowChecklistItemText(item)}"),
            ("record flow checklist item key helper", "function recordFlowChecklistItemKey(item: string)"),
            ("record flow checklist item key helper fields", "return item;"),
            ("record flow checklist item key binding", "key={recordFlowChecklistItemKey(item)}"),
            ("record flow checklist item text helper", "function recordFlowChecklistItemText(item: string)"),
            ("record flow checklist item text helper fields", "return item;"),
            ("record flow checklist item text binding", "text={recordFlowChecklistItemText(item)}"),
            ("insight flow checklist item key helper", "function insightFlowChecklistItemKey(item: string)"),
            ("insight flow checklist item key helper fields", "return item;"),
            ("insight flow checklist item key binding", "key={insightFlowChecklistItemKey(item)}"),
            ("insight flow checklist item text helper", "function insightFlowChecklistItemText(item: string)"),
            ("insight flow checklist item text helper fields", "return item;"),
            ("insight flow checklist item text binding", "text={insightFlowChecklistItemText(item)}"),
            ("subscription comparison row key helper", "function subscriptionComparisonRowKey(row: (typeof subscriptionComparisonDisplayRows)[number])"),
            ("subscription comparison row key helper fields", "return row.feature;"),
            ("subscription comparison row key binding", "key={subscriptionComparisonRowKey(row)}"),
            ("subscription comparison row feature helper", "function subscriptionComparisonRowFeature(row: (typeof subscriptionComparisonDisplayRows)[number])"),
            ("subscription comparison row feature helper fields", "return row.feature;"),
            ("subscription comparison row feature binding", "{subscriptionComparisonRowFeature(row)}"),
            ("subscription comparison row trial helper", "function subscriptionComparisonRowTrial(row: (typeof subscriptionComparisonDisplayRows)[number])"),
            ("subscription comparison row trial helper fields", "return row.trial;"),
            ("subscription comparison row trial binding", "{subscriptionComparisonRowTrial(row)}"),
            ("subscription comparison row annual helper", "function subscriptionComparisonRowAnnual(row: (typeof subscriptionComparisonDisplayRows)[number])"),
            ("subscription comparison row annual helper fields", "return row.annual;"),
            ("subscription comparison row annual binding", "{subscriptionComparisonRowAnnual(row)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "settings row binding",
            content,
            "onPress={() => pressSettingsRow(row)}",
        )
        _assert_contains(
            "settings display rows helper binding",
            content,
            "const settingsDisplayRows = useMemo(() => buildSettingsDisplayRows(), []);",
        )
        _assert_contains(
            "settings row accessibility item",
            settings_screen_data_content,
            "accessibilityLabel: boundDisplayText(`前往${label}設定：${helper || \"查看設定狀態\"}`, maxDisplayDetailTextLength)",
        )
        for label, marker in (
            ("settings rows config", "export const settingsRows: SettingsRow[] = ["),
            ("settings display rows helper", "export function settingsDisplayRows()"),
            ("settings display rows map", "return settingsRows.map(settingsRowDisplayItem);"),
            ("settings subpage target helper", 'export function settingsRowSubpageTarget(row: Pick<SettingsRow, "id">): AppScreen | null'),
            ("settings auth subpage target", 'return "accountSecurity";'),
            ("settings subscription management subpage target", 'return "subscriptionManagement";'),
            ("auth provider preview rows config", "export const authProviderPreviews: ReadonlyArray<AuthProviderPreview> = ["),
            ("auth provider preview display helper", "export function authProviderPreviewDisplayItem(value: AuthProviderPreview)"),
            ("auth provider display items helper", "export function authProviderDisplayItems()"),
            ("auth provider display items map", "return authProviderPreviews.map(authProviderPreviewDisplayItem);"),
            ("auth provider accessibility item", "accessibilityLabel: boundDisplayText(`查看${item.title}登入整合狀態，不保存 provider token`, maxDisplayDetailTextLength)"),
            ("auth provider callback status copy", "provider callback 尚未接入；callback 拿到 id_token 後會走 /auth/oidc-login、SecureStore 與 session revoke 流程。"),
            ("session management preview rows config", "export const sessionManagementPreviews = ["),
            ("session management display items helper", "export function sessionManagementDisplayItems()"),
            ("session management display items map", "return sessionManagementPreviews.map(sessionManagementPreviewDisplayItem);"),
            ("production auth readiness rows config", "export const productionAuthReadinessRows = ["),
            ("production auth readiness display rows helper", "export function productionAuthReadinessDisplayRows()"),
            ("production auth readiness display rows map", "return productionAuthReadinessRows.map(previewTupleDisplayItem);"),
            ("subscription management rows config", "export const subscriptionManagementRows = ["),
            ("subscription management display rows helper", "export function subscriptionManagementDisplayRows()"),
            ("subscription management display rows map", "return subscriptionManagementRows.map(previewTupleDisplayItem);"),
            ("privacy control rows config", "export const privacyControlRows = ["),
            ("privacy control display rows helper", "export function privacyControlDisplayRows()"),
            ("privacy control display rows map", "return privacyControlRows.map(previewTupleDisplayItem);"),
            ("tutorial steps config", "export const tutorialSteps = ["),
            ("tutorial display steps helper", "export function tutorialDisplaySteps()"),
            ("tutorial display steps map", "return tutorialSteps.map(tutorialStepDisplayItem);"),
            ("tutorial whisper release copy", "若已選擇本機 Whisper 模型，會先轉成文字並進入確認。"),
        ):
            _assert_contains(label, settings_screen_data_content, marker)
        for label, marker in (
            ("tutorial step key helper", "function tutorialStepKey(step: (typeof tutorialDisplaySteps)[number])"),
            ("tutorial step key helper fields", "return step.title;"),
            ("tutorial step key helper binding", "key={tutorialStepKey(step)}"),
            ("tutorial step icon helper", "function tutorialStepIcon(step: (typeof tutorialDisplaySteps)[number])"),
            ("tutorial step icon helper fields", "return step.icon;"),
            ("tutorial step icon helper binding", "{tutorialStepIcon(step)}"),
            ("tutorial step title helper", "function tutorialStepTitle(step: (typeof tutorialDisplaySteps)[number])"),
            ("tutorial step title helper fields", "return step.title;"),
            ("tutorial step title helper binding", "{tutorialStepTitle(step)}"),
            ("tutorial step description helper", "function tutorialStepDescription(step: (typeof tutorialDisplaySteps)[number])"),
            ("tutorial step description helper fields", "return step.description;"),
            ("tutorial step description helper binding", "{tutorialStepDescription(step)}"),
        ):
            _assert_contains(label, content, marker)
        tutorial_steps_render_block = _match_block(
            content,
            r"tutorialDisplaySteps\.map\(\(step\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "tutorial steps render block",
        )
        for label, marker in (
            ("direct tutorial step key binding", "key={step.title}"),
            ("direct tutorial step icon binding", "{step.icon}"),
            ("direct tutorial step title binding", "{step.title}"),
            ("direct tutorial step description binding", "{step.description}"),
        ):
            _assert_not_contains(label, tutorial_steps_render_block, marker)
        settings_display_rows_render_block = _match_block(
            content,
            r"settingsDisplayRows\.map\(\(row\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "settings display rows render block",
        )
        _assert_contains(
            "settings row accessibility binding",
            content,
            "accessibilityLabel={settingsDisplayRowAccessibilityLabel(row)}",
        )
        _assert_contains(
            "settings row button role",
            content,
            'accessibilityRole="button"\n                  style={styles.settingsRow}',
        )
        _assert_not_contains(
            "settings row direct destination binding",
            content,
            "onPress={() => openSettingsRow(row)}",
        )
        _assert_not_contains(
            "settings row direct key binding",
            settings_display_rows_render_block,
            "key={row.id}",
        )
        _assert_not_contains(
            "settings row direct accessibility binding",
            settings_display_rows_render_block,
            "accessibilityLabel={row.accessibilityLabel}",
        )
        _assert_not_contains(
            "settings row direct icon binding",
            settings_display_rows_render_block,
            "<Text>{row.icon}</Text>",
        )
        _assert_not_contains(
            "settings row direct label binding",
            content,
            "<Text style={styles.recordContent}>{row.label}</Text>",
        )
        _assert_not_contains(
            "settings row direct quota helper condition",
            content,
            'row.id === "quota" ? (',
        )
        _assert_not_contains(
            "settings row direct helper binding",
            content,
            "<Text style={styles.evidence}>{row.helper}</Text>",
        )
        for list_name in (
            "authBoundaryChecklistItems",
            "profileReadinessChecklistItems",
            "quotaReadinessChecklistItems",
            "reminderReadinessChecklistItems",
            "privacyReadinessChecklistItems",
            "tutorialSafetyChecklistItems",
        ):
            settings_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} settings checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                settings_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "subscriptionReadinessChecklistItems",
            "subscriptionManagementReadinessChecklistItems",
        ):
            subscription_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} subscription checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                subscription_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "doctorShareReadinessChecklistItems",
            "healthIntegrationReadinessChecklistItems",
        ):
            future_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} future checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                future_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "storeCheckoutReadinessChecklistItems",
            "foodPhotoEmptyResultChecklistItems",
            "foodPhotoReadinessChecklistItems",
        ):
            commerce_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} commerce checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                commerce_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "saveSuccessBoundaryChecklistItems",
            "deleteSuccessBoundaryChecklistItems",
            "updateSuccessBoundaryChecklistItems",
        ):
            outcome_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} outcome checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                outcome_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "aiReviewCostBoundaryChecklistItems",
            "aiSaveConfirmChecklistItems",
            "aiCandidateRemoveChecklistItems",
            "aiSaveFailureChecklistItems",
        ):
            ai_flow_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} AI flow checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                ai_flow_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "recordEntrySettingsChecklistItems",
            "transcriptReviewCostBoundaryChecklistItems",
        ):
            record_flow_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} record flow checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                record_flow_checklist_render_block,
                "key={item} text={item}",
            )
        for list_name in (
            "deleteConfirmChecklistItems",
            "analysisBoundaryChecklistItems",
            "detailedReportNoteItems",
        ):
            insight_flow_checklist_render_block = _match_block(
                content,
                rf"{list_name}\.map\(\(item\) => \(([\s\S]*?<HighlightBulletRow[^\n]*/>\n\s*)\)\)",
                f"{list_name} insight flow checklist render block",
            )
            _assert_not_contains(
                f"{list_name} direct checklist item binding",
                insight_flow_checklist_render_block,
                "key={item} text={item}",
            )
        subscription_comparison_render_block = _match_block(
            content,
            r"subscriptionComparisonDisplayRows\.map\(\(row\) => \(([\s\S]*?</View>\n\s*)\)\)",
            "subscription comparison render block",
        )
        for label, marker in (
            ("direct subscription comparison row key binding", "key={row.feature}"),
            ("direct subscription comparison row feature binding", "<Text style={styles.comparisonFeature}>{row.feature}</Text>"),
            ("direct subscription comparison row trial binding", "<Text style={styles.comparisonCell}>{row.trial}</Text>"),
            ("direct subscription comparison row annual binding", "<Text style={styles.comparisonCellStrong}>{row.annual}</Text>"),
        ):
            _assert_not_contains(label, subscription_comparison_render_block, marker)
        for block_label, pattern in (
            (
                "subscription management preview status rows render block",
                r"subscriptionManagementDisplayRows\.map\(\(row\) => \(([\s\S]*?</View>\n\s*)\)\)",
            ),
            (
                "privacy control preview status rows render block",
                r"privacyControlDisplayRows\.map\(\(row\) => \(([\s\S]*?</View>\n\s*)\)\)",
            ),
            (
                "production auth readiness preview status rows render block",
                r"productionAuthReadinessDisplayRows\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            ),
            (
                "session management preview status rows render block",
                r"sessionManagementDisplayItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            ),
            (
                "auth provider preview status rows render block",
                r"authProviderDisplayItems\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            ),
            (
                "reminder preview status rows render block",
                r"reminderPreviewDisplayItems\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            ),
            (
                "auth session display rows render block",
                r"authSessionDisplayItems\.map\(\(item\) => \(([\s\S]*?</View>\n\s*)\)\)",
            ),
        ):
            preview_status_rows_render_block = _match_block(content, pattern, block_label)
            for label, marker in (
                ("direct preview status row key binding", "key={row.title}"),
                ("direct preview status item key binding", "key={item.title}"),
                ("direct preview keyed item key binding", "key={item.key}"),
                ("direct preview status item accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
                ("direct preview status row icon binding", "<Text>{row.icon}</Text>"),
                ("direct preview status item icon binding", "<Text>{item.icon}</Text>"),
                ("direct preview status row title binding", "<Text style={styles.recordContent}>{row.title}</Text>"),
                ("direct preview status item title binding", "<Text style={styles.recordContent}>{item.title}</Text>"),
                ("direct preview status item login title binding", "<Text style={styles.recordContent}>{item.title} 登入</Text>"),
                ("direct preview status item time binding", "<Text style={styles.confidence}>{item.time}</Text>"),
                ("direct preview status item last used binding", "<Text style={styles.evidence}>{item.lastUsed}</Text>"),
                ("direct preview status row copy binding", "<Text style={styles.evidence}>{row.copy}</Text>"),
                ("direct preview status item copy binding", "<Text style={styles.evidence}>{item.copy}</Text>"),
                ("direct preview status row status binding", "<Text style={styles.previewModeBadge}>{row.statusLabel}</Text>"),
                ("direct preview status item status binding", "<Text style={styles.previewModeBadge}>{item.statusLabel}</Text>"),
            ):
                _assert_not_contains(f"{block_label} {label}", preview_status_rows_render_block, marker)
        _assert_contains(
            "settings tutorial row uses handler",
            content,
            'if (row.target === "tutorial")',
        )
        _assert_contains(
            "settings tutorial row return source",
            content,
            'openTutorial("settings")',
        )
        _assert_contains(
            "primary tab destination handler",
            content,
            "function openPrimaryTab(target: AppScreen)",
        )
        _assert_contains(
            "primary tab fallback screen opener binding",
            content,
            "if (target === \"menu\") {\n      openMenu(currentScreen);\n      return;\n    }\n    openScreen(target);",
        )
        _assert_contains(
            "primary tab press wrapper",
            content,
            "function pressPrimaryTab(screen: { id: AppScreen })",
        )
        _assert_contains(
            "primary tab press binding",
            content,
            "onPress={() => pressPrimaryTab(screen)}",
        )
        _assert_contains(
            "primary tab target helper",
            content,
            "function primaryTabTarget(screen: { id: AppScreen })",
        )
        _assert_contains(
            "primary tab target helper fields",
            content,
            "return screen.id;",
        )
        _assert_contains(
            "primary tab target helper binding",
            content,
            "openPrimaryTab(primaryTabTarget(screen));",
        )
        for label, marker in (
            ("primary tab key helper", "function primaryTabKey(screen: { id: AppScreen })"),
            ("primary tab key helper binding", "key={primaryTabKey(screen)}"),
            ("primary tab label helper", "function primaryTabLabel(screen: { label: string })"),
            ("primary tab label helper fields", "return screen.label;"),
            ("primary tab label helper binding", "{primaryTabLabel(screen)}"),
            ("primary tab accessibility display helper", "function primaryTabAccessibilityText(screen: { label: string })"),
            ("primary tab accessibility display helper fields", "return primaryTabAccessibilityLabel(primaryTabLabel(screen));"),
            ("primary tab accessibility display helper binding", "const primaryTabAccessibility = primaryTabAccessibilityText(screen);"),
            ("primary tab current state helper", "function primaryTabIsCurrent(screen: { isCurrent: boolean })"),
            ("primary tab current state helper fields", "return screen.isCurrent;"),
            ("primary tab current state helper binding", "const isCurrentPrimaryTab = primaryTabIsCurrent(screen);"),
            ("primary tab locked state helper", "function primaryTabIsLocked(screen: { isLocked: boolean })"),
            ("primary tab locked state helper fields", "return screen.isLocked;"),
            ("primary tab locked state helper binding", "const isPrimaryTabLocked = primaryTabIsLocked(screen);"),
            ("MVP flow step key helper", "function mvpFlowStepKey(step: (typeof mvpFlowSteps)[number])"),
            ("MVP flow step key helper fields", "return step.id;"),
            ("MVP flow step key helper binding", "key={mvpFlowStepKey(step)}"),
            ("MVP flow step label helper", "function mvpFlowStepLabel(step: (typeof mvpFlowSteps)[number])"),
            ("MVP flow step label helper fields", "return step.label;"),
            ("MVP flow step label helper binding", "{mvpFlowStepLabel(step)}"),
            ("MVP flow step active helper", "function mvpFlowStepIsActive(index: number, stepIndex: number)"),
            ("MVP flow step active helper fields", "return index === stepIndex;"),
            ("MVP flow step active helper binding", "const isActive = mvpFlowStepIsActive(index, mvpFlowStepIndex);"),
            ("MVP flow step done helper", "function mvpFlowStepIsDone(index: number, stepIndex: number)"),
            ("MVP flow step done helper fields", "return index < stepIndex;"),
            ("MVP flow step done helper binding", "const isDone = mvpFlowStepIsDone(index, mvpFlowStepIndex);"),
            ("MVP flow step indicator helper", "function mvpFlowStepIndicatorText(index: number, isDone: boolean)"),
            ("MVP flow step indicator helper binding", "{mvpFlowStepIndicatorText(index, isDone)}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "primary tab button role",
            content,
            'accessibilityRole="button"\n                  accessibilityState={{ disabled: isPrimaryTabLocked, selected: isCurrentPrimaryTab }}',
        )
        primary_tab_render_block = _match_block(
            content,
            r"primaryTabItems\.map\(\(screen\) => \{([\s\S]*?primaryTabLabel\(screen\)[\s\S]*?</Pressable>)",
            "primary tab render block",
        )
        for label, marker in (
            ("direct primary tab key binding", "key={screen.id}"),
            ("direct primary tab accessibility binding", "primaryTabAccessibilityLabel(screen.label)"),
            ("direct primary tab label binding", "{screen.label}"),
            ("direct primary tab current binding", "screen.isCurrent"),
            ("direct primary tab locked binding", "screen.isLocked"),
        ):
            _assert_not_contains(label, primary_tab_render_block, marker)
        mvp_flow_step_render_block = _match_block(
            content,
            r"mvpFlowSteps\.map\(\(step, index\) => \{([\s\S]*?mvpFlowStepLabel\(step\)[\s\S]*?</View>)",
            "MVP flow step render block",
        )
        for label, marker in (
            ("direct MVP flow step key binding", "key={step.id}"),
            ("direct MVP flow step label binding", "{step.label}"),
            ("direct MVP flow step active binding", "index === mvpFlowStepIndex"),
            ("direct MVP flow step done binding", "index < mvpFlowStepIndex"),
            ("direct MVP flow step indicator binding", 'isDone ? "✓" : String(index + 1)'),
        ):
            _assert_not_contains(label, mvp_flow_step_render_block, marker)
        _assert_not_contains(
            "primary tab direct destination binding",
            content,
            "onPress={() => openPrimaryTab(screen.id)}",
        )
        _assert_not_contains(
            "primary tab direct press target binding",
            content,
            "onPress={() => pressPrimaryTab(screen.id)}",
        )
        for label, marker in (
            ("settings local clear handler", "function clearLocalSessionFromSettings()"),
            ("auth provider challenge handler", "function startAuthProviderChallenge(provider: string)"),
            ("auth provider preview target helper", "function authProviderPreviewTarget(item: ReturnType<typeof authProviderPreviewDisplayItem>)"),
            ("auth provider preview target helper fields", "return item.provider;"),
            ("auth provider preview press handler", "function pressAuthProviderPreview(item: ReturnType<typeof authProviderPreviewDisplayItem>)"),
            ("auth provider preview target helper binding", "startAuthProviderChallenge(authProviderPreviewTarget(item));"),
            ("auth refresh handler", "function refreshAuthSessionFromSecurity()"),
            ("auth sessions load handler", "function loadAuthSessionsFromSecurity()"),
            ("auth logout handler", "function logoutAuthSessionFromSecurity()"),
            ("auth logout all handler", "function logoutAllAuthSessionsFromSecurity()"),
            ("auth logout main status binding", "setStatus(authLogoutMainStatusMessage());"),
            ("auth logout local clear status binding", "setStatus(authLogoutLocalClearStatusMessage());"),
            ("auth logout all main status binding", "setStatus(authLogoutAllMainStatusMessage());"),
            ("auth session management status handler", "function showAuthSessionManagementStatus(actionStatus: string)"),
            (
                "auth session management action status helper",
                "function authSessionManagementActionStatus(item: ReturnType<typeof sessionManagementPreviewDisplayItem>)",
            ),
            ("auth session management action status helper fields", "return item.actionStatus;"),
            (
                "auth session management preview press handler",
                "function pressAuthSessionManagementPreview(item: ReturnType<typeof sessionManagementPreviewDisplayItem>)",
            ),
            (
                "auth session management action status helper binding",
                "showAuthSessionManagementStatus(authSessionManagementActionStatus(item));",
            ),
            ("profile edit integration status handler", "function showProfileEditIntegrationStatus()"),
            ("recording quota settings sync handler", "function syncRecordingQuotaSettings()"),
            ("reminder integration status handler", "function showReminderIntegrationStatus()"),
            ("privacy integration status handler", "function showPrivacyIntegrationStatus()"),
            ("advanced settings toggle handler", "function toggleAdvancedSettings()"),
            ("backend reconnect settings handler", "function reconnectBackendFromSettings()"),
            ("profile selection settings handler", "function selectActiveProfileFromSettings(profileId: string)"),
            ("llm model selection settings handler", "function selectLlmModelFromSettings(modelId: string)"),
            ("stt model selection settings handler", "function selectSttModelFromSettings(modelId: string)"),
            ("native download kind handler", 'function selectNativeDownloadKind(kind: "whisper" | "llama")'),
            ("profile settings option handler", "function selectSettingsProfileChoice(profileId: string)"),
            ("settings choice display bundle helper binding", "const settingsChoiceDisplay = useMemo("),
            ("settings choice display bundle profiles", "profiles,"),
            ("settings choice display bundle llm models", "llmModels: models.llm_models"),
            ("settings choice display bundle stt models", "sttModels: models.stt_models"),
            ("settings choice display bundle auth sessions", "authSessions"),
            ("profile settings display items helper binding", "const profileChoiceDisplayItems = settingsChoiceDisplay.profileChoiceDisplayItems;"),
            ("llm model settings option handler", "function selectSettingsLlmModelChoice(modelId: string)"),
            ("stt model settings option handler", "function selectSettingsSttModelChoice(modelId: string)"),
            ("llm model settings display items helper binding", "const llmModelChoiceDisplayItems = settingsChoiceDisplay.llmModelChoiceDisplayItems;"),
            ("stt model settings display items helper binding", "const sttModelChoiceDisplayItems = settingsChoiceDisplay.sttModelChoiceDisplayItems;"),
            ("downloaded whisper model display items helper binding", "const downloadedWhisperModelChoiceItems = downloadedWhisperModelDisplayItems(downloadedModels);"),
            ("profile settings option press handler", "function pressSettingsProfileChoice(profile: (typeof profileChoiceDisplayItems)[number])"),
            ("settings profile choice target helper", "function settingsProfileChoiceTarget(profile: { sourceId: string })"),
            ("settings profile choice target helper fields", "return profile.sourceId;"),
            ("settings profile choice key helper", "function settingsProfileChoiceKey(profile: { id: string })"),
            ("settings profile choice key helper fields", "return profile.id;"),
            ("settings profile choice key binding", "key={settingsProfileChoiceKey(profile)}"),
            ("settings profile choice accessibility helper", "function settingsProfileChoiceAccessibilityLabel(profile: { accessibilityLabel: string })"),
            ("settings profile choice accessibility helper fields", "return profile.accessibilityLabel;"),
            ("settings profile choice accessibility binding", "accessibilityLabel={settingsProfileChoiceAccessibilityLabel(profile)}"),
            ("settings profile choice selected helper", "function settingsProfileChoiceIsSelected(profile: { sourceId: string }, activeId: string)"),
            ("settings profile choice selected helper fields", "return settingsProfileChoiceTarget(profile) === activeId;"),
            ("settings profile choice selected binding", "const profileSelected = settingsProfileChoiceIsSelected(profile, activeProfileId);"),
            ("settings profile choice label helper", "function settingsProfileChoiceLabel(profile: { label: string })"),
            ("settings profile choice label helper fields", "return profile.label;"),
            ("settings profile choice label binding", "{settingsProfileChoiceLabel(profile)}"),
            ("profile settings target helper binding", "selectSettingsProfileChoice(settingsProfileChoiceTarget(profile));"),
            ("settings model choice target helper", "function settingsModelChoiceTarget(model: { sourceId: string })"),
            ("settings model choice target helper fields", "return model.sourceId;"),
            ("settings model choice key helper", "function settingsModelChoiceKey(model: { id: string })"),
            ("settings model choice key helper fields", "return model.id;"),
            ("settings model choice key binding", "key={settingsModelChoiceKey(model)}"),
            ("settings model choice accessibility helper", "function settingsModelChoiceAccessibilityLabel(model: { accessibilityLabel: string })"),
            ("settings model choice accessibility helper fields", "return model.accessibilityLabel;"),
            ("settings model choice accessibility binding", "accessibilityLabel={settingsModelChoiceAccessibilityLabel(model)}"),
            ("settings model choice available helper", "function settingsModelChoiceIsAvailable(model: { available: boolean })"),
            ("settings model choice available helper fields", "return model.available;"),
            ("settings model choice disabled helper", "function settingsModelChoiceIsDisabled(model: { available: boolean }, isRequestInFlight: boolean)"),
            ("settings model choice disabled helper fields", "return !settingsModelChoiceIsAvailable(model) || isRequestInFlight;"),
            ("settings model choice disabled binding", "const modelDisabled = settingsModelChoiceIsDisabled(model, isAnyRequestInFlight);"),
            ("settings model choice selected helper", "function settingsModelChoiceIsSelected(model: { sourceId: string }, selectedId: string)"),
            ("settings model choice selected helper fields", "return settingsModelChoiceTarget(model) === selectedId;"),
            ("settings model choice LLM selected binding", "const modelSelected = settingsModelChoiceIsSelected(model, llmModelId);"),
            ("settings model choice STT selected binding", "const modelSelected = settingsModelChoiceIsSelected(model, sttModelId);"),
            ("settings model choice label helper", "function settingsModelChoiceLabel(model: { label: string })"),
            ("settings model choice label helper fields", "return model.label;"),
            ("settings model choice label binding", "{settingsModelChoiceLabel(model)}"),
            ("llm model settings option press handler", "function pressSettingsLlmModelChoice(model: (typeof llmModelChoiceDisplayItems)[number])"),
            ("llm model settings target helper binding", "selectSettingsLlmModelChoice(settingsModelChoiceTarget(model));"),
            ("stt model settings option press handler", "function pressSettingsSttModelChoice(model: (typeof sttModelChoiceDisplayItems)[number])"),
            ("stt model settings target helper binding", "selectSettingsSttModelChoice(settingsModelChoiceTarget(model));"),
            ("recording whisper model path target helper", "function recordingWhisperModelPathTarget(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model path target helper fields", "return item.sourceUri;"),
            ("recording whisper model key helper", "function recordingWhisperModelKey(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model key helper fields", "return recordingWhisperModelPathTarget(item);"),
            ("recording whisper model key helper binding", "key={recordingWhisperModelKey(model)}"),
            ("recording whisper model accessibility helper", "function recordingWhisperModelAccessibilityLabel(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model accessibility helper fields", "return item.accessibilityLabel;"),
            ("recording whisper model accessibility helper binding", "accessibilityLabel={recordingWhisperModelAccessibilityLabel(model)}"),
            ("recording whisper model selected helper", "function recordingWhisperModelIsSelected("),
            ("recording whisper model selected helper fields", "return recordingWhisperModelPathTarget(item) === selectedPath;"),
            ("recording whisper model selected helper binding", "const modelSelected = recordingWhisperModelIsSelected(model, whisperModelPath);"),
            ("recording whisper model status label helper", "function recordingWhisperModelStatusLabel(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model status label helper fields", "return item.label;"),
            ("recording whisper model status label helper render binding", "{recordingWhisperModelStatusLabel(model)}"),
            ("recording whisper model selected label helper", "function recordingWhisperModelSelectedLabel(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model selected label helper fields", "return item.selectedLabel;"),
            ("recording whisper model selected label helper binding", "{recordingWhisperModelSelectedLabel(model)}"),
            ("recording whisper model select handler", "function selectRecordingWhisperModelChoice(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording whisper model path target helper binding", "setWhisperModelPath(recordingWhisperModelPathTarget(item));"),
            ("recording whisper model status label helper binding", "setStatus(recordingModelSelectedStatusMessage(recordingWhisperModelStatusLabel(item)));"),
            ("recording whisper model press handler", "function pressRecordingWhisperModelChoice(item: (typeof downloadedWhisperModelChoiceItems)[number])"),
            ("recording model refresh handler", "function refreshRecordingModelsFromSettings()"),
            ("downloaded model boot refresh", "void refreshDownloadedModels();"),
            ("downloaded model auto whisper path helper binding", "const initialWhisperModelPath = downloadedWhisperModelInitialPath(whisperModels);"),
            ("downloaded model auto whisper select helper binding", "setWhisperModelPath(nativeDebugInputValue(initialWhisperModelPath));"),
            ("downloaded model refresh count helper binding", "setStatus(recordingModelRefreshStatusMessage(downloadedWhisperModelCount(whisperModels)));"),
            ("native whisper download option handler", "function selectWhisperNativeDownloadKind()"),
            ("native llama download option handler", "function selectLlamaNativeDownloadKind()"),
            ("native debug input value helper", "function nativeDebugInputValue(value: string)"),
            ("native debug input value helper fields", "return boundNativeDebugInput(value);"),
            ("downloaded whisper initial path helper", "function downloadedWhisperModelInitialPath(models: ReturnType<typeof boundDownloadedModels>)"),
            ("downloaded whisper initial path helper fields", 'return models[0]?.uri ?? "";'),
            ("downloaded whisper model count helper", "function downloadedWhisperModelCount(models: ReturnType<typeof boundDownloadedModels>)"),
            ("downloaded whisper model count helper fields", "return models.length;"),
            ("native model URL input handler", "function updateNativeModelUrlInput(value: string)"),
            ("native model URL helper binding", "setModelUrl(nativeDebugInputValue(value));"),
            ("native whisper path input handler", "function updateWhisperModelPathInput(value: string)"),
            ("native whisper path helper binding", "setWhisperModelPath(nativeDebugInputValue(value));"),
            ("native audio path input handler", "function updateNativeAudioPathInput(value: string)"),
            ("native audio path helper binding", "setAudioPath(nativeDebugInputValue(value));"),
            ("native llama path input handler", "function updateLlamaModelPathInput(value: string)"),
            ("native llama path helper binding", "setLlamaModelPath(nativeDebugInputValue(value));"),
            ("native module check settings handler", "function checkNativeModulesFromSettings()"),
            ("native model download settings handler", "function downloadNativeModelFromSettings()"),
            ("native whisper settings handler", "function runNativeWhisperFromSettings()"),
            ("native llama settings handler", "function runNativeLlamaFromSettings()"),
            ("native benchmarks settings handler", "function runNativeBenchmarksFromSettings()"),
            ("settings local clear binding", "onPress={clearLocalSessionFromSettings}"),
            ("auth provider preview press binding", "onPress={() => pressAuthProviderPreview(item)}"),
            ("auth provider accessibility binding", "accessibilityLabel={previewStatusRowAccessibilityLabel(item)}"),
            ("auth provider disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth refresh binding", "onPress={refreshAuthSessionFromSecurity}"),
            ("auth sessions load binding", "onPress={loadAuthSessionsFromSecurity}"),
            ("auth logout binding", "onPress={logoutAuthSessionFromSecurity}"),
            ("auth logout all binding", "onPress={logoutAllAuthSessionsFromSecurity}"),
            ("auth session display list helper binding", "const authSessionDisplayItems = settingsChoiceDisplay.authSessionDisplayItems;"),
            ("auth refresh accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.refreshSessionAccessibility}"),
            ("auth load sessions accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.loadSessionsAccessibility}"),
            ("auth logout local accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.logoutLocalAccessibility}"),
            ("auth logout all accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.logoutAllAccessibility}"),
            ("settings local clear accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.localClearAccessibility}"),
            ("auth status display helper binding", "const authStatusDisplay = authStatusDisplayTexts({"),
            ("auth action status display text binding", "const authActionStatusDisplayText = authStatusDisplay.authAction;"),
            ("auth token storage status display text binding", "const tokenStorageStatusDisplayText = authStatusDisplay.tokenStorage;"),
            ("auth token storage render display binding", "<Text style={styles.evidence}>{tokenStorageStatusDisplayText}</Text>"),
            ("account security boundary row key helper", "function accountSecurityBoundaryRowKey(row: (typeof accountSecurityBoundaryRows)[number])"),
            ("account security boundary row key helper fields", "return row.label;"),
            ("account security boundary row key helper binding", "key={accountSecurityBoundaryRowKey(row)}"),
            ("account security boundary row label helper", "function accountSecurityBoundaryRowLabel(row: (typeof accountSecurityBoundaryRows)[number])"),
            ("account security boundary row label helper fields", "return row.label;"),
            ("account security boundary row label helper binding", "{accountSecurityBoundaryRowLabel(row)}"),
            ("account security boundary row value helper", "function accountSecurityBoundaryRowValue(row: (typeof accountSecurityBoundaryRows)[number])"),
            ("account security boundary row value helper fields", "return row.value;"),
            ("account security boundary row value helper binding", "{accountSecurityBoundaryRowValue(row)}"),
            ("profile settings boundary row key helper", "function profileSettingsBoundaryRowKey(row: (typeof profileSettingsBoundaryRows)[number])"),
            ("profile settings boundary row key helper fields", "return row.label;"),
            ("profile settings boundary row key helper binding", "key={profileSettingsBoundaryRowKey(row)}"),
            ("profile settings boundary row label helper", "function profileSettingsBoundaryRowLabel(row: (typeof profileSettingsBoundaryRows)[number])"),
            ("profile settings boundary row label helper fields", "return row.label;"),
            ("profile settings boundary row label helper binding", "{profileSettingsBoundaryRowLabel(row)}"),
            ("profile settings boundary row value helper", "function profileSettingsBoundaryRowValue(row: (typeof profileSettingsBoundaryRows)[number])"),
            ("profile settings boundary row value helper fields", "return row.value;"),
            ("profile settings boundary row value helper binding", "{profileSettingsBoundaryRowValue(row)}"),
            ("recording quota boundary row key helper", "function recordingQuotaBoundaryRowKey(row: (typeof recordingQuotaBoundaryRows)[number])"),
            ("recording quota boundary row key helper fields", "return row.label;"),
            ("recording quota boundary row key helper binding", "key={recordingQuotaBoundaryRowKey(row)}"),
            ("recording quota boundary row label helper", "function recordingQuotaBoundaryRowLabel(row: (typeof recordingQuotaBoundaryRows)[number])"),
            ("recording quota boundary row label helper fields", "return row.label;"),
            ("recording quota boundary row label helper binding", "{recordingQuotaBoundaryRowLabel(row)}"),
            ("recording quota boundary row value helper", "function recordingQuotaBoundaryRowValue(row: (typeof recordingQuotaBoundaryRows)[number])"),
            ("recording quota boundary row value helper fields", "return row.value;"),
            ("recording quota boundary row value helper binding", "{recordingQuotaBoundaryRowValue(row)}"),
            ("AI save confirm boundary row key helper", "function aiSaveConfirmBoundaryRowKey(row: (typeof aiSaveConfirmBoundaryRows)[number])"),
            ("AI save confirm boundary row key helper fields", "return row.label;"),
            ("AI save confirm boundary row key helper binding", "key={aiSaveConfirmBoundaryRowKey(row)}"),
            ("AI save confirm boundary row label helper", "function aiSaveConfirmBoundaryRowLabel(row: (typeof aiSaveConfirmBoundaryRows)[number])"),
            ("AI save confirm boundary row label helper fields", "return row.label;"),
            ("AI save confirm boundary row label helper binding", "{aiSaveConfirmBoundaryRowLabel(row)}"),
            ("AI save confirm boundary row value helper", "function aiSaveConfirmBoundaryRowValue(row: (typeof aiSaveConfirmBoundaryRows)[number])"),
            ("AI save confirm boundary row value helper fields", "return row.value;"),
            ("AI save confirm boundary row value helper binding", "{aiSaveConfirmBoundaryRowValue(row)}"),
            ("privacy boundary row key helper", "function privacyBoundaryRowKey(row: (typeof privacyBoundaryRows)[number])"),
            ("privacy boundary row key helper fields", "return row.label;"),
            ("privacy boundary row key helper binding", "key={privacyBoundaryRowKey(row)}"),
            ("privacy boundary row label helper", "function privacyBoundaryRowLabel(row: (typeof privacyBoundaryRows)[number])"),
            ("privacy boundary row label helper fields", "return row.label;"),
            ("privacy boundary row label helper binding", "{privacyBoundaryRowLabel(row)}"),
            ("privacy boundary row value helper", "function privacyBoundaryRowValue(row: (typeof privacyBoundaryRows)[number])"),
            ("privacy boundary row value helper fields", "return row.value;"),
            ("privacy boundary row value helper binding", "{privacyBoundaryRowValue(row)}"),
            ("dev reset status display text binding", "const devResetStatusDisplayText = authStatusDisplay.devReset;"),
            ("native status display helper binding", "const nativeStatusDisplay = nativeStatusDisplayTexts(nativeStatus);"),
            ("native status display text binding", "const nativeStatusDisplayText = nativeStatusDisplay.native;"),
            ("auth secondary action disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth danger action disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth session management preview press binding", "onPress={() => pressAuthSessionManagementPreview(item)}"),
            ("auth session management button role", 'accessibilityRole="button"\n                  style={styles.aiReviewCard}'),
            ("profile edit integration status binding", "onPress={showProfileEditIntegrationStatus}"),
            ("settings subpage status display helper binding", "const settingsSubpageStatusDisplay = settingsSubpageStatusDisplayTexts({"),
            ("settings subpage profile action display binding", "const profileActionStatusDisplayText = settingsSubpageStatusDisplay.profileAction;"),
            ("settings subpage quota unavailable binding", "const recordingQuotaUnavailableStatusMessage = settingsSubpageStatusDisplay.recordingQuotaUnavailable;"),
            ("settings subpage reminder integration binding", "const reminderIntegrationStatusMessage = settingsSubpageStatusDisplay.reminderIntegration;"),
            ("settings subpage privacy integration binding", "const privacyIntegrationStatusMessage = settingsSubpageStatusDisplay.privacyIntegration;"),
            ("profile edit accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.editIntegrationAccessibility}"),
            ("recording quota settings sync binding", "onPress={syncRecordingQuotaSettings}"),
            ("recording quota accessibility binding", "accessibilityLabel={recordingQuotaSyncAccessibilityDisplayLabel}"),
            ("reminder integration status binding", "onPress={showReminderIntegrationStatus}"),
            ("reminder integration accessibility binding", "accessibilityLabel={reminderIntegrationAccessibilityDisplayLabel}"),
            ("privacy integration status binding", "onPress={showPrivacyIntegrationStatus}"),
            ("privacy integration accessibility binding", "accessibilityLabel={privacyIntegrationAccessibilityDisplayLabel}"),
            ("settings subpage return accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}"),
            ("settings subpage secondary button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
            ("settings subpage quota disabled state", "accessibilityState={{ disabled: isQuotaSyncing }}"),
            ("advanced settings toggle binding", "onPress={toggleAdvancedSettings}"),
            ("advanced settings toggle accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.advancedSettingsToggleAccessibility}"),
            ("advanced settings expanded state", "accessibilityState={{ expanded: showAdvancedSettings }}"),
            ("backend reconnect settings binding", "onPress={reconnectBackendFromSettings}"),
            ("backend reconnect accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.backendReconnectAccessibility}"),
            ("backend reconnect disabled state", "accessibilityState={{ disabled: isAnyRequestInFlight }}"),
            ("profile settings option binding", "onPress={() => pressSettingsProfileChoice(profile)}"),
            ("llm model settings option binding", "onPress={() => pressSettingsLlmModelChoice(model)}"),
            ("stt model settings option binding", "onPress={() => pressSettingsSttModelChoice(model)}"),
            ("recording whisper model settings title", "本機 Whisper 模型"),
            ("recording whisper model settings binding", "onPress={() => pressRecordingWhisperModelChoice(model)}"),
            ("recording whisper model accessibility binding", "accessibilityLabel={recordingWhisperModelAccessibilityLabel(model)}"),
            ("recording whisper model selected state", "accessibilityState={{ selected: modelSelected }}"),
            ("recording model refresh binding", "onPress={refreshRecordingModelsFromSettings}"),
            ("recording model refresh accessibility binding", "accessibilityLabel={recordingModelRefreshAccessibilityDisplayLabel}"),
            ("profile settings option accessibility binding", "accessibilityLabel={settingsProfileChoiceAccessibilityLabel(profile)}"),
            ("llm model settings option accessibility binding", "accessibilityLabel={settingsModelChoiceAccessibilityLabel(model)}"),
            ("settings option button role", 'accessibilityRole="button"'),
            ("profile settings option state binding", "accessibilityState={{ disabled: isAnyRequestInFlight, selected: profileSelected }}"),
            ("llm model settings option state binding", "accessibilityState={{ disabled: modelDisabled, selected: modelSelected }}"),
            ("stt model settings option state binding", "accessibilityState={{ disabled: modelDisabled, selected: modelSelected }}"),
            ("native model URL input binding", "onChangeText={updateNativeModelUrlInput}"),
            ("native whisper path input binding", "onChangeText={updateWhisperModelPathInput}"),
            ("native audio path input binding", "onChangeText={updateNativeAudioPathInput}"),
            ("native llama path input binding", "onChangeText={updateLlamaModelPathInput}"),
            ("native whisper download kind binding", "onPress={selectWhisperNativeDownloadKind}"),
            ("native llama download kind binding", "onPress={selectLlamaNativeDownloadKind}"),
            ("native whisper download kind accessibility binding", "accessibilityLabel={nativeWhisperDownloadKindAccessibilityDisplayLabel}"),
            ("native llama download kind accessibility binding", "accessibilityLabel={nativeLlamaDownloadKindAccessibilityDisplayLabel}"),
            ("native download kind state binding", 'accessibilityState={{ disabled: isBusy, selected: downloadKind === "whisper" }}'),
            ("native module check settings binding", "onPress={checkNativeModulesFromSettings}"),
            ("native model download settings binding", "onPress={downloadNativeModelFromSettings}"),
            ("native whisper settings binding", "onPress={runNativeWhisperFromSettings}"),
            ("native llama settings binding", "onPress={runNativeLlamaFromSettings}"),
            ("native benchmarks settings binding", "onPress={runNativeBenchmarksFromSettings}"),
            ("native module check accessibility binding", "accessibilityLabel={nativeModuleCheckAccessibilityDisplayLabel}"),
            ("native model download accessibility binding", "accessibilityLabel={nativeModelDownloadAccessibilityDisplayLabel}"),
            ("native whisper run accessibility binding", "accessibilityLabel={nativeWhisperRunAccessibilityDisplayLabel}"),
            ("native llama run accessibility binding", "accessibilityLabel={nativeLlamaRunAccessibilityDisplayLabel}"),
            ("native benchmark accessibility binding", "accessibilityLabel={nativeBenchmarkAccessibilityDisplayLabel}"),
            ("native debug action disabled state", "accessibilityState={{ disabled: isBusy }}"),
            ("doctor share token status handler", "function showDoctorShareTokenStatus()"),
            ("doctor share report status handler", "function showDoctorShareReportBoundaryStatus()"),
            ("health integration permission status handler", "function showHealthIntegrationPermissionStatus()"),
            ("health integration meter status handler", "function showHealthIntegrationMeterStatus()"),
            ("community close accessibility helper", "function communityCloseAccessibilityLabel()"),
            ("community close accessibility helper fields", "return auxiliaryDisplayLabels.closeReturn;"),
            ("community close accessibility display label binding", "const communityCloseAccessibilityDisplayLabel = communityCloseAccessibilityLabel();"),
            ("community close accessibility helper binding", "accessibilityLabel={communityCloseAccessibilityDisplayLabel}"),
            ("community preview boundary badge helper", "function communityPreviewBoundaryBadgeLabel()"),
            ("community preview boundary badge helper fields", "return communityPreviewBoundaryDisplay.badge;"),
            ("community preview boundary badge display label binding", "const communityPreviewBoundaryBadgeDisplayLabel = communityPreviewBoundaryBadgeLabel();"),
            ("community preview boundary badge helper binding", "{communityPreviewBoundaryBadgeDisplayLabel}"),
            ("community preview boundary copy helper", "function communityPreviewBoundaryCopyText()"),
            ("community preview boundary copy helper fields", "return communityPreviewBoundaryDisplay.copy;"),
            ("community preview boundary copy display text binding", "const communityPreviewBoundaryCopyDisplayText = communityPreviewBoundaryCopyText();"),
            ("community preview boundary copy helper binding", "{communityPreviewBoundaryCopyDisplayText}"),
            ("community post accessibility helper", "function communityPostAccessibilityLabel()"),
            ("community post accessibility helper fields", "return futurePreviewDisplayLabels.communityPostAccessibility;"),
            ("community post accessibility display label binding", "const communityPostAccessibilityDisplayLabel = communityPostAccessibilityLabel();"),
            ("community post accessibility helper binding", "accessibilityLabel={communityPostAccessibilityDisplayLabel}"),
            ("community post button helper", "function communityPostButtonLabel()"),
            ("community post button helper fields", "return futurePreviewDisplayLabels.communityPostButton;"),
            ("community post button display label binding", "const communityPostButtonDisplayLabel = communityPostButtonLabel();"),
            ("community post button helper binding", "{communityPostButtonDisplayLabel}"),
            ("community privacy accessibility helper", "function communityPrivacyAccessibilityLabel()"),
            ("community privacy accessibility helper fields", "return futurePreviewDisplayLabels.communityPrivacyAccessibility;"),
            ("community privacy accessibility display label binding", "const communityPrivacyAccessibilityDisplayLabel = communityPrivacyAccessibilityLabel();"),
            ("community privacy accessibility helper binding", "accessibilityLabel={communityPrivacyAccessibilityDisplayLabel}"),
            ("community action status label helper", "function communityActionStatusLabel()"),
            ("community action status label helper fields", "return futurePreviewDisplayLabels.communityStatus;"),
            ("community action status label display binding", "const communityActionStatusDisplayLabel = communityActionStatusLabel();"),
            ("community action status label helper binding", "{communityActionStatusDisplayLabel}"),
            ("community action status text helper", "function communityActionStatusText()"),
            ("community action status text helper fields", "return communityActionStatusDisplayText;"),
            ("community action status text display binding", "const communityActionStatusDisplayCopy = communityActionStatusText();"),
            ("community action status text helper binding", "{communityActionStatusDisplayCopy}"),
            ("community action status visible helper", "function communityActionStatusVisible()"),
            ("community action status visible helper fields", "return Boolean(communityActionStatus);"),
            ("community action status visible helper binding", "{communityActionStatusVisible() ? ("),
            ("community readiness section label helper", "function communityReadinessSectionLabel()"),
            ("community readiness section label helper fields", "return futurePreviewDisplayLabels.formalReadiness;"),
            ("community readiness section label display binding", "const communityReadinessSectionDisplayLabel = communityReadinessSectionLabel();"),
            ("community readiness section label helper binding", "{communityReadinessSectionDisplayLabel}"),
            ("community readiness checklist item key helper", "function communityReadinessChecklistItemKey(item: string)"),
            ("community readiness checklist item key helper fields", "return item;"),
            ("community readiness checklist item key helper binding", "key={communityReadinessChecklistItemKey(item)}"),
            ("community readiness checklist item text helper", "function communityReadinessChecklistItemText(item: string)"),
            ("community readiness checklist item text helper fields", "return item;"),
            ("community readiness checklist item text helper binding", "text={communityReadinessChecklistItemText(item)}"),
            ("community return future modules accessibility helper", "function communityReturnFutureModulesAccessibilityLabel()"),
            ("community return future modules accessibility helper fields", "return futurePreviewDisplayLabels.returnFutureModulesAccessibility;"),
            ("community return future modules accessibility display label binding", "const communityReturnFutureModulesAccessibilityDisplayLabel = communityReturnFutureModulesAccessibilityLabel();"),
            ("community return future modules accessibility helper binding", "accessibilityLabel={communityReturnFutureModulesAccessibilityDisplayLabel}"),
            ("community return future modules button helper", "function communityReturnFutureModulesButtonLabel()"),
            ("community return future modules button helper fields", "return futurePreviewDisplayLabels.returnFutureModules;"),
            ("community return future modules button display label binding", "const communityReturnFutureModulesButtonDisplayLabel = communityReturnFutureModulesButtonLabel();"),
            ("community return future modules button helper binding", "{communityReturnFutureModulesButtonDisplayLabel}"),
            ("community return future modules press helper", "function communityReturnFutureModulesPressHandler()"),
            ("community return future modules press helper fields", "return returnFromCommunityPreview;"),
            ("community return future modules press target binding", "const communityReturnFutureModulesPressTarget = communityReturnFutureModulesPressHandler();"),
            ("community return future modules press helper binding", "onPress={communityReturnFutureModulesPressTarget}"),
            ("doctor share boundary row key helper", "function doctorShareBoundaryRowKey(row: (typeof doctorShareBoundaryRows)[number])"),
            ("doctor share boundary row key helper fields", "return row.label;"),
            ("doctor share boundary row key helper binding", "key={doctorShareBoundaryRowKey(row)}"),
            ("doctor share boundary row label helper", "function doctorShareBoundaryRowLabel(row: (typeof doctorShareBoundaryRows)[number])"),
            ("doctor share boundary row label helper fields", "return row.label;"),
            ("doctor share boundary row label helper binding", "{doctorShareBoundaryRowLabel(row)}"),
            ("doctor share boundary row value helper", "function doctorShareBoundaryRowValue(row: (typeof doctorShareBoundaryRows)[number])"),
            ("doctor share boundary row value helper fields", "return row.value;"),
            ("doctor share boundary row value helper binding", "{doctorShareBoundaryRowValue(row)}"),
            ("health integration boundary row key helper", "function healthIntegrationBoundaryRowKey(row: (typeof healthIntegrationBoundaryRows)[number])"),
            ("health integration boundary row key helper fields", "return row.label;"),
            ("health integration boundary row key helper binding", "key={healthIntegrationBoundaryRowKey(row)}"),
            ("health integration boundary row label helper", "function healthIntegrationBoundaryRowLabel(row: (typeof healthIntegrationBoundaryRows)[number])"),
            ("health integration boundary row label helper fields", "return row.label;"),
            ("health integration boundary row label helper binding", "{healthIntegrationBoundaryRowLabel(row)}"),
            ("health integration boundary row value helper", "function healthIntegrationBoundaryRowValue(row: (typeof healthIntegrationBoundaryRows)[number])"),
            ("health integration boundary row value helper fields", "return row.value;"),
            ("health integration boundary row value helper binding", "{healthIntegrationBoundaryRowValue(row)}"),
            ("community screen title helper", "function communityScreenTitleLabel()"),
            ("community screen title helper fields", 'return "食物社群";'),
            ("community screen title helper binding", "{communityScreenTitleLabel()}"),
            ("community screen subtitle helper", "function communityScreenSubtitleCopy()"),
            ("community screen subtitle helper fields", 'return "同步真實食物升糖分享、點數與公開排行榜；貼文留言治理仍待正式開放。";'),
            ("community screen subtitle helper binding", "{communityScreenSubtitleCopy()}"),
            ("community posting status handler", "function showCommunityPostingStatus()"),
            ("community privacy status handler", "function showCommunityPrivacyStatus()"),
            ("food community backend-aware intro copy", "backend ready 時同步真實分享，visual smoke 或 backend unavailable 時才顯示本機預覽。"),
            ("food community Chinese-user real glycemic database positioning", "建立華人使用者真實食物升糖資料庫"),
            ("food community replaces theory and rumors positioning", "以實際食用前後血糖分享取代理論與網路傳言"),
            ("food community database section label helper", "function foodCommunityDatabaseSectionLabel()"),
            ("food community database section label helper fields", 'return "食物血糖資料庫";'),
            ("food community database section label helper binding", "{foodCommunityDatabaseSectionLabel()}"),
            ("food community database intro copy helper", "function foodCommunityDatabaseIntroCopy()"),
            ("food community database intro copy helper binding", "{foodCommunityDatabaseIntroCopy()}"),
            ("food community backend-aware empty copy", "backend ready 時會依搜尋同步，未連線時只篩選本機預覽。"),
            ("food community list empty title helper", "function foodCommunityListEmptyTitle()"),
            ("food community list empty title helper fields", 'return "沒有符合的食物";'),
            ("food community list empty title helper binding", "{foodCommunityListEmptyTitle()}"),
            ("food community list empty copy helper", "function foodCommunityListEmptyCopy()"),
            ("food community list empty copy helper binding", "{foodCommunityListEmptyCopy()}"),
            ("food community points store bridge current copy", "點數已串接商城，可兌換優惠券、商品折扣、特殊徽章與會員福利"),
            ("food community point rows helper binding", "const foodCommunityPointRows = foodCommunityDisplay.pointRows;"),
            ("food community syncs store points on open", 'if (currentScreen === "community") {\n      void loadCommunityPublicSettings();\n      void loadFoodCommunityCategories();\n      void loadCommunityFoods();\n      void loadStoreCatalogAndPoints();'),
            ("food community share count detail label helper", "function foodCommunityDetailShareCountLabel()"),
            ("food community share count detail label helper fields", 'return "分享總人數";'),
            ("food community share count detail label helper binding", "{foodCommunityDetailShareCountLabel()}"),
            ("food community average rise detail label helper", "function foodCommunityDetailAverageRiseLabel()"),
            ("food community average rise detail label helper fields", 'return "實際升糖參考值（平均）";'),
            ("food community average rise detail label helper binding", "{foodCommunityDetailAverageRiseLabel()}"),
            ("food community maximum rise detail label helper", "function foodCommunityDetailMaximumRiseLabel()"),
            ("food community maximum rise detail label helper fields", 'return "最高上升血糖";'),
            ("food community maximum rise detail label helper binding", "{foodCommunityDetailMaximumRiseLabel()}"),
            ("food community minimum rise detail label helper", "function foodCommunityDetailMinimumRiseLabel()"),
            ("food community minimum rise detail label helper fields", 'return "最低上升血糖";'),
            ("food community minimum rise detail label helper binding", "{foodCommunityDetailMinimumRiseLabel()}"),
            ("food community average rise unit", "{foodCommunityDetailAverageRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community maximum rise unit", "{foodCommunityDetailMaximumRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community minimum rise unit", "{foodCommunityDetailMinimumRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community individual share section label", "個別分享紀錄"),
            ("food community individual share render", "foodCommunityDetailIndividualShares(selectedFoodCommunityItem).map((share) =>"),
            ("food community individual share empty state", "尚未有可顯示的個別分享紀錄。"),
            ("food community share eaten date label helper", "function foodCommunityShareEatenDateLabel()"),
            ("food community share eaten date label helper fields", 'return "食用日期";'),
            ("food community share eaten date label helper binding", 'label={foodCommunityShareEatenDateLabel()}'),
            ("food community share eaten time label helper", "function foodCommunityShareEatenTimeLabel()"),
            ("food community share eaten time label helper fields", 'return "食用時間";'),
            ("food community share eaten time label helper binding", 'label={foodCommunityShareEatenTimeLabel()}'),
            ("food community detail sync function", "async function loadFoodCommunityDetail(itemId: string)"),
            ("food community detail endpoint", "`/community/foods/${boundedItemId}`"),
            ("food community list default item helper", "function foodCommunityListDefaultItemId(items: Array<{ id: string }>, fallbackId: string)"),
            ("food community list default item helper fields", "return items[0]?.id ?? fallbackId;"),
            ("food community list default item helper binding", "const nextSelectedItemId = foodCommunityListDefaultItemId(nextItems, selectedFoodCommunityItemId);"),
            ("food community list item title helper", "function foodCommunityListItemTitle(item: { title: string })"),
            ("food community list item title helper fields", "return item.title;"),
            ("food community list item title helper binding", "{foodCommunityListItemTitle(item)}"),
            ("food community list item metric summary helper", "function foodCommunityListItemMetricSummary(item: { metricSummary: string })"),
            ("food community list item metric summary helper fields", "return item.metricSummary;"),
            ("food community list item metric summary helper binding", "{foodCommunityListItemMetricSummary(item)}"),
            ("food community category summary helper", "function foodCommunityCategorySummary(category: { summary: string })"),
            ("food community category summary helper fields", "return category.summary;"),
            ("food community category summary helper binding", "{foodCommunityCategorySummary(selectedFoodCommunityCategoryDisplay)}"),
            ("food community detail list refresh", "void loadFoodCommunityDetail(nextSelectedItemId);"),
            ("food community detail selected refresh", "void loadFoodCommunityDetail(boundedItemId);"),
            ("food community detail selected item helper", "function foodCommunityDetailSelectedItemId(item: { id: string })"),
            ("food community detail selected item helper fields", "return item.id;"),
            ("food community detail selected item helper binding", "setSelectedFoodCommunityItemId(foodCommunityDetailSelectedItemId(detailedItem));"),
            ("food community detail refresh item helper", "function foodCommunityDetailRefreshItemId(item: { id: string })"),
            ("food community detail refresh item helper fields", "return item.id;"),
            ("food community detail refresh item helper binding", "const detailedItemId = foodCommunityDetailRefreshItemId(detailedItem);"),
            ("food community detail refresh item helper comparison", "current.map((item) => (item.id === detailedItemId ? detailedItem : item))"),
            ("food community detail status title helper", "function foodCommunityDetailStatusTitle(item: { title: string })"),
            ("food community detail status title helper fields", "return item.title;"),
            ("food community detail title helper", "function foodCommunityDetailTitle(item: { title: string })"),
            ("food community detail title helper fields", "return item.title;"),
            ("food community detail title display helper", "function foodCommunityDetailTitleDisplayText(item: { title: string })"),
            ("food community detail title display helper fields", "return `${foodCommunityDetailTitle(item)} 資料頁`;"),
            ("food community detail title display helper binding", "{foodCommunityDetailTitleDisplayText(selectedFoodCommunityItem)}"),
            ("food community detail panel visible helper", "function foodCommunityDetailPanelVisible(item: ReturnType<typeof foodCommunityItemDisplayItem> | null): item is ReturnType<typeof foodCommunityItemDisplayItem>"),
            ("food community detail panel visible helper fields", "return item !== null;"),
            ("food community detail panel visible helper binding", "foodCommunityDetailPanelVisible(selectedFoodCommunityItem) ? ("),
            ("food community detail share count helper", "function foodCommunityDetailShareCount(item: { shareCount: number })"),
            ("food community detail share count helper fields", "return item.shareCount;"),
            ("food community detail share count display helper", "function foodCommunityDetailShareCountDisplayText(item: { shareCount: number })"),
            ("food community detail share count display helper fields", "return String(foodCommunityDetailShareCount(item));"),
            ("food community detail share count display helper binding", "{foodCommunityDetailShareCountDisplayText(selectedFoodCommunityItem)}"),
            ("food community detail average rise helper", "function foodCommunityDetailAverageRise(item: { averageRise: number })"),
            ("food community detail average rise helper fields", "return item.averageRise;"),
            ("food community detail average rise display helper", "function foodCommunityDetailAverageRiseDisplayText(item: { averageRise: number })"),
            ("food community detail average rise display helper fields", "return `${foodCommunityDetailAverageRise(item)} mg/dL`;"),
            ("food community detail average rise display helper binding", "{foodCommunityDetailAverageRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community detail maximum rise helper", "function foodCommunityDetailMaximumRise(item: { maximumRise: number })"),
            ("food community detail maximum rise helper fields", "return item.maximumRise;"),
            ("food community detail maximum rise display helper", "function foodCommunityDetailMaximumRiseDisplayText(item: { maximumRise: number })"),
            ("food community detail maximum rise display helper fields", "return `${foodCommunityDetailMaximumRise(item)} mg/dL`;"),
            ("food community detail maximum rise display helper binding", "{foodCommunityDetailMaximumRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community detail minimum rise helper", "function foodCommunityDetailMinimumRise(item: { minimumRise: number })"),
            ("food community detail minimum rise helper fields", "return item.minimumRise;"),
            ("food community detail minimum rise display helper", "function foodCommunityDetailMinimumRiseDisplayText(item: { minimumRise: number })"),
            ("food community detail minimum rise display helper fields", "return `${foodCommunityDetailMinimumRise(item)} mg/dL`;"),
            ("food community detail minimum rise display helper binding", "{foodCommunityDetailMinimumRiseDisplayText(selectedFoodCommunityItem)}"),
            ("food community detail individual share section label helper", "function foodCommunityDetailIndividualShareSectionLabel()"),
            ("food community detail individual share section label helper fields", 'return "個別分享紀錄";'),
            ("food community detail individual share section label helper binding", "{foodCommunityDetailIndividualShareSectionLabel()}"),
            ("food community detail individual share empty text helper", "function foodCommunityDetailIndividualShareEmptyText()"),
            ("food community detail individual share empty text helper fields", 'return "尚未有可顯示的個別分享紀錄。";'),
            ("food community detail individual share empty text helper binding", "{foodCommunityDetailIndividualShareEmptyText()}"),
            ("food community detail individual shares helper", "function foodCommunityDetailIndividualShares(item: { individualShareDisplayItems: Array<{ id: string; summary: string; note: string }> })"),
            ("food community detail individual shares helper fields", "return item.individualShareDisplayItems;"),
            ("food community detail has individual shares helper", "function foodCommunityDetailHasIndividualShares(item: { individualShareDisplayItems: Array<{ id: string; summary: string; note: string }> })"),
            ("food community detail has individual shares helper fields", "return foodCommunityDetailIndividualShares(item).length > 0;"),
            ("food community detail has individual shares helper binding", "foodCommunityDetailHasIndividualShares(selectedFoodCommunityItem) ? ("),
            ("food community detail individual shares map helper binding", "foodCommunityDetailIndividualShares(selectedFoodCommunityItem).map((share) =>"),
            ("food community detail share row id helper", "function foodCommunityDetailShareRowId(share: { id: string })"),
            ("food community detail share row id helper fields", "return share.id;"),
            ("food community detail share row id helper binding", "key={foodCommunityDetailShareRowId(share)}"),
            ("food community detail share row summary helper", "function foodCommunityDetailShareRowSummary(share: { summary: string })"),
            ("food community detail share row summary helper fields", "return share.summary;"),
            ("food community detail share row summary helper binding", "{foodCommunityDetailShareRowSummary(share)}"),
            ("food community detail share row note helper", "function foodCommunityDetailShareRowNote(share: { note: string })"),
            ("food community detail share row note helper fields", "return share.note;"),
            ("food community detail share row note helper binding", "{foodCommunityDetailShareRowNote(share)}"),
            ("food community share field row key helper", "function foodCommunityShareFieldRowKey(row: (typeof foodCommunityShareFieldRows)[number])"),
            ("food community share field row key helper fields", "return row.label;"),
            ("food community share field row key helper binding", "key={foodCommunityShareFieldRowKey(row)}"),
            ("food community share field row label helper", "function foodCommunityShareFieldRowLabel(row: (typeof foodCommunityShareFieldRows)[number])"),
            ("food community share field row label helper fields", "return row.label;"),
            ("food community share field row label helper binding", "label={foodCommunityShareFieldRowLabel(row)}"),
            ("food community share field row value helper", "function foodCommunityShareFieldRowValue(row: (typeof foodCommunityShareFieldRows)[number])"),
            ("food community share field row value helper fields", "return row.value;"),
            ("food community share field row value helper binding", "value={foodCommunityShareFieldRowValue(row)}"),
            ("food community point row key helper", "function foodCommunityPointRowKey(row: (typeof foodCommunityPointRows)[number])"),
            ("food community point row key helper fields", "return row.label;"),
            ("food community point row key helper binding", "key={foodCommunityPointRowKey(row)}"),
            ("food community point row label helper", "function foodCommunityPointRowLabel(row: (typeof foodCommunityPointRows)[number])"),
            ("food community point row label helper fields", "return row.label;"),
            ("food community point row label helper binding", "{foodCommunityPointRowLabel(row)}"),
            ("food community point row value helper", "function foodCommunityPointRowValue(row: (typeof foodCommunityPointRows)[number])"),
            ("food community point row value helper fields", "return row.value;"),
            ("food community point row value helper binding", "{foodCommunityPointRowValue(row)}"),
            ("food community ranking row key helper", "function foodCommunityRankingRowKey(row: (typeof foodCommunityRankingRows)[number])"),
            ("food community ranking row key helper fields", "return row.label;"),
            ("food community ranking row key helper binding", "key={foodCommunityRankingRowKey(row)}"),
            ("food community ranking row label helper", "function foodCommunityRankingRowLabel(row: (typeof foodCommunityRankingRows)[number])"),
            ("food community ranking row label helper fields", "return row.label;"),
            ("food community ranking row label helper binding", "label={foodCommunityRankingRowLabel(row)}"),
            ("food community ranking row value helper", "function foodCommunityRankingRowValue(row: (typeof foodCommunityRankingRows)[number])"),
            ("food community ranking row value helper fields", "return row.value;"),
            ("food community ranking row value helper binding", "value={foodCommunityRankingRowValue(row)}"),
            ("food community detail status example count helper", "function foodCommunityDetailStatusExampleCount(item: { examples: unknown[] })"),
            ("food community detail status example count helper fields", "return item.examples.length;"),
            ("food community detail status title helper binding", "itemTitle: foodCommunityDetailStatusTitle(detailedItem),"),
            ("food community detail status example count helper binding", "exampleCount: foodCommunityDetailStatusExampleCount(detailedItem)"),
            ("food community detail status helper binding", "const detailStatus = foodCommunityDetailStatusMessages({"),
            ("food community detail in-flight guard", "foodCommunityDetailInFlightKeys.current.has(detailKey)"),
            ("food community detail in-flight status binding", "setCommunityActionStatus(detailStatus.inFlight);"),
            ("food community detail loading status binding", "setCommunityActionStatus(detailStatus.loading);"),
            ("food community detail success status binding", "setCommunityActionStatus(\n        foodCommunityDetailStatusMessages({"),
            ("food community detail failure status binding", "setCommunityActionStatus(detailStatus.failure);"),
            ("food community share fallback food name helper", "function foodCommunityShareFallbackFoodName(item: { title: string })"),
            ("food community share fallback food name helper fields", "return item.title;"),
            ("food community share fallback food name helper binding", "foodCommunityShareFields.foodName || foodCommunityShareFallbackFoodName(selectedFoodCommunityItem),"),
            ("food community share category helper", "function foodCommunityShareCategory(item: { category: FoodCommunityCategory })"),
            ("food community share category helper fields", "return item.category;"),
            ("food community share category helper binding", "category: apiFoodCategoryFromMobile(foodCommunityShareCategory(selectedFoodCommunityItem)),"),
            ("food community share section label helper", "function foodCommunityShareSectionLabel()"),
            ("food community share section label helper fields", 'return "食物分享紀錄";'),
            ("food community share section label helper binding", "{foodCommunityShareSectionLabel()}"),
            ("food community ranking section label helper", "function foodCommunityRankingSectionLabel()"),
            ("food community ranking section label helper fields", 'return "社群排行榜";'),
            ("food community ranking section label helper binding", "{foodCommunityRankingSectionLabel()}"),
            ("food community points store bridge copy helper", "function foodCommunityPointsStoreBridgeCopy()"),
            ("food community points store bridge copy helper fields", 'return "點數已串接商城，可兌換優惠券、商品折扣、特殊徽章與會員福利；出貨、付款與治理流程仍待正式開放。";'),
            ("food community points store bridge copy helper binding", "{foodCommunityPointsStoreBridgeCopy()}"),
            ("community public name preview label helper", "function communityPublicNamePreviewLabel()"),
            ("community public name preview label helper fields", 'return "公開顯示名稱預覽";'),
            ("community public name preview label helper binding", "{communityPublicNamePreviewLabel()}"),
            ("community hero icon label helper", "function communityHeroIconLabel()"),
            ("community hero icon label helper fields", 'return "群";'),
            ("community hero icon label helper binding", "{communityHeroIconLabel()}"),
            ("community public profile save accessibility helper", "function communityPublicProfileSaveAccessibilityLabel()"),
            ("community public profile save accessibility helper fields", 'return "儲存社群公開顯示名稱，不公開健康數值";'),
            ("community public profile save accessibility display label binding", "const communityPublicProfileSaveAccessibilityDisplayLabel = communityPublicProfileSaveAccessibilityLabel();"),
            ("community public profile save accessibility pressable binding", "accessibilityLabel={communityPublicProfileSaveAccessibilityDisplayLabel}"),
            ("community public profile save button helper", "function communityPublicProfileSaveButtonLabel()"),
            ("community public profile save button helper fields", 'return "儲存公開名稱";'),
            ("community public profile save button display label binding", "const communityPublicProfileSaveButtonDisplayLabel = communityPublicProfileSaveButtonLabel();"),
            ("community public profile save button text binding", "{communityPublicProfileSaveButtonDisplayLabel}"),
            ("community boundary row key helper", "function communityBoundaryRowKey(row: ReturnType<typeof communityBoundaryDisplayRows>[number])"),
            ("community boundary row key helper fields", "return row.label;"),
            ("community boundary row key helper binding", "key={communityBoundaryRowKey(row)}"),
            ("community boundary row label helper", "function communityBoundaryRowLabel(row: ReturnType<typeof communityBoundaryDisplayRows>[number])"),
            ("community boundary row label helper fields", "return row.label;"),
            ("community boundary row label helper binding", "{communityBoundaryRowLabel(row)}"),
            ("community boundary row value helper", "function communityBoundaryRowValue(row: ReturnType<typeof communityBoundaryDisplayRows>[number])"),
            ("community boundary row value helper fields", "return row.value;"),
            ("community boundary row value helper binding", "{communityBoundaryRowValue(row)}"),
            ("ranking screen title helper", "function rankingScreenTitleLabel()"),
            ("ranking screen title helper fields", 'return "社群排行";'),
            ("ranking screen title helper binding", "{rankingScreenTitleLabel()}"),
            ("ranking screen subtitle helper", "function rankingScreenSubtitleCopy()"),
            ("ranking screen subtitle helper fields", 'return "同步分享次數、貢獻度與食物測試達人公開榜單；只顯示 opt-in 使用者的非敏感分數。";'),
            ("ranking screen subtitle helper binding", "{rankingScreenSubtitleCopy()}"),
            ("ranking local streak preview label helper", "function rankingLocalStreakPreviewLabel()"),
            ("ranking local streak preview label helper fields", 'return "本機連續記錄預覽";'),
            ("ranking local streak preview label helper binding", "{rankingLocalStreakPreviewLabel()}"),
            ("ranking local preview boundary copy helper", "function rankingLocalPreviewBoundaryCopyText()"),
            ("ranking local preview boundary copy helper fields", "return rankingLocalPreviewBoundaryDisplayText;"),
            ("ranking local preview boundary copy helper binding", "{rankingLocalPreviewBoundaryCopyText()}"),
            ("ranking hero icon label helper", "function rankingHeroIconLabel()"),
            ("ranking hero icon label helper fields", 'return "榜";'),
            ("ranking hero icon label helper binding", "{rankingHeroIconLabel()}"),
            ("ranking streak display label helper", "function rankingStreakDisplayLabel(days: number)"),
            ("ranking streak display label helper fields", "return `${days} 天`;"),
            ("ranking streak display text helper", "function rankingStreakDisplayText()"),
            ("ranking streak display text helper fields", "return rankingStreakDisplayLabel(rankingStreakDisplayDays);"),
            ("ranking streak display text helper binding", "{rankingStreakDisplayText()}"),
            ("ranking boundary row key helper", "function rankingBoundaryRowKey(row: ReturnType<typeof rankingBoundaryDisplayRows>[number])"),
            ("ranking boundary row key helper fields", "return row.label;"),
            ("ranking boundary row key helper binding", "key={rankingBoundaryRowKey(row)}"),
            ("ranking boundary row label helper", "function rankingBoundaryRowLabel(row: ReturnType<typeof rankingBoundaryDisplayRows>[number])"),
            ("ranking boundary row label helper fields", "return row.label;"),
            ("ranking boundary row label helper binding", "{rankingBoundaryRowLabel(row)}"),
            ("ranking boundary row value helper", "function rankingBoundaryRowValue(row: ReturnType<typeof rankingBoundaryDisplayRows>[number])"),
            ("ranking boundary row value helper fields", "return row.value;"),
            ("ranking boundary row value helper binding", "{rankingBoundaryRowValue(row)}"),
            ("ranking leaderboard section key helper", "function rankingLeaderboardSectionKey(section: (typeof rankingLeaderboardSections)[number])"),
            ("ranking leaderboard section key helper fields", "return section.type;"),
            ("ranking leaderboard section key helper binding", "key={rankingLeaderboardSectionKey(section)}"),
            ("ranking leaderboard section label helper", "function rankingLeaderboardSectionLabel(section: (typeof rankingLeaderboardSections)[number])"),
            ("ranking leaderboard section label helper fields", "return section.label;"),
            ("ranking leaderboard section label helper binding", "{rankingLeaderboardSectionLabel(section)}"),
            ("ranking leaderboard section has entries helper", "function rankingLeaderboardSectionHasEntries(section: (typeof rankingLeaderboardSections)[number])"),
            ("ranking leaderboard section has entries helper fields", "return section.entries.length > 0;"),
            ("ranking leaderboard section has entries helper binding", "{rankingLeaderboardSectionHasEntries(section) ? ("),
            ("ranking leaderboard entry key helper", 'function rankingLeaderboardEntryKey(entry: (typeof rankingLeaderboardSections)[number]["entries"][number])'),
            ("ranking leaderboard entry key helper fields", "return entry.id;"),
            ("ranking leaderboard entry key helper binding", "key={rankingLeaderboardEntryKey(entry)}"),
            ("ranking leaderboard entry rank label helper", 'function rankingLeaderboardEntryRankLabel(entry: (typeof rankingLeaderboardSections)[number]["entries"][number])'),
            ("ranking leaderboard entry rank label helper fields", "return entry.rankLabel;"),
            ("ranking leaderboard entry rank label helper binding", "{rankingLeaderboardEntryRankLabel(entry)}"),
            ("ranking leaderboard entry display name helper", 'function rankingLeaderboardEntryDisplayName(entry: (typeof rankingLeaderboardSections)[number]["entries"][number])'),
            ("ranking leaderboard entry display name helper fields", "return entry.displayName;"),
            ("ranking leaderboard entry display name helper binding", "{rankingLeaderboardEntryDisplayName(entry)}"),
            ("ranking leaderboard entry score label helper", 'function rankingLeaderboardEntryScoreLabel(entry: (typeof rankingLeaderboardSections)[number]["entries"][number])'),
            ("ranking leaderboard entry score label helper fields", "return entry.scoreLabel;"),
            ("ranking leaderboard entry score label helper binding", "{rankingLeaderboardEntryScoreLabel(entry)}"),
            ("ranking leaderboard section empty copy helper", "function rankingLeaderboardSectionEmptyCopy(section: (typeof rankingLeaderboardSections)[number])"),
            ("ranking leaderboard section empty copy helper fields", "return section.emptyCopy;"),
            ("ranking leaderboard section empty copy helper binding", "{rankingLeaderboardSectionEmptyCopy(section)}"),
            ("ranking readiness section label helper", "function rankingReadinessSectionLabel()"),
            ("ranking readiness section label helper fields", "return futurePreviewDisplayLabels.formalReadiness;"),
            ("ranking readiness section label helper binding", "{rankingReadinessSectionLabel()}"),
            ("ranking readiness checklist item key helper", "function rankingReadinessChecklistItemKey(item: string)"),
            ("ranking readiness checklist item key helper fields", "return item;"),
            ("ranking readiness checklist item key helper binding", "key={rankingReadinessChecklistItemKey(item)}"),
            ("ranking readiness checklist item text helper", "function rankingReadinessChecklistItemText(item: string)"),
            ("ranking readiness checklist item text helper fields", "return item;"),
            ("ranking readiness checklist item text helper binding", "text={rankingReadinessChecklistItemText(item)}"),
            ("ranking close accessibility helper", "function rankingCloseAccessibilityLabel()"),
            ("ranking close accessibility helper fields", "return auxiliaryDisplayLabels.closeReturn;"),
            ("ranking close accessibility display label binding", "const rankingCloseAccessibilityDisplayLabel = rankingCloseAccessibilityLabel();"),
            ("ranking close accessibility helper binding", "accessibilityLabel={rankingCloseAccessibilityDisplayLabel}"),
            ("ranking close button helper", "function rankingCloseButtonLabel()"),
            ("ranking close button helper fields", 'return "×";'),
            ("ranking close button display label binding", "const rankingCloseButtonDisplayLabel = rankingCloseButtonLabel();"),
            ("ranking close button helper binding", "{rankingCloseButtonDisplayLabel}"),
            ("ranking close press helper", "function rankingClosePressHandler()"),
            ("ranking close press helper fields", "return returnFromRankingPreview;"),
            ("ranking close press target binding", "const rankingClosePressTarget = rankingClosePressHandler();"),
            ("ranking close press helper binding", "onPress={rankingClosePressTarget}"),
            ("ranking preview boundary badge helper", "function rankingPreviewBoundaryBadgeLabel()"),
            ("ranking preview boundary badge helper fields", "return rankingPreviewBoundaryDisplay.badge;"),
            ("ranking preview boundary badge helper binding", "{rankingPreviewBoundaryBadgeLabel()}"),
            ("ranking preview boundary copy helper", "function rankingPreviewBoundaryCopyText()"),
            ("ranking preview boundary copy helper fields", "return rankingPreviewBoundaryDisplay.copy;"),
            ("ranking preview boundary copy helper binding", "{rankingPreviewBoundaryCopyText()}"),
            ("ranking public action accessibility helper", "function rankingPublicActionAccessibilityLabel()"),
            ("ranking public action accessibility helper fields", "return futurePreviewDisplayLabels.rankingPublicAccessibility;"),
            ("ranking public action accessibility display label binding", "const rankingPublicActionAccessibilityDisplayLabel = rankingPublicActionAccessibilityLabel();"),
            ("ranking public action accessibility helper binding", "accessibilityLabel={rankingPublicActionAccessibilityDisplayLabel}"),
            ("ranking public action button helper", "function rankingPublicActionButtonLabel()"),
            ("ranking public action button helper fields", "return futurePreviewDisplayLabels.rankingPublicButton;"),
            ("ranking public action button display label binding", "const rankingPublicActionButtonDisplayLabel = rankingPublicActionButtonLabel();"),
            ("ranking public action button helper binding", "{rankingPublicActionButtonDisplayLabel}"),
            ("ranking public action press helper", "function rankingPublicActionPressHandler()"),
            ("ranking public action press helper fields", "return showRankingPublicStatus;"),
            ("ranking public action press target binding", "const rankingPublicActionPressTarget = rankingPublicActionPressHandler();"),
            ("ranking public action press helper binding", "onPress={rankingPublicActionPressTarget}"),
            ("ranking opt-in action accessibility helper", "function rankingOptInActionAccessibilityLabel(label: string)"),
            ("ranking opt-in action accessibility helper fields", "return label;"),
            ("ranking opt-in action accessibility display label binding", "const rankingOptInAccessibilityDisplayLabel = rankingOptInActionAccessibilityLabel(communityActionDisplay.rankingOptInAccessibility);"),
            ("ranking opt-in action button helper", "function rankingOptInActionButtonLabel(label: string)"),
            ("ranking opt-in action button helper fields", "return label;"),
            ("ranking opt-in action button display label binding", "const rankingOptInButtonDisplayLabel = rankingOptInActionButtonLabel(communityActionDisplay.rankingOptInButton);"),
            ("ranking opt-in action press helper", "function rankingOptInActionPressHandler()"),
            ("ranking opt-in action press helper fields", "return showRankingOptInStatus;"),
            ("ranking opt-in action press target binding", "const rankingOptInActionPressTarget = rankingOptInActionPressHandler();"),
            ("ranking opt-in action press helper binding", "onPress={rankingOptInActionPressTarget}"),
            ("ranking action status label helper", "function rankingActionStatusLabel()"),
            ("ranking action status label helper fields", "return futurePreviewDisplayLabels.rankingStatus;"),
            ("ranking action status label helper binding", "{rankingActionStatusLabel()}"),
            ("ranking action status text helper", "function rankingActionStatusText()"),
            ("ranking action status text helper fields", "return rankingActionStatusDisplayText;"),
            ("ranking action status text helper binding", "{rankingActionStatusText()}"),
            ("ranking action status visible helper", "function rankingActionStatusVisible()"),
            ("ranking action status visible helper fields", "return Boolean(rankingActionStatus);"),
            ("ranking action status visible helper binding", "{rankingActionStatusVisible() ? ("),
            ("ranking return future modules accessibility helper", "function rankingReturnFutureModulesAccessibilityLabel()"),
            ("ranking return future modules accessibility helper fields", "return futurePreviewDisplayLabels.returnFutureModulesAccessibility;"),
            ("ranking return future modules accessibility display label binding", "const rankingReturnFutureModulesAccessibilityDisplayLabel = rankingReturnFutureModulesAccessibilityLabel();"),
            ("ranking return future modules accessibility helper binding", "accessibilityLabel={rankingReturnFutureModulesAccessibilityDisplayLabel}"),
            ("ranking return future modules button helper", "function rankingReturnFutureModulesButtonLabel()"),
            ("ranking return future modules button helper fields", "return futurePreviewDisplayLabels.returnFutureModules;"),
            ("ranking return future modules button display label binding", "const rankingReturnFutureModulesButtonDisplayLabel = rankingReturnFutureModulesButtonLabel();"),
            ("ranking return future modules button helper binding", "{rankingReturnFutureModulesButtonDisplayLabel}"),
            ("ranking return future modules press helper", "function rankingReturnFutureModulesPressHandler()"),
            ("ranking return future modules press helper fields", "return returnFromRankingPreview;"),
            ("ranking return future modules press target binding", "const rankingReturnFutureModulesPressTarget = rankingReturnFutureModulesPressHandler();"),
            ("ranking return future modules press helper binding", "onPress={rankingReturnFutureModulesPressTarget}"),
            ("community public display name accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.communityPublicDisplayNameAccessibility}"),
            ("food community share food name accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareFoodNameAccessibility}"),
            ("food community share eaten date accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenDateAccessibility}"),
            ("food community share eaten time accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenTimeAccessibility}"),
            ("food community share before glucose accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareBeforeGlucoseAccessibility}"),
            ("food community share after glucose accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareAfterGlucoseAccessibility}"),
            ("food community share note accessibility auxiliary binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareNoteAccessibility}"),
            ("food community category api type import", "type FoodCommunityApiCategoryRead,"),
            ("food community backend category state", "const [foodCommunityBackendCategories, setFoodCommunityBackendCategories]"),
            ("food community backend category options", "const foodCommunityCategoriesForDisplay = foodCommunityDisplay.categoriesForDisplay;"),
            ("food community category sync function", "async function loadFoodCommunityCategories()"),
            ("food community category endpoint", '"/community/foods/categories"'),
            ("food community category open sync", "void loadFoodCommunityCategories();"),
            ("food community display bundle helper binding", "const foodCommunityDisplay = useMemo("),
            ("food community display bundle backend categories", "backendCategories: foodCommunityBackendCategories"),
            ("food community display bundle backend items", "backendItems: foodCommunityBackendItems"),
            ("food community display bundle selected category", "selectedCategory: foodCommunityCategory"),
            ("food community sync status helper binding", "const foodCommunitySyncStatus = foodCommunitySyncStatusMessages({"),
            ("food community sync unavailable status binding", "setCommunityActionStatus(foodCommunitySyncStatus.unavailable);"),
            ("food community backend search query variable", "const searchQuery = foodCommunitySearchText.trim();"),
            ("food community backend search all categories", 'const category = searchQuery ? "" : apiFoodCategoryFromMobile(foodCommunityCategory);'),
            ("food community backend category only without search", 'if (category) {\n      query.set("category", category);\n    }'),
            ("food community backend all categories cache key", 'category || "all-categories"'),
            ("food community sync in-flight status binding", "setCommunityActionStatus(foodCommunitySyncStatus.inFlight);"),
            ("food community sync loading status binding", "setCommunityActionStatus(foodCommunitySyncStatus.loading);"),
            ("food community sync success status binding", "setCommunityActionStatus(\n        foodCommunitySyncStatusMessages({"),
            ("food community sync failure status binding", "setCommunityActionStatus(foodCommunitySyncStatus.failure);"),
            ("food community share field rows helper binding", "const foodCommunityShareFieldRows = foodCommunityDisplay.shareFieldRows;"),
            ("food community point rows helper binding", "const foodCommunityPointRows = foodCommunityDisplay.pointRows;"),
            ("food community ranking rows helper binding", "const foodCommunityRankingRows = foodCommunityDisplay.rankingRows;"),
            ("community action display helper binding", "const communityActionDisplay = communityActionDisplayTexts({"),
            ("food community share bounded button label", "const foodCommunityShareButtonDisplayLabel = communityActionDisplay.foodCommunityShareButton;"),
            ("food community share bounded accessibility label", "const foodCommunityShareAccessibilityDisplayLabel = communityActionDisplay.foodCommunityShareAccessibility;"),
            ("food community backend-aware leaderboard label", "{foodCommunityRankingSectionLabel()}"),
            ("food community share food name updater", "function updateFoodCommunityFoodName(value: string)"),
            ("food community share eaten date updater", "function updateFoodCommunityEatenDate(value: string)"),
            ("food community share eaten time updater", "function updateFoodCommunityEatenTime(value: string)"),
            ("food community share food name input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareFoodNameAccessibility}"),
            ("food community share food name binding", "onChangeText={updateFoodCommunityFoodName}"),
            ("food community share eaten date input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenDateAccessibility}"),
            ("food community share eaten time input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareEatenTimeAccessibility}"),
            ("food community share before glucose input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareBeforeGlucoseAccessibility}"),
            ("food community share after glucose input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareAfterGlucoseAccessibility}"),
            ("food community share note input", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunityShareNoteAccessibility}"),
            ("food community share eaten date binding", "onChangeText={updateFoodCommunityEatenDate}"),
            ("food community share eaten time binding", "onChangeText={updateFoodCommunityEatenTime}"),
            ("food community share eaten date max length", "maxLength={maxDateInputLength}"),
            ("food community share eaten time max length", "maxLength={maxTimeInputLength}"),
            ("food community share food name payload", "food_name: foodName"),
            ("food community share eaten_at payload", "eaten_at: eatenAt"),
            ("food community share eaten_at local parser", "eatenAt = localDateTimeToIso(foodCommunityShareFields.eatenDate, foodCommunityShareFields.eatenTime);"),
            ("food community share before glucose payload", "before_glucose: beforeGlucose"),
            ("food community share after glucose payload", "after_glucose: afterGlucose"),
            ("food community share status helper binding", "const shareStatus = foodCommunityShareStatusMessages({"),
            ("food community share visual-smoke binding", "setCommunityActionStatus(shareStatus.visualSmoke);"),
            ("food community share unavailable binding", "setCommunityActionStatus(shareStatus.unavailable);"),
            ("food community share in-flight binding", "setCommunityActionStatus(shareStatus.inFlight);"),
            ("food community share food name validation", "setCommunityActionStatus(shareStatus.missingFoodName);"),
            ("food community share glucose validation binding", "setCommunityActionStatus(shareStatus.invalidGlucose);"),
            ("food community share time validation binding", "timeErrorMessage: error instanceof Error ? error.message : \"食用時間格式不正確。\""),
            ("food community share loading status binding", "setCommunityActionStatus(shareStatus.loading);"),
            ("food community share selected item helper", "function foodCommunityShareSelectedItemId(item: { id: string })"),
            ("food community share selected item helper fields", "return item.id;"),
            ("food community share selected item helper binding", "setSelectedFoodCommunityItemId(foodCommunityShareSelectedItemId(updatedFood));"),
            ("food community share refresh item helper", "function foodCommunityShareRefreshItemId(item: { id: string })"),
            ("food community share refresh item helper fields", "return item.id;"),
            ("food community share refresh item helper binding", "const updatedFoodId = foodCommunityShareRefreshItemId(updatedFood);"),
            ("food community share refresh item helper filter", "current.filter((item) => item.id !== updatedFoodId)"),
            ("food community share success status binding", "setCommunityActionStatus(\n        foodCommunityShareStatusMessages({"),
            ("food community share failure status binding", "setCommunityActionStatus(shareStatus.failure);"),
            ("community public settings status helper binding", "const publicSettingsStatus = communityPublicSettingsStatusMessages({"),
            ("community public settings load failure binding", "communityPublicSettingsStatusMessages({\n          backendUnavailableMessage: protectedAccountBackendUnavailableMessage,"),
            ("community public settings visual-smoke binding", "setCommunityActionStatus(publicSettingsStatus.visualSmoke);"),
            ("community public settings unavailable binding", "setCommunityActionStatus(publicSettingsStatus.unavailable);"),
            ("community public settings missing name binding", "setCommunityActionStatus(publicSettingsStatus.missingDisplayName);"),
            ("community public settings success binding", "setCommunityActionStatus(\n        communityPublicSettingsStatusMessages({"),
            ("community public settings failure binding", "setCommunityActionStatus(publicSettingsStatus.failure);"),
            ("food community search input handler", "function updateFoodCommunitySearchInput(value: string)"),
            ("food community category select handler", "function selectFoodCommunityCategory(category: FoodCommunityCategory)"),
            ("food community category press handler", "function pressFoodCommunityCategoryOption(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option key helper", "function foodCommunityCategoryOptionKey(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option key helper fields", "return category.value;"),
            ("food community category option key helper binding", "key={foodCommunityCategoryOptionKey(category)}"),
            ("food community category option accessibility label helper", "function foodCommunityCategoryOptionAccessibilityLabel(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option accessibility label helper fields", "return category.accessibilityLabel;"),
            ("food community category option accessibility label helper binding", "accessibilityLabel={foodCommunityCategoryOptionAccessibilityLabel(category)}"),
            ("food community category option label helper", "function foodCommunityCategoryOptionLabel(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option label helper fields", "return category.label;"),
            ("food community category option label helper binding", "{foodCommunityCategoryOptionLabel(category)}"),
            ("food community category option selected helper", "function foodCommunityCategoryOptionSelected(category: ReturnType<typeof foodCommunityCategoryDisplayItem>, selectedCategory: FoodCommunityCategory)"),
            ("food community category option selected helper fields", "return selectedCategory === category.value;"),
            ("food community category option selected helper state binding", "accessibilityState={{ selected: foodCommunityCategoryOptionSelected(category, foodCommunityCategory) }}"),
            ("food community category option selected helper pill style binding", "foodCommunityCategoryOptionSelected(category, foodCommunityCategory) ? styles.segmentActive : null"),
            ("food community category option selected helper text style binding", "foodCommunityCategoryOptionSelected(category, foodCommunityCategory) ? styles.segmentTextActive : null"),
            ("food community item select handler", "function selectFoodCommunityItem(itemId: string)"),
            ("food community item press handler", "function pressFoodCommunityItem(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community item target helper", "function foodCommunityItemTarget(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community item target helper fields", "return item.id;"),
            ("food community item target helper binding", "selectFoodCommunityItem(foodCommunityItemTarget(item));"),
            ("food community list item key helper", "function foodCommunityListItemKey(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community list item key helper fields", "return item.id;"),
            ("food community list item key helper binding", "key={foodCommunityListItemKey(item)}"),
            ("food community list item accessibility label helper", "function foodCommunityListItemAccessibilityLabel(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community list item accessibility label helper fields", "return item.accessibilityLabel;"),
            ("food community list item accessibility label helper binding", "accessibilityLabel={foodCommunityListItemAccessibilityLabel(item)}"),
            ("food community list item selected helper", "function foodCommunityListItemSelected("),
            ("food community list item selected helper fields", "return selectedItem?.id === item.id;"),
            ("food community list item selected helper state binding", "accessibilityState={{ selected: foodCommunityListItemSelected(item, selectedFoodCommunityItem) }}"),
            ("food community list item selected helper style binding", "foodCommunityListItemSelected(item, selectedFoodCommunityItem) ? styles.recordCardSelected : null"),
            ("food community list empty helper", "function foodCommunityListIsEmpty(items: Array<ReturnType<typeof foodCommunityItemDisplayItem>>)"),
            ("food community list empty helper fields", "return items.length === 0;"),
            ("food community list empty helper binding", "foodCommunityListIsEmpty(visibleFoodCommunityItems) ? ("),
            ("food community share status handler", "function showFoodCommunityShareStatus()"),
            ("commerce search input value helper", "function commerceSearchInputValue(value: string)"),
            ("commerce search input value helper fields", "return boundStoreSearchText(value);"),
            ("food community search input helper binding", "setFoodCommunitySearchText(commerceSearchInputValue(value));"),
            ("ranking public status handler", "function showRankingPublicStatus()"),
            ("ranking opt-in status handler", "function showRankingOptInStatus()"),
            ("doctor share token status binding", "onPress={showDoctorShareTokenStatus}"),
            ("doctor share report status binding", "onPress={showDoctorShareReportBoundaryStatus}"),
            ("health integration permission status binding", "onPress={showHealthIntegrationPermissionStatus}"),
            ("health integration meter status binding", "onPress={showHealthIntegrationMeterStatus}"),
            ("community posting status binding", "onPress={showCommunityPostingStatus}"),
            ("community privacy status binding", "onPress={showCommunityPrivacyStatus}"),
            ("food community search input binding", "onChangeText={updateFoodCommunitySearchInput}"),
            ("food community category press binding", "onPress={() => pressFoodCommunityCategoryOption(category)}"),
            ("food community item press binding", "onPress={() => pressFoodCommunityItem(item)}"),
            ("food community share status binding", "onPress={showFoodCommunityShareStatus}"),
            ("food community share accessibility binding", "accessibilityLabel={foodCommunityShareAccessibilityDisplayLabel}"),
            ("food community share button label binding", "{foodCommunityShareButtonDisplayLabel}"),
            ("ranking public status binding", "onPress={rankingPublicActionPressTarget}"),
            ("ranking opt-in status binding", "onPress={rankingOptInActionPressTarget}"),
            ("ranking opt-in dynamic button label", "const rankingOptInButtonDisplayLabel = rankingOptInActionButtonLabel(communityActionDisplay.rankingOptInButton);"),
            ("ranking opt-in dynamic accessibility label", "const rankingOptInAccessibilityDisplayLabel = rankingOptInActionAccessibilityLabel(communityActionDisplay.rankingOptInAccessibility);"),
            ("doctor token accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.doctorTokenAccessibility}"),
            ("doctor report accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.doctorReportAccessibility}"),
            ("health permission accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.healthPermissionAccessibility}"),
            ("health meter accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.healthMeterAccessibility}"),
            ("community post accessibility binding", "accessibilityLabel={communityPostAccessibilityDisplayLabel}"),
            ("community privacy accessibility binding", "accessibilityLabel={communityPrivacyAccessibilityDisplayLabel}"),
            ("community privacy dynamic button binding", "{rankingOptInButtonDisplayLabel}"),
            ("food community promoted title", "{communityScreenTitleLabel()}"),
            ("ranking promoted title", "{rankingScreenTitleLabel()}"),
            ("food community search accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunitySearchInputAccessibility}"),
            ("food community category accessibility binding", "accessibilityLabel={foodCommunityCategoryOptionAccessibilityLabel(category)}"),
            ("food community category selected state", "accessibilityState={{ selected: foodCommunityCategoryOptionSelected(category, foodCommunityCategory) }}"),
            ("food community item accessibility binding", "accessibilityLabel={foodCommunityListItemAccessibilityLabel(item)}"),
            ("food community selected state", "accessibilityState={{ selected: foodCommunityListItemSelected(item, selectedFoodCommunityItem) }}"),
            ("food community share fields", "foodCommunityShareFieldRows.map"),
            ("food community point rows", "foodCommunityPointRows.map"),
            ("food community ranking rows", "foodCommunityRankingRows.map"),
            ("ranking backend sync function", "async function loadCommunityLeaderboards()"),
            ("ranking sync status helper binding", "const leaderboardSyncStatus = communityLeaderboardSyncStatusMessages({"),
            ("ranking sync unavailable status binding", "setRankingActionStatus(leaderboardSyncStatus.unavailable);"),
            ("ranking sync in-flight status binding", "setRankingActionStatus(leaderboardSyncStatus.inFlight);"),
            ("ranking sync loading status binding", "setRankingActionStatus(leaderboardSyncStatus.loading);"),
            ("ranking sync success status binding", "setRankingActionStatus(\n        communityLeaderboardSyncStatusMessages({"),
            ("ranking sync failure status binding", "setRankingActionStatus(leaderboardSyncStatus.failure);"),
            ("ranking backend endpoint", "`/community/leaderboards?${query.toString()}`"),
            ("ranking share count type", '"share_count"'),
            ("ranking contribution type", '"contribution"'),
            ("ranking food tester type", '"food_tester"'),
            ("ranking display sections state", "const [rankingLeaderboardSections, setRankingLeaderboardSections]"),
            ("ranking section render", "rankingLeaderboardSections.map((section) =>"),
            ("ranking entry render", "section.entries.map((entry) =>"),
            ("ranking public status loads backend", "void loadCommunityLeaderboards();"),
            ("ranking public accessibility binding", "accessibilityLabel={rankingPublicActionAccessibilityDisplayLabel}"),
            ("ranking public button label binding", "{rankingPublicActionButtonDisplayLabel}"),
            ("ranking opt-in dynamic accessibility binding", "accessibilityLabel={rankingOptInAccessibilityDisplayLabel}"),
            ("ranking opt-in dynamic button binding", "{rankingOptInButtonDisplayLabel}"),
            ("future preview return accessibility binding", "accessibilityLabel={communityReturnFutureModulesAccessibilityDisplayLabel}"),
            ("future preview secondary CTA button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
        ):
            _assert_contains(label, content, marker)
        settings_profile_choice_render_block = _match_block(
            content,
            r"profileChoiceDisplayItems\.map\(\(profile\) => \{([\s\S]*?pressSettingsProfileChoice\(profile\)[\s\S]*?</Pressable>)",
            "settings profile choice render block",
        )
        for label, marker in (
            ("direct settings profile key binding", "key={profile.id}"),
            ("direct settings profile accessibility binding", "accessibilityLabel={profile.accessibilityLabel}"),
            ("direct settings profile selected state binding", "profile.sourceId === activeProfileId"),
            ("direct settings profile label binding", "{profile.label}"),
        ):
            _assert_not_contains(label, settings_profile_choice_render_block, marker)
        settings_llm_choice_render_block = _match_block(
            content,
            r"llmModelChoiceDisplayItems\.map\(\(model\) => \{([\s\S]*?pressSettingsLlmModelChoice\(model\)[\s\S]*?</Pressable>)",
            "settings LLM model choice render block",
        )
        for label, marker in (
            ("direct LLM model key binding", "key={model.id}"),
            ("direct LLM model accessibility binding", "accessibilityLabel={model.accessibilityLabel}"),
            ("direct LLM model disabled binding", "!model.available || isAnyRequestInFlight"),
            ("direct LLM model selected state binding", "model.sourceId === llmModelId"),
            ("direct LLM model available text binding", "!model.available ? styles.chipTextDisabled : null"),
            ("direct LLM model label binding", "{model.label}"),
        ):
            _assert_not_contains(label, settings_llm_choice_render_block, marker)
        settings_stt_choice_render_block = _match_block(
            content,
            r"sttModelChoiceDisplayItems\.map\(\(model\) => \{([\s\S]*?pressSettingsSttModelChoice\(model\)[\s\S]*?</Pressable>)",
            "settings STT model choice render block",
        )
        for label, marker in (
            ("direct STT model key binding", "key={model.id}"),
            ("direct STT model accessibility binding", "accessibilityLabel={model.accessibilityLabel}"),
            ("direct STT model disabled binding", "!model.available || isAnyRequestInFlight"),
            ("direct STT model selected state binding", "model.sourceId === sttModelId"),
            ("direct STT model available text binding", "!model.available ? styles.chipTextDisabled : null"),
            ("direct STT model label binding", "{model.label}"),
        ):
            _assert_not_contains(label, settings_stt_choice_render_block, marker)
        recording_whisper_model_render_block = _match_block(
            content,
            r"downloadedWhisperModelChoiceItems\.map\(\(model\) => \{([\s\S]*?pressRecordingWhisperModelChoice\(model\)[\s\S]*?</Pressable>)",
            "recording Whisper model choice render block",
        )
        for label, marker in (
            ("direct recording Whisper model selected binding", "model.sourceUri === whisperModelPath"),
            ("direct recording Whisper model key binding", "key={model.sourceUri}"),
            ("direct recording Whisper model accessibility binding", "accessibilityLabel={model.accessibilityLabel}"),
            ("direct recording Whisper model label binding", "{model.label}"),
            ("direct recording Whisper model selected label binding", "{model.selectedLabel}"),
        ):
            _assert_not_contains(label, recording_whisper_model_render_block, marker)
        for label, marker in (
            ("settings model display label helper", "function modelOptionDisplayLabel(model: ModelChoiceDisplaySource)"),
            ("settings model disabled copy", "（未啟用）"),
            ("profile settings display item helper", "function settingsProfileChoiceDisplayItem(profile: ProfileChoiceDisplaySource)"),
            ("profile settings display items helper", "function settingsProfileChoiceDisplayItems(profiles: ProfileChoiceDisplaySource[])"),
            ("profile settings display items map", "return profiles.map(settingsProfileChoiceDisplayItem);"),
            ("profile settings option accessibility label", "`選擇照護對象：${label}；只切換本機 active profile，不寫入個資`"),
            ("model settings display item helper", 'function settingsModelChoiceDisplayItem<T extends ModelChoiceDisplaySource>(model: T, kind: "LLM" | "STT")'),
            ("model settings display items helper", 'function settingsModelChoiceDisplayItems<T extends ModelChoiceDisplaySource>(models: T[], kind: "LLM" | "STT")'),
            ("model settings display items map", "return models.map((model) => settingsModelChoiceDisplayItem(model, kind));"),
            ("model settings option accessibility label", "`選擇${kind}模型：${label}；未啟用模型不可選，雲端 fallback 預設停用`"),
            ("settings choice display bundle helper", "function settingsChoiceDisplayBundle<"),
            ("settings choice display bundle profile items", "profileChoiceDisplayItems: settingsProfileChoiceDisplayItems(value.profiles)"),
            ("settings choice display bundle llm items", 'llmModelChoiceDisplayItems: settingsModelChoiceDisplayItems(value.llmModels, "LLM")'),
            ("settings choice display bundle stt items", 'sttModelChoiceDisplayItems: settingsModelChoiceDisplayItems(value.sttModels, "STT")'),
            ("settings choice display bundle auth sessions", "authSessionDisplayItems: authSessionDisplayListItems(value.authSessions)"),
            ("downloaded model display label helper", "function downloadedModelDisplayLabel(value: DownloadedModelDisplaySource)"),
            ("downloaded model checksum copy", "md5 ${boundIdentifier(value.md5).slice(0, 12)}"),
            ("downloaded whisper model display helper", "function downloadedWhisperModelDisplayItem(value: DownloadedModelDisplaySource)"),
            ("downloaded whisper model display items helper", "function downloadedWhisperModelDisplayItems(values: DownloadedModelDisplaySource[])"),
            ("downloaded whisper model display items filter", '.filter((model) => model.kind === "whisper" && model.exists)'),
            ("downloaded whisper model display items map", ".map(downloadedWhisperModelDisplayItem);"),
            ("downloaded whisper model accessibility label", "`選擇本機 Whisper 模型：${fileName}，只用於本機錄音轉文字`"),
        ):
            _assert_contains(label, settings_choice_display_content, marker)
        for label, marker in (
            ("downloaded model row key helper", "function downloadedModelRowKey(model: DownloadedModel)"),
            ("downloaded model row key helper fields", "return model.uri;"),
            ("downloaded model row key helper binding", "key={downloadedModelRowKey(model)}"),
            ("downloaded model row label helper", "function downloadedModelRowLabel(model: DownloadedModel)"),
            ("downloaded model row label helper fields", "return downloadedModelDisplayLabel(model);"),
            ("downloaded model row label helper binding", "{downloadedModelRowLabel(model)}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("AI model option bound helper", "function boundAiModelOption<T extends AiModelOptionTransformSource>(value: T): T"),
            ("AI model option id bound", "id: boundIdentifier(value.id)"),
            ("AI model option availability bool", "available: Boolean(value.available)"),
            ("AI model options list bound", "stt_models: value.stt_models.slice(0, maxMobileModelOptions).map(boundAiModelOption)"),
            ("AI model options LLM list bound", "llm_models: value.llm_models.slice(0, maxMobileModelOptions).map(boundAiModelOption)"),
        ):
            _assert_contains(label, ai_model_transforms_content, marker)
        for label, marker in (
            ("downloaded model state bound helper", "function boundDownloadedModel<T extends DownloadedModel>(value: T): T"),
            ("downloaded model state uri bound", "uri: boundNativeDebugInput(value.uri)"),
            ("downloaded model state exists boolean", "exists: Boolean(value.exists)"),
            ("downloaded model state rows bound", "return value.slice(0, maxDownloadedModelRows).map(boundDownloadedModel)"),
        ):
            _assert_contains(label, model_transforms_content, marker)
        _assert_contains(
            "auth session management accessibility item",
            shared_display_items_content,
            "accessibilityLabel: boundDisplayText(`查看${item.title}session 管理狀態，不顯示 raw token`, maxDisplayDetailTextLength)",
        )
        for label, marker in (
            ("active profile label helper", "function activeProfileLabelText(activeProfile: ActiveProfileDisplaySource | null, profileCount: number)"),
            ("active profile no profile copy", "尚未建立照護對象"),
            ("active profile no selection copy", "尚未選擇照護對象"),
            ("active profile inline helper", "function activeProfileInlineText(activeProfileLabel: string)"),
            ("active profile inline copy", "目前對象：${activeProfileLabel}"),
            ("active profile relationship helper", "function activeProfileRelationshipText(activeProfile: ActiveProfileDisplaySource | null)"),
            ("active profile relationship fallback", "未載入"),
            ("settings subpage status display texts helper", "function settingsSubpageStatusDisplayTexts(value: {"),
            ("settings subpage profile action status binding", "profileAction: boundUiMessage(value.profileActionStatus)"),
            ("settings subpage quota action status binding", "recordingQuotaAction: boundUiMessage(value.recordingQuotaActionStatus)"),
            ("settings subpage profile edit integration copy", "個人資料編輯尚未啟用；需完成 production auth、profile update API、權限檢查與 rollback 流程。"),
            ("settings subpage quota syncing copy", "正在同步 backend 語音額度。"),
            ("settings subpage reminder integration copy", "提醒設定目前是 UI 預覽；需完成通知權限、背景排程、時區與後端 reminder schema 後才會啟用。"),
            ("settings subpage privacy integration copy", "隱私控制目前是 UI 預覽；正式啟用需要 permission service、export/delete workflow、share revoke 與 PHI-safe audit。"),
            ("voice minutes formatting helper", "function formatVoiceMinutes(seconds: number)"),
            ("voice minutes whole minute copy", "return `${minutes} 分鐘`;"),
            ("voice minutes seconds copy", "return `${minutes} 分 ${remainingSeconds} 秒`;"),
            ("voice quota low helper", "function isVoiceQuotaLow("),
            ("voice quota low threshold", "voiceQuotaLowWarningThresholdSeconds = 120"),
            ("voice quota capture helper", "function captureVoiceQuotaCopy(quota: VoiceQuotaDisplaySource | null)"),
            ("voice quota unloaded copy", "語音額度載入後，只有接近上限時才會提醒。"),
            ("voice quota low copy", "請分段記錄或改用文字輸入"),
            ("voice quota normal copy", "今日錄音額度正常；接近上限 2 分鐘內才會顯示剩餘時間。"),
            ("quota used display helper", "function quotaUsedDisplayValue(quota: VoiceQuotaUsageDisplaySource | null)"),
            ("quota used pending copy", "已用 尚未載入"),
            ("quota remaining display helper", "function quotaRemainingDisplayValue(quota: VoiceQuotaUsageDisplaySource | null)"),
            ("quota remaining pending copy", "剩餘 尚未載入"),
            ("settings quota helper", "function settingsQuotaHelperText(quota: VoiceQuotaDisplaySource | null)"),
            ("settings quota pending copy", "錄音額度尚未載入"),
            ("quota display texts helper", "function quotaDisplayTexts(quota: VoiceQuotaUsageDisplaySource | null)"),
            ("quota display texts used binding", "used: quotaUsedDisplayValue(quota)"),
            ("quota display texts remaining binding", "remaining: quotaRemainingDisplayValue(quota)"),
            ("quota display texts daily limit", "剩餘 2 分鐘內才提醒使用者。"),
            ("quota display texts subscription daily limit", "剩餘 2 分鐘內才需要提醒使用者。"),
            ("quota display texts settings helper", "settingsHelper: settingsQuotaHelperText(quota)"),
        ):
            _assert_contains(label, settings_copy_content, marker)
        for label, marker in (
            ("native module check button label helper", "function nativeModuleCheckButtonLabel(isRunning: boolean)"),
            ("native model download button label helper", "function nativeModelDownloadButtonLabel(isRunning: boolean, progress: number)"),
            ("native download kind accessibility helper", 'function nativeDownloadKindAccessibilityLabel(kind: "whisper" | "llama", selectedKind: "whisper" | "llama")'),
            ("native module check accessibility helper", "function nativeModuleCheckAccessibilityLabel(isRunning: boolean)"),
            ("native model download accessibility helper", "function nativeModelDownloadAccessibilityLabel(isRunning: boolean, progress: number)"),
            ("native whisper run accessibility helper", "function nativeWhisperRunAccessibilityLabel(isRunning: boolean)"),
            ("native llama run accessibility helper", "function nativeLlamaRunAccessibilityLabel(isRunning: boolean)"),
            ("native benchmark accessibility helper", "function nativeBenchmarkAccessibilityLabel(isRunning: boolean)"),
            ("native status display texts helper", "function nativeStatusDisplayTexts(nativeStatus: string)"),
            ("native status display binding", "native: boundUiMessage(nativeStatus)"),
            ("native module check button copy", "檢查 native modules"),
            ("native model no cloud AI copy", "不呼叫雲端 AI"),
        ):
            _assert_contains(label, native_status_copy_content, marker)
        for label, marker in (
            ("recording model refresh label helper", "function recordingModelRefreshButtonLabel()"),
            ("recording model refresh accessibility helper", "function recordingModelRefreshAccessibilityLabel()"),
        ):
            _assert_contains(label, native_status_copy_content, marker)
        for label, marker in (
            ("settings model runtime label helper", "function modelRuntimeLabel("),
            ("settings model selection boundary helper", "function modelSelectionBoundaryCopy()"),
            ("settings quota data boundary helper", "function recordingQuotaDataBoundaryCopy()"),
            ("settings quota readiness checklist helper", "function quotaReadinessChecklistDisplayItems()"),
            ("settings model local runtime copy", "本地模型"),
            ("settings model fallback disabled copy", "雲端 fallback 在 v1 預設停用"),
            ("settings quota production auth copy", "quota API 必須由 production auth 驗證 account / profile，不信任前端傳入的使用量。"),
            ("settings quota rollback copy", "錄音開始時先檢查剩餘額度；parser 成功或失敗都要有一致的 usage rollback / commit 規則。"),
            ("settings quota low warning copy", "接近剩餘 2 分鐘才提醒；避免首頁長期顯示倒數造成壓力。"),
            ("recording quota sync accessibility helper", "function recordingQuotaSyncAccessibilityLabel(isSyncing: boolean)"),
            ("reminder integration accessibility helper", "function reminderIntegrationAccessibilityLabel()"),
            ("reminder preview display rows helper", "function reminderPreviewDisplayItems()"),
            ("reminder preview fasting glucose copy", "晨間空腹血糖"),
            ("reminder preview dinner copy", "晚餐後兩小時"),
            ("reminder preview appointment copy", "回診前整理"),
            ("reminder readiness checklist helper", "function reminderReadinessChecklistDisplayItems()"),
            ("reminder readiness permission copy", "系統通知權限請求與拒絕後的替代說明。"),
            ("reminder readiness PHI-safe notification copy", "通知內容不得包含敏感健康數值或完整紀錄。"),
            ("privacy integration accessibility helper", "function privacyIntegrationAccessibilityLabel()"),
            ("privacy boundary rows helper", "function privacyBoundaryDisplayRows()"),
            ("privacy boundary records row", "健康紀錄"),
            ("privacy boundary notification row", "通知內容"),
            ("privacy boundary share row", "外部分享"),
            ("privacy boundary ai cost row", "0 次呼叫"),
            ("privacy readiness checklist helper", "function privacyReadinessChecklistDisplayItems()"),
            ("privacy readiness notification minimization copy", "通知內容最小化：推播不可包含血糖數值、完整餐點或用藥內容。"),
            ("privacy readiness opt-in copy", "資料分享 opt-in / opt-out：醫師、照護者、社群與排行榜都必須分開授權。"),
            ("privacy readiness revoke copy", "撤銷與到期：任何 share token、grant、公開顯示都必須可撤回。"),
        ):
            _assert_contains(label, settings_copy_content, marker)
        for label, marker in (
            ("tutorial step display helper", "function tutorialStepDisplayItem(value: readonly string[])"),
            ("tutorial step fallback copy", "尚未設定教學說明。"),
            ("preview tuple display helper", "function previewTupleDisplayItem(value: readonly [string, string, string])"),
            ("preview tuple fallback copy", "尚未設定說明。"),
            ("session management preview helper", "function sessionManagementPreviewDisplayItem(value: readonly [string, string, string])"),
            ("session management preview status copy", "尚未啟用；需完成 server-side session list"),
            ("boundary metric display helper", "function boundaryMetricDisplayItem(value: readonly [string, string])"),
            ("metric display helper", "function metricDisplayItem(value: readonly [string, string])"),
            ("detail pair display helper", "function detailPairDisplayItem(value: readonly [string, string])"),
            ("reminder preview display helper", "function reminderPreviewDisplayItem(value: readonly [string, string, string, string])"),
            ("option display helper", "function optionDisplayItem(value: string)"),
            ("option display items helper", "function optionDisplayItems(values: readonly string[])"),
            ("option display items map", "return values.map(optionDisplayItem);"),
            ("value label display helper", "function valueLabelDisplayItem(value: readonly [string, string])"),
            ("value label display items helper", "function valueLabelDisplayItems(values: ReadonlyArray<readonly [string, string]>)"),
            ("value label display items map", "return values.map(valueLabelDisplayItem);"),
            ("manual record type display helper", "function manualRecordTypeDisplayItem<T extends string>(value: { id: T; label: string })"),
            ("manual record type display items helper", "function manualRecordTypeDisplayItems<T extends string>(values: ReadonlyArray<{ id: T; label: string }>)"),
            ("manual record type display items map", "return values.map(manualRecordTypeDisplayItem);"),
            ("manual record type parser boundary copy", "不呼叫 AI 或 parser"),
            ("comparison display helper", "function comparisonDisplayItem(value: readonly [string, string, string])"),
            ("destination card display helper", "function destinationCardDisplayItem(value: readonly string[])"),
            ("menu screen display helper", "function menuScreenDisplayItem(value: { id: AppScreen; label: string; icon: string })"),
            ("menu screen display items helper", "function menuScreenDisplayItems(values: ReadonlyArray<{ id: AppScreen; label: string; icon: string }>)"),
            ("menu screen display items map", "return values.map(menuScreenDisplayItem);"),
            ("menu screen accessibility copy", "accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)"),
            ("visual smoke route jump display helper", "function visualSmokeRouteJumpDisplayItem(value: { id: AppScreen; label: string })"),
            ("visual smoke route jump display items helper", "function visualSmokeRouteJumpDisplayItems(values: ReadonlyArray<{ id: AppScreen; label: string }>)"),
            ("visual smoke route jump display items map", "return values.map(visualSmokeRouteJumpDisplayItem);"),
            ("visual smoke route jump accessibility copy", "accessibilityLabel: boundDisplayText(`Visual smoke 前往${label}`, maxDisplayTextLength)"),
            ("result checklist item helper", "function resultChecklistItem(value: string)"),
        ):
            _assert_contains(label, shared_display_items_content, marker)
        for label, marker in (
            ("account display name helper", "function accountDisplayNameDisplayText(account: AccountDisplaySource | null)"),
            ("account display name fallback copy", "尚未連線帳號"),
            ("account email display helper", "function accountEmailDisplayValue(account: AccountDisplaySource | null)"),
            ("account email fallback copy", "尚未取得登入識別"),
            ("account login display helper", "function accountLoginDisplayValue(account: AccountDisplaySource | null)"),
            ("account login display copy", "Email 登入・${account.email}"),
            ("account public display helper", "function accountPublicDisplayNameText(account: AccountDisplaySource | null)"),
            ("account public display fallback copy", "尚未設定"),
            ("doctor share account boundary helper", "function doctorShareAccountBoundaryText(account: AccountDisplaySource | null)"),
            ("doctor share connected copy", "已連線帳號；正式分享仍需 production auth、權限與授權碼流程。"),
            ("doctor share disconnected copy", "尚未連線帳號；不可建立任何外部分享。"),
            ("account security auth mode display helper", "function accountSecurityAuthModeDisplayTexts(value: {"),
            ("account security dev auth label", 'const label = value.allowMobileDevAuth ? "Dev Auth" : "Production Auth Required";'),
            ("account security auth mode label binding", "label: displayLabel"),
            ("account security auth mode accessibility binding", "cardAccessibilityLabel: boundDisplayText("),
            ("doctor share boundary rows helper", "function doctorShareBoundaryDisplayRows()"),
            ("doctor share boundary token row", "授權碼"),
            ("doctor share boundary permission row", "醫師權限"),
            ("doctor share boundary report row", "/reports/basic 預留"),
            ("doctor share boundary ai cost row", "0 次呼叫"),
            ("profile settings boundary rows helper", "function profileSettingsBoundaryDisplayRows("),
            ("profile settings boundary rows state helper", "function profileSettingsBoundaryDisplayRowsForState(value: {"),
            ("profile settings boundary rows state account", "value.account"),
            ("profile settings boundary rows state relationship", "value.activeProfileRelationshipDisplayText"),
            ("profile settings boundary account row", "帳號資料"),
            ("profile settings boundary active profile row", "照護對象"),
            ("profile settings boundary local edit row", "本機編輯"),
            ("profile readiness checklist helper", "function profileReadinessChecklistDisplayItems()"),
            ("profile readiness production auth copy", "production auth / OIDC 或 JWT 邊界，避免 dev account 被當成正式個資。"),
            ("profile readiness permission copy", "帳號與照護對象權限檢查：只能編輯自己有權限的 profile。"),
            ("doctor share readiness checklist helper", "function doctorShareReadinessChecklistDisplayItems()"),
            ("doctor share readiness token copy", "share token / authorization grant 產生、到期與撤銷"),
            ("doctor share readiness grant scope copy", "doctor grant 僅允許 profile:read / profile:export 的明確授權範圍"),
            ("doctor share readiness audit copy", "所有分享、查看、匯出與撤銷都必須寫入 audit log"),
        ):
            _assert_contains(label, account_copy_content, marker)
        for label, marker in (
            ("account transform bound account helper", "function boundAccount<T extends AccountTransformSource>(value: T): T"),
            ("account transform email bound", "email: boundDisplayText(value.email, maxEmailTextLength)"),
            ("account transform profile helper", "function boundProfile<T extends ProfileTransformSource>(value: T): T"),
            ("account transform relationship bound", "relationship: boundDisplayText(value.relationship, 40)"),
            ("account transform profile list bound", "return value.slice(0, maxMobileProfiles).map(boundProfile)"),
        ):
            _assert_contains(label, account_transforms_content, marker)
        for label, marker in (
            ("auth token response bound helper", "function boundAuthTokenResponse<T extends AuthTokenResponseTransformSource>(value: T): T | null"),
            ("auth token response access token trim", "const accessToken = value.access_token.trim()"),
            ("auth refresh token request bound helper", "function boundRefreshTokenForRequest(value: string)"),
            ("auth OIDC provider request bound helper", "function boundOidcProviderForRequest(value: string): OidcLoginProvider | \"\""),
            ("auth OIDC id token JWT shape guard", "/^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$/.test(token)"),
            ("auth OIDC nonce shape guard", "/^[A-Za-z0-9._~+-]+$/.test(nonce)"),
            ("auth device fingerprint bound helper", "function boundDeviceFingerprintForRequest(value: string | null | undefined)"),
            ("auth protected headers builder", "function buildProtectedRequestHeaders("),
            ("auth protected headers dev fallback", 'return { "X-Account-Id": devAccountId };'),
        ):
            _assert_contains(label, auth_transforms_content, marker)
        for label, marker in (
            ("auth session display helper", "function authSessionDisplayItem(value: AuthSessionDisplaySource, index: number)"),
            ("auth session display key", "key: `auth-session-${boundedIndex}-${id.slice(0, 12)}`"),
            ("auth session display created/expires copy", "`建立 ${recordDateTimeDisplay(value.created_at)} · 到期 ${recordDateTimeDisplay(value.expires_at)}`"),
            ("auth session display fingerprint label", 'value.has_device_fingerprint ? "裝置已識別" : "無裝置指紋"'),
            ("auth session display last used fallback", '"尚無最後使用時間"'),
            ("auth session display list helper", "function authSessionDisplayListItems(values: AuthSessionDisplaySource[])"),
            ("auth session display list limit", "return values.slice(0, 20).map(authSessionDisplayItem);"),
        ):
            _assert_contains(label, auth_session_display_content, marker)
        for label, marker in (
            ("dev reset response type", "export type DevResetResponse = {"),
            ("dev reset response bound helper", "export function boundDevResetResponse(value: DevResetResponse): DevResetResponse"),
            ("dev reset deleted count key cap", ".slice(0, maxDevResetDeletedCountKeys)"),
            ("dev reset deleted count clamp", "clampNumber(count, 0, maxMobileCountValue)"),
            ("auth status display texts helper", "function authStatusDisplayTexts(value: {"),
            ("auth status display auth action binding", "authAction: boundUiMessage(value.authActionStatus)"),
            ("auth status display dev reset binding", "devReset: boundUiMessage(value.devResetStatus)"),
            ("auth status display token storage binding", "tokenStorage: boundUiMessage(value.tokenStorageStatus)"),
            ("auth boundary checklist helper", "function authBoundaryChecklistDisplayItems()"),
            ("auth boundary provider control copy", "Apple / Google / Email 登入需由正式 auth provider 控制。"),
            ("auth boundary secure storage copy", "mobile token persistence 只可走 SecureStore / Keychain / Keystore；不可 fallback 到一般 storage。"),
            ("auth boundary protected API copy", "所有受保護 API 都要由後端驗證帳號、profile 與權限 scope。"),
            ("auth logout main status helper", "function authLogoutMainStatusMessage()"),
            ("auth logout main status copy", 'return boundUiMessage("已登出");'),
            ("auth logout local clear status helper", "function authLogoutLocalClearStatusMessage()"),
            ("auth logout local clear status copy", 'return boundUiMessage("已清除本機 token");'),
            ("auth logout all main status helper", "function authLogoutAllMainStatusMessage()"),
            ("auth logout all main status copy", 'return boundUiMessage("已登出全部裝置");'),
        ):
            _assert_contains(label, auth_status_copy_content, marker)
        for label, marker in (
            ("auth refresh accessibility label", "refreshSessionAccessibility: boundDisplayText(\"刷新 session，使用 SecureStore refresh token rotation\", maxDisplayDetailTextLength)"),
            ("auth load sessions accessibility label", "loadSessionsAccessibility: boundDisplayText(\"載入 sessions，只顯示 bounded session metadata\", maxDisplayDetailTextLength)"),
            ("auth logout local accessibility label", "logoutLocalAccessibility: boundDisplayText(\"登出本機，revoke session 並清除本機安全 token\", maxDisplayDetailTextLength)"),
            ("auth logout all accessibility label", "logoutAllAccessibility: boundDisplayText(\"登出全部裝置，revoke backend sessions 並清除本機 token\", maxDisplayDetailTextLength)"),
            ("settings local clear accessibility label", "localClearAccessibility: boundDisplayText(\"清除本機 session 與預覽狀態，不刪除 backend 紀錄\", maxDisplayDetailTextLength)"),
            ("advanced settings toggle accessibility label", "advancedSettingsToggleAccessibility: boundDisplayText(\"展開或收合進階設定，不連線 backend 或啟動模型\", maxDisplayDetailTextLength)"),
            ("backend reconnect accessibility label", "backendReconnectAccessibility: boundDisplayText(\"重新連線 backend，會清除 stale session/model/record state\", maxDisplayDetailTextLength)"),
            ("profile edit accessibility label", "editIntegrationAccessibility: boundDisplayText(\"查看個人資料編輯整合狀態，不寫入個資或照護對象\", maxDisplayDetailTextLength)"),
            ("subscription comparison rows config", "export const subscriptionComparisonRows = ["),
            ("subscription comparison display rows helper", "function subscriptionComparisonDisplayRows()"),
            ("subscription comparison display rows map", "return subscriptionComparisonRows.map(comparisonDisplayItem);"),
            ("subscription plan display helper", "function planDisplayName(planCode?: string)"),
            ("subscription trial plan copy", "試用版"),
            ("subscription annual plan copy", "年費會員"),
            ("subscription status label helper", "function subscriptionStatusLabel(status?: string)"),
            ("subscription trialing status copy", "試用中"),
            ("subscription active status copy", "有效"),
            ("subscription cancelled status copy", "已取消"),
            ("subscription expired status copy", "已到期"),
            ("subscription quota plan helper", "function quotaPlanDisplayText(quota: SubscriptionPlanDisplaySource | null, fallback = \"額度尚未載入\")"),
            ("subscription quota fallback copy", "額度尚未載入"),
            ("membership trial-days helper", "function membershipTrialDaysText(trialDays: number | null)"),
            ("membership trial-days fallback copy", "試用天數尚未載入"),
            ("membership trial-days remaining copy", "還剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天"),
            ("subscription membership display text helper", "function subscriptionMembershipDisplayTexts("),
            ("subscription membership display subscription plan", "subscriptionPlan: quotaPlanDisplayText(quota)"),
            ("subscription membership display management status", 'managementStatus: subscriptionStatusSummaryText(quota, trialDays, "請先同步 backend quota / entitlement。")'),
            ("subscription membership display trial hero", 'quota?.status === "trialing" ? "7 天免費試用即將結束" : "會員狀態"'),
            ("subscription membership display plan status", "planStatus: boundDisplayText("),
            ("membership feature display rows helper", "function membershipFeatureDisplayRows()"),
            ("membership feature voice record copy", "輕鬆說，隨時記"),
            ("membership feature ai organize copy", "自動歸納重點，儲存前仍需確認"),
            ("membership feature analysis copy", "趨勢與摘要一目了然"),
            ("membership feature history copy", "完整保存並支援查詢"),
            ("recording quota boundary rows helper", "function recordingQuotaBoundaryDisplayRows("),
            ("recording quota boundary plan row", "目前方案"),
            ("recording quota boundary status row", "會員狀態"),
            ("recording quota boundary warning row", "提醒規則"),
            ("recording quota boundary ai cost row", "0 次呼叫"),
            ("account security boundary rows helper", "function accountSecurityBoundaryDisplayRows("),
            ("account security boundary rows state helper", "function accountSecurityBoundaryDisplayRowsForState(value: {"),
            ("account security boundary rows state boolean account", "Boolean(value.account)"),
            ("account security boundary rows state session count", "value.authSessionCount"),
            ("account security boundary token guard row", "Token guard"),
            ("account security boundary session list row", "Session list"),
            ("account security boundary protected API row", "保護 API"),
            ("subscription status summary helper", "function subscriptionStatusSummaryText("),
            ("subscription status summary trial copy", "試用剩 ${clampNumber(trialDays, 0, maxMobileCountValue)} 天"),
            ("subscription readiness checklist helper", "function subscriptionReadinessChecklistDisplayItems()"),
            ("subscription readiness store backend copy", "App Store / Play Store 或正式付款後台"),
            ("subscription readiness receipt copy", "receipt validation 與訂閱狀態 webhook"),
            ("subscription readiness entitlement copy", "entitlement 與 voice quota 的 server-side enforcement"),
            ("subscription management readiness checklist helper", "function subscriptionManagementReadinessChecklistDisplayItems()"),
            ("subscription management readiness deep link copy", "商店付款或正式會員後台深連結，讓使用者可以管理續訂與取消。"),
            ("subscription management readiness entitlement copy", "idempotent entitlement update"),
            ("subscription management readiness server-side copy", "server-side entitlement"),
            ("subscription action status display texts helper", "function subscriptionActionStatusDisplayTexts(value: {"),
            ("subscription action status display action binding", "subscriptionAction: boundUiMessage(value.subscriptionActionStatus)"),
            ("subscription action status display management binding", "subscriptionManagementAction: boundUiMessage(value.subscriptionManagementActionStatus)"),
            ("subscription trial integration status copy", "試用啟動需要正式付款/商店串接；目前不會建立訂閱，也不會變更會員狀態。"),
            ("subscription renewal integration status copy", "續訂啟用需要正式付款/商店串接與 receipt validation；目前不會建立訂閱。"),
            ("subscription management syncing status copy", "正在同步 backend entitlement 與語音額度。"),
            ("subscription management payment status copy", "訂閱管理目前是 UI 預覽；正式啟用需要付款深連結、receipt validation、webhook 與 entitlement policy。"),
        ):
            _assert_contains(label, subscription_copy_content, marker)
        for label, marker in (
            ("subscription trial days helper", "function trialDaysLeft(trialEndsAt?: string | null)"),
            ("subscription trial days invalid date guard", "Number.isNaN(end)"),
            ("subscription trial days ceil calculation", "Math.ceil((end - Date.now()) / 86_400_000)"),
            ("subscription voice quota bound helper", "function boundVoiceQuota<T extends VoiceQuotaTransformSource>(value: T): T"),
            ("subscription voice quota max seconds", "const maxMobileVoiceSeconds = 86_400"),
            ("subscription voice quota trial end bound", "trial_ends_at: boundOptionalDateTime(value.trial_ends_at)"),
            ("subscription voice quota used bound", "used_seconds_today: Math.min(used, dailyLimit || used)"),
            ("subscription single recording limit constant", "const mobileSingleRecordingLimitSeconds = 60;"),
            ("subscription effective recording limit helper", "function recordingEffectiveLimitSeconds(quota: VoiceQuotaTransformSource | null)"),
            ("subscription effective recording limit remaining clamp", "Math.min(mobileSingleRecordingLimitSeconds, quota.remaining_seconds_today)"),
        ):
            _assert_contains(label, subscription_transforms_content, marker)
        for label, marker in (
            ("food community visual smoke promoted label", '{ id: "community", label: "食物社群" }'),
            ("food community screen chrome backend-ready subtitle", 'community: { subtitle: "同步食物升糖資料庫、分享、點數與公開排名。", backTo: "futureModules", actionLabel: "‹" }'),
            ("ranking screen chrome backend-ready subtitle", 'ranking: { subtitle: "查看 opt-in 公開社群排行與非敏感分數。", backTo: "futureModules", actionLabel: "‹" }'),
            ("store screen chrome backend-ready subtitle", 'store: { subtitle: "同步點數商城、兌換券與購物車邊界。", backTo: "menu", actionLabel: "‹" }'),
        ):
            _assert_contains(label, navigation_content, marker)
        _assert_not_contains(
            "food community hidden from first-version menu",
            _match_block(
                navigation_content,
                r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];",
                "menuScreens",
            ),
            'id: "community"',
        )
        _assert_not_contains(
            "achievements hidden from first-version menu",
            _match_block(
                navigation_content,
                r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];",
                "menuScreens",
            ),
            'id: "achievements"',
        )
        _assert_not_contains(
            "store hidden from first-version menu",
            _match_block(
                navigation_content,
                r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];",
                "menuScreens",
            ),
            'id: "store"',
        )
        _assert_contains(
            "future modules hidden outside debug tools",
            content,
            "{enableDebugTools ? (\n              <Pressable\n                accessibilityLabel={auxiliaryDisplayLabels.showMoreFeaturesAccessibility}",
        )
        _assert_not_contains(
            "food community stale inline share accessibility label",
            content,
            'accessibilityLabel="送出食物分享，backend 會計算升糖幅度並建立社群點數"',
        )
        _assert_not_contains(
            "store boundary must not claim points ledger unfinished",
            content,
            '["正式啟用前", "需完成點數帳本、庫存、訂單、付款與 rollback"]',
        )
        submit_food_share_block = _match_block(
            content,
            r"async function submitFoodCommunityShare\(\) \{([\s\S]*?)\n  async function redeemStoreProduct",
            "submitFoodCommunityShare function block",
        )
        _assert_not_contains(
            "food community share payload client glucose delta",
            submit_food_share_block,
            "glucose_delta",
        )
        _assert_not_contains(
            "food community share must not force current timestamp",
            submit_food_share_block,
            "new Date().toISOString()",
        )
        _assert_contains(
            "food community share refreshes store points",
            submit_food_share_block,
            "void loadStoreCatalogAndPoints();",
        )
        _assert_contains(
            "food community share refreshes leaderboards",
            submit_food_share_block,
            "void loadCommunityLeaderboards();",
        )
        save_public_settings_block = _match_block(
            content,
            r"async function saveCommunityPublicSettings\(nextOptIn\?: boolean\) \{([\s\S]*?)\n  async function loadCommunityLeaderboards",
            "saveCommunityPublicSettings function block",
        )
        _assert_contains(
            "community settings save refreshes leaderboards",
            save_public_settings_block,
            "void loadCommunityLeaderboards();",
        )
        ranking_opt_in_block = _function_block(content, "showRankingOptInStatus")
        _assert_contains(
            "ranking opt-in toggles community settings",
            ranking_opt_in_block,
            "void saveCommunityPublicSettings(!(communityPublicSettings?.leaderboard_opt_in ?? false));",
        )
        _assert_not_contains(
            "ranking opt-in stale status-only handler",
            ranking_opt_in_block,
            "setRankingActionStatus(rankingOptInStatusMessage);",
        )
        _assert_not_contains(
            "ranking stale opt-in unavailable copy",
            content,
            "opt-in 尚未啟用",
        )
        _assert_not_contains(
            "food community stale leaderboard reserved label",
            content,
            "社群排行榜預留",
        )
        _assert_not_contains(
            "food community stale reserved menu label",
            content,
            "食物社群（預留）",
        )
        _assert_not_contains(
            "food community stale visual smoke preview label",
            content,
            '{ id: "community", label: "社群預覽" }',
        )
        _assert_not_contains(
            "food community stale preview chrome subtitle",
            content,
            "社群交流與公開資料邊界預覽。",
        )
        _assert_not_contains(
            "ranking stale reserved menu label",
            content,
            "社群排行（預留）",
        )
        _assert_not_contains(
            "ranking stale preview chrome subtitle",
            content,
            "排行榜統計與公開排名 opt-in 預覽。",
        )
        _assert_not_contains(
            "store stale future chrome subtitle",
            content,
            "瀏覽未來商城與優惠入口。",
        )
        _assert_not_contains(
            "food community stale disabled badge",
            content,
            "社群未啟用",
        )
        redeem_store_block = _match_block(
            content,
            r"async function redeemStoreProduct\(product: ReturnType<typeof storeProductDisplayItem>\) \{([\s\S]*?)\n  async function useStoreRedemption",
            "redeemStoreProduct function block",
        )
        _assert_contains(
            "store redemption success refreshes catalog points wallet",
            redeem_store_block,
            "void loadStoreCatalogAndPoints();",
        )
        _assert_contains(
            "store redemption reward id fail closed",
            redeem_store_block,
            'const rewardId = storeProductRewardId(product);\n    if (!rewardId) {\n      setStoreActionStatus(redeemStatus.invalidProduct);\n      return;\n    }',
        )
        _assert_contains(
            "store redemption reward id payload helper binding",
            redeem_store_block,
            "body: JSON.stringify({ reward_code: rewardId })",
        )
        _assert_contains(
            "store redemption action status helper binding",
            redeem_store_block,
            "setStoreActionStatus(storeProductActionStatus(product));",
        )
        _assert_contains(
            "store redemption product title helper binding",
            redeem_store_block,
            "productTitle: storeProductRedeemTitle(product),",
        )
        _assert_not_contains(
            "store redemption direct product id fail closed",
            redeem_store_block,
            "if (!product.id) {",
        )
        _assert_not_contains(
            "store redemption direct product id payload",
            redeem_store_block,
            "body: JSON.stringify({ reward_code: product.id })",
        )
        _assert_not_contains(
            "store redemption direct product action status",
            redeem_store_block,
            "setStoreActionStatus(product.actionStatus);",
        )
        _assert_not_contains(
            "store redemption direct product title status",
            redeem_store_block,
            "productTitle: product.title,",
        )
        use_redemption_block = _match_block(
            content,
            r"async function useStoreRedemption\(redemption: ReturnType<typeof storeRedemptionDisplayItem>\) \{([\s\S]*?)\n  async function boot",
            "useStoreRedemption function block",
        )
        _assert_contains(
            "store redemption use refreshes catalog points wallet",
            use_redemption_block,
            "void loadStoreCatalogAndPoints();",
        )
        _assert_contains(
            "store redemption id fail closed",
            use_redemption_block,
            'const redemptionId = storeRedemptionUseId(redemption);\n    if (!redemptionId) {\n      setStoreActionStatus(redemptionUseStatus.invalid);\n      return;\n    }',
        )
        _assert_contains(
            "store redemption use endpoint helper binding",
            use_redemption_block,
            "`/store/redemptions/${redemptionId}/use`",
        )
        _assert_contains(
            "store redemption use title helper binding",
            use_redemption_block,
            "redemptionTitle: storeRedemptionUseTitle(redemption),",
        )
        _assert_contains(
            "store redemption use status label helper binding",
            use_redemption_block,
            "statusLabel: storeRedemptionUseStatusLabel(redemption),",
        )
        _assert_not_contains(
            "store redemption direct id fail closed",
            use_redemption_block,
            "if (!redemption.id) {",
        )
        _assert_not_contains(
            "store redemption direct id endpoint",
            use_redemption_block,
            "`/store/redemptions/${redemption.id}/use`",
        )
        _assert_not_contains(
            "store redemption direct title status",
            use_redemption_block,
            "redemptionTitle: redemption.title,",
        )
        _assert_not_contains(
            "store redemption direct status label status",
            use_redemption_block,
            "statusLabel: redemption.statusLabel,",
        )
        for label, marker in (
            ("food community stale no-backend empty copy", "目前不查詢 backend"),
            ("food community stale local-preview-only intro copy", "目前為本機預覽，不取代理論資料或醫療建議。"),
            ("food community stale disabled share status copy", "食物分享尚未啟用；目前不寫入食物資料庫、不建立積分、不更新排行榜，也不串接商城兌換。"),
            ("store stale no-issue boundary copy", "但仍不發券、不建立出貨訂單，也不處理付款"),
            ("store stale redeemable reservation-only copy", "可用社群點數建立兌換 reservation；實際發券、出貨或 entitlement 仍需後續 fulfillment。"),
            ("store stale cart incentive-unwired copy", "需等商品、庫存、優惠、付款與退款規則完成後再接 backend。"),
            ("store stale points ledger unavailable copy", "點數兌換流程尚未接上點數帳本"),
            ("store stale cart CTA label", "查看兌換整合狀態"),
            ("store stale cart CTA no-points copy", "查看點數兌換整合狀態，不扣點、不建立訂單或付款"),
            ("store stale visual smoke no-issue copy", "商城預覽不得扣點、發券、啟動結帳或金流整合。"),
            ("tutorial stale no-whisper copy", "目前不會自動轉文字；請改用文字輸入，未來接上 STT 後也會先進文字確認。"),
            ("year review stale no-share-image copy", "分享圖片尚未產生；需等年度摘要素材、隱私遮罩與分享權限完成後再啟用。"),
            ("year review stale no-privacy-mask copy", "尚未產生正式年度素材、分享圖或隱私遮罩。"),
            ("year review stale badge-share-image copy", "正式徽章素材與分享圖會在年度回顧模組完成後接上。"),
        ):
            _assert_not_contains(label, content, marker)
        for label, marker in (
            ("native model URL direct setter binding", "onChangeText={(value) => setModelUrl(boundNativeDebugInput(value))}"),
            ("native whisper path direct setter binding", "onChangeText={(value) => setWhisperModelPath(boundNativeDebugInput(value))}"),
            ("native audio path direct setter binding", "onChangeText={(value) => setAudioPath(boundNativeDebugInput(value))}"),
            ("native llama path direct setter binding", "onChangeText={(value) => setLlamaModelPath(boundNativeDebugInput(value))}"),
            ("native model URL direct handler bound input", "setModelUrl(boundNativeDebugInput(value));"),
            ("native whisper path direct handler bound input", "setWhisperModelPath(boundNativeDebugInput(value));"),
            ("native audio path direct handler bound input", "setAudioPath(boundNativeDebugInput(value));"),
            ("native llama path direct handler bound input", "setLlamaModelPath(boundNativeDebugInput(value));"),
            ("downloaded model direct first whisper uri binding", "setWhisperModelPath(boundNativeDebugInput(whisperModels[0].uri));"),
            ("downloaded model direct refresh count binding", "recordingModelRefreshStatusMessage(whisperModels.length)"),
            ("direct profile settings option binding", "onPress={() => selectActiveProfileFromSettings(profile.sourceId)}"),
            ("direct llm model settings option binding", "onPress={() => selectLlmModelFromSettings(model.id)}"),
            ("direct stt model settings option binding", "onPress={() => selectSttModelFromSettings(model.id)}"),
            ("direct profile settings source binding", "onPress={() => selectSettingsProfileChoice(profile.sourceId)}"),
            ("direct profile settings handler source binding", "selectSettingsProfileChoice(profile.sourceId);"),
            ("direct llm model settings id binding", "onPress={() => selectSettingsLlmModelChoice(model.id)}"),
            ("direct stt model settings id binding", "onPress={() => selectSettingsSttModelChoice(model.id)}"),
            ("direct llm model settings source binding", "selectSettingsLlmModelChoice(model.sourceId);"),
            ("direct stt model settings source binding", "selectSettingsSttModelChoice(model.sourceId);"),
            ("direct recording whisper model path binding", "setWhisperModelPath(item.sourceUri);"),
            ("direct recording whisper model status label binding", "setStatus(recordingModelSelectedStatusMessage(item.label));"),
            ("direct native whisper download kind binding", 'onPress={() => selectNativeDownloadKind("whisper")}'),
            ("direct native llama download kind binding", 'onPress={() => selectNativeDownloadKind("llama")}'),
            ("direct downloaded model row key binding", "key={model.uri}"),
            ("direct downloaded model row label binding", "{downloadedModelDisplayLabel(model)}"),
            ("direct auth provider preview binding", "onPress={() => startAuthProviderChallenge(item.provider)}"),
            ("direct auth provider handler target binding", "startAuthProviderChallenge(item.provider);"),
            ("direct auth session management status binding", "onPress={() => showAuthSessionManagementStatus(item.actionStatus)}"),
            ("direct auth session management handler status binding", "showAuthSessionManagementStatus(item.actionStatus);"),
            ("direct daily record menu index binding", "setDailyRecordMenuIndex((current) => (current === item.index ? null : item.index));"),
            ("direct daily record menu type-label binding", "dailyRecordEntryMenuOpenStatusMessage(item.typeLabel)"),
            ("direct daily record edit index binding", 'openPreviewRecordEdit(item.index, "aiSaveConfirm")'),
            ("direct daily record delete index binding", 'openPreviewRecordRemoveConfirm(item.index, "aiSaveConfirm")'),
        ):
            _assert_not_contains(label, content, marker)
        pricing_card_block = _style_block(content, "pricingCard")
        _assert_not_contains(
            "pricing section open wrapper background",
            pricing_card_block,
            "backgroundColor:",
        )
        _assert_not_contains(
            "pricing section open wrapper border",
            pricing_card_block,
            "borderWidth:",
        )
        comparison_row_block = _style_block(content, "comparisonRow")
        _assert_contains(
            "comparison row single-layer background",
            comparison_row_block,
            'backgroundColor: "#FFFFFF"',
        )
        _assert_contains(
            "comparison row wrapping",
            comparison_row_block,
            'flexWrap: "wrap"',
        )
        hero_card_feature_block = _style_block(content, "heroCardFeature")
        _assert_contains(
            "future hero card wrapping",
            hero_card_feature_block,
            'flexWrap: "wrap"',
        )
        _assert_contains(
            "future hero card single-layer background",
            hero_card_feature_block,
            'backgroundColor: "#EAF6F1"',
        )
        for label, marker in (
            ("future modules open handler", "function openFutureModulesFromMenu()"),
            ("future modules return menu handler", "function returnFromFutureModulesToMenu()"),
            ("future module detail return handler", "function returnFromFutureModuleDetail()"),
            ("future module target route handler", "function openFutureModuleTargetRoute(target: AppScreen)"),
            ("future module target route doctor binding", 'openDoctorShare("futureModules");'),
            ("future module target route achievement binding", 'openAchievements("futureModules");'),
            ("future module target route fallback", "return false;\n  }\n\n  function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard)"),
            ("future module destination handler", "function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard)"),
            ("future module target route helper binding", "if (openFutureModuleTargetRoute(target)) {"),
            ("future module destination fallback screen opener binding", "if (openFutureModuleTargetRoute(target)) {\n      return;\n    }\n    openScreen(target);"),
            ("future module destination press handler", "function pressFutureModuleDestination(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module destination target helper", "function futureModuleDestinationTarget(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module destination target helper fields", "return item.target;"),
            ("future module destination module helper", "function futureModuleDestinationModule(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module destination module helper fields", "return item.module;"),
            ("future module destination target helper binding", "openFutureModuleDestination(futureModuleDestinationTarget(item), futureModuleDestinationModule(item));"),
            ("future module card key helper", "function futureModuleCardKey(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card key helper fields", "return item.key;"),
            ("future module card key binding", "key={futureModuleCardKey(item)}"),
            ("future module card accessibility helper", "function futureModuleCardAccessibilityLabel(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card accessibility helper fields", "return item.accessibilityLabel;"),
            ("future module card accessibility helper binding", "accessibilityLabel={futureModuleCardAccessibilityLabel(item)}"),
            ("future module card icon helper", "function futureModuleCardIcon(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card icon helper fields", "return item.icon;"),
            ("future module card icon binding", "{futureModuleCardIcon(item)}"),
            ("future module card title helper", "function futureModuleCardTitle(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card title helper fields", "return item.title;"),
            ("future module card title binding", "{futureModuleCardTitle(item)}"),
            ("future module card description helper", "function futureModuleCardDescription(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card description helper fields", "return item.description;"),
            ("future module card description binding", "{futureModuleCardDescription(item)}"),
            ("future module card readiness helper", "function futureModuleCardReadiness(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card readiness helper fields", "return item.readiness;"),
            ("future module card readiness binding", "{futureModuleCardReadiness(item)}"),
            ("future module card requirements helper", "function futureModuleCardRequirements(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card requirements helper fields", "return item.requirements;"),
            ("future module card requirements binding", "futureModuleCardRequirements(item).map((requirement) => ("),
            ("future module requirement key helper", 'function futureModuleRequirementKey(\n    requirement: ReturnType<typeof futureModuleCardDisplayItem>["requirements"][number]'),
            ("future module requirement key helper fields", "return requirement.key;"),
            ("future module requirement key binding", "key={futureModuleRequirementKey(requirement)}"),
            ("future module requirement text helper", 'function futureModuleRequirementText(\n    requirement: ReturnType<typeof futureModuleCardDisplayItem>["requirements"][number]'),
            ("future module requirement text helper fields", "return requirement.text;"),
            ("future module requirement text binding", "text={futureModuleRequirementText(requirement)}"),
            ("future module card safety helper", "function futureModuleCardSafety(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card safety helper fields", "return item.safety;"),
            ("future module card safety binding", "{futureModuleCardSafety(item)}"),
            ("future module card target state helper", "function futureModuleCardHasTarget(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card target state helper fields", "return Boolean(item.target);"),
            ("future module card target state binding", "{futureModuleCardHasTarget(item) ?"),
            ("future module display card helper binding", "const futureModuleDisplayCards = useMemo(\n    () => futureModuleCardDisplayItems(futureModuleCards),"),
            ("future preview status display helper binding", "const futurePreviewStatusDisplay = futurePreviewStatusDisplayTexts({"),
            ("future preview status future action binding", "const futureModuleActionStatusDisplayText = futurePreviewStatusDisplay.futureModuleAction;"),
            ("future preview status doctor token binding", "const doctorShareTokenStatusMessage = futurePreviewStatusDisplay.doctorShareToken;"),
            ("future preview status health permission binding", "const healthIntegrationPermissionStatusMessage = futurePreviewStatusDisplay.healthIntegrationPermission;"),
            ("future preview status community share binding", "const foodCommunityShareStatusMessage = futurePreviewStatusDisplay.foodCommunityShare;"),
            ("menu preview return screen helper", "function menuPreviewReturnScreen(returnScreen: AppScreen, selfScreen: AppScreen)"),
            ("menu preview return screen helper fields", 'return returnScreen === selfScreen ? "menu" : returnScreen;'),
            ("menu preview screen opener helper", "function openMenuPreviewScreen(\n    screen: AppScreen,\n    returnScreen: AppScreen,"),
            ("menu preview screen opener helper fields", "setReturnScreen(menuPreviewReturnScreen(returnScreen, screen));\n    openScreen(screen);"),
            ("subscription menu preview opener helper binding", 'openMenuPreviewScreen("subscription", returnScreen, setSubscriptionReturnScreen);'),
            ("tutorial menu preview opener helper binding", 'openMenuPreviewScreen("tutorial", returnScreen, setTutorialReturnScreen);'),
            ("food photo menu preview opener helper binding", 'openMenuPreviewScreen("foodPhoto", returnScreen, setFoodPhotoReturnScreen);'),
            ("achievements menu preview opener helper binding", 'openMenuPreviewScreen("achievements", returnScreen, setAchievementsReturnScreen);'),
            ("achievements screen opener keeps sync binding", 'openMenuPreviewScreen("achievements", returnScreen, setAchievementsReturnScreen);\n    void loadAchievementSummary();'),
            ("year review menu preview opener helper binding", 'openMenuPreviewScreen("yearReview", returnScreen, setYearReviewReturnScreen);'),
            ("year review screen opener keeps sync binding", 'openMenuPreviewScreen("yearReview", returnScreen, setYearReviewReturnScreen);\n    void loadYearReview();'),
            ("store menu preview opener helper binding", 'openMenuPreviewScreen("store", returnScreen, setStoreReturnScreen);'),
            ("store screen opener keeps catalog sync binding", 'openMenuPreviewScreen("store", returnScreen, setStoreReturnScreen);\n    void loadStoreCatalogAndPoints();'),
            ("achievement/year review status display helper binding", "const achievementYearReviewStatusDisplay = achievementYearReviewStatusDisplayTexts({"),
            ("achievement action status display binding", "const achievementActionStatusDisplayText = achievementYearReviewStatusDisplay.achievementAction;"),
            ("year review action status display binding", "const yearReviewActionStatusDisplayText = achievementYearReviewStatusDisplay.yearReviewAction;"),
            ("future module card accessibility binding", "accessibilityLabel={futureModuleCardAccessibilityLabel(item)}"),
            ("future module card button role", 'accessibilityRole="button"\n                  style={styles.recordCard}'),
            ("doctor share return handler", "function returnFromDoctorSharePreview()"),
            ("health integration return handler", "function returnFromHealthIntegrationPreview()"),
            ("community return handler", "function returnFromCommunityPreview()"),
            ("ranking return handler", "function returnFromRankingPreview()"),
            ("achievements return handler", "function returnFromAchievements()"),
            ("year review return handler", "function returnFromYearReview()"),
            ("store cart open handler", "function openStoreCart()"),
            ("store cart open status helper binding", 'openScreenWithStatus("storeCart", commercePreviewOpenCartStatusMessage());'),
            ("store return handler", "function returnFromStore()"),
            ("store cart return store handler", "function returnFromStoreCartToStore()"),
            ("store cart return status helper binding", 'openScreenWithStatus("store", commercePreviewReturnStoreStatusMessage());'),
            ("food photo return handler", "function returnFromFoodPhoto()"),
            ("achievement integration status handler", "function showAchievementIntegrationStatus()"),
            ("year review share status handler", "function showYearReviewShareStatus()"),
            ("achievement display items helper binding", "const achievementDisplayItems = useMemo(() => buildAchievementDisplayItems(achievements), [achievements]);"),
            ("achievement badge summary helper binding", "const achievementBadgeDisplaySummary = achievementBadgeSummary(achievementDisplayItems);"),
            ("achievement unlocked summary binding", "achievementBadgeDisplaySummary.unlockedCount"),
            ("achievement next remaining summary binding", "achievementBadgeDisplaySummary.nextRemaining"),
            ("store search input handler", "function updateStoreSearchInput(value: string)"),
            ("store search input helper binding", "setStoreSearchText(commerceSearchInputValue(value));"),
            ("store category select handler", "function selectStoreCategory(category: StoreCategory)"),
            ("store category option press handler", "function pressStoreCategoryOption(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store category target helper", "function storeCategoryTarget(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store category target helper fields", "return category.value;"),
            ("store category target helper binding", "selectStoreCategory(storeCategoryTarget(category));"),
            ("store category option key helper", "function storeCategoryOptionKey(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store category option key helper binding", "key={storeCategoryOptionKey(category)}"),
            ("store category option accessibility helper", "function storeCategoryOptionAccessibilityLabel(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store category option accessibility helper fields", "return category.accessibilityLabel;"),
            ("store category option accessibility helper binding", "accessibilityLabel={storeCategoryOptionAccessibilityLabel(category)}"),
            ("store category option label helper", "function storeCategoryOptionLabel(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store category option label helper fields", "return category.label;"),
            ("store category option label helper binding", "{storeCategoryOptionLabel(category)}"),
            ("store category option selected helper", "function storeCategoryOptionSelected(category: ReturnType<typeof storeCategoryDisplayItem>, selectedCategory: StoreCategory)"),
            ("store category option selected helper fields", "return storeCategoryTarget(category) === selectedCategory;"),
            ("store category option selected helper binding", "storeCategoryOptionSelected(category, storeCategory)"),
            ("store display bundle helper binding", "const storeDisplay = useMemo("),
            ("store display bundle backend products", "backendProducts: storeBackendProducts"),
            ("store display bundle fallback products", "fallbackProducts: storeProducts"),
            ("store category display items helper binding", "const storeCategoryDisplayOptions = storeDisplay.categoryDisplayOptions;"),
            ("store product display items helper binding", "const storeProductDisplayItems = storeDisplay.productDisplayItems;"),
            ("store visible helper binding", "const visibleStoreProducts = storeDisplay.visibleProducts;"),
            ("food community category display items helper binding", "const foodCommunityCategoryDisplayOptions = foodCommunityDisplay.categoryDisplayOptions;"),
            ("food community category default item helper", "function foodCommunityCategoryDefaultItemId(category: FoodCommunityCategory)"),
            ("food community category default item helper fields", "return firstMatch?.id ?? \"\";"),
            ("food community category select handler", "function selectFoodCommunityCategory(category: FoodCommunityCategory)"),
            ("food community category default item helper binding", "setSelectedFoodCommunityItemId(foodCommunityCategoryDefaultItemId(category));"),
            ("food community category option press handler", "function pressFoodCommunityCategoryOption(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option key helper", "function foodCommunityCategoryOptionKey(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option key helper fields", "return category.value;"),
            ("food community category option key helper binding", "key={foodCommunityCategoryOptionKey(category)}"),
            ("food community category option accessibility label helper", "function foodCommunityCategoryOptionAccessibilityLabel(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option accessibility label helper fields", "return category.accessibilityLabel;"),
            ("food community category option accessibility label helper binding", "accessibilityLabel={foodCommunityCategoryOptionAccessibilityLabel(category)}"),
            ("food community category option label helper", "function foodCommunityCategoryOptionLabel(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category option label helper fields", "return category.label;"),
            ("food community category option label helper binding", "{foodCommunityCategoryOptionLabel(category)}"),
            ("food community category option selected helper", "function foodCommunityCategoryOptionSelected(category: ReturnType<typeof foodCommunityCategoryDisplayItem>, selectedCategory: FoodCommunityCategory)"),
            ("food community category option selected helper fields", "return selectedCategory === category.value;"),
            ("food community category option selected helper state binding", "accessibilityState={{ selected: foodCommunityCategoryOptionSelected(category, foodCommunityCategory) }}"),
            ("food community category option selected helper pill style binding", "foodCommunityCategoryOptionSelected(category, foodCommunityCategory) ? styles.segmentActive : null"),
            ("food community category option selected helper text style binding", "foodCommunityCategoryOptionSelected(category, foodCommunityCategory) ? styles.segmentTextActive : null"),
            ("food community category target helper", "function foodCommunityCategoryTarget(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community category target helper fields", "return category.value;"),
            ("food community category target helper binding", "selectFoodCommunityCategory(foodCommunityCategoryTarget(category));"),
            ("food community list item key helper", "function foodCommunityListItemKey(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community list item key helper fields", "return item.id;"),
            ("food community list item key helper binding", "key={foodCommunityListItemKey(item)}"),
            ("food community list item accessibility label helper", "function foodCommunityListItemAccessibilityLabel(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community list item accessibility label helper fields", "return item.accessibilityLabel;"),
            ("food community list item accessibility label helper binding", "accessibilityLabel={foodCommunityListItemAccessibilityLabel(item)}"),
            ("food community list item selected helper", "function foodCommunityListItemSelected("),
            ("food community list item selected helper fields", "return selectedItem?.id === item.id;"),
            ("food community list item selected helper state binding", "accessibilityState={{ selected: foodCommunityListItemSelected(item, selectedFoodCommunityItem) }}"),
            ("food community list item selected helper style binding", "foodCommunityListItemSelected(item, selectedFoodCommunityItem) ? styles.recordCardSelected : null"),
            ("food community list empty helper", "function foodCommunityListIsEmpty(items: Array<ReturnType<typeof foodCommunityItemDisplayItem>>)"),
            ("food community list empty helper fields", "return items.length === 0;"),
            ("food community list empty helper binding", "foodCommunityListIsEmpty(visibleFoodCommunityItems) ? ("),
            ("store product status handler", "function showStoreProductStatus(actionStatus: string)"),
            ("store product action status helper", "function storeProductActionStatus(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product action status helper fields", "return product.actionStatus;"),
            ("store product card key helper", "function storeProductCardKey(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card key helper fields", "return product.id;"),
            ("store product card key helper binding", "key={storeProductCardKey(product)}"),
            ("store product card icon helper", "function storeProductCardIcon(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card icon helper fields", "return product.icon;"),
            ("store product card icon helper binding", "{storeProductCardIcon(product)}"),
            ("store product card title helper", "function storeProductCardTitle(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card title helper fields", "return product.title;"),
            ("store product card title helper binding", "{storeProductCardTitle(product)}"),
            ("store product card badge helper", "function storeProductCardBadge(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card badge helper fields", "return product.badge;"),
            ("store product card badge helper binding", "storeProductCardBadge(product) ?"),
            ("store product card description helper", "function storeProductCardDescription(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card description helper fields", "return product.description;"),
            ("store product card description helper binding", "{storeProductCardDescription(product)}"),
            ("store product card points helper", "function storeProductCardPointsCost(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product card points helper fields", "return product.pointsCost;"),
            ("store product card points helper binding", "{storeProductCardPointsCost(product)}"),
            ("store product reward id helper", "function storeProductRewardId(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product reward id helper fields", "return product.id;"),
            ("store product redeem title helper", "function storeProductRedeemTitle(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product redeem title helper fields", "return product.title;"),
            ("store product action label helper", "function storeProductActionLabel(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product action label helper fields", 'return product.rewardStatus === "redeemable" ? "兌" : auxiliaryDisplayLabels.productOpenArrow;'),
            ("store product action accessibility helper", "function storeProductActionAccessibilityLabel(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store product action accessibility helper fields", "return product.actionAccessibilityLabel;"),
            ("store redemption use id helper", "function storeRedemptionUseId(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption use id helper fields", "return redemption.id;"),
            ("store redemption use title helper", "function storeRedemptionUseTitle(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption use title helper fields", "return redemption.title;"),
            ("store redemption use status label helper", "function storeRedemptionUseStatusLabel(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption use status label helper fields", "return redemption.statusLabel;"),
            ("store redemption card key helper", "function storeRedemptionCardKey(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption card key helper fields", "return redemption.id;"),
            ("store redemption card key helper binding", "key={storeRedemptionCardKey(product)}"),
            ("store redemption card title helper", "function storeRedemptionCardTitle(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption card title helper fields", "return redemption.title;"),
            ("store redemption card title helper binding", "{storeRedemptionCardTitle(product)}"),
            ("store redemption card status helper", "function storeRedemptionCardStatusLabel(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption card status helper fields", "return redemption.statusLabel;"),
            ("store redemption card status helper binding", "{storeRedemptionCardStatusLabel(product)}"),
            ("store redemption card subtitle helper", "function storeRedemptionCardSubtitle(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption card subtitle helper fields", "return redemption.subtitle;"),
            ("store redemption card subtitle helper binding", "{storeRedemptionCardSubtitle(product)}"),
            ("store redemption action disabled helper", "function storeRedemptionActionDisabled(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption action disabled helper fields", "return !redemption.isUsable;"),
            ("store redemption action label helper", "function storeRedemptionActionLabel(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption action label helper fields", "return redemption.actionLabel;"),
            ("store redemption action accessibility helper", "function storeRedemptionActionAccessibilityLabel(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redemption action accessibility helper fields", "return redemption.actionAccessibilityLabel;"),
            ("store redemption boundary row key helper", "function storeRedemptionBoundaryRowKey(row: (typeof storeRedemptionBoundaryRows)[number])"),
            ("store redemption boundary row key helper fields", "return row.label;"),
            ("store redemption boundary row key helper binding", "key={storeRedemptionBoundaryRowKey(row)}"),
            ("store redemption boundary row label helper", "function storeRedemptionBoundaryRowLabel(row: (typeof storeRedemptionBoundaryRows)[number])"),
            ("store redemption boundary row label helper fields", "return row.label;"),
            ("store redemption boundary row label helper binding", "{storeRedemptionBoundaryRowLabel(row)}"),
            ("store redemption boundary row value helper", "function storeRedemptionBoundaryRowValue(row: (typeof storeRedemptionBoundaryRows)[number])"),
            ("store redemption boundary row value helper fields", "return row.value;"),
            ("store redemption boundary row value helper binding", "{storeRedemptionBoundaryRowValue(row)}"),
            ("store product status press handler", "function pressStoreProductStatus(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store redemption status press handler", "function pressStoreRedemptionStatus(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store catalog sync function", "async function loadStoreCatalogAndPoints()"),
            ("store sync status helper binding", "const storeSyncStatus = storeCatalogSyncStatusMessages({"),
            ("store sync unavailable status binding", "setStoreActionStatus(storeSyncStatus.unavailable);"),
            ("store sync in-flight status binding", "setStoreActionStatus(storeSyncStatus.inFlight);"),
            ("store sync loading status binding", "setStoreActionStatus(storeSyncStatus.loading);"),
            ("store sync success status binding", "setStoreActionStatus(\n        storeCatalogSyncStatusMessages({"),
            ("store sync failure status binding", "setStoreActionStatus(storeSyncStatus.failure);"),
            ("store rewards endpoint", 'requestJson<StoreRewardApiInput[]>(normalizedApiBaseUrl, "/store/rewards"'),
            ("store points endpoint", 'requestJson<StoreApiPointsBalance>(normalizedApiBaseUrl, "/store/points"'),
            ("store redemptions endpoint", 'requestJson<StoreApiRedemption[]>(normalizedApiBaseUrl, "/store/redemptions?limit=20"'),
            ("store redemption wallet helper binding", "const storeRedemptionDisplayItems = storeDisplay.redemptionDisplayItems;"),
            ("store redemption boundary rows helper binding", "const storeRedemptionBoundaryRows = storeDisplay.redemptionBoundaryRows;"),
            ("store redemption post endpoint", '"/store/redemptions"'),
            ("store redemption reward payload", "body: JSON.stringify({ reward_code: rewardId })"),
            ("store redemption use endpoint", "`/store/redemptions/${redemptionId}/use`"),
            ("store redemption wallet label", "我的兌換券"),
            ("store empty wallet all reward types copy", "尚未同步兌換紀錄；完成食物分享取得點數後可兌換優惠券、折扣碼、特殊徽章或會員福利。"),
            ("store redemption wallet render", "storeRedemptionDisplayItems.map((product) =>"),
            ("store redemption action binding", "onPress={() => pressStoreRedemptionStatus(product)}"),
            ("store redemption disabled helper accessibility state", "accessibilityState={{ disabled: storeRedemptionActionDisabled(product) }}"),
            ("store redemption disabled helper style", "storeRedemptionActionDisabled(product) ? styles.buttonDisabled : null"),
            ("store redemption disabled helper prop", "disabled={storeRedemptionActionDisabled(product)}"),
            ("store redemption action label helper binding", "{storeRedemptionActionLabel(product)}"),
            ("store redemption action accessibility helper binding", "accessibilityLabel={storeRedemptionActionAccessibilityLabel(product)}"),
            ("store redemption boundary rows", "storeRedemptionBoundaryRows.map"),
            ("store redeem status helper binding", "const redeemStatus = storeRedeemStatusMessages({"),
            ("store redeem visual-smoke status binding", "setStoreActionStatus(redeemStatus.visualSmoke);"),
            ("store redeem unavailable status binding", "setStoreActionStatus(redeemStatus.unavailable);"),
            ("store redeem invalid product status binding", "setStoreActionStatus(redeemStatus.invalidProduct);"),
            ("store redeem in-flight status binding", "setStoreActionStatus(redeemStatus.inFlight);"),
            ("store redeem loading status binding", "setStoreActionStatus(redeemStatus.loading);"),
            ("store redeem success status binding", "setStoreActionStatus(\n        storeRedeemStatusMessages({"),
            ("store redeem failure status binding", "setStoreActionStatus(redeemStatus.failure);"),
            ("store redemption use status helper binding", "const redemptionUseStatus = storeRedemptionUseStatusMessages({"),
            ("store redemption use visual-smoke status binding", "setStoreActionStatus(redemptionUseStatus.visualSmoke);"),
            ("store redemption use unavailable status binding", "setStoreActionStatus(redemptionUseStatus.unavailable);"),
            ("store redemption use unusable status binding", "setStoreActionStatus(redemptionUseStatus.unusable);"),
            ("store redemption use invalid status binding", "setStoreActionStatus(redemptionUseStatus.invalid);"),
            ("store redemption use in-flight status binding", "setStoreActionStatus(redemptionUseStatus.inFlight);"),
            ("store redemption use loading status binding", "setStoreActionStatus(redemptionUseStatus.loading);"),
            ("store redemption use success status binding", "setStoreActionStatus(\n        storeRedemptionUseStatusMessages({"),
            ("store redemption use failure status binding", "setStoreActionStatus(redemptionUseStatus.failure);"),
            ("store product action label binding", "{storeProductActionLabel(product)}"),
            ("food photo upload status handler", "function showFoodPhotoUploadStatus()"),
            ("food photo integration status handler", "function showFoodPhotoIntegrationStatus()"),
            ("food photo retake status handler", "function showFoodPhotoRetakeStatus()"),
            ("future modules open binding", "onPress={openFutureModulesFromMenu}"),
            ("future modules return menu binding", "onPress={returnFromFutureModulesToMenu}"),
            ("future module detail return binding", "onPress={returnFromFutureModuleDetail}"),
            ("future module destination binding", "onPress={() => pressFutureModuleDestination(item)}"),
            ("doctor share return binding", "onPress={returnFromDoctorSharePreview}"),
            ("health integration return binding", "onPress={returnFromHealthIntegrationPreview}"),
            ("community return binding", "onPress={returnFromCommunityPreview}"),
            ("ranking return binding", "onPress={rankingReturnFutureModulesPressTarget}"),
            ("achievements return binding", "onPress={returnFromAchievements}"),
            ("year review return binding", "onPress={returnFromYearReview}"),
            ("store cart open binding", "onPress={openStoreCart}"),
            ("store return binding", "onPress={returnFromStore}"),
            ("store cart return store binding", "onPress={returnFromStoreCartToStore}"),
            ("food photo return binding", "onPress={returnFromFoodPhoto}"),
            ("achievement integration status binding", "onPress={showAchievementIntegrationStatus}"),
            ("year review share status binding", "onPress={showYearReviewShareStatus}"),
            ("store search input binding", "onChangeText={updateStoreSearchInput}"),
            ("store category option press binding", "onPress={() => pressStoreCategoryOption(category)}"),
            ("store product status press binding", "onPress={() => pressStoreProductStatus(product)}"),
            ("food photo upload status binding", "onPress={showFoodPhotoUploadStatus}"),
            ("food photo integration status binding", "onPress={showFoodPhotoIntegrationStatus}"),
            ("food photo retake status binding", "onPress={showFoodPhotoRetakeStatus}"),
            ("achievement integration accessibility binding", "accessibilityLabel={achievementIntegrationAccessibilityDisplayLabel}"),
            ("achievement newly unlocked state", "const [achievementNewlyUnlockedItems, setAchievementNewlyUnlockedItems] = useState<AchievementItem[]>([])"),
            ("achievement newly unlocked display items", "const achievementNewlyUnlockedDisplayItems = useMemo("),
            ("achievement limited display helper binding", "limitedAchievementDisplayItems(achievementNewlyUnlockedItems)"),
            ("achievement save success newly unlocked helper binding", "const saveSuccessNewlyUnlockedDisplayItems = saveSuccessNewlyUnlockedAchievementDisplayItems("),
            ("achievement category sections helper binding", "const achievementCategoryDisplaySections = useMemo("),
            ("achievement newly unlocked filter", "mappedSummaryItems.filter((item) => item.newlyUnlocked)"),
            ("achievement newly unlocked section", "本次新解鎖"),
            ("achievement save success newly unlocked section", "新解鎖成就"),
            ("achievement save success newly unlocked render", "saveSuccessNewlyUnlockedDisplayItems.map"),
            ("achievement unlocked card key helper", "function achievementUnlockedCardKey(prefix: string, displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card badge style helper", "function achievementUnlockedCardBadgeStyle(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card badge style helper fields", 'displayItem.kind === "streak" ? styles.achievementBadgeStreak : null'),
            ("achievement unlocked card icon helper", "function achievementUnlockedCardIcon(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card icon helper binding", "{achievementUnlockedCardIcon(displayItem)}"),
            ("achievement unlocked card level helper", "function achievementUnlockedCardLevel(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card level helper binding", "{achievementUnlockedCardLevel(displayItem)}"),
            ("achievement unlocked card title helper", "function achievementUnlockedCardTitle(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card title helper binding", "{achievementUnlockedCardTitle(displayItem)}"),
            ("achievement unlocked card detail helper", "function achievementUnlockedCardDetail(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement unlocked card detail helper fields", "return `${displayItem.kindLabel} · ${achievementUnlockDisplayDate(displayItem.unlockedAt)}`;"),
            ("achievement unlocked card detail helper binding", "{achievementUnlockedCardDetail(displayItem)}"),
            ("achievement save-success unlocked card key binding", 'achievementUnlockedCardKey("save-success-new-unlock", displayItem)'),
            ("achievement newly unlocked card key binding", 'achievementUnlockedCardKey("new-unlock", displayItem)'),
            ("achievement unlocked card key binding", 'achievementUnlockedCardKey("unlock", displayItem)'),
            ("achievement progress card key helper", "function achievementProgressCardKey(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card key helper binding", "key={achievementProgressCardKey(displayItem)}"),
            ("achievement progress card accessibility helper", "function achievementProgressCardAccessibilityLabel(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card accessibility helper binding", "accessibilityLabel={achievementProgressCardAccessibilityLabel(displayItem)}"),
            ("achievement progress card unlocked helper", "function achievementProgressCardIsUnlocked(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card unlocked helper fields", "return displayItem.progress >= displayItem.target;"),
            ("achievement progress card ratio helper", "function achievementProgressCardRatio(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card ratio helper fields", "return Math.min(1, displayItem.progress / displayItem.target);"),
            ("achievement progress card style helper", "function achievementProgressCardStyle(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card style helper binding", "style={achievementProgressCardStyle(displayItem)}"),
            ("achievement progress card status style helper", "function achievementProgressCardStatusStyle(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card status text helper", "function achievementProgressCardStatusText(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card status binding", "{achievementProgressCardStatusText(displayItem)}"),
            ("achievement progress card detail helper", "function achievementProgressCardDetail(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card detail helper fields", "return `${displayItem.kindLabel} · ${displayItem.description}`;"),
            ("achievement progress card detail helper binding", "{achievementProgressCardDetail(displayItem)}"),
            ("achievement progress card fill style helper", "function achievementProgressCardFillStyle(displayItem: (typeof achievementDisplayItems)[number])"),
            ("achievement progress card fill style helper binding", "style={achievementProgressCardFillStyle(displayItem)}"),
            ("achievement category section key helper", "function achievementCategorySectionKey(section: (typeof achievementCategoryDisplaySections)[number])"),
            ("achievement category section key helper fields", "return section.key;"),
            ("achievement category section key binding", "key={achievementCategorySectionKey(section)}"),
            ("achievement category section label helper", "function achievementCategorySectionLabel(section: (typeof achievementCategoryDisplaySections)[number])"),
            ("achievement category section label helper fields", "return section.label;"),
            ("achievement category section label binding", "{achievementCategorySectionLabel(section)}"),
            ("achievement category section items helper", "function achievementCategorySectionItems(section: (typeof achievementCategoryDisplaySections)[number])"),
            ("achievement category section items helper fields", "return section.items;"),
            ("achievement category section items binding", "achievementCategorySectionItems(section).map((displayItem) => {"),
            ("achievement unlocked history endpoint", "`/achievements/unlocks?${query.toString()}`"),
            ("achievement sync status helper binding", "const achievementSyncStatus = achievementSyncStatusMessages({"),
            ("achievement sync unavailable status binding", "setAchievementActionStatus(achievementSyncStatus.unavailable);"),
            ("achievement sync in-flight status binding", "setAchievementActionStatus(achievementSyncStatus.inFlight);"),
            ("achievement sync loading status binding", "setAchievementActionStatus(achievementSyncStatus.loading);"),
            ("achievement sync endpoint", "syncUnlocks ? `/achievements/sync?${query.toString()}` : `/achievements/summary?${query.toString()}`"),
            ("achievement sync method post", 'method: syncUnlocks ? "POST" : "GET"'),
            ("achievement sync success status binding", "setAchievementActionStatus(\n        achievementSyncStatusMessages({"),
            ("achievement sync failure status binding", "setAchievementActionStatus(achievementSyncStatus.failure);"),
            ("achievement sync handler passes true", "void loadAchievementSummary(true);"),
            ("achievement post-save sync helper", "function syncAchievementsAfterRecordSave()"),
            ("achievement AI save success sync", "setStatus(aiSaveSuccessStatusMessage());\n      syncAchievementsAfterRecordSave();"),
            ("achievement AI daily save transactional response", "const saveResponse = await requestJson<DailyRecordSaveResponse>"),
            ("achievement manual create sync", "setStatus(manualRecordCreateSuccessStatusMessage());\n      syncAchievementsAfterRecordSave();"),
            ("achievement category sections", "achievementCategoryDisplaySections.map"),
            ("achievement section item render", "achievementCategorySectionItems(section).map"),
            ("achievement streak style", "displayItem.kind === \"streak\" ? styles.achievementBadgeStreak : null"),
            ("achievement badge level render", "{achievementUnlockedCardLevel(displayItem)}"),
            ("achievement accessibility binding", "accessibilityLabel={achievementProgressCardAccessibilityLabel(displayItem)}"),
            ("achievement progress ratio bounded", "return Math.min(1, displayItem.progress / displayItem.target);"),
            ("year review generation display value", "const yearReviewGenerationDisplayText = nextYearReviewGenerationLabel(new Date());"),
            ("year review header display helper binding", "const yearReviewHeaderDisplay = yearReviewHeaderDisplayTexts({"),
            ("year review header target year binding", "targetYear: yearReviewTargetDisplayYear"),
            ("year review header record count binding", "recordCount: yearlyRecordDisplayCount"),
            ("year review header source binding", "summary: yearReviewBackendSummary"),
            ("year review hero title display value", "const yearReviewHeroTitleDisplayText = yearReviewHeaderDisplay.heroTitle;"),
            ("year review hero title render", "{yearReviewHeroTitleDisplayText}"),
            ("year review record stats helper binding", "const yearlyRecordStats = useMemo("),
            ("year review record stats records binding", "yearlyReviewRecordStats(records, yearReviewTargetDisplayYear)"),
            ("year review achievement badge summary binding", "const yearlyAchievementBadgeSummary = achievementBadgeSummary(achievementDisplayItems);"),
            ("year review unlocked badge count summary binding", "yearlyAchievementBadgeSummary.unlockedCount"),
            ("year review highest badge level summary binding", "yearlyAchievementBadgeSummary.highestLevel"),
            ("year review glucose count helper binding", "const yearlyGlucoseRecordDisplayCount = clampNumber(yearlyRecordStats.glucoseRecords.length, 0, maxMobileCountValue);"),
            ("year review live calculation display value", "const yearReviewLiveCalculationDisplayText = yearReviewHeaderDisplay.liveCalculation;"),
            ("year review backend metric rows helper binding", "const backendYearMetricRows = backendYearReviewMetricDisplayRows(yearReviewBackendSummary);"),
            ("year review backend health rows helper binding", "const backendYearHealthRows = backendYearReviewHealthOutcomeDisplayRows(yearReviewBackendSummary);"),
            ("year review local metric rows helper binding", "const localYearlyReviewMetricRows = localYearlyReviewMetricDisplayRows("),
            ("year review annual stat rows", "yearlyReviewMetricRows.map"),
            ("year review metric row key helper", "function yearlyReviewMetricRowKey(row: (typeof yearlyReviewMetricRows)[number])"),
            ("year review metric row key helper fields", "return row.label;"),
            ("year review metric row key helper binding", "key={yearlyReviewMetricRowKey(row)}"),
            ("year review metric row label helper", "function yearlyReviewMetricRowLabel(row: (typeof yearlyReviewMetricRows)[number])"),
            ("year review metric row label helper fields", "return row.label;"),
            ("year review metric row label helper binding", "{yearlyReviewMetricRowLabel(row)}"),
            ("year review metric row value helper", "function yearlyReviewMetricRowValue(row: (typeof yearlyReviewMetricRows)[number])"),
            ("year review metric row value helper fields", "return row.value;"),
            ("year review metric row value helper binding", "{yearlyReviewMetricRowValue(row)}"),
            ("year review local health rows helper binding", "const localYearlyHealthOutcomeRows = localYearlyHealthOutcomeDisplayRows("),
            ("year review health outcome rows", "yearlyHealthOutcomeRows.map"),
            ("year review health outcome row key helper", "function yearlyHealthOutcomeRowKey(row: (typeof yearlyHealthOutcomeRows)[number])"),
            ("year review health outcome row key helper fields", "return row.label;"),
            ("year review health outcome row key helper binding", "key={yearlyHealthOutcomeRowKey(row)}"),
            ("year review health outcome row label helper", "function yearlyHealthOutcomeRowLabel(row: (typeof yearlyHealthOutcomeRows)[number])"),
            ("year review health outcome row label helper fields", "return row.label;"),
            ("year review health outcome row label helper binding", "{yearlyHealthOutcomeRowLabel(row)}"),
            ("year review health outcome row value helper", "function yearlyHealthOutcomeRowValue(row: (typeof yearlyHealthOutcomeRows)[number])"),
            ("year review health outcome row value helper fields", "return row.value;"),
            ("year review health outcome row value helper binding", "{yearlyHealthOutcomeRowValue(row)}"),
            ("year review local highlight helper binding", "const yearlyHighlightDisplayTexts = localYearlyHighlightDisplayItems("),
            ("year review highlight item key helper", "function yearlyHighlightItemKey(item: string)"),
            ("year review highlight item key helper fields", "return item;"),
            ("year review highlight item key binding", "key={yearlyHighlightItemKey(item)}"),
            ("year review highlight item text helper", "function yearlyHighlightItemText(item: string)"),
            ("year review highlight item text helper fields", "return item;"),
            ("year review highlight item text binding", "{yearlyHighlightItemText(item)}"),
            ("year review insight display helper binding", "const yearlyInsightDisplayTexts = yearReviewInsightDisplayTexts({"),
            ("year review insight backend observation binding", "backendObservation: backendYearAiObservation"),
            ("year review insight backend encouragement binding", "backendEncouragement: backendYearAiEncouragement"),
            ("year review glucose average display text binding", "const yearlyGlucoseAverageDisplayText = yearlyInsightDisplayTexts.glucoseAverage;"),
            ("year review AI observation", "yearlyAiObservationDisplayText"),
            ("year review AI encouragement", "yearlyAiEncouragementDisplayText"),
            ("year review source display value", "const yearReviewSourceDisplayText = yearReviewHeaderDisplay.source;"),
            ("year review source render", "{yearReviewSourceDisplayText}"),
            ("year review share accessibility binding", "accessibilityLabel={yearReviewShareAccessibilityDisplayLabel}"),
            ("year review sync status helper binding", "const yearReviewSyncStatus = yearReviewSyncStatusMessages({"),
            ("year review sync unavailable status binding", "setYearReviewActionStatus(yearReviewSyncStatus.unavailable);"),
            ("year review sync in-flight status binding", "setYearReviewActionStatus(yearReviewSyncStatus.inFlight);"),
            ("year review sync loading status binding", "setYearReviewActionStatus(yearReviewSyncStatus.loading);"),
            ("year review sync success status binding", "setYearReviewActionStatus(\n        yearReviewSyncStatusMessages({"),
            ("year review sync failure status binding", "setYearReviewActionStatus(yearReviewSyncStatus.failure);"),
            ("year review native share import", "Share,"),
            ("year review share card status helper binding", "const shareCardStatus = yearReviewShareCardStatusMessages({"),
            ("year review share card unavailable status binding", "setYearReviewActionStatus(shareCardStatus.unavailable);"),
            ("year review share card loading status binding", "setYearReviewActionStatus(shareCardStatus.loading);"),
            ("year review share asset endpoint", "`/year-reviews/${targetYear}/share-card/asset?${query.toString()}`"),
            ("year review share confirm endpoint", "`/year-reviews/${targetYear}/share-card/confirm?${query.toString()}`"),
            ("year review privacy acknowledgement payload", "body: JSON.stringify({ privacy_acknowledged: true })"),
            ("year review bounded share package id", "const confirmedSharePackageId = boundIdentifier(sharePackage.share_package_id);"),
            ("year review invalid share package guard", 'throw new Error("invalid_year_review_share_package_id");'),
            ("year review share asset uri prepared", "const shareAssetUri = await writeYearReviewShareAssetFile(shareAsset);"),
            ("year review native share call", "const shareResult = await Share.share({"),
            ("year review bounded share text", "message: boundDisplayText(sharePackage.share_text, maxDisplayDetailTextLength)"),
            ("year review native share asset url", "url: shareAssetUri"),
            ("year review share result mapping", 'const shareResultKind = shareResult.action === Share.sharedAction ? "opened" : "dismissed";'),
            ("year review share result endpoint", "`/year-reviews/share-packages/${confirmedSharePackageId}/result`"),
            ("year review share result payload", "body: JSON.stringify({ share_result: shareResultKind })"),
            ("year review reported package id bounded state", "setYearReviewSharePackageId(boundIdentifier(reportedPackage.share_package_id) || confirmedSharePackageId);"),
            ("year review fallback package id bounded state", "setYearReviewSharePackageId(confirmedSharePackageId);"),
            ("year review share card success status binding", "setYearReviewActionStatus(\n        yearReviewShareCardStatusMessages({"),
            ("year review share card failure status binding", "setYearReviewActionStatus(shareCardStatus.failure);"),
            ("year review revoke handler", "function revokeYearReviewShareStatus()"),
            ("year review revoke status helper binding", "const revokeStatus = yearReviewRevokeStatusMessages({"),
            ("year review revoke visual-smoke status binding", "setYearReviewActionStatus(revokeStatus.visualSmoke);"),
            ("year review revoke empty status binding", "setYearReviewActionStatus(revokeStatus.empty);"),
            ("year review revoke unavailable status binding", "setYearReviewActionStatus(revokeStatus.unavailable);"),
            ("year review revoke bounded package id", "const targetSharePackageId = boundIdentifier(yearReviewSharePackageId);"),
            ("year review invalid revoke package guard", "setYearReviewActionStatus(revokeStatus.invalid);"),
            ("year review revoke loading status binding", "setYearReviewActionStatus(revokeStatus.loading);"),
            ("year review revoke endpoint", "`/year-reviews/share-packages/${targetSharePackageId}/revoke`"),
            ("year review revoke success status binding", "setYearReviewActionStatus(\n        yearReviewRevokeStatusMessages({"),
            ("year review revoke failure status binding", "setYearReviewActionStatus(revokeStatus.failure);"),
            ("store product button role", 'accessibilityRole="button"\n                  style={styles.roundActionButton}'),
            ("store preview display helper binding", "const storePreviewDisplay = storePreviewDisplayTexts(storeActionStatus);"),
            ("store action status display binding", "const storeActionStatusDisplayText = storePreviewDisplay.actionStatus;"),
            ("store preview boundary display binding", "const storePreviewBoundaryDisplayText = storePreviewDisplay.previewBoundary;"),
            ("store cart accessibility display binding", "const storeCartButtonAccessibilityDisplayLabel = storePreviewDisplay.cartButtonAccessibility;"),
            ("store cart accessibility binding", "accessibilityLabel={storeCartButtonAccessibilityDisplayLabel}"),
            ("food photo upload button role", 'accessibilityRole="button"\n              style={styles.uploadBox}'),
            ("food photo status display helper binding", "const foodPhotoStatusDisplay = foodPhotoStatusDisplayTexts(foodPhotoActionStatus);"),
            ("food photo action status display binding", "const foodPhotoActionStatusDisplayText = foodPhotoStatusDisplay.action;"),
            ("food photo upload status binding", "const foodPhotoUploadStatusMessage = foodPhotoStatusDisplay.upload;"),
            ("food photo integration accessibility binding", "accessibilityLabel={foodPhotoIntegrationAccessibilityDisplayLabel}"),
            ("food photo retake accessibility binding", "accessibilityLabel={foodPhotoRetakeAccessibilityDisplayLabel}"),
            ("future commerce primary CTA button role", 'accessibilityRole="button"\n              style={styles.primaryButtonFull}'),
            ("future commerce secondary CTA button role", 'accessibilityRole="button"\n              style={styles.secondaryButton}'),
            ("future commerce action row CTA button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
        ):
            _assert_contains(label, content, marker)
        future_module_card_render_block = _match_block(
            content,
            r"futureModuleDisplayCards\.map\(\(item\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "future module card render block",
        )
        for label, marker in (
            ("direct future module card key binding", "key={item.key}"),
            ("direct future module card accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("direct future module card icon binding", "<Text>{item.icon}</Text>"),
            ("direct future module card title binding", "<Text style={styles.recordType}>{item.title}</Text>"),
            ("direct future module card description binding", "<Text style={styles.recordContent}>{item.description}</Text>"),
            ("direct future module card readiness binding", "<Text style={styles.evidence}>{item.readiness}</Text>"),
            ("direct future module card requirements binding", "item.requirements.map((requirement) => ("),
            ("direct future module card requirement key binding", "key={requirement.key}"),
            ("direct future module card requirement text binding", "text={requirement.text}"),
            ("direct future module card safety binding", "<Text style={styles.warningText}>{item.safety}</Text>"),
            ("direct future module card target preview binding", "{item.target ? <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.viewPreview}</Text> : null}"),
            ("direct future module card target integration binding", "{!item.target ? <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.viewIntegration}</Text> : null}"),
        ):
            _assert_not_contains(label, future_module_card_render_block, marker)
        future_module_detail_requirement_block = _match_block(
            content,
            r"selectedFutureModuleDisplay\.requirements\.map\(\(requirement\) => \(([\s\S]*?<HighlightBulletRow[^>]*/>)",
            "future module detail requirement render block",
        )
        for label, marker in (
            ("direct future module detail requirement key binding", "key={requirement.key}"),
            ("direct future module detail requirement text binding", "text={requirement.text}"),
        ):
            _assert_not_contains(label, future_module_detail_requirement_block, marker)
        for label, marker in (
            ("year review file system import", 'import * as FileSystem from "expo-file-system";'),
            ("year review share asset cache helper", "export async function writeYearReviewShareAssetFile(asset: YearReviewApiShareAsset)"),
            ("year review share asset cache directory guard", "if (!FileSystem.cacheDirectory)"),
            ("year review share asset filename sanitizer", "safeYearReviewShareAssetFileName(asset.filename)"),
            ("year review share asset svg write", "await FileSystem.writeAsStringAsync(uri, asset.svg_text"),
            ("year review share asset utf8 encoding", "encoding: FileSystem.EncodingType.UTF8"),
        ):
            _assert_contains(label, year_review_share_file_content, marker)
        for label, marker in (
            ("achievements return accessibility label", 'achievementsReturnAccessibility: boundDisplayText("返回上一個功能入口，不寫入成就資料", maxDisplayDetailTextLength)'),
            ("year review return accessibility label", 'yearReviewReturnAccessibility: boundDisplayText("返回上一個功能入口，不產生分享圖或公開資料", maxDisplayDetailTextLength)'),
            ("store return accessibility label", 'storeReturnAccessibility: boundDisplayText("返回上一個功能入口，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("store cart checkout accessibility label", 'storeCartCheckoutAccessibility: boundDisplayText("結帳尚未開放，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("store cart return accessibility label", 'storeCartReturnAccessibility: boundDisplayText("返回商城，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("food photo return accessibility label", 'foodPhotoReturnAccessibility: boundDisplayText("返回上一個功能入口，不讀取照片或呼叫 Vision", maxDisplayDetailTextLength)'),
        ):
            _assert_contains(label, shared_display_items_content, marker)
        for label, marker in (
            ("achievements return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.achievementsReturnAccessibility}"),
            ("year review return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.yearReviewReturnAccessibility}"),
            ("store return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeReturnAccessibility}"),
            ("store cart checkout accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeCartCheckoutAccessibility}"),
            ("store cart checkout disabled state", "accessibilityState={{ disabled: true }}"),
            ("store cart return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeCartReturnAccessibility}"),
            ("food photo return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.foodPhotoReturnAccessibility}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("year review API response type", "export type YearReviewApiResponse = {"),
            ("year review share asset type", "export type YearReviewApiShareAsset = {"),
            ("year review target year helper", "export function yearReviewTargetYear(value: Date)"),
            ("year review sync status helper", "export function yearReviewSyncStatusMessages(value: {"),
            ("year review sync unavailable fallback", "backend 尚未 ready"),
            ("year review sync loading copy", "正在同步 backend 年度回顧。"),
            ("year review sync snapshot id binding", "已保存 snapshot ${boundIdentifier(value.snapshotId).slice(0, 8)}"),
            ("year review sync success copy", "已同步 ${value.year} 年 backend 年度回顧"),
            ("year review sync failure copy", "年度回顧同步失敗；目前保留本機已載入紀錄預覽。"),
            ("year review generation label helper", "export function nextYearReviewGenerationLabel(value: Date)"),
            ("year review generation label copy", "return boundDisplayText(`每年 1 月 1 日自動產生前一年度回顧；下一次為 ${nextYear} 年 1 月 1 日`, maxDisplayDetailTextLength);"),
            ("year review source helper", "export function yearReviewSourceDisplayCopy(summary: YearReviewApiResponse | null, sharePackageId: string)"),
            ("year review source snapshot id", "snapshot ${boundIdentifier(summary.snapshot_id).slice(0, 8)}"),
            ("year review source generated time", "產生時間 ${recordDateTimeDisplay(summary.generated_at)}"),
            ("year review source share package id", "最近分享 package ${boundedSharePackageId.slice(0, 8)}"),
            ("year review header display helper", "export function yearReviewHeaderDisplayTexts(value: {"),
            ("year review header preview boundary", "previewBoundary: yearReviewPreviewBoundaryCopy()"),
            ("year review header hero title", "heroTitle: yearReviewHeroTitleCopy(value.targetYear)"),
            ("year review header source", "source: yearReviewSourceDisplayCopy(value.summary, value.sharePackageId)"),
            ("year review header share accessibility", "shareAccessibilityLabel: yearReviewShareButtonAccessibilityLabel()"),
            ("year review backend-saved boundary", "年度回顧由 backend snapshot 保存年度統計、AI-style 觀察與鼓勵；不提供診療建議或療效宣稱。"),
            ("year review backend metric rows helper", "export function backendYearReviewMetricDisplayRows(summary: YearReviewApiResponse | null)"),
            ("year review backend metric rows slice", "summary?.annual_stats.slice(0, 7).map"),
            ("year review backend health rows helper", "export function backendYearReviewHealthOutcomeDisplayRows(summary: YearReviewApiResponse | null)"),
            ("year review backend health rows slice", "summary?.health_outcomes.slice(0, 3).map"),
            ("year review share unavailable status helper", "export function yearReviewShareUnavailableStatusMessage()"),
            ("year review backend-aware share fallback", "backend ready 時可準備隱私遮罩分享卡並開啟原生分享。"),
            ("year review share card status helper", "export function yearReviewShareCardStatusMessages(value: {"),
            ("year review share card unavailable fallback", "backend 尚未 ready"),
            ("year review share card loading copy", "正在準備隱私遮罩後的年度分享卡。"),
            ("year review share card checksum copy", "checksum ${boundIdentifier("),
            ("year review share card failure copy", "分享卡準備或原生分享失敗；未送出外部分享。"),
            ("year review revoke status helper", "export function yearReviewRevokeStatusMessages(value: {"),
            ("year review revoke visual-smoke copy", "visual smoke 預覽不撤回年度分享 package。"),
            ("year review revoke unavailable fallback", "backend 尚未 ready"),
            ("year review revoke invalid copy", "年度分享 package 識別無效；已清除本機撤回狀態。"),
            ("year review revoke success package binding", "年度分享 package ${boundIdentifier(value.sharePackageId).slice(0, 8)} 已撤回"),
            ("year review revoke failure copy", "年度分享撤回失敗；請稍後重試。"),
            ("year review share asset filename helper", "export function safeYearReviewShareAssetFileName(value: string)"),
            ("year review share asset filename sanitizer", "const sanitized = bounded.replace(/[^a-zA-Z0-9._-]/g, \"_\");"),
        ):
            _assert_contains(label, future_module_display_content, marker)
        for label, marker in (
            ("achievement levels", "export const achievementLevels = [10, 50, 100, 150, 200, 250];"),
            ("achievement dynamic levels helper", "export function achievementDynamicLevels(maxObservedRecords: number, maxObservedStreak: number)"),
            ("achievement records helper", "export function localAchievementItemsForRecords(records: RecordItem[]): AchievementItem[]"),
            ("achievement dynamic levels next level", "nextLevel <= maxObservedLevel + achievementLevelStep"),
            ("achievement categories", "export const achievementCategoryDefinitions: Array<{"),
            ("achievement target lower bound", "const target = Math.max(1, boundAchievementProgress(value.target));"),
            ("achievement progress clamped to target", "const progress = Math.min(target, boundAchievementProgress(value.progress, target));"),
            ("achievement display items helper", "export function achievementDisplayItems(items: AchievementItem[])"),
            ("achievement display items map", "return items.map(achievementDisplayItem);"),
            ("achievement limited display helper", "export function limitedAchievementDisplayItems(items: AchievementItem[])"),
            ("achievement limited display slice", "return items.slice(0, maxListItems).map(achievementDisplayItem);"),
            ("achievement save success newly unlocked helper", "export function saveSuccessNewlyUnlockedAchievementDisplayItems(items: AchievementDisplayItem[])"),
            ("achievement save success newly unlocked slice", "return items.slice(0, 3);"),
            ("achievement category sections helper", "export function buildAchievementCategoryDisplaySections(items: AchievementDisplayItem[])"),
            ("achievement category section key", "key: boundIdentifier(`achievement-section-${definition.id}`),"),
            ("achievement category section filter", "items: items.filter((item) => item.category === definition.id)"),
            ("achievement badge summary helper", "export function achievementBadgeSummary(items: AchievementDisplayItem[])"),
            ("achievement badge summary unlocked filter", "const unlockedItems = items.filter((item) => item.progress >= item.target);"),
            ("achievement badge summary highest level", ".sort((first, second) => second - first)[0] ?? 0"),
            ("achievement badge summary next remaining", "nextRemaining"),
            ("achievement API transform helper", "export function achievementItemFromApi(value: AchievementApiItem): AchievementItem"),
            ("achievement unlock date helper", "export function achievementUnlockDisplayDate(value?: string | null)"),
        ):
            _assert_contains(label, future_module_display_content, marker)
        for label, marker in (
            ("future module cards static config", "export const futureModuleCards: FutureModuleCard[] = ["),
            ("future module food community database card title", 'title: "食物社群資料庫"'),
            ("future module food community database card readiness", "資料庫、分享、點數與排行榜已接 backend；貼文留言治理仍待正式開放。"),
            ("future module food community governance-only requirements", 'requirements: ["貼文、留言、封鎖、檢舉與審核流程", "公開分享刪除與撤回治理", "退出後歷史資料撤回與 audit event"]'),
            ("future module store backend-ready readiness", "點數兌換與兌換券已接 backend；購物車、出貨、付款與法務仍待完成。"),
            ("store future card special badge copy", "點數商城、優惠券、商品折扣、特殊徽章與會員獎勵入口。"),
            ("future module store remaining-commerce requirements", 'requirements: ["購物車、庫存 reservation 與 rollback", "出貨訂單、付款與退款流程", "商品法務、客服與履約稽核"]'),
            ("ranking backend-ready future module copy", "分享次數、貢獻度與食物測試達人榜單已接 backend"),
            ("ranking future module governance-only requirements", 'requirements: ["封鎖、檢舉與審核流程", "榜單爭議處理與公開名稱違規處置", "排名退出後歷史資料撤回流程"]'),
            ("achievement future module backend-ready readiness", "成就 taxonomy、backend summary、解鎖同步與已保存徽章已接上；公開展示 opt-in 與撤回治理仍待完成。"),
            ("achievement future module governance-only requirements", 'requirements: ["公開展示 opt-in 與跨使用者展示", "成就展示撤回治理", "公開徽章稽核與違規處置"]'),
            ("year review future module backend-ready readiness", "年度 snapshot、隱私遮罩分享卡與原生分享已接 backend；外部平台深度整合與刪除治理仍待完成。"),
            ("year review future module governance-only requirements", 'requirements: ["外部平台深度整合與權限細節", "分享 package 刪除與撤回治理", "外部分享稽核與違規處置"]'),
            ("future module display card helper", "export function futureModuleCardDisplayItem(value: FutureModuleCard)"),
            ("future module display card list helper", "export function futureModuleCardDisplayItems(values: FutureModuleCard[])"),
            ("future module display card list map", "return values.map(futureModuleCardDisplayItem);"),
            ("future module selected display helper", "export function selectedFutureModuleDisplayItem(value: FutureModuleCard | null)"),
            ("future module card accessibility item", "accessibilityLabel: boundDisplayText(`查看${futureModuleText(value.title, \"未來模組\", maxDisplayTextLength)}整合狀態`, maxDisplayTextLength)"),
            ("future module requirements display helper", "function futureModuleRequirements(value: string[] | undefined)"),
            ("future module detail boundary copy helper", "export function futureModuleDetailBoundaryCopy()"),
            ("future module detail boundary copy", "這個頁面只整理 UI 入口、工程前置條件與資料安全邊界"),
            ("future module implementation order copy helper", "export function futureModuleImplementationOrderCopy()"),
            ("future module implementation order copy", "實作順序建議：先完成 production auth、權限模型、schema/source 欄位與 audit trail"),
            ("future modules open status helper", "export function futureModulesOpenStatusMessage()"),
            ("future modules return menu status helper", "export function futureModulesReturnMenuStatusMessage()"),
            ("future module detail return status helper", "export function futureModuleDetailReturnStatusMessage()"),
            ("future preview return status helper", "export function futurePreviewReturnStatusMessage(target: AppScreen)"),
            ("future preview status display texts helper", "export function futurePreviewStatusDisplayTexts(value: {"),
            ("future preview status action binding", "futureModuleAction: boundUiMessage(value.futureModuleActionStatus)"),
            ("future preview doctor token status copy", "授權碼尚未啟用；目前不會建立 profile grant、share token、QR code 或醫師端 session。"),
            ("future preview doctor report status copy", "回診摘要可沿用 bounded detailed report 設計，最多 ${boundedReportLimit} 筆"),
            ("future preview health permission status copy", "平台權限尚未啟用；目前不會請求 HealthKit / Health Connect 權限"),
            ("future preview community share status copy", "backend ready 時可送出食物分享、建立社群點數並刷新排行榜與商城點數"),
            ("community leaderboard type", 'export type CommunityLeaderboardType = "share_count" | "contribution" | "food_tester";'),
            ("community leaderboard api response type", "export type CommunityLeaderboardApiResponse = {"),
            ("community leaderboard display section type", "export type CommunityLeaderboardDisplaySection = {"),
            ("ranking display section helper", "export function communityLeaderboardDisplaySection(value: CommunityLeaderboardApiResponse): CommunityLeaderboardDisplaySection"),
            ("ranking contribution label", "return \"貢獻度排行\";"),
            ("ranking food tester label", "return \"食物測試達人排行\";"),
            ("ranking share count label", "return \"分享次數排行\";"),
            ("ranking contribution score label", "return `${boundedScore} 點`;"),
            ("ranking empty copy", "目前沒有 opt-in 的公開榜單資料。"),
            ("community public settings type", "export type CommunityPublicSettings = {"),
            ("community public settings bound helper", "export function boundCommunityPublicSettings(value: CommunityPublicSettings): CommunityPublicSettings"),
            ("community public display name fallback", 'display_name: boundDisplayText(value.display_name || "糖友", maxDisplayTextLength)'),
            ("community public leaderboard opt-in boolean", "leaderboard_opt_in: Boolean(value.leaderboard_opt_in)"),
            ("food community category type", "export type FoodCommunityCategory ="),
            ("food community item type", "export type FoodCommunityItem = {"),
            ("food community api item type", "export type FoodCommunityApiItem = {"),
            ("food community api share response type", "export type FoodCommunityApiShareResponse = {"),
            ("food community api item transform helper", "export function foodCommunityItemFromApi(value: FoodCommunityApiItem): FoodCommunityItem"),
            ("food community backend share mapping", "examples: (value.shares ?? []).slice(0, 3).map((share) => ({"),
            ("food community share fields type", "export type FoodCommunityShareFields = {"),
            ("food community share food name field", "foodName: string;"),
            ("food community empty share fields helper", "export function emptyFoodCommunityShareFields(): FoodCommunityShareFields"),
            ("food community empty share fields current time", "const nowInputs = localDateTimeInputs(new Date());"),
            ("food community category display helper", "export function foodCommunityCategoryDisplayItem(value: { id: FoodCommunityCategory; label: string; foodCount?: number; sampleFoods?: string[] })"),
            ("food community category display items helper", "export function foodCommunityCategoryDisplayItems("),
            ("food community category display items map", "return values.map(foodCommunityCategoryDisplayItem);"),
            ("food community category accessibility copy", "accessibilityLabel: boundDisplayText(`切換食物分類：${label}，${summary}`, maxDisplayDetailTextLength)"),
            ("food community share display helper", "export function foodCommunityShareDisplayItem(value: FoodCommunityShare)"),
            ("food community share display summary", "summary: boundDisplayText(`食用前 ${before}，食用後 ${after}，血糖變化 ${rise} mg/dL`, maxDisplayDetailTextLength)"),
            ("food community item display helper", "export function foodCommunityItemDisplayItem(value: FoodCommunityItem)"),
            ("food community item display items helper", "export function foodCommunityItemDisplayItems(items: FoodCommunityItem[])"),
            ("food community item display items map", "return items.map(foodCommunityItemDisplayItem);"),
            ("food community backend-ready item accessibility", "同步已載入食物分享統計與個別紀錄"),
            ("food community metric summary reference value", "metricSummary: boundDisplayText(\n      `${shareCount} 人分享，實際升糖參考值 ${averageRise} mg/dL`,"),
            ("food community individual share display items", "individualShareDisplayItems: value.examples.map(foodCommunityShareDisplayItem).slice(0, 3)"),
            ("food community item metric summary", "`${shareCount} 人分享，實際升糖參考值 ${averageRise} mg/dL`"),
            ("food community visible helper", "export function visibleFoodCommunityDisplayItems("),
            ("food community search bypasses category filter", "const matchesCategory = query.length > 0 || item.category === category;"),
            ("food community search aliases", "item.aliases.some((alias) => alias.toLowerCase().includes(query))"),
            ("food community selected helper", "export function selectedFoodCommunityDisplayItem("),
            ("food community selected fallback order", "items.find((item) => item.id === selectedItemId) ?? visibleItems[0] ?? items[0] ?? null"),
            ("community action display texts helper", "export function communityActionDisplayTexts(value: {"),
            ("community action share button binding", "foodCommunityShareButton,"),
            ("community action share accessibility binding", "foodCommunityShareAccessibility: boundDisplayText("),
            ("community action ranking button binding", "rankingOptInButton,"),
            ("community action ranking accessibility binding", "rankingOptInAccessibility: boundDisplayText("),
            ("food community sync status helper", "export function foodCommunitySyncStatusMessages(value: {"),
            ("food community sync unavailable fallback", "backend account 尚未 ready"),
            ("food community sync in-flight copy", "正在同步食物社群資料庫，請稍候。"),
            ("food community sync loading copy", "正在同步 backend 食物社群資料庫。"),
            ("food community sync item count clamp", "clampNumber(value.itemCount, 0, maxMobileCountValue)"),
            ("food community sync failure copy", "食物社群資料庫同步失敗；目前保留本機預覽資料。"),
            ("food community detail status helper", "export function foodCommunityDetailStatusMessages(value: {"),
            ("food community detail in-flight copy", "正在同步食物個別分享紀錄，請稍候。"),
            ("food community detail loading copy", "正在同步食物個別分享紀錄。"),
            ("food community detail title bound", "boundDisplayText(value.itemTitle, maxDisplayTextLength)"),
            ("food community detail example count clamp", "clampNumber(\n        value.exampleCount,"),
            ("food community detail failure copy", "食物個別分享紀錄同步失敗；目前保留已載入資料。"),
            ("community public settings status helper", "export function communityPublicSettingsStatusMessages(value: {"),
            ("community public settings load failure copy", "社群公開設定同步失敗；公開排名保持預設關閉。"),
            ("community public settings unavailable fallback", "backend account 尚未 ready"),
            ("community public settings missing name copy", "請輸入公開顯示名稱後再更新社群公開設定。"),
            ("community public settings opt-in enabled copy", "已開啟排行榜 opt-in；公開榜單只顯示公開名稱與非敏感統計。"),
            ("community public settings failure copy", "社群公開設定更新失敗；未變更排行榜 opt-in。"),
            ("food community share status helper", "export function foodCommunityShareStatusMessages(value: {"),
            ("food community share visual-smoke copy", "Visual smoke 預覽不送出食物分享，也不寫入點數或排行榜。"),
            ("food community share unavailable fallback", "請先選擇食物"),
            ("food community share glucose validation copy", "請輸入 20-600 mg/dL 之間的食用前與食用後血糖。"),
            ("food community share awarded points clamp", "clampNumber(value.awardedPoints, 0, maxMobileCountValue)"),
            ("food community share failure copy", "食物分享送出失敗；沒有建立點數、排行榜或商城兌換。"),
            ("community leaderboard sync status helper", "export function communityLeaderboardSyncStatusMessages(value: {"),
            ("community leaderboard sync unavailable fallback", "backend account 尚未 ready"),
            ("community leaderboard sync in-flight copy", "正在同步公開排行榜，請稍候。"),
            ("community leaderboard sync loading copy", "正在同步 backend 公開排行榜。"),
            ("community leaderboard sync success count clamp", "clampNumber(value.sectionCount, 0, maxMobileCountValue)"),
            ("community leaderboard sync failure copy", "公開排行榜同步失敗；目前保留本機連續記錄預覽。"),
            ("food community display bundle helper", "export function foodCommunityDisplayBundle(value: {"),
            ("food community display bundle category fallback", "value.backendCategories.length > 0 ? value.backendCategories : value.fallbackCategories"),
            ("food community display bundle item fallback", "value.backendItems.length > 0 ? value.backendItems : value.fallbackItems"),
            ("food community display bundle visible items", "const visibleItems = visibleFoodCommunityDisplayItems(itemDisplayItems, value.selectedCategory, value.searchText);"),
            ("food community display bundle selected item", "const selectedItem = selectedFoodCommunityDisplayItem(itemDisplayItems, visibleItems, value.selectedItemId);"),
            ("food community display bundle share rows", "shareFieldRows: foodCommunityShareFieldDisplayRows(value.shareFields, selectedItem?.title)"),
            ("food community share field rows helper", "export function foodCommunityShareFieldDisplayRows("),
            ("food community share eaten time row", '"食用時間"'),
            ("food community share calculated rise row", '"血糖上升值"'),
            ("food community share calculated rise expression", "Number(fields.afterGlucose) - Number(fields.beforeGlucose)"),
            ("food community share calculated rise signed clamp", "clampNumber(Number(fields.afterGlucose) - Number(fields.beforeGlucose), -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
            ("food community share auto-calculation fallback", '"系統自動計算"'),
            ("food community point rows helper", "export function foodCommunityPointDisplayRows(pointsBalance: StoreApiPointsBalance | null)"),
            ("food community point use row", "點數用途"),
            ("food community ranking rows helper", "export function foodCommunityRankingDisplayRows()"),
            ("food community ranking share count row", "分享次數排行"),
            ("food community ranking contribution row", "貢獻度排行"),
            ("food community ranking food tester row", "食物測試達人排行"),
            ("store redeemable fulfillment helper", "export function storeRedeemableFulfillmentCopy(category: StoreCategory): string"),
            ("store immediate coupon discount code copy", "送出後 backend 會扣點並立即發出優惠券或折扣碼。"),
            ("store reservation fulfillment copy", "送出後 backend 會扣點並建立兌換 reservation，後續仍需 fulfillment。"),
            ("store product type", "export type StoreProduct = {"),
            ("store reward api input type", "export type StoreRewardApiInput = {"),
            ("store points balance api type", "export type StoreApiPointsBalance = {"),
            ("store redemption api type", "export type StoreApiRedemption = {"),
            ("store categories static config", "export const storeCategories: Array<{ id: StoreCategory; label: string }> = ["),
            ("store coupon redemption category", '{ id: "coupons", label: "優惠券" }'),
            ("store supplement discount category", '{ id: "supplementDiscounts", label: "保健食品折扣" }'),
            ("store partner product category", '{ id: "partnerProducts", label: "合作商品" }'),
            ("store special badge category", '{ id: "specialBadges", label: "特殊徽章" }'),
            ("store member benefit category", '{ id: "memberBenefits", label: "特殊會員福利" }'),
            ("store products static config", "export const storeProducts: StoreProduct[] = ["),
            ("store fallback coupon backend code", 'id: "coupon_50"'),
            ("store fallback coupon backend points", 'pointsCost: "100 點"'),
            ("store fallback supplement backend code", 'id: "supplement_discount_10"'),
            ("store fallback supplement backend points", 'pointsCost: "150 點"'),
            ("store fallback partner product backend code", 'id: "partner_product_trial"'),
            ("store fallback partner product backend points", 'pointsCost: "300 點"'),
            ("store fallback special badge backend code", 'id: "annual_member_badge"'),
            ("store fallback special badge backend points", 'pointsCost: "80 點"'),
            ("store fallback member benefit backend code", 'id: "member_benefit_pack"'),
            ("store fallback member benefit backend points", 'pointsCost: "500 點"'),
            ("store special badge product", 'id: "annual_member_badge"'),
            ("store category display helper", "export function storeCategoryDisplayItem(value: { id: StoreCategory; label: string })"),
            ("store category display items helper", "export function storeCategoryDisplayItems(values: Array<{ id: StoreCategory; label: string }>)"),
            ("store category display items map", "return values.map(storeCategoryDisplayItem);"),
            ("store category accessibility copy", "accessibilityLabel: boundDisplayText(`切換商城分類：${label}，不建立訂單或付款`, maxDisplayDetailTextLength)"),
            ("store product display helper", "export function storeProductDisplayItem(value: StoreProduct)"),
            ("store product display items helper", "export function storeProductDisplayItems(products: StoreProduct[])"),
            ("store product display items map", "return products.map(storeProductDisplayItem);"),
            ("store product display points cost field", "pointsCost: boundDisplayText(value.pointsCost || \"點數未設定\", 40)"),
            ("store product display redeemable status copy", "`${title} 可用社群點數兌換；${storeRedeemableFulfillmentCopy(value.category)}`"),
            ("store product display preview status copy", "`${title} 目前只顯示點數兌換預覽；點數扣抵、庫存、結帳、訂單與 entitlement 寫入尚未啟用。`"),
            ("store visible product helper", "export function visibleStoreProductDisplayItems("),
            ("store visible product category match", "const matchesCategory = product.category === category;"),
            ("store visible product search fields", "`${product.title} ${product.description} ${product.pointsCost}`.toLowerCase().includes(query)"),
            ("store display bundle helper", "export function storeDisplayBundle(value: {"),
            ("store display bundle product fallback", "value.backendProducts.length > 0 ? value.backendProducts : value.fallbackProducts"),
            ("store display bundle product items", "const productDisplayItems = storeProductDisplayItems(productsForDisplay);"),
            ("store display bundle wallet items", "redemptionDisplayItems: storeRedemptionWalletDisplayItems(value.redemptions)"),
            ("store display bundle visible products", "visibleProducts: visibleStoreProductDisplayItems(productDisplayItems, value.selectedCategory, value.searchText)"),
            ("store display bundle boundary rows", "redemptionBoundaryRows: storeRedemptionBoundaryDisplayRows("),
            ("store backend category transform helper", "export function storeCategoryFromApi(value: StoreRewardApiCategory): StoreCategory"),
            ("store backend special badge mapping", 'if (value === "special_badges")'),
            ("store backend reward product transform helper", "export function storeProductFromApi(value: StoreRewardApiInput): StoreProduct"),
            ("store backend reward fallback title", 'title: boundDisplayText(value.title || "兌換項目", maxDisplayTextLength)'),
            ("store redemption display input type", "export type StoreRedemptionDisplayInput = {"),
            ("store redemption display helper", "export function storeRedemptionDisplayItem(value: StoreRedemptionDisplayInput)"),
            ("store redemption wallet display helper", "export function storeRedemptionWalletDisplayItems(items: StoreRedemptionDisplayInput[])"),
            ("store redemption wallet max list bound", "return items.slice(0, maxListItems).map(storeRedemptionDisplayItem);"),
            ("store redemption usable issued status", 'status === "issued" &&'),
            ("store redemption usable code required", "Boolean(code) &&"),
            ("store redemption usable coupon types", '(value.fulfillment_type === "coupon" || value.fulfillment_type === "discount_code") &&'),
            ("store redemption usable unused only", "!value.used_at;"),
            ("store redemption boundary rows helper", "export function storeRedemptionBoundaryDisplayRows("),
            ("store points balance boundary row", '"點數餘額"'),
            ("store special badge redemption boundary", "優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利"),
            ("store backend-ready remaining boundary", '["仍待完成", "庫存、出貨訂單、付款與 rollback"]'),
            ("store redemption unfinished boundary row", "庫存、出貨訂單、付款與 rollback"),
            ("store redemption backend catalog status copy", "已讀取 backend catalog"),
            ("store redemption local preview status copy", "本機預覽，不扣點、不建訂單、不發券"),
            ("future preview boundary helper", "function futurePreviewBoundaryDisplayItem(badge: string, copy: string)"),
            ("doctor share preview boundary helper", "export function doctorSharePreviewBoundaryDisplayItem()"),
            ("doctor share preview boundary copy", "目前不產生授權碼、不建立 share token、不新增 grants、不呼叫醫師端 API"),
            ("doctor share backend boundary copy helper", "export function doctorShareBackendBoundaryCopy()"),
            ("doctor share backend boundary copy", "後端已有 profile grant / shared profile / basic report 的基礎能力"),
            ("health integration preview boundary helper", "export function healthIntegrationPreviewBoundaryDisplayItem()"),
            ("health integration preview boundary copy", "目前不請求 HealthKit / Health Connect 權限、不掃描 BLE、不讀取血糖機、不寫入 records"),
            ("health integration external boundary copy helper", "export function healthIntegrationExternalDataBoundaryCopy()"),
            ("health integration external boundary copy", "外部資料不能覆蓋使用者手動紀錄"),
            ("health integration boundary rows helper", "export function healthIntegrationBoundaryDisplayRows()"),
            ("health integration boundary source row", "meter / healthkit / health_connect"),
            ("health integration boundary batch row", "import_batch_id 預留"),
            ("health integration boundary sync row", "pending / synced / failed"),
            ("health integration boundary ai cost row", "0 次呼叫"),
            ("health integration readiness checklist helper", "export function healthIntegrationReadinessChecklistDisplayItems()"),
            ("health integration readiness authorization copy", "使用者授權、撤權與資料刪除流程"),
            ("health integration readiness sync copy", "import batch id、sync status 與錯誤復原"),
            ("health integration readiness duplicate copy", "duplicate detection，避免同一筆血糖被重複匯入"),
            ("community preview boundary helper", "export function communityPreviewBoundaryDisplayItem()"),
            ("community preview boundary copy", "backend ready 時可同步食物資料庫、送出食物分享、建立點數並刷新排行榜"),
            ("community public name boundary copy helper", "export function communityPublicNameBoundaryCopy()"),
            ("community public name boundary copy", "公開名稱與排行榜 opt-in 已可同步 backend；健康紀錄仍預設私密"),
            ("community boundary rows helper", "export function communityBoundaryDisplayRows(isLeaderboardOptedIn: boolean)"),
            ("community boundary records row", "健康紀錄"),
            ("community boundary public ranking row", "公開排名"),
            ("community boundary moderation row", "留言治理"),
            ("community boundary ai cost row", "0 次呼叫"),
            ("community readiness checklist helper", "export function communityReadinessChecklistDisplayItems()"),
            ("community readiness moderation copy", "社群貼文、留言、封鎖、檢舉與審核流程"),
            ("community readiness opt-in copy", "健康資料不可自動公開，分享需明確 opt-in"),
            ("community readiness audit copy", "公開分享刪除、撤回與 audit-friendly event stream"),
            ("ranking preview boundary helper", "export function rankingPreviewBoundaryDisplayItem()"),
            ("ranking preview boundary copy", "一般操作路徑只讀取 opt-in 公開榜單與非敏感統計"),
            ("ranking local preview boundary copy helper", "export function rankingLocalPreviewBoundaryCopy()"),
            ("ranking local preview boundary copy", "本機連續天數僅供自己查看；公開榜單只使用 backend 已聚合的 opt-in 社群統計"),
            ("ranking boundary rows helper", "export function rankingBoundaryDisplayRows()"),
            ("ranking boundary public row", "公開排名"),
            ("ranking boundary data row", "非敏感統計"),
            ("ranking boundary health value row", "健康數值"),
            ("ranking boundary ai cost row", "0 次呼叫"),
            ("ranking readiness checklist helper", "export function rankingReadinessChecklistDisplayItems()"),
            ("ranking readiness moderation copy", "封鎖、檢舉與審核流程"),
            ("ranking readiness dispute copy", "榜單爭議處理與公開名稱違規處置"),
            ("ranking readiness audit copy", "退出排名後的歷史資料撤回與 audit event"),
            ("reminder preview boundary helper", "export function reminderPreviewBoundaryDisplayItem()"),
            ("privacy preview boundary helper", "export function privacyPreviewBoundaryDisplayItem()"),
            ("food photo vision boundary helper", "export function foodPhotoVisionBoundaryDisplayItem()"),
            ("food photo vision boundary copy", "相機、圖片上傳、影像模型與營養估算尚未啟用"),
            ("food photo checklist helper", "export function foodPhotoEmptyResultChecklistDisplayItems()"),
            ("food photo checklist no mock result", "這裡不使用固定範例數字，避免把 mock 結果誤認為實際 AI 分析。"),
            ("food photo intro copy helper", "export function foodPhotoIntroCopy()"),
            ("food photo readiness checklist helper", "export function foodPhotoReadinessChecklistDisplayItems()"),
            ("food photo readiness permission copy", "相機 / 相簿權限與圖片壓縮上限"),
            ("food photo readiness privacy copy", "圖片儲存、刪除與隱私遮罩策略"),
            ("food photo readiness cost copy", "Vision 成本上限、rate limit 與重試規則"),
            ("food photo readiness confirm copy", "使用者確認後才可轉成飲食紀錄"),
            ("food photo integration accessibility helper", "export function foodPhotoIntegrationButtonAccessibilityLabel()"),
            ("food photo retake accessibility helper", "export function foodPhotoRetakeButtonAccessibilityLabel()"),
            ("food photo status display texts helper", "export function foodPhotoStatusDisplayTexts(actionStatus: string)"),
            ("food photo status display action binding", "action: boundUiMessage(actionStatus)"),
            ("food photo upload status copy", "相機與照片上傳尚未啟用；正式開放前需要圖片權限、壓縮上限、儲存策略與 Vision 成本控制。"),
            ("food photo integration status copy", "相機與照片上傳尚未啟用；需先完成圖片儲存、權限、成本控制與使用者確認流程。"),
            ("food photo retake status copy", "重新拍攝需等相機/相簿流程接上；目前沒有暫存圖片或分析結果可清除。"),
            ("store cart unavailable display helper", "export function storeCartUnavailableDisplayItem()"),
            ("store cart unavailable copy", "目前不建立訂單、不保留購物車內容，也不處理付款或折價券。"),
            ("store cart backend order flow evidence", "需等購物車、庫存、出貨、付款與退款規則完成後再接 backend order flow。"),
            ("store checkout readiness checklist helper", "export function storeCheckoutReadinessChecklistDisplayItems()"),
            ("store checkout readiness catalog copy", "商品目錄、庫存與價格來源"),
            ("store checkout readiness inventory rollback copy", "購物車持久化、庫存 reservation 與 rollback 規則"),
            ("store checkout readiness payment copy", "付款金流、receipt validation 與退款流程"),
            ("store checkout readiness service audit copy", "訂單狀態、出貨狀態與客服稽核"),
            ("store cart open status helper", "export function commercePreviewOpenCartStatusMessage()"),
            ("store cart open status copy", "已開啟購物車整合狀態；preview 不建立 cart、order、payment 或 backend write。"),
            ("store cart return status helper", "export function commercePreviewReturnStoreStatusMessage()"),
            ("store cart return status copy", "已返回商城；購物車整合狀態不建立訂單、不保存購物車，也不處理付款。"),
            ("store preview boundary copy helper", "export function storePreviewBoundaryCopy()"),
            ("store preview boundary copy", "點數商城一般操作路徑會同步 backend 目錄與點數"),
            ("store backend-aware boundary copy", "優惠券與保健食品折扣可立即發碼，合作商品與會員福利仍需後續 fulfillment"),
            ("store empty search display helper", "export function storeEmptySearchDisplayItem()"),
            ("store cart integration button label", 'return boundDisplayText("查看購物車整合狀態", maxDisplayTextLength);'),
            ("store cart accessibility helper", "export function storeCartButtonAccessibilityLabel()"),
            ("store cart integration accessibility", "查看購物車、出貨訂單與付款整合狀態；不建立訂單或付款"),
            ("store local boundary copy helper", "export function storeLocalBoundaryCopy()"),
            ("store local boundary copy", "商城目前可同步點數、發出優惠券 / 折扣碼並建立兌換紀錄"),
            ("store cart intro copy helper", "export function storeCartIntroCopy()"),
            ("store backend-aware cart intro copy", "點數帳本、兌換券與折扣碼已可同步；購物車、出貨訂單與付款仍未接上。"),
            ("store checkout readiness title helper", "export function storeCheckoutReadinessTitle()"),
            ("store preview display texts helper", "export function storePreviewDisplayTexts(actionStatus: string)"),
            ("store preview display action binding", "actionStatus: boundUiMessage(actionStatus)"),
            ("store preview display boundary binding", "previewBoundary: storePreviewBoundaryCopy()"),
            ("store preview display cart accessibility binding", "cartButtonAccessibility: storeCartButtonAccessibilityLabel()"),
            ("store preview display checkout title binding", "checkoutReadinessTitle: storeCheckoutReadinessTitle()"),
            ("store catalog sync status helper", "export function storeCatalogSyncStatusMessages(value: {"),
            ("store catalog sync unavailable fallback", "backend account 尚未 ready"),
            ("store catalog sync in-flight copy", "正在同步商城點數與兌換目錄，請稍候。"),
            ("store catalog sync loading copy", "正在同步 backend 商城目錄與社群點數。"),
            ("store catalog sync redemption clamp", "clampNumber(value.redemptionCount, 0, maxMobileCountValue)"),
            ("store catalog sync balance clamp", "clampNumber(\n        value.pointsBalance,"),
            ("store catalog sync failure copy", "商城目錄、點數或兌換券同步失敗；目前保留本機預覽資料。"),
            ("store redeem status helper", "export function storeRedeemStatusMessages(value: {"),
            ("store redeem visual-smoke copy", "Visual smoke 預覽不送出商城兌換，也不扣點。"),
            ("store redeem unavailable fallback", "backend account 尚未 ready"),
            ("store redeem invalid product copy", "商城兌換項目識別無效；目前不送出兌換。"),
            ("store redeem product title bound", "boundDisplayText(value.productTitle, maxDisplayTextLength)"),
            ("store redeem points clamp", "clampNumber(\n        value.pointsCost,"),
            ("store redeem failure copy", "兌換失敗；可能點數不足或該商品仍未開放 fulfillment。"),
            ("store redemption use status helper", "export function storeRedemptionUseStatusMessages(value: {"),
            ("store redemption use visual-smoke copy", "Visual smoke 預覽不標記兌換券使用，也不更新 backend 狀態。"),
            ("store redemption use unavailable fallback", "backend account 尚未 ready"),
            ("store redemption use title bound", "boundDisplayText(value.redemptionTitle, maxDisplayTextLength)"),
            ("store redemption use status label bound", "value.statusLabel,\n        maxDisplayTextLength"),
            ("store redemption use invalid copy", "兌換券識別無效；目前不更新兌換券狀態。"),
            ("store redemption use in-flight copy", "商城兌換狀態更新中，請稍候。"),
            ("store redemption use success identifier bound", "boundIdentifier(value.usedIdentifier)"),
            ("store redemption use failure copy", "兌換券狀態更新失敗；可能已使用、已失效或不屬於目前帳號。"),
            ("achievement preview boundary copy helper", "export function achievementPreviewBoundaryCopy()"),
            ("achievement preview boundary copy", "成就可同步 backend 依記錄聚合的 MVP 徽章摘要"),
            ("achievement local computation copy helper", "export function achievementLocalComputationCopy()"),
            ("achievement local computation copy", "成就摘要只讀取既有紀錄並聚合進度"),
            ("achievement next badge copy helper", "export function achievementNextBadgeCopy(remainingProgress: number)"),
            ("achievement integration accessibility helper", "export function achievementIntegrationButtonAccessibilityLabel()"),
            ("achievement sync unlock button label", 'return boundDisplayText("同步徽章解鎖", maxDisplayTextLength);'),
            ("achievement sync unlock accessibility copy", "同步成就徽章解鎖紀錄，不更新排行榜或公開資料"),
            ("achievement sync status helper", "export function achievementSyncStatusMessages(value: {"),
            ("achievement sync unavailable fallback", "backend 尚未 ready"),
            ("achievement sync loading summary copy", "正在讀取 backend 成就摘要。"),
            ("achievement sync loading unlock copy", "正在同步 backend 徽章解鎖紀錄。"),
            ("achievement sync success unlock copy", "已同步 backend 徽章解鎖"),
            ("achievement sync success summary copy", "已讀取 backend 成就摘要"),
            ("achievement sync failure copy", "成就摘要同步失敗；目前保留本機已載入紀錄推算。"),
            ("year review preview boundary copy helper", "export function yearReviewPreviewBoundaryCopy()"),
            ("year review backend-aware snapshot boundary", "backend ready 時同步保存年度 snapshot，並準備 privacy-masked 年度分享 package；離線時使用已載入紀錄即時計算。"),
            ("year review hero title helper", "export function yearReviewHeroTitleCopy(targetYear: number)"),
            ("year review hero title copy", "return boundDisplayText(`前一年度 ${targetYear} 年回顧`, maxDisplayTextLength);"),
            ("year review live calculation copy helper", "export function yearReviewLiveCalculationCopy(targetYear: number, generationLabel: string)"),
            ("year review backend snapshot live copy", "同步成功後會使用 backend snapshot。"),
            ("year review badge material copy helper", "export function yearReviewBadgeMaterialCopy()"),
            ("year review backend-aware badge material", "年度分享卡使用 backend 隱私遮罩摘要。"),
            ("year review share accessibility helper", "export function yearReviewShareButtonAccessibilityLabel()"),
            ("year review local metric rows helper", "export function localYearlyReviewMetricDisplayRows("),
            ("year review annual record days", '["本年度總記錄天數",'),
            ("year review annual glucose count", '["本年度血糖記錄次數",'),
            ("year review annual meal count", '["本年度飲食記錄次數",'),
            ("year review annual exercise count", '["本年度運動記錄次數",'),
            ("year review annual longest streak", '["最長連續記錄天數",'),
            ("year review annual achieved badges", '["達成徽章數量",'),
            ("year review annual highest badge", '["解鎖最高等級徽章",'),
            ("year review local health rows helper", "export function localYearlyHealthOutcomeDisplayRows("),
            ("year review average glucose outcome", '["年平均血糖",'),
            ("year review highest glucose outcome", '["年度最高血糖",'),
            ("year review lowest glucose outcome", '["年度最低血糖",'),
            ("year review local highlight helper", "export function localYearlyHighlightDisplayItems("),
            ("year review local highlight empty copy", "目前還沒有今年紀錄，開始記錄後會自動產生年度摘要。"),
            ("year review local highlight most recorded copy", "最常記錄的是${recordTypeLabel(mostRecordedType[0])}"),
            ("year review local highlight streak copy", "最長連續記錄 ${boundedLongestStreakDays} 天。"),
            ("year review ai observation copy helper", "export function yearReviewAiObservationCopy(recordCount: number, averageGlucose: number | null, longestStreak: number)"),
            ("year review ai encouragement copy helper", "export function yearReviewAiEncouragementCopy(recordCount: number)"),
            ("year review insight display helper", "export function yearReviewInsightDisplayTexts(value: {"),
            ("year review insight glucose average evidence", "前一年度血糖紀錄平均值為 ${value.averageGlucose} mg/dL。"),
            ("year review insight backend observation fallback", "value.backendObservation"),
            ("year review insight backend encouragement fallback", "value.backendEncouragement"),
            ("achievement/year review status display texts helper", "export function achievementYearReviewStatusDisplayTexts(value: {"),
            ("achievement status display binding", "achievementAction: boundUiMessage(value.achievementActionStatus)"),
            ("year review status display binding", "yearReviewAction: boundUiMessage(value.yearReviewActionStatus)"),
            ("future preview section labels helper", "export function futurePreviewSectionLabels()"),
            ("doctor token accessibility label", "doctorTokenAccessibility: boundDisplayText(`${doctorTokenButton}，只顯示授權碼與 share token 邊界`, maxDisplayDetailTextLength)"),
            ("doctor report accessibility label", "doctorReportAccessibility: boundDisplayText(`${doctorReportButton}，只顯示報表與醫師端唯讀邊界`, maxDisplayDetailTextLength)"),
            ("health permission accessibility label", "healthPermissionAccessibility: boundDisplayText(`${healthPermissionButton}，不請求平台權限或讀取健康資料`, maxDisplayDetailTextLength)"),
            ("health meter accessibility label", "healthMeterAccessibility: boundDisplayText(`${healthMeterButton}，不掃描血糖機或寫入紀錄`, maxDisplayDetailTextLength)"),
            ("community post accessibility label", "communityPostAccessibility: boundDisplayText(`${communityPostButton}，不建立貼文或公開紀錄`, maxDisplayDetailTextLength)"),
            ("community privacy accessibility label", "communityPrivacyAccessibility: boundDisplayText(`${communityPrivacyButton}，只顯示公開資料邊界`, maxDisplayDetailTextLength)"),
            ("ranking public accessibility label", "rankingPublicAccessibility: boundDisplayText(`${rankingPublicButton}，只讀取 opt-in 公開榜單，不公開健康數值`, maxDisplayDetailTextLength)"),
            ("future preview return accessibility label", "returnFutureModulesAccessibility: boundDisplayText(\"返回未來擴充，不建立 future module 資料或呼叫 backend\", maxDisplayDetailTextLength)"),
        ):
            _assert_contains(label, future_module_display_content, marker)
        for label, marker in (
            ("food community stale future store bridge copy", "點數未來可串接商城兌換優惠券、商品折扣、特殊徽章與會員福利。"),
            ("store stale empty wallet coupon-only copy", "尚未同步兌換券；完成食物分享取得點數後可兌換優惠券或折扣碼。"),
            ("year review stale future module privacy incomplete copy", "需先累積年度資料、完成隱私遮罩與分享權限。"),
            ("year review stale future module requirements", 'requirements: ["年度 aggregate job 或報表查詢", "分享圖隱私遮罩", "使用者分享與刪除控制"]'),
            ("year review stale future module backend-ready requirements", 'requirements: ["每年 1 月 1 日自動產生", "privacy-masked share package", "外部平台深度整合與刪除治理"]'),
            ("achievement stale future module backend incomplete copy", "需先完成 achievement definitions、後端同步與隱私邊界。"),
            ("achievement stale future module requirements", 'requirements: ["streak days 與 badge definitions", "achievement records 同步", "公開展示需使用者 opt-in"]'),
            ("achievement stale future module backend-ready requirements", 'requirements: ["三大分類與動態級距", "backend summary / sync / unlocks", "公開展示 opt-in 與撤回治理"]'),
            ("community stale future module public opt-in requirement", 'requirements: ["公開顯示名稱與排行榜 opt-in", "食物分享、點數與排行榜同步", "貼文、留言、封鎖、檢舉與審核流程"]'),
            ("community readiness stale public settings incomplete copy", "公開顯示名稱與可見範圍設定"),
            ("ranking readiness stale opt-in incomplete copy", "user public ranking opt-in 與退出流程"),
            ("ranking future module stale opt-in requirement", 'requirements: ["user public ranking opt-in", "ranking stats structure", "排名退出與歷史資料撤回流程"]'),
            ("ranking stale future module backend-ready requirement", 'requirements: ["三種公開榜單同步", "封鎖、檢舉與審核流程", "排名退出後歷史資料撤回流程"]'),
            ("store stale future module points ledger requirement", 'requirements: ["點數帳本與兌換券狀態", "購物車、出貨訂單與付款", "退款、履約與商品法務審核"]'),
            ("store checkout stale coupon rules incomplete copy", "購物車持久化、優惠券與折扣規則"),
        ):
            _assert_not_contains(label, content, marker)
        year_reviews_api_content = YEAR_REVIEWS_API_PATH.read_text(encoding="utf-8")
        year_review_service_content = YEAR_REVIEW_SNAPSHOTS_PATH.read_text(encoding="utf-8")
        year_review_model_content = (REPO_ROOT / "backend" / "app" / "models" / "year_review.py").read_text(
            encoding="utf-8"
        )
        year_review_snapshot_model_block = _match_block(
            year_review_model_content,
            r"class YearReviewSnapshot\(Base\):([\s\S]*?)\n\nclass YearReviewSharePackage",
            "YearReviewSnapshot model block",
        )
        year_review_share_package_model_block = _match_block(
            year_review_model_content,
            r"class YearReviewSharePackage\(Base\):([\s\S]*?)\Z",
            "YearReviewSharePackage model block",
        )
        year_review_share_constraint_migration_content = YEAR_REVIEW_SHARE_CONSTRAINT_MIGRATION_PATH.read_text(
            encoding="utf-8"
        )
        for label, marker in (
            ("year review completed-year service validator", "def validate_completed_year_review_year(year: int, now: datetime | None = None) -> int:"),
            ("year review latest completed year helper", "def latest_completed_year(now: datetime | None = None) -> int:"),
            ("year review validator preserves requested year", "return year"),
            ("year review batch generation validates completed year", "validate_completed_year_review_year(year)"),
        ):
            _assert_contains(label, year_review_service_content, marker)
        for label, marker in (
            ("year review api completed-year validator", "def _validate_completed_review_year(year: int) -> None:"),
            ("year review api uses service validator", "validate_completed_year_review_year(year)"),
            ("year review unfinished year error code", '"code": "year_review_year_not_completed"'),
            ("year review unfinished year message", '"message": "Year review can only be generated for completed calendar years."'),
        ):
            _assert_contains(label, year_reviews_api_content, marker)
        for label, marker in (
            ("year review share package privacy ORM constraint", "ck_year_review_share_packages_privacy_level"),
            ("year review share package asset ORM constraint", "ck_year_review_share_packages_asset_kind"),
            ("year review share package checksum ORM constraint", "ck_year_review_share_packages_checksum_len"),
            ("year review share package status ORM constraint", "ck_year_review_share_packages_status"),
            ("year review share package result ORM constraint", "ck_year_review_share_packages_last_result"),
        ):
            _assert_contains(label, year_review_share_package_model_block, marker)
            _assert_contains(label.replace("ORM", "migration"), year_review_share_constraint_migration_content, marker)
            if marker in year_review_snapshot_model_block:
                raise AssertionError(f"{label} must not be declared on YearReviewSnapshot.")
        year_review_tests_content = COMMUNITY_STORE_YEAR_REVIEW_TEST_PATH.read_text(encoding="utf-8")
        for label, marker in (
            ("year review share package constraint metadata regression", "test_year_review_share_package_constraints_are_declared_on_share_package_model"),
            ("year review unfinished year share-card test path", 'f"/year-reviews/{unfinished_year}/share-card?profile_id={profile_id}"'),
            ("year review unfinished year asset test path", 'f"/year-reviews/{unfinished_year}/share-card/asset?profile_id={profile_id}"'),
            ("year review unfinished year confirm test path", 'f"/year-reviews/{unfinished_year}/share-card/confirm?profile_id={profile_id}"'),
            ("year review unfinished year no share packages assertion", "assert share_packages == []"),
            ("year review public package json privacy guard", "public_package_json = json.dumps(share_package, ensure_ascii=False)"),
            ("year review public package omits annual stats", '"annual_stats",'),
            ("year review public package omits health outcomes", '"health_outcomes",'),
            ("year review public package omits ai summary", '"ai_summary",'),
            ("year review public package omits summary json", '"summary_json",'),
            ("year review opened package last result persisted", 'assert opened_share_package_row.last_share_result == "dismissed"'),
            ("year review dismissed package last result persisted", 'assert dismissed_share_package_row.last_share_result == "dismissed"'),
            ("year review batch unfinished year test", "test_year_review_batch_generation_rejects_unfinished_year_before_snapshot_creation"),
            ("year review batch unfinished year error", 'with raises(ValueError, match="year_review_year_not_completed"):'),
            ("year review older completed year regression", "validate_completed_year_review_year(2024, datetime(2026, 1, 1, 0, 15, tzinfo=UTC)) == 2024"),
        ):
            _assert_contains(label, year_review_tests_content, marker)
        if year_reviews_api_content.count("_validate_completed_review_year(year)") != 4:
            raise AssertionError("Year Review year endpoints must validate completed calendar year before snapshot work.")
        year_review_share_block = _function_block(content, "loadYearReviewShareCard")
        _assert_contains(
            "year review share uses native share",
            year_review_share_block,
            "const shareResult = await Share.share({",
        )
        _assert_contains(
            "year review share message is masked text only",
            year_review_share_block,
            "message: boundDisplayText(sharePackage.share_text, maxDisplayDetailTextLength)",
        )
        _assert_not_contains(
            "year review share does not pass raw svg text",
            year_review_share_block,
            "message: shareAsset.svg_text",
        )
        _assert_not_contains(
            "year review share does not pass package asset svg text",
            year_review_share_block,
            "message: sharePackage.asset.svg_text",
        )
        _assert_not_contains(
            "year review share does not pass raw snapshot payload",
            year_review_share_block,
            "message: JSON.stringify",
        )
        _assert_not_contains(
            "year review share does not store raw reported package id",
            year_review_share_block,
            "setYearReviewSharePackageId(reportedPackage.share_package_id)",
        )
        _assert_not_contains(
            "year review share does not store raw confirmed package id",
            year_review_share_block,
            "setYearReviewSharePackageId(sharePackage.share_package_id)",
        )
        _assert_not_contains(
            "store search direct setter binding",
            content,
            "onChangeText={(value) => setStoreSearchText(boundStoreSearchText(value))}",
        )
        _assert_not_contains(
            "account security direct boundary row key binding",
            content,
            "accountSecurityBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "account security direct boundary row label binding",
            content,
            "accountSecurityBoundaryRows.map((row) => (\n                <View key={accountSecurityBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "account security direct boundary row value binding",
            content,
            "accountSecurityBoundaryRows.map((row) => (\n                <View key={accountSecurityBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{accountSecurityBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "profile settings direct boundary row key binding",
            content,
            "profileSettingsBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "profile settings direct boundary row label binding",
            content,
            "profileSettingsBoundaryRows.map((row) => (\n                <View key={profileSettingsBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "profile settings direct boundary row value binding",
            content,
            "profileSettingsBoundaryRows.map((row) => (\n                <View key={profileSettingsBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{profileSettingsBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "recording quota direct boundary row key binding",
            content,
            "recordingQuotaBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "recording quota direct boundary row label binding",
            content,
            "recordingQuotaBoundaryRows.map((row) => (\n                <View key={recordingQuotaBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "recording quota direct boundary row value binding",
            content,
            "recordingQuotaBoundaryRows.map((row) => (\n                <View key={recordingQuotaBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{recordingQuotaBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "privacy direct boundary row key binding",
            content,
            "privacyBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "privacy direct boundary row label binding",
            content,
            "privacyBoundaryRows.map((row) => (\n                <View key={privacyBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "privacy direct boundary row value binding",
            content,
            "privacyBoundaryRows.map((row) => (\n                <View key={privacyBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{privacyBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "AI save confirm direct boundary row key binding",
            content,
            "aiSaveConfirmBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "AI save confirm direct boundary row label binding",
            content,
            "aiSaveConfirmBoundaryRows.map((row) => (\n                <View key={aiSaveConfirmBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "AI save confirm direct boundary row value binding",
            content,
            "aiSaveConfirmBoundaryRows.map((row) => (\n                <View key={aiSaveConfirmBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{aiSaveConfirmBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "detailed report direct boundary row key binding",
            content,
            "detailedReportBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "detailed report direct boundary row label binding",
            content,
            "detailedReportBoundaryRows.map((row) => (\n                <View key={detailedReportBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "detailed report direct boundary row value binding",
            content,
            "detailedReportBoundaryRows.map((row) => (\n                <View key={detailedReportBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{detailedReportBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "analysis direct metric row binding",
            content,
            "analysisMetricRows.map((row) => (\n                <MetricCard key={row.label} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "detailed report direct metric row binding",
            content,
            "detailedReportMetricRows.map((row) => (\n                <MetricCard key={row.label} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "membership feature direct row key binding",
            content,
            "membershipFeatureRows.map((row) => (\n                <View key={row.label} style={styles.detailRow}>",
        )
        _assert_not_contains(
            "membership feature direct row label binding",
            content,
            "membershipFeatureRows.map((row) => (\n                <View key={membershipFeatureRowKey(row)} style={styles.detailRow}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "membership feature direct row value binding",
            content,
            "membershipFeatureRows.map((row) => (\n                <View key={membershipFeatureRowKey(row)} style={styles.detailRow}>\n                  <Text style={styles.confidence}>{membershipFeatureRowLabel(row)}</Text>\n                  <Text style={styles.recordContent}>{row.value}</Text>",
        )
        _assert_not_contains(
            "year review direct metric row key binding",
            content,
            "yearlyReviewMetricRows.map((row) => (\n                <View key={row.label} style={styles.metricCard}>",
        )
        _assert_not_contains(
            "year review direct metric row label binding",
            content,
            "yearlyReviewMetricRows.map((row) => (\n                <View key={yearlyReviewMetricRowKey(row)} style={styles.metricCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "year review direct metric row value binding",
            content,
            "yearlyReviewMetricRows.map((row) => (\n                <View key={yearlyReviewMetricRowKey(row)} style={styles.metricCard}>\n                  <Text style={styles.confidence}>{yearlyReviewMetricRowLabel(row)}</Text>\n                  <Text style={styles.metricValue}>{row.value}</Text>",
        )
        _assert_not_contains(
            "year review direct health outcome row key binding",
            content,
            "yearlyHealthOutcomeRows.map((row) => (\n                <View key={row.label} style={styles.metricCard}>",
        )
        _assert_not_contains(
            "year review direct health outcome row label binding",
            content,
            "yearlyHealthOutcomeRows.map((row) => (\n                <View key={yearlyHealthOutcomeRowKey(row)} style={styles.metricCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "year review direct health outcome row value binding",
            content,
            "yearlyHealthOutcomeRows.map((row) => (\n                <View key={yearlyHealthOutcomeRowKey(row)} style={styles.metricCard}>\n                  <Text style={styles.confidence}>{yearlyHealthOutcomeRowLabel(row)}</Text>\n                  <Text style={styles.metricValue}>{row.value}</Text>",
        )
        _assert_not_contains(
            "year review direct highlight item key binding",
            content,
            "yearlyHighlightDisplayTexts.map((item) => (\n                <View key={item} style={styles.highlightRow}>",
        )
        _assert_not_contains(
            "year review direct highlight item text binding",
            content,
            "yearlyHighlightDisplayTexts.map((item) => (\n                <View key={yearlyHighlightItemKey(item)} style={styles.highlightRow}>\n                  <Text style={styles.recordType}>•</Text>\n                  <Text style={styles.evidence}>{item}</Text>",
        )
        _assert_not_contains(
            "daily record direct detail rows map binding",
            content,
            "item.detailRows.map((row) => (",
        )
        _assert_not_contains(
            "daily record direct detail row binding",
            content,
            "item.detailRows.map((row) => (\n                            <DailyRecordDetailRow key={`${item.key}-${row.label}`} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "daily record direct detail row label binding",
            content,
            "item.detailRows.map((row) => (\n                            <DailyRecordDetailRow key={dailyRecordDetailRowKey(item, row)} label={row.label} value={dailyRecordDetailRowValue(row)} />",
        )
        _assert_not_contains(
            "daily record direct detail row value binding",
            content,
            "item.detailRows.map((row) => (\n                            <DailyRecordDetailRow key={dailyRecordDetailRowKey(item, row)} label={dailyRecordDetailRowLabel(row)} value={row.value} />",
        )
        ai_remove_confirm_block = _match_block(
            content,
            r'(currentScreen === "aiRemoveConfirm"[\s\S]*?<Text style=\{styles\.dangerButtonText\}>\{aiRemoveConfirmSubmitDisplayText\}</Text>)',
            "AI remove confirm render block",
        )
        for label, marker in (
            ("direct pending remove icon binding", "{pendingPreviewRemoveDisplayItem.icon}"),
            ("direct pending remove type binding", "{pendingPreviewRemoveDisplayItem.typeLabel}"),
            ("direct pending remove payload binding", "{pendingPreviewRemoveDisplayItem.payloadSummary}"),
        ):
            _assert_not_contains(label, ai_remove_confirm_block, marker)
        _assert_not_contains(
            "food community search direct handler bound input",
            content,
            "setFoodCommunitySearchText(boundStoreSearchText(value));",
        )
        _assert_not_contains(
            "store search direct handler bound input",
            content,
            "setStoreSearchText(boundStoreSearchText(value));",
        )
        _assert_not_contains(
            "store category direct selection binding",
            content,
            "onPress={() => selectStoreCategory(category.value)}",
        )
        _assert_not_contains(
            "store category direct handler value binding",
            content,
            "selectStoreCategory(category.value);",
        )
        store_category_option_render_block = _match_block(
            content,
            r"storeCategoryDisplayOptions\.map\(\(category\) => \(([\s\S]*?</Pressable>\n\s*)\)\)",
            "store category option render block",
        )
        for label, marker in (
            ("direct store category key binding", "key={category.value}"),
            ("direct store category accessibility binding", "accessibilityLabel={category.accessibilityLabel}"),
            ("direct store category selected state binding", "storeCategory === category.value"),
            ("direct store category label binding", "{category.label}"),
        ):
            _assert_not_contains(label, store_category_option_render_block, marker)
        _assert_not_contains(
            "food community category direct handler value binding",
            content,
            "selectFoodCommunityCategory(category.value);",
        )
        _assert_not_contains(
            "food community category direct option key binding",
            content,
            "foodCommunityCategoryDisplayOptions.map((category) => (\n                <Pressable\n                  key={category.value}",
        )
        _assert_not_contains(
            "food community category direct accessibility label binding",
            content,
            "key={foodCommunityCategoryOptionKey(category)}\n                  accessibilityLabel={category.accessibilityLabel}",
        )
        _assert_not_contains(
            "food community category direct selected state binding",
            content,
            "accessibilityState={{ selected: foodCommunityCategory === category.value }}",
        )
        _assert_not_contains(
            "food community category direct selected active style binding",
            content,
            "foodCommunityCategory === category.value ? styles.segmentActive : null",
        )
        _assert_not_contains(
            "food community category direct selected text style binding",
            content,
            "foodCommunityCategory === category.value ? styles.segmentTextActive : null",
        )
        _assert_not_contains(
            "food community category direct label binding",
            content,
            "foodCommunityCategoryOptionSelected(category, foodCommunityCategory) ? styles.segmentTextActive : null\n                    ]}\n                  >\n                    {category.label}",
        )
        _assert_not_contains(
            "food community category direct default item selection",
            content,
            "setSelectedFoodCommunityItemId(firstMatch?.id ?? \"\");",
        )
        _assert_not_contains(
            "food community direct list default item selection",
            content,
            "setSelectedFoodCommunityItemId(nextItems[0]?.id ?? selectedFoodCommunityItemId);",
        )
        _assert_not_contains(
            "food community direct list detail refresh",
            content,
            "void loadFoodCommunityDetail(nextItems[0].id);",
        )
        _assert_not_contains(
            "food community direct list item key binding",
            content,
            "visibleFoodCommunityItems.map((item) => (\n                <Pressable\n                  key={item.id}",
        )
        _assert_not_contains(
            "food community direct list item accessibility label binding",
            content,
            "key={foodCommunityListItemKey(item)}\n                  accessibilityLabel={item.accessibilityLabel}",
        )
        _assert_not_contains(
            "food community direct list item selected state binding",
            content,
            "accessibilityState={{ selected: selectedFoodCommunityItem?.id === item.id }}",
        )
        _assert_not_contains(
            "food community direct list item selected style binding",
            content,
            "selectedFoodCommunityItem?.id === item.id ? styles.recordCardSelected : null",
        )
        _assert_not_contains(
            "food community direct list empty binding",
            content,
            "visibleFoodCommunityItems.length === 0 ? (",
        )
        _assert_not_contains(
            "food community direct list item title binding",
            content,
            "<Text style={styles.recordContent}>{item.title}</Text>\n                    <Text style={styles.evidence}>{item.metricSummary}</Text>",
        )
        _assert_not_contains(
            "food community direct list item metric summary binding",
            content,
            "{item.metricSummary}",
        )
        _assert_not_contains(
            "food community direct category summary binding",
            content,
            "{selectedFoodCommunityCategoryDisplay.summary}",
        )
        _assert_not_contains(
            "food community direct detail selected item binding",
            content,
            "setSelectedFoodCommunityItemId(detailedItem.id);",
        )
        _assert_not_contains(
            "food community direct detail panel visibility binding",
            content,
            "{selectedFoodCommunityItem ? (",
        )
        _assert_not_contains(
            "food community direct detail refresh item comparison",
            content,
            "item.id === detailedItem.id",
        )
        _assert_not_contains(
            "food community direct detail status title binding",
            content,
            "itemTitle: detailedItem.title,",
        )
        _assert_not_contains(
            "food community direct detail status example count binding",
            content,
            "exampleCount: detailedItem.examples.length",
        )
        _assert_not_contains(
            "food community direct share selected item binding",
            content,
            "setSelectedFoodCommunityItemId(updatedFood.id);",
        )
        _assert_not_contains(
            "food community direct share refresh item filter",
            content,
            "item.id !== updatedFood.id",
        )
        _assert_not_contains(
            "food community direct share fallback food name binding",
            content,
            "foodCommunityShareFields.foodName || selectedFoodCommunityItem.title",
        )
        _assert_not_contains(
            "food community direct detail title binding",
            content,
            "{selectedFoodCommunityItem.title} 資料頁",
        )
        _assert_not_contains(
            "food community direct detail title display binding",
            content,
            "{foodCommunityDetailTitle(selectedFoodCommunityItem)} 資料頁",
        )
        _assert_not_contains(
            "food community direct detail share count binding",
            content,
            "{selectedFoodCommunityItem.shareCount}",
        )
        _assert_not_contains(
            "food community direct detail share count display binding",
            content,
            "{foodCommunityDetailShareCount(selectedFoodCommunityItem)}",
        )
        _assert_not_contains(
            "food community direct detail average rise binding",
            content,
            "{selectedFoodCommunityItem.averageRise} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail average rise display binding",
            content,
            "{foodCommunityDetailAverageRise(selectedFoodCommunityItem)} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail maximum rise binding",
            content,
            "{selectedFoodCommunityItem.maximumRise} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail maximum rise display binding",
            content,
            "{foodCommunityDetailMaximumRise(selectedFoodCommunityItem)} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail minimum rise binding",
            content,
            "{selectedFoodCommunityItem.minimumRise} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail minimum rise display binding",
            content,
            "{foodCommunityDetailMinimumRise(selectedFoodCommunityItem)} mg/dL",
        )
        _assert_not_contains(
            "food community direct detail individual share section label binding",
            content,
            "<Text style={styles.label}>個別分享紀錄</Text>",
        )
        _assert_not_contains(
            "food community direct detail individual share empty text binding",
            content,
            "<Text style={styles.evidence}>尚未有可顯示的個別分享紀錄。</Text>",
        )
        _assert_not_contains(
            "food community direct detail individual shares binding",
            content,
            "selectedFoodCommunityItem.individualShareDisplayItems",
        )
        _assert_not_contains(
            "food community direct detail individual shares length binding",
            content,
            "foodCommunityDetailIndividualShares(selectedFoodCommunityItem).length > 0",
        )
        _assert_not_contains(
            "food community direct detail share row id binding",
            content,
            "key={share.id}",
        )
        _assert_not_contains(
            "food community direct detail share row summary binding",
            content,
            "{share.summary}",
        )
        _assert_not_contains(
            "food community direct detail share row note binding",
            content,
            "{share.note}",
        )
        _assert_not_contains(
            "food community direct share eaten date label binding",
            content,
            '<FieldLabel icon={"📅"} label={"食用日期"} />',
        )
        _assert_not_contains(
            "food community direct share eaten time label binding",
            content,
            '<FieldLabel icon={"🕒"} label={"食用時間"} />',
        )
        _assert_not_contains(
            "food community direct share category binding",
            content,
            "category: apiFoodCategoryFromMobile(selectedFoodCommunityItem.category),",
        )
        _assert_not_contains(
            "food community direct share section label binding",
            content,
            "<Text style={styles.label}>食物分享紀錄</Text>",
        )
        _assert_not_contains(
            "food community direct share food name accessibility binding",
            content,
            'accessibilityLabel="輸入食物名稱"',
        )
        _assert_not_contains(
            "food community direct share eaten date accessibility binding",
            content,
            'accessibilityLabel="輸入食物分享食用日期"',
        )
        _assert_not_contains(
            "food community direct share eaten time accessibility binding",
            content,
            'accessibilityLabel="輸入食物分享食用時間"',
        )
        _assert_not_contains(
            "food community direct share before glucose accessibility binding",
            content,
            'accessibilityLabel="輸入食用前血糖"',
        )
        _assert_not_contains(
            "food community direct share after glucose accessibility binding",
            content,
            'accessibilityLabel="輸入食用後血糖"',
        )
        _assert_not_contains(
            "food community direct share note accessibility binding",
            content,
            'accessibilityLabel="輸入食物分享備註心得"',
        )
        _assert_not_contains(
            "food community direct ranking section label binding",
            content,
            "<Text style={styles.label}>社群排行榜</Text>",
        )
        _assert_not_contains(
            "food community direct points store bridge copy binding",
            content,
            "<Text style={styles.evidence}>點數已串接商城，可兌換優惠券、商品折扣、特殊徽章與會員福利；出貨、付款與治理流程仍待正式開放。</Text>",
        )
        _assert_not_contains(
            "food community direct share field row key binding",
            content,
            "foodCommunityShareFieldRows.map((row) => (\n                <HighlightDetailRow key={row.label} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "food community direct share field row label binding",
            content,
            "foodCommunityShareFieldRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityShareFieldRowKey(row)}\n                  label={row.label}",
        )
        _assert_not_contains(
            "food community direct share field row value binding",
            content,
            "foodCommunityShareFieldRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityShareFieldRowKey(row)}\n                  label={foodCommunityShareFieldRowLabel(row)}\n                  value={row.value}",
        )
        _assert_not_contains(
            "food community direct ranking row key binding",
            content,
            "foodCommunityRankingRows.map((row) => (\n                <HighlightDetailRow key={row.label} label={row.label} value={row.value} />",
        )
        _assert_not_contains(
            "food community direct ranking row label binding",
            content,
            "foodCommunityRankingRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityRankingRowKey(row)}\n                  label={row.label}",
        )
        _assert_not_contains(
            "food community direct ranking row value binding",
            content,
            "foodCommunityRankingRows.map((row) => (\n                <HighlightDetailRow\n                  key={foodCommunityRankingRowKey(row)}\n                  label={foodCommunityRankingRowLabel(row)}\n                  value={row.value}",
        )
        _assert_not_contains(
            "food community direct point row key binding",
            content,
            "foodCommunityPointRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "food community direct point row label binding",
            content,
            "foodCommunityPointRows.map((row) => (\n                <View key={foodCommunityPointRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "food community direct point row value binding",
            content,
            "foodCommunityPointRows.map((row) => (\n                <View key={foodCommunityPointRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{foodCommunityPointRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "community direct public name preview label binding",
            content,
            "<Text style={styles.evidence}>公開顯示名稱預覽</Text>",
        )
        _assert_not_contains(
            "community direct hero icon label binding",
            content,
            "<Text style={styles.heroIconText}>群</Text>",
        )
        _assert_not_contains(
            "community direct public display name accessibility binding",
            content,
            'accessibilityLabel="輸入社群公開顯示名稱"',
        )
        _assert_not_contains(
            "community direct public profile save accessibility binding",
            content,
            'accessibilityLabel="儲存社群公開顯示名稱，不公開健康數值"',
        )
        _assert_not_contains(
            "community direct public profile save button text binding",
            content,
            "<Text style={styles.secondaryButtonText}>儲存公開名稱</Text>",
        )
        _assert_not_contains(
            "community direct privacy opt-in ternary button text binding",
            content,
            '{communityPublicSettings?.leaderboard_opt_in ? "關閉排行榜 opt-in" : "開啟排行榜 opt-in"}',
        )
        _assert_not_contains(
            "ranking direct screen title binding",
            content,
            '<Text style={styles.sectionTitle}>社群排行</Text>',
        )
        _assert_not_contains(
            "ranking direct screen subtitle copy binding",
            content,
            '<Text style={styles.evidence}>同步分享次數、貢獻度與食物測試達人公開榜單；只顯示 opt-in 使用者的非敏感分數。</Text>',
        )
        _assert_not_contains(
            "ranking direct local streak preview label binding",
            content,
            '<Text style={styles.evidence}>本機連續記錄預覽</Text>',
        )
        _assert_not_contains(
            "ranking direct hero icon label binding",
            content,
            '<Text style={styles.heroIconText}>榜</Text>',
        )
        _assert_not_contains(
            "ranking direct streak display label binding",
            content,
            '<Text style={styles.heroNumber}>{rankingStreakDisplayDays} 天</Text>',
        )
        _assert_not_contains(
            "ranking direct streak display label helper argument binding",
            content,
            "<Text style={styles.evidence}>{rankingLocalStreakPreviewLabel()}</Text>\n                <Text style={styles.heroNumber}>{rankingStreakDisplayLabel(rankingStreakDisplayDays)}</Text>",
        )
        _assert_not_contains(
            "ranking direct local preview boundary copy binding",
            content,
            "<Text style={styles.evidence}>{rankingLocalStreakPreviewLabel()}</Text>\n                <Text style={styles.heroNumber}>{rankingStreakDisplayLabel(rankingStreakDisplayDays)}</Text>\n                <Text style={styles.evidence}>{rankingLocalPreviewBoundaryDisplayText}</Text>",
        )
        _assert_not_contains(
            "ranking direct boundary row key binding",
            content,
            "rankingBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "ranking direct boundary row label binding",
            content,
            "rankingBoundaryRows.map((row) => (\n                <View key={rankingBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "ranking direct boundary row value binding",
            content,
            "rankingBoundaryRows.map((row) => (\n                <View key={rankingBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{rankingBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard section key binding",
            content,
            "rankingLeaderboardSections.map((section) => (\n              <View key={section.type} style={styles.inlineInfoBlock}>",
        )
        _assert_not_contains(
            "ranking direct leaderboard section label binding",
            content,
            "rankingLeaderboardSections.map((section) => (\n              <View key={rankingLeaderboardSectionKey(section)} style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{section.label}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard entry key binding",
            content,
            "section.entries.map((entry) => (\n                    <View key={entry.id} style={styles.highlightRow}>",
        )
        _assert_not_contains(
            "ranking direct leaderboard entry rank label binding",
            content,
            "section.entries.map((entry) => (\n                    <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>\n                      <Text style={styles.recordType}>{entry.rankLabel}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard entry display name binding",
            content,
            "section.entries.map((entry) => (\n                    <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>\n                      <Text style={styles.recordType}>{rankingLeaderboardEntryRankLabel(entry)}</Text>\n                      <View style={styles.timelineContent}>\n                        <Text style={styles.recordContent}>{entry.displayName}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard entry score label binding",
            content,
            "section.entries.map((entry) => (\n                    <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>\n                      <Text style={styles.recordType}>{rankingLeaderboardEntryRankLabel(entry)}</Text>\n                      <View style={styles.timelineContent}>\n                        <Text style={styles.recordContent}>{rankingLeaderboardEntryDisplayName(entry)}</Text>\n                        <Text style={styles.evidence}>{entry.scoreLabel}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard section empty copy binding",
            content,
            "rankingLeaderboardSections.map((section) => (\n              <View key={rankingLeaderboardSectionKey(section)} style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingLeaderboardSectionLabel(section)}</Text>\n                {section.entries.length > 0 ? (\n                  section.entries.map((entry) => (\n                    <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>\n                      <Text style={styles.recordType}>{rankingLeaderboardEntryRankLabel(entry)}</Text>\n                      <View style={styles.timelineContent}>\n                        <Text style={styles.recordContent}>{rankingLeaderboardEntryDisplayName(entry)}</Text>\n                        <Text style={styles.evidence}>{rankingLeaderboardEntryScoreLabel(entry)}</Text>\n                      </View>\n                    </View>\n                  ))\n                ) : (\n                  <Text style={styles.evidence}>{section.emptyCopy}</Text>",
        )
        _assert_not_contains(
            "ranking direct leaderboard section entries condition binding",
            content,
            "rankingLeaderboardSections.map((section) => (\n              <View key={rankingLeaderboardSectionKey(section)} style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingLeaderboardSectionLabel(section)}</Text>\n                {section.entries.length > 0 ? (",
        )
        _assert_not_contains(
            "ranking direct readiness section label binding",
            content,
            "rankingLeaderboardSections.map((section) => (\n              <View key={rankingLeaderboardSectionKey(section)} style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingLeaderboardSectionLabel(section)}</Text>\n                {section.entries.length > 0 ? (\n                  section.entries.map((entry) => (\n                    <View key={rankingLeaderboardEntryKey(entry)} style={styles.highlightRow}>\n                      <Text style={styles.recordType}>{rankingLeaderboardEntryRankLabel(entry)}</Text>\n                      <View style={styles.timelineContent}>\n                        <Text style={styles.recordContent}>{rankingLeaderboardEntryDisplayName(entry)}</Text>\n                        <Text style={styles.evidence}>{rankingLeaderboardEntryScoreLabel(entry)}</Text>\n                      </View>\n                    </View>\n                  ))\n                ) : (\n                  <Text style={styles.evidence}>{rankingLeaderboardSectionEmptyCopy(section)}</Text>\n                )}\n              </View>\n            ))}\n            <View style={styles.inlineInfoBlock}>\n              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>",
        )
        _assert_not_contains(
            "ranking direct readiness checklist item key binding",
            content,
            "rankingReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={item} text={item} />",
        )
        _assert_not_contains(
            "ranking direct readiness checklist item text binding",
            content,
            "rankingReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={rankingReadinessChecklistItemKey(item)} text={item} />",
        )
        _assert_not_contains(
            "doctor share direct boundary row key binding",
            content,
            "doctorShareBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "doctor share direct boundary row label binding",
            content,
            "doctorShareBoundaryRows.map((row) => (\n                <View key={doctorShareBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "doctor share direct boundary row value binding",
            content,
            "doctorShareBoundaryRows.map((row) => (\n                <View key={doctorShareBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{doctorShareBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "health integration direct boundary row key binding",
            content,
            "healthIntegrationBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "health integration direct boundary row label binding",
            content,
            "healthIntegrationBoundaryRows.map((row) => (\n                <View key={healthIntegrationBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "health integration direct boundary row value binding",
            content,
            "healthIntegrationBoundaryRows.map((row) => (\n                <View key={healthIntegrationBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{healthIntegrationBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "community direct close accessibility binding",
            content,
            '<Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole="button" style={styles.closeButton} onPress={returnFromCommunityPreview}>',
        )
        _assert_not_contains(
            "community direct preview boundary badge binding",
            content,
            "<View style={styles.inlineInfoBlock}>\n              <Text style={styles.previewModeBadge}>{communityPreviewBoundaryDisplay.badge}</Text>",
        )
        _assert_not_contains(
            "community direct preview boundary copy binding",
            content,
            "<Text style={styles.previewModeBadge}>{communityPreviewBoundaryBadgeDisplayLabel}</Text>\n              <Text style={styles.evidence}>{communityPreviewBoundaryDisplay.copy}</Text>",
        )
        _assert_not_contains(
            "community direct post accessibility binding",
            content,
            "accessibilityLabel={futurePreviewDisplayLabels.communityPostAccessibility}\n                accessibilityRole=\"button\"\n                style={styles.secondaryButton}\n                onPress={showCommunityPostingStatus}",
        )
        _assert_not_contains(
            "community direct post button binding",
            content,
            "<Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.communityPostButton}</Text>",
        )
        _assert_not_contains(
            "community direct privacy accessibility binding",
            content,
            "accessibilityLabel={futurePreviewDisplayLabels.communityPrivacyAccessibility}\n                accessibilityRole=\"button\"\n                style={styles.secondaryButton}\n                onPress={showCommunityPrivacyStatus}",
        )
        _assert_not_contains(
            "community direct action status label binding",
            content,
            "{communityActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{futurePreviewDisplayLabels.communityStatus}</Text>",
        )
        _assert_not_contains(
            "community direct action status text binding",
            content,
            "{communityActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{communityActionStatusDisplayLabel}</Text>\n                <Text style={styles.evidence}>{communityActionStatusDisplayText}</Text>",
        )
        _assert_not_contains(
            "community direct action status visibility binding",
            content,
            "{communityActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{communityActionStatusDisplayLabel}</Text>\n                <Text style={styles.evidence}>{communityActionStatusDisplayCopy}</Text>",
        )
        _assert_not_contains(
            "community direct readiness section label binding",
            content,
            "<View style={styles.inlineInfoBlock}>\n              <Text style={styles.label}>{futurePreviewDisplayLabels.formalReadiness}</Text>\n              {communityReadinessChecklistItems.map((item) => (",
        )
        _assert_not_contains(
            "community direct readiness checklist item key binding",
            content,
            "communityReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow key={item} text={item} />",
        )
        _assert_not_contains(
            "community direct readiness checklist item text binding",
            content,
            "communityReadinessChecklistItems.map((item) => (\n                <HighlightBulletRow\n                  key={communityReadinessChecklistItemKey(item)}\n                  text={item}",
        )
        _assert_not_contains(
            "community direct boundary row key binding",
            content,
            "communityBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "community direct boundary row label binding",
            content,
            "communityBoundaryRows.map((row) => (\n                <View key={communityBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "community direct boundary row value binding",
            content,
            "communityBoundaryRows.map((row) => (\n                <View key={communityBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{communityBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "community direct return future modules accessibility binding",
            content,
            "{communityActionStatusVisible() ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{communityActionStatusDisplayLabel}</Text>\n                <Text style={styles.evidence}>{communityActionStatusDisplayCopy}</Text>\n              </View>\n            ) : null}\n            <Pressable\n              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}",
        )
        _assert_not_contains(
            "community direct return future modules button binding",
            content,
            "<Pressable\n              accessibilityLabel={communityReturnFutureModulesAccessibilityDisplayLabel}\n              accessibilityRole=\"button\"\n              style={styles.secondaryButton}\n              onPress={returnFromCommunityPreview}\n            >\n              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>",
        )
        _assert_not_contains(
            "community direct return future modules press binding",
            content,
            "<Pressable\n              accessibilityLabel={communityReturnFutureModulesAccessibilityDisplayLabel}\n              accessibilityRole=\"button\"\n              style={styles.secondaryButton}\n              onPress={returnFromCommunityPreview}\n            >\n              <Text style={styles.secondaryButtonText}>{communityReturnFutureModulesButtonDisplayLabel}</Text>",
        )
        _assert_not_contains(
            "community direct screen title binding",
            content,
            "<Text style={styles.sectionTitle}>食物社群</Text>",
        )
        _assert_not_contains(
            "community direct screen subtitle binding",
            content,
            "<Text style={styles.evidence}>同步真實食物升糖分享、點數與公開排行榜；貼文留言治理仍待正式開放。</Text>",
        )
        _assert_not_contains(
            "food community direct database section label binding",
            content,
            "<Text style={styles.label}>食物血糖資料庫</Text>",
        )
        _assert_not_contains(
            "food community direct database intro copy binding",
            content,
            "<Text style={styles.evidence}>建立華人使用者真實食物升糖資料庫，以實際食用前後血糖分享取代理論與網路傳言；backend ready 時同步真實分享，visual smoke 或 backend unavailable 時才顯示本機預覽。</Text>",
        )
        _assert_not_contains(
            "food community direct list empty title binding",
            content,
            "<Text style={styles.label}>沒有符合的食物</Text>",
        )
        _assert_not_contains(
            "food community direct list empty copy binding",
            content,
            "<Text style={styles.evidence}>可清除搜尋文字或切換分類；backend ready 時會依搜尋同步，未連線時只篩選本機預覽。</Text>",
        )
        _assert_not_contains(
            "food community direct share count detail label binding",
            content,
            "<Text style={styles.confidence}>分享總人數</Text>",
        )
        _assert_not_contains(
            "food community direct average rise detail label binding",
            content,
            "<Text style={styles.confidence}>實際升糖參考值（平均）</Text>",
        )
        _assert_not_contains(
            "food community direct maximum rise detail label binding",
            content,
            "<Text style={styles.confidence}>最高上升血糖</Text>",
        )
        _assert_not_contains(
            "food community direct minimum rise detail label binding",
            content,
            "<Text style={styles.confidence}>最低上升血糖</Text>",
        )
        _assert_not_contains(
            "ranking direct close accessibility binding",
            content,
            "<Text style={styles.sectionTitle}>{rankingScreenTitleLabel()}</Text>\n                <Text style={styles.evidence}>{rankingScreenSubtitleCopy()}</Text>\n              </View>\n              <Pressable accessibilityLabel={auxiliaryDisplayLabels.closeReturn} accessibilityRole=\"button\" style={styles.closeButton} onPress={returnFromRankingPreview}>",
        )
        _assert_not_contains(
            "ranking direct close button binding",
            content,
            "<Text style={styles.sectionTitle}>{rankingScreenTitleLabel()}</Text>\n                <Text style={styles.evidence}>{rankingScreenSubtitleCopy()}</Text>\n              </View>\n              <Pressable accessibilityLabel={rankingCloseAccessibilityDisplayLabel} accessibilityRole=\"button\" style={styles.closeButton} onPress={returnFromRankingPreview}>\n                <Text style={styles.closeButtonText}>×</Text>",
        )
        _assert_not_contains(
            "ranking direct close press binding",
            content,
            "<Text style={styles.sectionTitle}>{rankingScreenTitleLabel()}</Text>\n                <Text style={styles.evidence}>{rankingScreenSubtitleCopy()}</Text>\n              </View>\n              <Pressable accessibilityLabel={rankingCloseAccessibilityDisplayLabel} accessibilityRole=\"button\" style={styles.closeButton} onPress={returnFromRankingPreview}>",
        )
        _assert_not_contains(
            "ranking direct preview boundary badge binding",
            content,
            "<Pressable accessibilityLabel={rankingCloseAccessibilityDisplayLabel} accessibilityRole=\"button\" style={styles.closeButton} onPress={returnFromRankingPreview}>\n                <Text style={styles.closeButtonText}>{rankingCloseButtonDisplayLabel}</Text>\n              </Pressable>\n            </View>\n            <View style={styles.inlineInfoBlock}>\n              <Text style={styles.previewModeBadge}>{rankingPreviewBoundaryDisplay.badge}</Text>",
        )
        _assert_not_contains(
            "ranking direct preview boundary copy binding",
            content,
            "<View style={styles.inlineInfoBlock}>\n              <Text style={styles.previewModeBadge}>{rankingPreviewBoundaryBadgeLabel()}</Text>\n              <Text style={styles.evidence}>{rankingPreviewBoundaryDisplay.copy}</Text>",
        )
        _assert_not_contains(
            "ranking direct action status label binding",
            content,
            "{rankingActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{futurePreviewDisplayLabels.rankingStatus}</Text>",
        )
        _assert_not_contains(
            "ranking direct action status text binding",
            content,
            "{rankingActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingActionStatusLabel()}</Text>\n                <Text style={styles.evidence}>{rankingActionStatusDisplayText}</Text>",
        )
        _assert_not_contains(
            "ranking direct action status visibility binding",
            content,
            "{rankingActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingActionStatusLabel()}</Text>\n                <Text style={styles.evidence}>{rankingActionStatusText()}</Text>",
        )
        _assert_not_contains(
            "ranking direct return future modules accessibility binding",
            content,
            "{rankingActionStatus ? (\n              <View style={styles.inlineInfoBlock}>\n                <Text style={styles.label}>{rankingActionStatusLabel()}</Text>\n                <Text style={styles.evidence}>{rankingActionStatusText()}</Text>\n              </View>\n            ) : null}\n            <Pressable\n              accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}",
        )
        _assert_not_contains(
            "ranking direct return future modules button binding",
            content,
            "<Pressable\n              accessibilityLabel={rankingReturnFutureModulesAccessibilityDisplayLabel}\n              accessibilityRole=\"button\"\n              style={styles.secondaryButton}\n              onPress={returnFromRankingPreview}\n            >\n              <Text style={styles.secondaryButtonText}>{futurePreviewDisplayLabels.returnFutureModules}</Text>",
        )
        _assert_not_contains(
            "ranking direct return future modules press binding",
            content,
            "<Pressable\n              accessibilityLabel={rankingReturnFutureModulesAccessibilityDisplayLabel}\n              accessibilityRole=\"button\"\n              style={styles.secondaryButton}\n              onPress={returnFromRankingPreview}",
        )
        _assert_not_contains(
            "ranking direct public action press binding",
            content,
            "<Pressable\n                accessibilityLabel={rankingPublicActionAccessibilityDisplayLabel}\n                accessibilityRole=\"button\"\n                style={styles.secondaryButton}\n                onPress={showRankingPublicStatus}",
        )
        _assert_not_contains(
            "ranking direct opt-in action press binding",
            content,
            "<Pressable\n                accessibilityLabel={rankingOptInAccessibilityDisplayLabel}\n                accessibilityRole=\"button\"\n                style={styles.secondaryButton}\n                onPress={showRankingOptInStatus}",
        )
        _assert_not_contains(
            "food community item direct handler id binding",
            content,
            "selectFoodCommunityItem(item.id);",
        )
        _assert_not_contains(
            "store product direct status binding",
            content,
            "onPress={() => showStoreProductStatus(product.actionStatus)}",
        )
        _assert_not_contains(
            "store product direct action label binding",
            content,
            '{product.rewardStatus === "redeemable" ? "兌" : auxiliaryDisplayLabels.productOpenArrow}',
        )
        _assert_not_contains(
            "store product direct action accessibility binding",
            content,
            "accessibilityLabel={product.actionAccessibilityLabel}\n                  accessibilityRole=\"button\"\n                  style={styles.roundActionButton}\n                  onPress={() => pressStoreProductStatus(product)}",
        )
        store_product_card_render_block = _match_block(
            content,
            r"visibleStoreProducts\.length > 0 \? visibleStoreProducts\.map\(\(product\) => \(([\s\S]*?storeProductActionLabel\(product\)[\s\S]*?</Pressable>)",
            "store product card render block",
        )
        for label, marker in (
            ("direct store product card key binding", "key={product.id}"),
            ("direct store product card icon binding", "{product.icon}"),
            ("direct store product card title binding", "{product.title}"),
            ("direct store product card badge conditional", "{product.badge ?"),
            ("direct store product card badge text", "{product.badge}</Text>"),
            ("direct store product card description binding", "{product.description}"),
            ("direct store product card points binding", "{product.pointsCost}"),
        ):
            _assert_not_contains(label, store_product_card_render_block, marker)
        _assert_not_contains(
            "store redemption direct disabled binding",
            content,
            "!product.isUsable",
        )
        _assert_not_contains(
            "store redemption direct action label binding",
            content,
            "{product.actionLabel}",
        )
        _assert_not_contains(
            "store redemption direct action accessibility binding",
            content,
            "accessibilityLabel={product.actionAccessibilityLabel}",
        )
        store_redemption_card_render_block = _match_block(
            content,
            r"storeRedemptionDisplayItems\.map\(\(product\) => \(([\s\S]*?storeRedemptionActionLabel\(product\)[\s\S]*?</Pressable>)",
            "store redemption card render block",
        )
        for label, marker in (
            ("direct store redemption card key binding", "key={product.id}"),
            ("direct store redemption card title binding", "{product.title}"),
            ("direct store redemption card status binding", "{product.statusLabel}"),
            ("direct store redemption card subtitle binding", "{product.subtitle}"),
        ):
            _assert_not_contains(label, store_redemption_card_render_block, marker)
        for block_label, pattern in (
            (
                "save success unlocked achievement card render block",
                r"saveSuccessNewlyUnlockedDisplayItems\.map\(\(displayItem\) => \(([\s\S]*?achievementUnlockedCardDetail\(displayItem\)[\s\S]*?</View>\n\s*)\)",
            ),
            (
                "newly unlocked achievement card render block",
                r"achievementNewlyUnlockedDisplayItems\.map\(\(displayItem\) => \(([\s\S]*?achievementUnlockedCardDetail\(displayItem\)[\s\S]*?</View>\n\s*)\)",
            ),
            (
                "unlocked achievement card render block",
                r"achievementUnlockedDisplayItems\.map\(\(displayItem\) => \(([\s\S]*?achievementUnlockedCardDetail\(displayItem\)[\s\S]*?</View>\n\s*)\)",
            ),
        ):
            achievement_unlocked_card_render_block = _match_block(content, pattern, block_label)
            for label, marker in (
                ("direct achievement unlocked card id binding", "displayItem.id"),
                ("direct achievement unlocked card streak binding", 'displayItem.kind === "streak"'),
                ("direct achievement unlocked card color binding", "displayItem.badgeColor"),
                ("direct achievement unlocked card icon binding", "{displayItem.icon}"),
                ("direct achievement unlocked card level binding", "{displayItem.level}"),
                ("direct achievement unlocked card title binding", "{displayItem.title}"),
                ("direct achievement unlocked card kind label binding", "displayItem.kindLabel"),
                ("direct achievement unlocked card date binding", "displayItem.unlockedAt"),
            ):
                _assert_not_contains(f"{block_label} {label}", achievement_unlocked_card_render_block, marker)
        achievement_progress_card_render_block = _match_block(
            content,
            r"achievementCategorySectionItems\(section\)\.map\(\(displayItem\) => \{([\s\S]*?achievementProgressCardFillStyle\(displayItem\)[\s\S]*?</View>)",
            "achievement progress card render block",
        )
        for label, marker in (
            ("direct achievement progress id binding", "displayItem.id"),
            ("direct achievement progress accessibility binding", "displayItem.accessibilityLabel"),
            ("direct achievement progress unlocked comparison", "displayItem.progress >= displayItem.target"),
            ("direct achievement progress ratio", "displayItem.progress / displayItem.target"),
            ("direct achievement progress streak binding", 'displayItem.kind === "streak"'),
            ("direct achievement progress color binding", "displayItem.badgeColor"),
            ("direct achievement progress icon binding", "{displayItem.icon}"),
            ("direct achievement progress level binding", "{displayItem.level}"),
            ("direct achievement progress title binding", "{displayItem.title}"),
            ("direct achievement progress label binding", "displayItem.progressLabel"),
            ("direct achievement progress kind label binding", "displayItem.kindLabel"),
            ("direct achievement progress description binding", "displayItem.description"),
        ):
            _assert_not_contains(label, achievement_progress_card_render_block, marker)
        achievement_category_section_render_block = _match_block(
            content,
            r"achievementCategoryDisplaySections\.map\(\(section\) => \(([\s\S]*?achievementCategorySectionItems\(section\)[\s\S]*?</View>\n\s*)\)\)",
            "achievement category section render block",
        )
        for label, marker in (
            ("direct achievement category section key binding", "key={section.key}"),
            ("direct achievement category section label binding", "{section.label}"),
            ("direct achievement category section items binding", "section.items.map"),
        ):
            _assert_not_contains(label, achievement_category_section_render_block, marker)
        _assert_not_contains(
            "store redemption direct boundary row key binding",
            content,
            "storeRedemptionBoundaryRows.map((row) => (\n                <View key={row.label} style={styles.reportBoundaryCard}>",
        )
        _assert_not_contains(
            "store redemption direct boundary row label binding",
            content,
            "storeRedemptionBoundaryRows.map((row) => (\n                <View key={storeRedemptionBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{row.label}</Text>",
        )
        _assert_not_contains(
            "store redemption direct boundary row value binding",
            content,
            "storeRedemptionBoundaryRows.map((row) => (\n                <View key={storeRedemptionBoundaryRowKey(row)} style={styles.reportBoundaryCard}>\n                  <Text style={styles.confidence}>{storeRedemptionBoundaryRowLabel(row)}</Text>\n                  <Text style={styles.recordType}>{row.value}</Text>",
        )
        _assert_not_contains(
            "future module direct destination binding",
            content,
            "onPress={() => openFutureModuleDestination(item.target, item.module)}",
        )
        _assert_not_contains(
            "future module direct destination handler binding",
            content,
            "openFutureModuleDestination(item.target, item.module);",
        )
        product_card_block = _style_block(content, "productCard")
        _assert_contains(
            "store product card wrapping",
            product_card_block,
            'flexWrap: "wrap"',
        )
        _assert_contains(
            "store product card single-layer background",
            product_card_block,
            'backgroundColor: "#FFFFFF"',
        )
        achievement_card_block = _style_block(content, "achievementCard")
        _assert_contains(
            "achievement card wrapping",
            achievement_card_block,
            'flexWrap: "wrap"',
        )
        _assert_contains(
            "achievement card single-layer background",
            achievement_card_block,
            'backgroundColor: "#FFFFFF"',
        )
        achievement_badge_block = _style_block(content, "achievementBadge")
        _assert_contains(
            "achievement badge stable width",
            achievement_badge_block,
            "minWidth: 58",
        )
        achievement_streak_badge_block = _style_block(content, "achievementBadgeStreak")
        _assert_contains(
            "achievement streak badge independent shape",
            achievement_streak_badge_block,
            "borderRadius: 999",
        )
        year_badge_row_block = _style_block(content, "yearBadgeRow")
        _assert_contains(
            "year review badge row wrapping",
            year_badge_row_block,
            'flexWrap: "wrap"',
        )
        for style_name in (
            "emptyStateCard",
            "timelineCard",
            "accountCard",
            "flowStepperCard",
            "subscriptionStatusCard",
            "planCardHeader",
        ):
            block = _style_block(content, style_name)
            _assert_contains(
                f"{style_name} wrapping",
                block,
                'flexWrap: "wrap"',
            )
        for label, marker in (
            ("subscription quota sync handler", "function syncSubscriptionQuota()"),
            ("subscription trial integration handler", "function showSubscriptionTrialIntegrationStatus()"),
            ("subscription status screen helper", "function openSubscriptionStatusScreen(screen: AppScreen, statusMessage: string)"),
            ("subscription status screen helper fields", "openScreenWithStatus(screen, statusMessage);"),
            ("subscription management open handler", "function openSubscriptionManagementFromSubscription()"),
            ("subscription management status screen helper binding", 'openSubscriptionStatusScreen("subscriptionManagement", subscriptionManagementOpenStatusMessage());'),
            ("subscription membership status handler", "function openMembershipStatusFromSubscription()"),
            ("subscription membership status screen helper binding", 'openSubscriptionStatusScreen("membershipStatus", subscriptionMembershipStatusOpenStatusMessage());'),
            ("subscription management sync handler", "function syncSubscriptionManagementStatus()"),
            ("settings return status helper", "function returnToSettingsWithStatus(statusMessage: string)"),
            ("settings return status helper fields", 'openScreenWithStatus("settings", statusMessage);'),
            ("subscription management return handler", "function returnFromSubscriptionManagementToSettings()"),
            ("subscription management return status helper binding", "returnToSettingsWithStatus(subscriptionManagementReturnSettingsStatusMessage());"),
            ("subscription management payment handler", "function showSubscriptionManagementPaymentStatus()"),
            ("membership return subscription handler", "function returnFromMembershipStatusToSubscription()"),
            ("membership return subscription status helper binding", 'openScreenWithStatus("subscription", membershipStatusReturnSubscriptionStatusMessage());'),
            ("membership renewal management handler", "function openMembershipRenewalManagement()"),
            ("membership management handler", "function openMembershipManagement()"),
            ("subscription quota sync binding", "onPress={syncSubscriptionQuota}"),
            ("subscription trial integration binding", "onPress={showSubscriptionTrialIntegrationStatus}"),
            ("subscription management open binding", "onPress={openSubscriptionManagementFromSubscription}"),
            ("subscription membership status binding", "onPress={openMembershipStatusFromSubscription}"),
            ("subscription management sync binding", "onPress={syncSubscriptionManagementStatus}"),
            ("subscription management return binding", "onPress={returnFromSubscriptionManagementToSettings}"),
            ("subscription management payment binding", "onPress={showSubscriptionManagementPaymentStatus}"),
            ("membership return subscription binding", "onPress={returnFromMembershipStatusToSubscription}"),
            ("membership renewal management binding", "onPress={openMembershipRenewalManagement}"),
            ("membership management binding", "onPress={openMembershipManagement}"),
            ("subscription action status display helper binding", "const subscriptionActionStatusDisplay = subscriptionActionStatusDisplayTexts({"),
            ("subscription action status display text binding", "const subscriptionActionStatusDisplayText = subscriptionActionStatusDisplay.subscriptionAction;"),
            ("subscription management status display text binding", "const subscriptionManagementActionStatusDisplayText = subscriptionActionStatusDisplay.subscriptionManagementAction;"),
            ("subscription trial integration status binding", "const subscriptionTrialIntegrationStatusMessage = subscriptionActionStatusDisplay.trialIntegration;"),
            ("subscription management unavailable status binding", "const subscriptionManagementUnavailableStatusMessage = subscriptionActionStatusDisplay.managementUnavailable;"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("subscription quota accessibility label", "syncQuotaAccessibility: boundDisplayText(`${syncQuota}會員額度狀態，不建立訂閱或收款`, maxDisplayDetailTextLength)"),
            ("subscription trial accessibility label", "trialIntegrationAccessibility: boundDisplayText(`${trialIntegrationButton}，只顯示付款與 entitlement 邊界`, maxDisplayDetailTextLength)"),
            ("subscription management accessibility label", "manageSubscribedPlanAccessibility: boundDisplayText(`${manageSubscribedPlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength)"),
            ("subscription member status accessibility label", "memberStatusAccessibility: boundDisplayText(`${memberStatusButton}，查看目前同步會員資料`, maxDisplayDetailTextLength)"),
            ("subscription return settings accessibility label", "returnSettingsAccessibility: boundDisplayText(`${returnSettings}，不改變會員權益`, maxDisplayDetailTextLength)"),
            ("subscription payment accessibility label", "paymentIntegrationAccessibility: boundDisplayText(`${paymentIntegrationButton}，只顯示付款串接狀態`, maxDisplayDetailTextLength)"),
            ("membership renewal accessibility label", "renewalIntegrationAccessibility: boundDisplayText(`${renewalIntegrationButton}，前往訂閱管理預覽`, maxDisplayDetailTextLength)"),
            ("membership manage accessibility label", "managePlanAccessibility: boundDisplayText(`${managePlan}，前往訂閱管理預覽`, maxDisplayDetailTextLength)"),
        ):
            _assert_contains(label, subscription_copy_content, marker)
        for label, marker in (
            ("subscription quota accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.syncQuotaAccessibility}"),
            ("subscription trial accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.trialIntegrationAccessibility}"),
            ("subscription management accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.manageSubscribedPlanAccessibility}"),
            ("subscription member status accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.memberStatusAccessibility}"),
            ("subscription return settings accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.returnSettingsAccessibility}"),
            ("subscription payment accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.paymentIntegrationAccessibility}"),
            ("membership renewal accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.renewalIntegrationAccessibility}"),
            ("membership manage accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.managePlanAccessibility}"),
            ("subscription primary CTA button role", 'accessibilityRole="button"\n              style={styles.primaryButtonFull}'),
            ("subscription secondary CTA button role", 'accessibilityRole="button"\n              style={styles.secondaryButton}'),
            ("subscription management action button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
        ):
            _assert_contains(label, content, marker)

        print(
            "Mobile navigation verified: "
            f"{len(screens)} screens, {len(menu_destinations)} menu destinations, "
            f"{len(future_targets)} future targets, "
            f"{len(EXPECTED_PREVIEW_RETURN_CTA_SCREENS)} preview return CTAs, "
            "header/close/non-header bounded accessibility labels, button roles, and aligned disabled/selected states, "
            f"{len(content.split('<TextInput')) - 1} labeled and length-limited TextInputs, "
            f"{len(MIN_TOUCH_TARGET_STYLE_RULES)} compact touch-target styles plus "
            f"{len(MIN_TOUCH_TARGET_WIDTH_STYLE_RULES)} width checks, "
            f"{len(READABILITY_STYLE_RULES)} dense-row readability styles, "
            "guided minimal Home mic entry, non-button record directions, rotating examples, hold/release hints, secondary elapsed hint, and Record quick-entry affordances, "
            "History and Analysis open-section styles, "
            "AI Review rejected-event open stack, "
            "detail row open-section styles, "
            "settings open-stack rows, "
            "menu label parity, "
            "pricing and comparison open-section styles, "
            "inline press-wrapper guard, "
            "inline press-argument guard, "
            "ScrollView keyboard tap and keyboard-avoiding guards, "
            "TextInput update/value/placeholder/accessibility/maxLength/aligned-editable-state/keyboard-normalization/numeric-keyboard/multiline-layout/style-boundary guard, "
            "future and commerce card wrapping, "
            "achievement and year review wrapping, "
            "achievement taxonomy parity, "
            "food category parity, "
            "shared card wrapping styles, "
            "debug-gated visual smoke route jumps."
        )
    except AssertionError as exc:
        errors.append(str(exc))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
