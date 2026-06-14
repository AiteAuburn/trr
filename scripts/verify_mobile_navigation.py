#!/usr/bin/env python3
"""Verify mobile navigation stays aligned with the UI route contract."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = REPO_ROOT / "mobile" / "App.tsx"
ACHIEVEMENTS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "achievements.py"
ACHIEVEMENT_CATALOG_PATH = REPO_ROOT / "backend" / "app" / "services" / "achievement_catalog.py"
YEAR_REVIEW_SNAPSHOTS_PATH = REPO_ROOT / "backend" / "app" / "services" / "year_review_snapshots.py"
COMMUNITY_SCHEMA_PATH = REPO_ROOT / "backend" / "app" / "schemas" / "community.py"
COMMUNITY_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "community.py"
REPORTS_API_PATH = REPO_ROOT / "backend" / "app" / "api" / "reports.py"
REPORTING_SERVICE_PATH = REPO_ROOT / "backend" / "app" / "services" / "reporting.py"
REPORTS_TEST_PATH = REPO_ROOT / "backend" / "tests" / "test_reports.py"

EXPECTED_MENU_DESTINATIONS = {
    "today",
    "record",
    "manualRecord",
    "history",
    "analysis",
    "subscription",
    "tutorial",
    "achievements",
    "yearReview",
    "store",
    "settings",
}

EXPECTED_MENU_LABELS = {
    "today": "今日紀錄",
    "record": "錄音預覽/文字",
    "manualRecord": "手動新增",
    "history": "歷史紀錄",
    "analysis": "基本分析",
    "subscription": "會員方案",
    "tutorial": "使用教學",
    "achievements": "成就榜",
    "yearReview": "年度回顧",
    "store": "商城",
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
    block = _screen_chrome_block(content)
    return set(re.findall(r"^\s+([A-Za-z][A-Za-z0-9]*): \{", block, flags=re.MULTILINE))


def _screen_chrome_block(content: str) -> str:
    block = _match_block(
        content,
        r"const screenChrome:[\s\S]*?= \{([\s\S]*?)\};\n\nconst menuScreens",
        "screenChrome",
    )
    return block


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
        r"const futureModuleCards:[\s\S]*?= \[([\s\S]*?)\];",
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


def _verify_achievement_contract(content: str) -> None:
    backend_content = ACHIEVEMENTS_API_PATH.read_text(encoding="utf-8")
    catalog_content = ACHIEVEMENT_CATALOG_PATH.read_text(encoding="utf-8")
    year_review_content = YEAR_REVIEW_SNAPSHOTS_PATH.read_text(encoding="utf-8")
    mobile_level_marker = f"const achievementLevels = [{', '.join(str(level) for level in EXPECTED_ACHIEVEMENT_LEVELS)}];"
    catalog_level_marker = f"ACHIEVEMENT_LEVELS = ({', '.join(str(level) for level in EXPECTED_ACHIEVEMENT_LEVELS)})"
    _assert_contains("mobile achievement levels", content, mobile_level_marker)
    _assert_contains("backend shared achievement levels", catalog_content, catalog_level_marker)
    _assert_contains("backend achievement catalog import", backend_content, "from app.services.achievement_catalog import (")
    _assert_contains(
        "year review achievement catalog import",
        year_review_content,
        "from app.services.achievement_catalog import ACHIEVEMENT_CATEGORY_DEFINITIONS, ACHIEVEMENT_LEVELS",
    )
    _assert_not_contains("year review local achievement levels", year_review_content, catalog_level_marker)
    _assert_not_contains("achievement api local achievement levels", backend_content, catalog_level_marker)
    for label, marker in (
        ("year review cumulative badge counts", "cumulative_counts = tuple("),
        ("year review streak badge counts", "streak_counts = tuple("),
        ("year review badge counts combine cumulative streak", "annual_badge_progress_counts = cumulative_counts + streak_counts"),
        ("year review achieved badge source", "achieved_badges = achieved_badge_count(annual_badge_progress_counts)"),
        ("year review highest badge source", "highest_badge = highest_unlocked_level(annual_badge_progress_counts)"),
    ):
        _assert_contains(label, year_review_content, marker)

    for category, label, record_type, icon in EXPECTED_ACHIEVEMENT_CATEGORIES:
        _assert_contains(
            f"mobile achievement category {category}",
            content,
            f'{{ id: "{category}", label: "{label}", recordType: "{record_type}", cumulativeIcon: "{icon}",',
        )
        _assert_contains(f"backend achievement category {category}", catalog_content, f'"id": "{category}"')
        _assert_contains(f"backend achievement label {category}", catalog_content, f'"label": "{label}"')
        _assert_contains(f"backend achievement record type {category}", catalog_content, f'"record_type": "{record_type}"')
        _assert_contains(f"backend achievement icon {category}", catalog_content, f'"cumulative_icon": "{icon}"')
        _assert_contains(f"mobile cumulative id {category}", content, f'id: `${{definition.id}}-cumulative-${{level}}`')
        _assert_contains(f"mobile streak id {category}", content, f'id: `${{definition.id}}-streak-${{level}}`')

    for label, marker in (
        ("mobile cumulative kind", 'kind: "cumulative"'),
        ("mobile cumulative label", 'kindLabel: "累積型"'),
        ("mobile cumulative shared category icon", "icon: definition.cumulativeIcon"),
        ("mobile cumulative level color", "const badgeColor = achievementLevelColors[levelIndex] ?? definition.cumulativeColor"),
        ("mobile streak kind", 'kind: "streak"'),
        ("mobile streak label", 'kindLabel: "連續型"'),
        ("mobile streak independent icon", 'icon: "連"'),
        ("mobile streak independent style", 'displayItem.kind === "streak" ? styles.achievementBadgeStreak : null'),
        ("mobile badge level number", "{displayItem.level}"),
        ("backend cumulative kind", 'kind="cumulative"'),
        ("backend cumulative label", 'kind_label="累積型"'),
        ("backend cumulative shared category icon", 'icon=str(definition["cumulative_icon"])'),
        ("backend cumulative level color", "badge_color=badge_color"),
        ("backend streak kind", 'kind="streak"'),
        ("backend streak label", 'kind_label="連續型"'),
        ("backend streak independent icon", 'icon="連"'),
        ("backend streak independent color", "badge_color=ACHIEVEMENT_STREAK_BADGE_COLOR"),
    ):
        haystack = backend_content if label.startswith("backend") else content
        _assert_contains(label, haystack, marker)


def _verify_food_community_category_contract(content: str) -> None:
    backend_content = COMMUNITY_SCHEMA_PATH.read_text(encoding="utf-8")
    backend_api_content = COMMUNITY_API_PATH.read_text(encoding="utf-8")
    _assert_contains(
        "food community mobile fallback categories",
        content,
        "const foodCommunityCategories: Array<{ id: FoodCommunityCategory; label: string }> = [",
    )
    _assert_contains("food community backend labels", backend_content, "FOOD_CATEGORY_LABELS: dict[FoodCategory, str] = {")
    _assert_contains("food community api-to-mobile mapper", content, "function mobileFoodCategoryFromApi(value: string)")
    _assert_contains("food community mobile-to-api mapper", content, "function apiFoodCategoryFromMobile(value: FoodCommunityCategory)")
    _assert_contains("food community mobile individual food items", content, "const foodCommunityItems: FoodCommunityItem[] = [")
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
    ):
        _assert_contains(label, backend_api_content, marker)
    for label, marker in (
        ("food community API average delta signed clamp", "averageRise: clampNumber(Math.round(stats.average_glucose_delta ?? 0), -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community API max delta signed clamp", "maximumRise: clampNumber(stats.max_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community API min delta signed clamp", "minimumRise: clampNumber(stats.min_glucose_delta ?? 0, -maxMobileGlucoseValue, maxMobileGlucoseValue)"),
        ("food community display average delta signed clamp", "const averageRise = clampNumber(value.averageRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
        ("food community display max delta signed clamp", "const maximumRise = clampNumber(value.maximumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
        ("food community display min delta signed clamp", "const minimumRise = clampNumber(value.minimumRise, -maxMobileGlucoseValue, maxMobileGlucoseValue);"),
    ):
        _assert_contains(label, content, marker)
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
            content,
            f'{{ id: "{mobile_id}", label: "{label}" }}',
        )
        _assert_contains(
            f"mobile individual food item category {mobile_id}",
            content,
            f'category: "{mobile_id}"',
        )
        _assert_contains(f"backend food category {api_code}", backend_content, f'"{api_code}": "{label}"')
        if mobile_id == api_code:
            _assert_contains(
                f"food category direct api mapping {mobile_id}",
                content,
                f'value === "{mobile_id}"',
            )
        else:
            _assert_contains(
                f"food category api-to-mobile mapping {api_code}",
                content,
                f'value === "{api_code}"',
            )
            _assert_contains(
                f"food category mobile-to-api mapping {mobile_id}",
                content,
                f'value === "{mobile_id}"',
            )


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
        ("basic report fasting before meal helper", 'value.strip().lower() in {"fasting", "before_meal"}'),
        ("basic report after meal helper", 'value.strip().lower() == "after_meal"'),
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
        ("basic report test record count", '"count": 3'),
        ("basic report test before meal count", '"before_meal_count": 2'),
        ("basic report test after meal count", '"after_meal_count": 1'),
        ("basic report test average", '"average": 153.3'),
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
        r"<KeyboardAvoidingView\b[\s\S]*?<ScrollView\s+contentContainerStyle=\{styles\.container\}",
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
        is_prepared_label_variable = re.fullmatch(
            r"[A-Za-z][A-Za-z0-9_]*(Accessibility|AccessibilityLabel|AccessibilityDisplayLabel)",
            source,
        )
        if not (is_bounded_display_object or is_render_item_source or is_prepared_label_variable):
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
            _normalize_jsx_expression(match.group(1).split(",")[-1])
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
        "screen.id",
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
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)?", binding):
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
    errors: list[str] = []

    try:
        _assert_inline_press_callbacks_use_press_wrappers(content)
        _assert_inline_press_callbacks_use_display_args(content)
        _assert_text_input_change_handlers_use_update_wrappers(content)
        _assert_text_inputs_use_bounded_state_values(content)
        _assert_text_input_placeholders_are_static_and_bounded(content)
        _assert_text_input_accessibility_labels_are_bounded(content)

        screens = _screen_union(content)
        chrome_keys = _screen_chrome_keys(content)
        checked_screens = _current_screen_checks(content)
        menu_destinations = _menu_destinations(content)
        menu_labels = _menu_labels(content)
        future_targets = _future_targets(content)

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

        _verify_achievement_contract(content)
        _verify_food_community_category_contract(content)
        _verify_basic_report_contract()

        _assert_contains(
            "header menu action",
            content,
            'headerBackTarget === "menu" && currentScreen !== "menu" && !currentChrome.actionLabel',
        )
        _assert_contains(
            "minimal home chrome keeps menu fallback",
            content,
            'today: { subtitle: "" }',
        )
        _assert_not_contains(
            "minimal home chrome must not override hamburger action",
            _screen_chrome_block(content),
            'today: { subtitle: "", backTo:',
        )
        _assert_not_contains(
            "minimal home chrome must not set close/back action label",
            _screen_chrome_block(content),
            'today: { subtitle: "", actionLabel:',
        )
        _assert_contains(
            "header hamburger fallback glyph",
            content,
            '<Text style={styles.menuButtonText}>{currentChrome.actionLabel ?? "☰"}</Text>',
        )
        primary_screens_block = _match_block(
            content,
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
        screen_chrome_block = _screen_chrome_block(content)
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

        for target in sorted(EXPECTED_MENU_BACK_TARGETS):
            _assert_contains(
                f"{target} back-to-menu chrome",
                content,
                f'{target}: {{ subtitle: ',
            )

        _assert_contains(
            "destination-aware return labels",
            content,
            "function returnDestinationButtonLabel(destination: AppScreen)",
        )
        for screen in sorted(EXPECTED_PREVIEW_RETURN_CTA_SCREENS):
            label_name = f"{screen}ReturnButtonDisplayLabel"
            return_state_name = f"{screen}ReturnScreen"
            _assert_contains(
                f"{screen} return label",
                content,
                f"const {label_name} = returnDestinationButtonLabel({return_state_name});",
            )
            _assert_contains(
                f"{screen} return handler",
                content,
                f"setCurrentScreen({return_state_name})",
            )
            _assert_contains(
                f"{screen} return CTA render",
                content,
                f"{{{label_name}}}",
            )

        _assert_contains(
            "header accessibility helper",
            content,
            "function headerActionAccessibilityLabel(chrome: { actionLabel?: string })",
        )
        _assert_contains(
            "header accessibility label binding",
            content,
            "accessibilityLabel={headerActionDisplayAccessibilityLabel}",
        )
        _assert_contains(
            "primary tab accessibility helper",
            content,
            "function primaryTabAccessibilityLabel(label: string)",
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
            "close-button accessibility label copy",
            content,
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
            content,
            "function recordingButtonAccessibilityLabel(isRecording: boolean)",
        )
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
            content,
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
            "AI review manual entry handler",
            content,
            "function openAiReviewManualRecord()",
        )
        _assert_contains(
            "transcript review manual entry handler",
            content,
            "function openTranscriptReviewManualRecord()",
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
            "record detail return handler",
            content,
            "function returnFromRecordDetail()",
        )
        _assert_contains(
            "tutorial record entry handler",
            content,
            "function openTutorialRecordEntry()",
        )
        _assert_contains(
            "tutorial manual entry handler",
            content,
            "function openTutorialManualRecord()",
        )
        _assert_contains(
            "manual record return binding",
            content,
            "onPress={returnFromManualRecord}",
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
            "AI save confirm return binding",
            content,
            "onPress={returnFromAiSaveConfirm}",
        )
        _assert_contains(
            "save success unsaved candidate handler",
            content,
            "function processUnsavedPreviewRecords()",
        )
        _assert_contains(
            "save success destination handler",
            content,
            "function openSaveSuccessDestination(target: AppScreen)",
        )
        _assert_contains(
            "save success destination card handler",
            content,
            "function openSaveSuccessDestinationCard(target: AppScreen)",
        )
        _assert_contains(
            "result destination accessibility item",
            content,
            "accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)",
        )
        _assert_contains(
            "save success destination card press handler",
            content,
            "function pressSaveSuccessDestinationCard(item: ReturnType<typeof destinationCardDisplayItem>)",
        )
        _assert_contains(
            "save success destination card binding",
            content,
            "onPress={() => pressSaveSuccessDestinationCard(item)}",
        )
        _assert_contains(
            "save success destination card accessibility binding",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
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
            content,
            '...(hasUnsavedPreviewRecords\n      ? [["⚠", "返回確認", "處理尚未儲存的候選紀錄", "aiReview"]]\n      : [])',
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
            "AI save failure back AI review handler",
            content,
            "function returnFromAiSaveFailureToAiReview()",
        )
        _assert_contains(
            "AI save failure return save confirm handler",
            content,
            "function returnFromAiSaveFailureToSaveConfirm()",
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
            "AI candidate edit accessibility item",
            content,
            "editAccessibilityLabel: boundDisplayText(`修改${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength)",
        )
        _assert_contains(
            "AI candidate remove accessibility item",
            content,
            "removeAccessibilityLabel: boundDisplayText(`移除${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength)",
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
            "accessibilityLabel={item.editAccessibilityLabel}",
        )
        _assert_contains(
            "AI candidate remove accessibility binding",
            content,
            "accessibilityLabel={item.removeAccessibilityLabel}",
        )
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
        _assert_contains(
            "AI candidate remove-confirm return binding",
            content,
            "onPress={returnFromPreviewRemoveConfirm}",
        )
        _assert_contains(
            "AI candidate edit return handler",
            content,
            "function returnFromPreviewRecordEdit()",
        )
        _assert_contains(
            "AI candidate edit return binding",
            content,
            "onPress={returnFromPreviewRecordEdit}",
        )
        for label, marker in (
            ("AI candidate preview edit return accessibility label", 'previewEditReturnAccessibility: boundDisplayText("取消候選修改並返回 AI 確認，不寫入正式紀錄", maxDisplayDetailTextLength)'),
            ("AI candidate preview edit apply accessibility label", 'previewEditApplyAccessibility: boundDisplayText("套用未儲存候選修改，不送 backend save request", maxDisplayDetailTextLength)'),
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
            "manual record confirm return handler",
            content,
            "function returnFromManualRecordConfirm()",
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
            ("manual record create submit binding", "onPress={submitManualRecordCreate}"),
            ("record update submit binding", "onPress={submitRecordUpdate}"),
            ("record delete submit binding", "onPress={submitRecordDelete}"),
            ("dev reset menu submit binding", "onPress={resetDevelopmentDataFromMenu}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "delete confirm open handler",
            content,
            "function openDeleteConfirm()",
        )
        _assert_contains(
            "delete confirm return handler",
            content,
            "function returnFromDeleteConfirm()",
        )
        _assert_contains(
            "delete confirm open binding",
            content,
            "onPress={openDeleteConfirm}",
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
            "record edit return handler",
            content,
            "function returnFromRecordEdit()",
        )
        _assert_contains(
            "record edit open binding",
            content,
            "onPress={openRecordEdit}",
        )
        _assert_contains(
            "record edit return binding",
            content,
            "onPress={returnFromRecordEdit}",
        )
        _assert_contains(
            "delete success destination handler",
            content,
            "function openDeleteSuccessDestination(target: AppScreen)",
        )
        _assert_contains(
            "update success destination handler",
            content,
            "function openUpdateSuccessDestination(target: AppScreen)",
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
            "delete success destination card binding",
            content,
            "onPress={() => pressDeleteSuccessDestinationCard(item)}",
        )
        _assert_contains(
            "delete success destination card accessibility binding",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
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
            "update success destination card accessibility binding",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
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
            content,
            "accessibilityLabel: boundDisplayText(`前往${label}`, maxDisplayTextLength)",
        )
        _assert_contains(
            "menu card accessibility binding",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
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
            "menu destination handler",
            content,
            "function openMenuDestination(target: AppScreen)",
        )
        _assert_contains(
            "menu destination press wrapper",
            content,
            "function pressMenuDestination(item: ReturnType<typeof menuScreenDisplayItem>)",
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
        _assert_contains(
            "more action accessibility",
            content,
            "accessibilityLabel={auxiliaryDisplayLabels.showMoreFeaturesAccessibility}",
        )
        _assert_contains(
            "more action button role",
            content,
            'accessibilityRole="button"\n              style={styles.moreButton}',
        )
        _assert_contains(
            "dev reset accessibility",
            content,
            "accessibilityLabel={auxiliaryDisplayLabels.devResetAccessibility}",
        )
        _assert_contains(
            "visual smoke route jump list",
            content,
            "const visualSmokeRouteJumps",
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
            "visual smoke route press wrapper",
            content,
            "function pressVisualSmokeRoute(item: ReturnType<typeof visualSmokeRouteJumpDisplayItem>)",
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
        _assert_contains(
            "visual smoke initial route env",
            content,
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
            "accessibilityLabel={item.accessibilityLabel}",
        )
        _assert_contains(
            "store product action accessibility",
            content,
            "accessibilityLabel={product.actionAccessibilityLabel}",
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
            ("minimal home hides primary tabs", 'const showPrimaryTabs = currentScreen !== "today" && primaryScreens.some((screen) => screen.id === currentScreen)'),
            ("minimal home hides MVP flow stepper", 'currentScreen !== "today" &&'),
            ("minimal home section style", "styles.homeMinimalSection"),
            ("minimal home mic button style", "styles.homeMicButton"),
            ("minimal home active mic style", "styles.homeMicButtonActive"),
            ("minimal home primary hint", "按住開始說話記錄"),
            ("minimal home secondary hint", "放開即結束"),
            ("minimal home recording seconds helper", "function homeRecordingSecondaryHint(isRecording: boolean, elapsedSeconds: number)"),
            ("minimal home recording seconds copy", "已錄音 ${clampNumber(elapsedSeconds, 0, maxMobileCountValue)} 秒，放開即結束"),
            ("minimal home recording seconds display value", "const homeRecordingSecondaryHintDisplayText = homeRecordingSecondaryHint("),
            ("minimal home mic accessibility binding", "accessibilityLabel={recordingButtonDisplayAccessibilityLabel}"),
            ("minimal home mic press in", "onPressIn={startRecordingPreview}"),
            ("minimal home mic press out", "onPressOut={finishRecordingPreview}"),
            ("minimal home conditional subtitle", "{currentChrome.subtitle ? <Text style={styles.subtitle}>{currentChrome.subtitle}</Text> : null}"),
            ("minimal home empty subtitle", 'today: { subtitle: "" }'),
        ):
            _assert_contains(label, content, marker)
        today_home_block = _today_home_render_block(content)
        if today_home_block.count("<Pressable") != 1:
            raise AssertionError("Today/Home render block must contain exactly one Pressable mic control.")
        for label, marker in (
            ("minimal home block primary hint", "<Text style={styles.homeHint}>按住開始說話記錄</Text>"),
            ("minimal home block secondary hint", "<Text style={styles.homeHintSecondary}>{homeRecordingSecondaryHintDisplayText}</Text>"),
        ):
            _assert_contains(label, today_home_block, marker)
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
            content,
            "function quickEntryModeDisplayItems()",
        )
        for label in ("語音預覽", "文字整理", "手動新增"):
            _assert_contains(
                f"record quick-entry {label}",
                content,
                f'label: boundDisplayText("{label}", maxDisplayTextLength)',
            )
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
            "record quick-entry wrapper",
            content,
            "function handleRecordQuickEntryMode(mode: QuickEntryMode)",
        )
        _assert_contains(
            "record quick-entry item press wrapper",
            content,
            "function pressRecordQuickEntryItem(item: ReturnType<typeof quickEntryModeDisplayItems>[number])",
        )
        _assert_contains(
            "quick-entry accessibility labels",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
        )
        _assert_contains(
            "quick-entry button role",
            content,
            'accessibilityRole="button"',
        )
        for label, marker in (
            ("core rerecord accessibility label", 'rerecordAccessibility: boundDisplayText("重新錄音，只重置本機錄音預覽狀態", maxDisplayDetailTextLength)'),
            ("core recording text accessibility label", 'useRecordingTextAccessibility: boundDisplayText("使用錄音結果轉文字，不呼叫 STT 或 AI", maxDisplayDetailTextLength)'),
            ("core sample accessibility label", 'fillSampleAccessibility: boundDisplayText("填入範例文字，只供確認 UI 預覽，不送 parser", maxDisplayDetailTextLength)'),
            ("core manual accessibility label", 'manualAddAccessibility: boundDisplayText("改用手動新增，不呼叫 AI、LLM 或 STT", maxDisplayDetailTextLength)'),
            ("core next organize accessibility label", 'nextOrganizeAccessibility: boundDisplayText("前往文字確認，尚未送出 AI 整理", maxDisplayDetailTextLength)'),
            ("core text record accessibility label", 'textRecordAccessibility: boundDisplayText("前往文字記錄輸入，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("core analysis accessibility label", 'viewAnalysisAccessibility: boundDisplayText("查看基本分析，只使用已載入紀錄", maxDisplayDetailTextLength)'),
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
            ("confirmation save confirm accessibility label", 'enterSaveConfirmAccessibility: boundDisplayText("進入儲存確認，不儲存也不重新呼叫 AI", maxDisplayDetailTextLength)'),
            ("confirmation return text accessibility label", 'returnTextConfirmAccessibility: boundDisplayText("回文字確認，不送 parser 或寫入資料", maxDisplayDetailTextLength)'),
            ("confirmation return confirm accessibility label", 'returnConfirmAccessibility: boundDisplayText("返回確認，保留候選紀錄且不送 backend", maxDisplayDetailTextLength)'),
            ("confirmation submit save accessibility label", 'submitAiSaveAccessibility: boundDisplayText("確認儲存目前候選紀錄，送 backend 驗證與 audit", maxDisplayDetailTextLength)'),
            ("confirmation cancel accessibility label", 'cancelAccessibility: boundDisplayText("取消並返回確認，不刪除正式紀錄", maxDisplayDetailTextLength)'),
            ("confirmation remove accessibility label", 'confirmRemoveAccessibility: boundDisplayText("確認移除未儲存候選，不呼叫刪除 API", maxDisplayDetailTextLength)'),
            ("confirmation failure return accessibility label", 'returnSaveConfirmAccessibility: boundDisplayText("返回儲存確認，不自動重試 backend save", maxDisplayDetailTextLength)'),
            ("confirmation transcript parse accessibility label", 'submitTranscriptParseAccessibility: boundDisplayText("送出文字整理，僅在 backend 和模型 ready 時呼叫 parser", maxDisplayDetailTextLength)'),
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
        for label, marker in (
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
            ("delete success history accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.deleteSuccessHistoryAccessibility}"),
            ("record result return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordResultReturnAccessibility}"),
            ("updated record detail accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.updatedRecordDetailAccessibility}"),
            ("manual return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualReturnAccessibility}"),
            ("manual create preview accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualCreatePreviewAccessibility}"),
            ("manual confirm return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualConfirmReturnAccessibility}"),
            ("manual create submit accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.manualCreateSubmitAccessibility}"),
            ("record detail return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDetailReturnAccessibility}"),
            ("record edit open accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordEditOpenAccessibility}"),
            ("record delete open accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteOpenAccessibility}"),
            ("record delete return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteReturnAccessibility}"),
            ("record delete cancel accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteCancelAccessibility}"),
            ("record delete submit accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordDeleteSubmitAccessibility}"),
            ("record edit return accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordEditReturnAccessibility}"),
            ("record update submit accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.recordUpdateSubmitAccessibility}"),
            ("manual create preview disabled state", "disabled: Boolean(manualRecordValidationError) || isBusy || !protectedBackendReady"),
            ("record update submit disabled state", "accessibilityState={{ disabled: Boolean(selectedRecordEditValidationError) || isBusy }}"),
            ("record delete disabled state", "accessibilityState={{ disabled: isBusy }}"),
        ):
            _assert_contains(label, content, marker)
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
            "today record entry handler",
            content,
            "function openTodayRecordEntry()",
        )
        _assert_contains(
            "today record detail handler",
            content,
            "function openTodayRecordDetail(record: RecordItem)",
        )
        _assert_contains(
            "today record detail card handler",
            content,
            "function openTodayRecordDetailCard(record: RecordItem)",
        )
        _assert_contains(
            "today record detail card press handler",
            content,
            "function pressTodayRecordDetailCard(item: ReturnType<typeof recordListDisplayItem>)",
        )
        _assert_contains(
            "record list accessibility item",
            content,
            "accessibilityLabel: boundDisplayText(`查看${typeLabel}紀錄：${payloadSummary}，時間 ${timeLabel}`, maxDisplayDetailTextLength)",
        )
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
            _assert_contains(label, content, marker)
        _assert_contains(
            "today analysis handler",
            content,
            "function openTodayAnalysis()",
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
            'key={`record-${item.key}`}',
        )
        _assert_contains(
            "record quick-entry action",
            content,
            "onPress={() => pressRecordQuickEntryItem(item)}",
        )
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
            "historyCalendarGrid",
            "historyCalendarDay",
            "historyCalendarDayHasRecords",
            "historyCalendarDayMuted",
            "historyCalendarDaySelected",
            "historyRawCard",
        ):
            _assert_contains(f"{style_name} style", content, f"{style_name}: {{")
        for label, marker in (
            ("history calendar day display item", "function historyCalendarDayDisplayItem(date: Date, selectedDateKey: string, recordsByDate: Map<string, RecordItem[]>)"),
            ("history raw record display item", "function historyRawRecordDisplayItem(record: RecordItem, index: number)"),
            ("history selected date state", "const [selectedHistoryDate, setSelectedHistoryDate] = useState(formatLocalDateInput(new Date()))"),
            ("history detail mode state", 'const [historyDetailMode, setHistoryDetailMode] = useState<HistoryDetailMode>("structured")'),
            ("history calendar date resets structured mode", 'setHistoryDetailMode("structured");'),
            ("history records by date map", "const historyRecordsByDate = useMemo(() => {"),
            ("history calendar display items", "const historyCalendarDisplayItems = useMemo(() => {"),
            ("history calendar render", "historyCalendarDisplayItems.map((item) =>"),
            ("history calendar day press handler", "function pressHistoryCalendarDay(item: ReturnType<typeof historyCalendarDayDisplayItem>)"),
            ("history calendar day binding", "onPress={() => pressHistoryCalendarDay(item)}"),
            ("history calendar selected state", "accessibilityState={{ selected: item.isSelected }}"),
            ("history detail mode display item", "function historyDetailModeDisplayItem(value: { id: HistoryDetailMode; label: string; accessibilityCopy: string })"),
            ("history detail mode display options", "const historyDetailModeDisplayOptions = useMemo(() => historyDetailModes.map(historyDetailModeDisplayItem), [])"),
            ("history detail mode press handler", "function pressHistoryDetailModeOption(item: ReturnType<typeof historyDetailModeDisplayItem>)"),
            ("history detail mode binding", "onPress={() => pressHistoryDetailModeOption(item)}"),
            ("history structured records render", "selectedHistoryRecordDisplayItems.map((item) =>"),
            ("history raw records render", "selectedHistoryRawDisplayItems.map((item) =>"),
            ("history raw source status", "sourceStatusLabel: boundDisplayText(hasSourceText ? \"原始逐字稿\" : \"僅結構化\", 40)"),
            ("history raw fallback copy", "尚無原始逐字稿；正式紀錄只保留結構化資料。"),
        ):
            _assert_contains(label, content, marker)
        history_calendar_day_block = _function_block(content, "historyCalendarDayDisplayItem")
        for label, marker in (
            ("history calendar date key", "const dateKey = formatLocalDateInput(date);"),
            ("history calendar date record count", "const recordCount = clampNumber(recordsByDate.get(dateKey)?.length ?? 0, 0, maxMobileCountValue);"),
            ("history calendar has records flag", "hasRecords: recordCount > 0"),
            ("history calendar selected flag", "isSelected: dateKey === selectedDateKey"),
            ("history calendar accessibility has/no records", '${dateKey}，${recordCount > 0 ? `有 ${recordCount} 筆紀錄` : "沒有紀錄"}，點擊查看日期'),
        ):
            _assert_contains(label, history_calendar_day_block, marker)
        history_block = _history_render_block(content)
        history_calendar_index = history_block.find("styles.historyCalendarGrid")
        history_detail_index = history_block.find("styles.historySelectedDatePanel")
        history_structured_index = history_block.find('historyDetailMode === "structured"')
        history_raw_index = history_block.find("selectedHistoryRawDisplayItems.map((item) =>")
        if history_calendar_index == -1 or history_detail_index == -1 or history_calendar_index > history_detail_index:
            raise AssertionError("History calendar must render before selected-date details.")
        if history_structured_index == -1 or history_raw_index == -1 or history_structured_index > history_raw_index:
            raise AssertionError("History structured AI-organized records must render before raw transcript branch.")
        for label, marker in (
            ("history calendar has-records style binding", "item.hasRecords ? styles.historyCalendarDayHasRecords : styles.historyCalendarDayMuted"),
            ("history calendar selected style binding", "item.isSelected ? styles.historyCalendarDaySelected : null"),
            ("history calendar record dot binding", "item.hasRecords ? <View style={styles.historyCalendarDot} /> : null"),
            ("history calendar lit-date legend", "亮燈日期有紀錄"),
        ):
            _assert_contains(label, history_block, marker)
        for label, marker in (
            ("history range tabs render", "historyRangeDisplayOptions.map"),
            ("history custom range apply button", "applyHistoryCustomRange"),
            ("history custom start input", "historyCustomStart"),
            ("history custom end input", "historyCustomEnd"),
        ):
            if marker in history_block:
                raise AssertionError(f"History calendar-first render block must not contain {label}.")
        history_raw_display_block = _function_block(content, "historyRawRecordDisplayItem")
        for label, marker in (
            ("history raw source metadata lookup", "const sourceText = record.metadata_json?.source_text;"),
            ("history raw source type guard", 'const hasSourceText = typeof sourceText === "string";'),
            ("history raw bounded source text", "boundDisplayText(sourceText, maxDisplayDetailTextLength)"),
            ("history raw fallback assignment", ': "尚無原始逐字稿；正式紀錄只保留結構化資料。";'),
            ("history raw status label", 'sourceStatusLabel: boundDisplayText(hasSourceText ? "原始逐字稿" : "僅結構化", 40)'),
        ):
            _assert_contains(label, history_raw_display_block, marker)
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
            "history record detail card accessibility binding",
            content,
            "accessibilityLabel={item.accessibilityLabel}",
        )
        _assert_contains(
            "history record detail card button role",
            content,
            'accessibilityRole="button"',
        )
        _assert_contains(
            "history record detail card style",
            content,
            "style={styles.historyItemButton}",
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
            "history record detail card binding",
            content,
            "onPress={() => pressHistoryRecordDetailCard(item)}",
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
            "analysis return today handler",
            content,
            "function returnFromAnalysisToToday()",
        )
        _assert_contains(
            "analysis detailed report handler",
            content,
            "function openAnalysisDetailedReport()",
        )
        _assert_contains(
            "detailed report return analysis handler",
            content,
            "function returnFromDetailedReportToAnalysis()",
        )
        _assert_contains(
            "detailed report manual entry handler",
            content,
            "function openDetailedReportManualRecord()",
        )
        _assert_contains(
            "detailed report return today handler",
            content,
            "function returnFromDetailedReportToToday()",
        )
        _assert_contains(
            "manual record type handler",
            content,
            "function selectManualRecordType(type: ManualRecordType)",
        )
        _assert_contains(
            "manual record type option press handler",
            content,
            "function pressManualRecordTypeOption(type: ReturnType<typeof manualRecordTypeDisplayItem>)",
        )
        _assert_contains(
            "analysis range handler",
            content,
            "function selectAnalysisRange(range: AnalysisRange)",
        )
        _assert_contains(
            "analysis range option press handler",
            content,
            "function pressAnalysisRangeOption(item: ReturnType<typeof analysisRangeDisplayItem>)",
        )
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
        for label, marker in (
            ("analysis week range option", '{ id: "week", label: "本週" }'),
            ("analysis month range option", '{ id: "month", label: "本月" }'),
            ("analysis custom range option", '{ id: "custom", label: "自訂日期區間" }'),
            ("analysis default month range state", 'const [analysisRange, setAnalysisRange] = useState<AnalysisRange>("month");'),
            ("analysis date bounds helper", "function analysisDateBounds(range: AnalysisRange, customStart: string, customEnd: string)"),
            ("analysis selected date bounds", "const analysisSelectedDateBounds = useMemo("),
            ("analysis local records date bounds", "const { start, end } = analysisSelectedDateBounds;\n    return recordsForDisplay.filter((record) => {"),
            ("analysis local glucose derives from analysis records", "const analysisGlucoseRecords = useMemo(\n    () =>\n      analysisRecords"),
            ("analysis local glucose record mapper", ".map((record) => ({\n          record,\n          value:"),
            ("analysis local glucose records dependency", "    [analysisRecords]\n  );\n  const analysisGlucoseValues = analysisGlucoseRecords.map((entry) => entry.value);"),
            ("analysis report start bound", "const startAt = analysisSelectedDateBounds.start.toISOString();"),
            ("analysis report end bound", "const endAt = analysisSelectedDateBounds.end.toISOString();"),
        ):
            _assert_contains(label, content, marker)
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
            ("report return analysis accessibility label", 'reportReturnAnalysisAccessibility: boundDisplayText("返回基本分析，不重新查詢報告", maxDisplayDetailTextLength)'),
            ("report manual accessibility label", 'reportManualAccessibility: boundDisplayText("從詳細報告改用手動新增，不呼叫 AI 或寫入資料", maxDisplayDetailTextLength)'),
            ("report today accessibility label", 'reportReturnTodayAccessibility: boundDisplayText("從詳細報告回今日紀錄，不重新查詢 backend", maxDisplayDetailTextLength)'),
            ("analysis manual accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisManualAccessibility}"),
            ("analysis today accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisReturnTodayAccessibility}"),
            ("analysis detailed report accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.analysisDetailedReportAccessibility}"),
            ("analysis detailed report disabled state", "accessibilityState={{ disabled: isReportLoading }}"),
            ("report return analysis accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportReturnAnalysisAccessibility}"),
            ("report manual accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportManualAccessibility}"),
            ("report today accessibility binding", "accessibilityLabel={coreFlowDisplayLabels.reportReturnTodayAccessibility}"),
        ):
            _assert_contains(label, content, marker)
        _assert_contains(
            "manual record type binding",
            content,
            "onPress={() => pressManualRecordTypeOption(type)}",
        )
        for label, marker in (
            ("generic option accessibility item", "accessibilityLabel: boundDisplayText(`選擇${label}選項`, maxDisplayTextLength)"),
            ("manual record type accessibility item", "accessibilityLabel: boundDisplayText(`選擇${label}紀錄類型，不呼叫 AI 或 parser`, maxDisplayDetailTextLength)"),
            ("store category accessibility item", "accessibilityLabel: boundDisplayText(`切換商城分類：${label}，不建立訂單或付款`, maxDisplayDetailTextLength)"),
            ("analysis range accessibility item", "accessibilityLabel: boundDisplayText(`切換分析範圍：${label}，只使用已載入紀錄`, maxDisplayDetailTextLength)"),
            ("manual type chip accessibility binding", "accessibilityLabel={type.accessibilityLabel}"),
            ("shared option chip accessibility binding", "accessibilityLabel={option.accessibilityLabel}"),
            ("store category accessibility binding", "accessibilityLabel={category.accessibilityLabel}"),
            ("history range accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("analysis range accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("manual type chip button role", 'accessibilityRole="button"\n                  accessibilityState={{ selected: manualRecordType === type.value }}'),
            ("history calendar selected state", "accessibilityState={{ selected: item.isSelected }}"),
            ("history detail selected state", "accessibilityState={{ selected: historyDetailMode === item.value }}"),
            ("analysis range selected state", "accessibilityState={{ selected: analysisRange === item.value }}"),
            ("analysis custom date conditional render", '{analysisRange === "custom" ? ('),
            ("analysis start date accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.analysisStartDateInputAccessibility}"),
            ("analysis end date accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.analysisEndDateInputAccessibility}"),
            ("analysis start date input binding", "onChangeText={updateAnalysisCustomStartInput}"),
            ("analysis end date input binding", "onChangeText={updateAnalysisCustomEndInput}"),
            ("manual glucose unit selected state", "accessibilityState={{ selected: manualRecordFields.glucoseUnit === option.value }}"),
            ("manual glucose timing selected state", "accessibilityState={{ selected: manualRecordFields.glucoseTiming === option.value }}"),
            ("manual meal selected state", "accessibilityState={{ selected: manualRecordFields.mealType === option.value }}"),
            ("preview glucose unit selected state", "accessibilityState={{ selected: previewEditFields.glucoseUnit === option.value }}"),
            ("preview glucose timing selected state", "accessibilityState={{ selected: previewEditFields.glucoseTiming === option.value }}"),
            ("preview meal selected state", "accessibilityState={{ selected: previewEditFields.mealType === option.value }}"),
            ("record edit glucose unit selected state", "accessibilityState={{ selected: recordEditFields.glucoseUnit === option.value }}"),
            ("record edit glucose timing selected state", "accessibilityState={{ selected: recordEditFields.glucoseTiming === option.value }}"),
            ("record edit meal selected state", "accessibilityState={{ selected: recordEditFields.mealType === option.value }}"),
            ("store category selected state", "accessibilityState={{ selected: storeCategory === category.value }}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("preview edit date input handler", "function updatePreviewEditDateInput(value: string)"),
            ("preview edit time input handler", "function updatePreviewEditTimeInput(value: string)"),
            ("preview edit glucose input binding", "onChangeText={updatePreviewEditGlucoseValue}"),
            ("preview edit unit option press handler", "function pressPreviewEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("preview edit timing option press handler", "function pressPreviewEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("preview edit meal type option press handler", "function pressPreviewEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("preview edit unit option press binding", "onPress={() => pressPreviewEditGlucoseUnitOption(option)}"),
            ("preview edit timing option press binding", "onPress={() => pressPreviewEditGlucoseTimingOption(option)}"),
            ("preview edit meal type option press binding", "onPress={() => pressPreviewEditMealTypeOption(option)}"),
            ("preview edit fallback json binding", "onChangeText={updatePreviewEditFallbackJson}"),
            ("manual record date input handler", "function updateManualRecordDateInput(value: string)"),
            ("manual record time input handler", "function updateManualRecordTimeInput(value: string)"),
            ("manual record glucose input binding", "onChangeText={updateManualRecordGlucoseValue}"),
            ("manual record unit option press handler", "function pressManualRecordGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("manual record timing option press handler", "function pressManualRecordGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("manual record meal type option press handler", "function pressManualRecordMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("manual record unit option press binding", "onPress={() => pressManualRecordGlucoseUnitOption(option)}"),
            ("manual record timing option press binding", "onPress={() => pressManualRecordGlucoseTimingOption(option)}"),
            ("manual record meal type option press binding", "onPress={() => pressManualRecordMealTypeOption(option)}"),
            ("record edit date input handler", "function updateRecordEditDateInput(value: string)"),
            ("record edit time input handler", "function updateRecordEditTimeInput(value: string)"),
            ("record edit glucose input binding", "onChangeText={updateRecordEditGlucoseValue}"),
            ("record edit unit option press handler", "function pressRecordEditGlucoseUnitOption(option: ReturnType<typeof optionDisplayItem>)"),
            ("record edit timing option press handler", "function pressRecordEditGlucoseTimingOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("record edit meal type option press handler", "function pressRecordEditMealTypeOption(option: ReturnType<typeof valueLabelDisplayItem>)"),
            ("record edit unit option press binding", "onPress={() => pressRecordEditGlucoseUnitOption(option)}"),
            ("record edit timing option press binding", "onPress={() => pressRecordEditGlucoseTimingOption(option)}"),
            ("record edit meal type option press binding", "onPress={() => pressRecordEditMealTypeOption(option)}"),
            ("record edit fallback json binding", "onChangeText={updateRecordEditFallbackJson}"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("manual record direct type binding", "onPress={() => selectManualRecordType(type.value)}"),
            ("preview edit direct unit selection binding", "onPress={() => selectPreviewEditGlucoseUnit(option.value)}"),
            ("preview edit direct timing selection binding", "onPress={() => selectPreviewEditGlucoseTiming(option.value)}"),
            ("preview edit direct meal type selection binding", "onPress={() => selectPreviewEditMealType(option.value)}"),
            ("preview edit date inline setter", "onChangeText={(value) => setPreviewEditDate("),
            ("preview edit time inline setter", "onChangeText={(value) => setPreviewEditTime("),
            ("preview edit direct field updater", 'onChangeText={(value) => updatePreviewEditField("'),
            ("preview edit direct option updater", 'onPress={() => updatePreviewEditField("'),
            ("manual record direct unit selection binding", "onPress={() => selectManualRecordGlucoseUnit(option.value)}"),
            ("manual record direct timing selection binding", "onPress={() => selectManualRecordGlucoseTiming(option.value)}"),
            ("manual record direct meal type selection binding", "onPress={() => selectManualRecordMealType(option.value)}"),
            ("manual record date inline setter", "onChangeText={(value) => setManualRecordDate("),
            ("manual record time inline setter", "onChangeText={(value) => setManualRecordTime("),
            ("manual record direct field updater", 'onChangeText={(value) => updateManualRecordField("'),
            ("manual record direct option updater", 'onPress={() => updateManualRecordField("'),
            ("record edit direct unit selection binding", "onPress={() => selectRecordEditGlucoseUnit(option.value)}"),
            ("record edit direct timing selection binding", "onPress={() => selectRecordEditGlucoseTiming(option.value)}"),
            ("record edit direct meal type selection binding", "onPress={() => selectRecordEditMealType(option.value)}"),
            ("record edit date inline setter", "onChangeText={(value) => setRecordEditDate("),
            ("record edit time inline setter", "onChangeText={(value) => setRecordEditTime("),
            ("record edit direct field updater", 'onChangeText={(value) => updateRecordEditField("'),
            ("record edit direct option updater", 'onPress={() => updateRecordEditField("'),
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
            "const analysisMetricRows = ([",
        )
        for label, marker in (
            ("analysis normalized glucose timing helper", "function normalizedGlucoseTiming(value: unknown)"),
            ("analysis before timing helper", "function isBeforeMealGlucoseTiming(value: unknown)"),
            ("analysis after timing helper", "function isAfterMealGlucoseTiming(value: unknown)"),
            ("analysis before timing helper usage", "isBeforeMealGlucoseTiming(record.payload_json.meal_timing)"),
            ("analysis after timing helper usage", "isAfterMealGlucoseTiming(record.payload_json.meal_timing)"),
        ):
            _assert_contains(label, content, marker)
        for label, marker in (
            ("analysis highest metric", '["最高血糖", analysisHighestDisplayValue === null ? "尚無" : String(analysisHighestDisplayValue)]'),
            ("analysis lowest metric", '["最低血糖", analysisLowestDisplayValue === null ? "尚無" : String(analysisLowestDisplayValue)]'),
            ("analysis average metric", '["平均血糖", analysisAverageDisplayValue === null ? "尚無" : String(analysisAverageDisplayValue)]'),
            ("analysis glucose record count metric", '["血糖測量總次數", String(analysisGlucoseRecordDisplayCount)]'),
            ("analysis before meal count metric", '["飯前血糖次數", String(analysisBeforeMealGlucoseDisplayCount)]'),
            ("analysis after meal count metric", '["飯後血糖次數", String(analysisAfterMealGlucoseDisplayCount)]'),
            ("detailed report backend before meal count", "basicReport?.glucose.before_meal_count ?? beforeMealGlucoseCount"),
            ("detailed report backend after meal count", "basicReport?.glucose.after_meal_count ?? afterMealGlucoseCount"),
            ("detailed report before meal metric", '["飯前血糖", `${reportBeforeMealGlucoseDisplayCount} 次`]'),
            ("detailed report after meal metric", '["飯後血糖", `${reportAfterMealGlucoseDisplayCount} 次`]'),
        ):
            _assert_contains(label, content, marker)
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
            "`查看分析圖表點：${point.label}，血糖 ${point.value}`",
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
            "const accountSecurityCardAccessibilityLabel = boundDisplayText(",
        )
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
            "settings row press wrapper",
            content,
            "function pressSettingsRow(row: ReturnType<typeof settingsRowDisplayItem>)",
        )
        _assert_contains(
            "settings row binding",
            content,
            "onPress={() => pressSettingsRow(row)}",
        )
        _assert_contains(
            "settings row accessibility item",
            content,
            "accessibilityLabel: boundDisplayText(`前往${label}設定：${helper || \"查看設定狀態\"}`, maxDisplayDetailTextLength)",
        )
        _assert_contains(
            "settings row accessibility binding",
            content,
            "accessibilityLabel={row.accessibilityLabel}",
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
            "primary tab press wrapper",
            content,
            "function pressPrimaryTab(target: AppScreen)",
        )
        _assert_contains(
            "primary tab press binding",
            content,
            "onPress={() => pressPrimaryTab(screen.id)}",
        )
        _assert_contains(
            "primary tab button role",
            content,
            'accessibilityRole="button"\n                  accessibilityState={{ disabled: isPrimaryTabLocked, selected: isCurrentPrimaryTab }}',
        )
        _assert_not_contains(
            "primary tab direct destination binding",
            content,
            "onPress={() => openPrimaryTab(screen.id)}",
        )
        for label, marker in (
            ("settings local clear handler", "function clearLocalSessionFromSettings()"),
            ("auth provider challenge handler", "function startAuthProviderChallenge(provider: string)"),
            ("auth provider preview press handler", "function pressAuthProviderPreview(item: ReturnType<typeof authProviderPreviewDisplayItem>)"),
            ("auth refresh handler", "function refreshAuthSessionFromSecurity()"),
            ("auth sessions load handler", "function loadAuthSessionsFromSecurity()"),
            ("auth logout handler", "function logoutAuthSessionFromSecurity()"),
            ("auth logout all handler", "function logoutAllAuthSessionsFromSecurity()"),
            ("auth session management status handler", "function showAuthSessionManagementStatus(actionStatus: string)"),
            (
                "auth session management preview press handler",
                "function pressAuthSessionManagementPreview(item: ReturnType<typeof sessionManagementPreviewDisplayItem>)",
            ),
            ("auth provider accessibility item", "accessibilityLabel: boundDisplayText(`查看${item.title}登入整合狀態，不保存 provider token`, maxDisplayDetailTextLength)"),
            ("auth session management accessibility item", "accessibilityLabel: boundDisplayText(`查看${item.title}session 管理狀態，不顯示 raw token`, maxDisplayDetailTextLength)"),
            ("auth refresh accessibility label", "refreshSessionAccessibility: boundDisplayText(\"刷新 session，使用 SecureStore refresh token rotation\", maxDisplayDetailTextLength)"),
            ("auth load sessions accessibility label", "loadSessionsAccessibility: boundDisplayText(\"載入 sessions，只顯示 bounded session metadata\", maxDisplayDetailTextLength)"),
            ("auth logout local accessibility label", "logoutLocalAccessibility: boundDisplayText(\"登出本機，revoke session 並清除本機安全 token\", maxDisplayDetailTextLength)"),
            ("auth logout all accessibility label", "logoutAllAccessibility: boundDisplayText(\"登出全部裝置，revoke backend sessions 並清除本機 token\", maxDisplayDetailTextLength)"),
            ("settings local clear accessibility label", "localClearAccessibility: boundDisplayText(\"清除本機 session 與預覽狀態，不刪除 backend 紀錄\", maxDisplayDetailTextLength)"),
            ("advanced settings toggle accessibility label", "advancedSettingsToggleAccessibility: boundDisplayText(\"展開或收合進階設定，不連線 backend 或啟動模型\", maxDisplayDetailTextLength)"),
            ("backend reconnect accessibility label", "backendReconnectAccessibility: boundDisplayText(\"重新連線 backend，會清除 stale session/model/record state\", maxDisplayDetailTextLength)"),
            ("profile edit accessibility label", "editIntegrationAccessibility: boundDisplayText(\"查看個人資料編輯整合狀態，不寫入個資或照護對象\", maxDisplayDetailTextLength)"),
            ("recording quota sync accessibility helper", "function recordingQuotaSyncAccessibilityLabel(isSyncing: boolean)"),
            ("reminder integration accessibility helper", "function reminderIntegrationAccessibilityLabel()"),
            ("privacy integration accessibility helper", "function privacyIntegrationAccessibilityLabel()"),
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
            ("native download kind accessibility helper", 'function nativeDownloadKindAccessibilityLabel(kind: "whisper" | "llama", selectedKind: "whisper" | "llama")'),
            ("native module check accessibility helper", "function nativeModuleCheckAccessibilityLabel(isRunning: boolean)"),
            ("native model download accessibility helper", "function nativeModelDownloadAccessibilityLabel(isRunning: boolean, progress: number)"),
            ("native whisper run accessibility helper", "function nativeWhisperRunAccessibilityLabel(isRunning: boolean)"),
            ("native llama run accessibility helper", "function nativeLlamaRunAccessibilityLabel(isRunning: boolean)"),
            ("native benchmark accessibility helper", "function nativeBenchmarkAccessibilityLabel(isRunning: boolean)"),
            ("profile settings option handler", "function selectSettingsProfileChoice(profileId: string)"),
            ("llm model settings option handler", "function selectSettingsLlmModelChoice(modelId: string)"),
            ("stt model settings option handler", "function selectSettingsSttModelChoice(modelId: string)"),
            ("profile settings display item helper", "function settingsProfileChoiceDisplayItem(profile: Profile)"),
            ("model settings display item helper", 'function settingsModelChoiceDisplayItem(model: AiModelOption, kind: "LLM" | "STT")'),
            ("llm model settings display items", "const llmModelChoiceDisplayItems = useMemo("),
            ("stt model settings display items", "const sttModelChoiceDisplayItems = useMemo("),
            ("profile settings option accessibility label", "`選擇照護對象：${label}；只切換本機 active profile，不寫入個資`"),
            ("model settings option accessibility label", "`選擇${kind}模型：${label}；未啟用模型不可選，雲端 fallback 預設停用`"),
            ("profile settings option press handler", "function pressSettingsProfileChoice(profile: (typeof profileChoiceDisplayItems)[number])"),
            ("llm model settings option press handler", "function pressSettingsLlmModelChoice(model: (typeof llmModelChoiceDisplayItems)[number])"),
            ("stt model settings option press handler", "function pressSettingsSttModelChoice(model: (typeof sttModelChoiceDisplayItems)[number])"),
            ("native whisper download option handler", "function selectWhisperNativeDownloadKind()"),
            ("native llama download option handler", "function selectLlamaNativeDownloadKind()"),
            ("native model URL input handler", "function updateNativeModelUrlInput(value: string)"),
            ("native whisper path input handler", "function updateWhisperModelPathInput(value: string)"),
            ("native audio path input handler", "function updateNativeAudioPathInput(value: string)"),
            ("native llama path input handler", "function updateLlamaModelPathInput(value: string)"),
            ("native module check settings handler", "function checkNativeModulesFromSettings()"),
            ("native model download settings handler", "function downloadNativeModelFromSettings()"),
            ("native whisper settings handler", "function runNativeWhisperFromSettings()"),
            ("native llama settings handler", "function runNativeLlamaFromSettings()"),
            ("native benchmarks settings handler", "function runNativeBenchmarksFromSettings()"),
            ("settings local clear binding", "onPress={clearLocalSessionFromSettings}"),
            ("auth provider preview press binding", "onPress={() => pressAuthProviderPreview(item)}"),
            ("auth provider accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("auth provider disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth refresh binding", "onPress={refreshAuthSessionFromSecurity}"),
            ("auth sessions load binding", "onPress={loadAuthSessionsFromSecurity}"),
            ("auth logout binding", "onPress={logoutAuthSessionFromSecurity}"),
            ("auth logout all binding", "onPress={logoutAllAuthSessionsFromSecurity}"),
            ("auth refresh accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.refreshSessionAccessibility}"),
            ("auth load sessions accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.loadSessionsAccessibility}"),
            ("auth logout local accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.logoutLocalAccessibility}"),
            ("auth logout all accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.logoutAllAccessibility}"),
            ("settings local clear accessibility binding", "accessibilityLabel={settingsSubscriptionDisplayLabels.localClearAccessibility}"),
            ("auth secondary action disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth danger action disabled state", "accessibilityState={{ disabled: isAuthOperationInFlight }}"),
            ("auth session management preview press binding", "onPress={() => pressAuthSessionManagementPreview(item)}"),
            ("auth session management button role", 'accessibilityRole="button"\n                  style={styles.aiReviewCard}'),
            ("profile edit integration status binding", "onPress={showProfileEditIntegrationStatus}"),
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
            ("profile settings option accessibility binding", "accessibilityLabel={profile.accessibilityLabel}"),
            ("llm model settings option accessibility binding", "accessibilityLabel={model.accessibilityLabel}"),
            ("settings option button role", 'accessibilityRole="button"'),
            ("profile settings option state binding", "accessibilityState={{ disabled: isAnyRequestInFlight, selected: profile.sourceId === activeProfileId }}"),
            ("llm model settings option state binding", "accessibilityState={{ disabled: modelDisabled, selected: model.sourceId === llmModelId }}"),
            ("stt model settings option state binding", "accessibilityState={{ disabled: modelDisabled, selected: model.sourceId === sttModelId }}"),
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
            ("community posting status handler", "function showCommunityPostingStatus()"),
            ("community privacy status handler", "function showCommunityPrivacyStatus()"),
            ("community privacy backend-aware status copy", "公開名稱與排行榜 opt-in 已可同步 backend；社群貼文、留言、刪除撤回與審核流程仍未開放。"),
            ("food community backend-aware intro copy", "backend ready 時同步真實分享，visual smoke 或 backend unavailable 時才顯示本機預覽。"),
            ("food community backend-aware empty copy", "backend ready 時會依搜尋同步，未連線時只篩選本機預覽。"),
            ("food community backend-aware share status copy", "backend ready 時可送出食物分享、建立社群點數並刷新排行榜與商城點數；visual smoke 或 backend unavailable 時不寫入資料。"),
            ("food community backend share mapping", "examples: (value.shares ?? []).slice(0, 3).map((share) => ({"),
            ("food community metric summary", "metricSummary: boundDisplayText(\n      `${shareCount} 人分享，平均上升 ${averageRise} mg/dL`,"),
            ("food community share count detail label", "分享總人數"),
            ("food community average rise detail label", "平均上升血糖"),
            ("food community maximum rise detail label", "最高上升血糖"),
            ("food community minimum rise detail label", "最低上升血糖"),
            ("food community average rise unit", "{selectedFoodCommunityItem.averageRise} mg/dL"),
            ("food community maximum rise unit", "{selectedFoodCommunityItem.maximumRise} mg/dL"),
            ("food community minimum rise unit", "{selectedFoodCommunityItem.minimumRise} mg/dL"),
            ("food community individual share display items", "individualShareDisplayItems: value.examples.map(foodCommunityShareDisplayItem).slice(0, 3)"),
            ("food community individual share section label", "個別分享紀錄"),
            ("food community individual share render", "selectedFoodCommunityItem.individualShareDisplayItems.map((share) =>"),
            ("food community individual share empty state", "尚未有可顯示的個別分享紀錄。"),
            ("food community detail sync function", "async function loadFoodCommunityDetail(itemId: string)"),
            ("food community detail endpoint", "`/community/foods/${boundedItemId}`"),
            ("food community detail list refresh", "void loadFoodCommunityDetail(nextItems[0].id);"),
            ("food community detail selected refresh", "void loadFoodCommunityDetail(boundedItemId);"),
            ("food community detail in-flight guard", "foodCommunityDetailInFlightKeys.current.has(detailKey)"),
            ("food community category api type", "type FoodCommunityApiCategoryRead = {"),
            ("food community backend category state", "const [foodCommunityBackendCategories, setFoodCommunityBackendCategories]"),
            ("food community backend category options", "foodCommunityBackendCategories.length > 0 ? foodCommunityBackendCategories : foodCommunityCategories"),
            ("food community category sync function", "async function loadFoodCommunityCategories()"),
            ("food community category endpoint", '"/community/foods/categories"'),
            ("food community category open sync", "void loadFoodCommunityCategories();"),
            ("food community search bypasses category filter", "const matchesCategory = query.length > 0 || item.category === foodCommunityCategory;"),
            ("food community backend search query variable", "const searchQuery = foodCommunitySearchText.trim();"),
            ("food community backend search all categories", 'const category = searchQuery ? "" : apiFoodCategoryFromMobile(foodCommunityCategory);'),
            ("food community backend category only without search", 'if (category) {\n      query.set("category", category);\n    }'),
            ("food community backend all categories cache key", 'category || "all-categories"'),
            ("food community share food name field", "foodName: string;"),
            ("food community share calculated rise row", '"血糖上升值"'),
            ("food community share calculated rise expression", "Number(foodCommunityShareFields.afterGlucose) - Number(foodCommunityShareFields.beforeGlucose)"),
            ("food community share auto-calculation fallback", '"系統自動計算"'),
            ("food community share bounded button label", 'const foodCommunityShareButtonDisplayLabel = boundDisplayText("送出食物分享", maxDisplayTextLength);'),
            ("food community share bounded accessibility label", "const foodCommunityShareAccessibilityDisplayLabel = boundDisplayText(\n    `${foodCommunityShareButtonDisplayLabel}，backend 會計算升糖幅度並建立社群點數`,\n    maxDisplayDetailTextLength\n  );"),
            ("food community share food name updater", "function updateFoodCommunityFoodName(value: string)"),
            ("food community share food name input", 'accessibilityLabel="輸入食物名稱"'),
            ("food community share food name binding", "onChangeText={updateFoodCommunityFoodName}"),
            ("food community share food name payload", "food_name: foodName"),
            ("food community share before glucose payload", "before_glucose: beforeGlucose"),
            ("food community share after glucose payload", "after_glucose: afterGlucose"),
            ("food community share food name validation", "請輸入食物名稱後再送出分享。"),
            ("food community search input handler", "function updateFoodCommunitySearchInput(value: string)"),
            ("food community category select handler", "function selectFoodCommunityCategory(category: FoodCommunityCategory)"),
            ("food community category press handler", "function pressFoodCommunityCategoryOption(category: ReturnType<typeof foodCommunityCategoryDisplayItem>)"),
            ("food community item press handler", "function pressFoodCommunityItem(item: ReturnType<typeof foodCommunityItemDisplayItem>)"),
            ("food community share status handler", "function showFoodCommunityShareStatus()"),
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
            ("ranking public status binding", "onPress={showRankingPublicStatus}"),
            ("ranking opt-in status binding", "onPress={showRankingOptInStatus}"),
            ("doctor token accessibility label", "doctorTokenAccessibility: boundDisplayText(`${doctorTokenButton}，只顯示授權碼與 share token 邊界`, maxDisplayDetailTextLength)"),
            ("doctor report accessibility label", "doctorReportAccessibility: boundDisplayText(`${doctorReportButton}，只顯示報表與醫師端唯讀邊界`, maxDisplayDetailTextLength)"),
            ("health permission accessibility label", "healthPermissionAccessibility: boundDisplayText(`${healthPermissionButton}，不請求平台權限或讀取健康資料`, maxDisplayDetailTextLength)"),
            ("health meter accessibility label", "healthMeterAccessibility: boundDisplayText(`${healthMeterButton}，不掃描血糖機或寫入紀錄`, maxDisplayDetailTextLength)"),
            ("community post accessibility label", "communityPostAccessibility: boundDisplayText(`${communityPostButton}，不建立貼文或公開紀錄`, maxDisplayDetailTextLength)"),
            ("community privacy accessibility label", "communityPrivacyAccessibility: boundDisplayText(`${communityPrivacyButton}，只顯示公開資料邊界`, maxDisplayDetailTextLength)"),
            ("ranking public accessibility label", "rankingPublicAccessibility: boundDisplayText(`${rankingPublicButton}，只讀取 opt-in 公開榜單，不公開健康數值`, maxDisplayDetailTextLength)"),
            ("ranking opt-in dynamic button label", "const rankingOptInButtonDisplayLabel = boundDisplayText("),
            ("ranking opt-in dynamic accessibility label", "const rankingOptInAccessibilityDisplayLabel = boundDisplayText("),
            ("ranking opt-in backend settings accessibility copy", "更新 backend 公開排名設定且不公開健康數值"),
            ("future preview return accessibility label", "returnFutureModulesAccessibility: boundDisplayText(\"返回未來擴充，不建立 future module 資料或呼叫 backend\", maxDisplayDetailTextLength)"),
            ("doctor token accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.doctorTokenAccessibility}"),
            ("doctor report accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.doctorReportAccessibility}"),
            ("health permission accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.healthPermissionAccessibility}"),
            ("health meter accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.healthMeterAccessibility}"),
            ("community post accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.communityPostAccessibility}"),
            ("community privacy accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.communityPrivacyAccessibility}"),
            ("food community search accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.foodCommunitySearchInputAccessibility}"),
            ("food community category accessibility binding", "accessibilityLabel={category.accessibilityLabel}"),
            ("food community item accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("food community selected state", "accessibilityState={{ selected: selectedFoodCommunityItem?.id === item.id }}"),
            ("food community share fields", "foodCommunityShareFieldRows.map"),
            ("food community point rows", "foodCommunityPointRows.map"),
            ("food community ranking rows", "foodCommunityRankingRows.map"),
            ("ranking backend sync function", "async function loadCommunityLeaderboards()"),
            ("ranking backend endpoint", "`/community/leaderboards?${query.toString()}`"),
            ("ranking share count type", '"share_count"'),
            ("ranking contribution type", '"contribution"'),
            ("ranking food tester type", '"food_tester"'),
            ("ranking display sections state", "const [rankingLeaderboardSections, setRankingLeaderboardSections]"),
            ("ranking display section helper", "function communityLeaderboardDisplaySection(value: CommunityLeaderboardApiResponse)"),
            ("ranking section render", "rankingLeaderboardSections.map((section) =>"),
            ("ranking entry render", "section.entries.map((entry) =>"),
            ("ranking public status loads backend", "void loadCommunityLeaderboards();"),
            ("ranking public accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.rankingPublicAccessibility}"),
            ("ranking opt-in dynamic accessibility binding", "accessibilityLabel={rankingOptInAccessibilityDisplayLabel}"),
            ("ranking opt-in dynamic button binding", "{rankingOptInButtonDisplayLabel}"),
            ("future preview return accessibility binding", "accessibilityLabel={futurePreviewDisplayLabels.returnFutureModulesAccessibility}"),
            ("future preview secondary CTA button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
        ):
            _assert_contains(label, content, marker)
        _assert_not_contains(
            "food community stale inline share accessibility label",
            content,
            'accessibilityLabel="送出食物分享，backend 會計算升糖幅度並建立社群點數"',
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
            'if (!product.id) {\n      setStoreActionStatus(boundUiMessage("商城兌換項目識別無效；目前不送出兌換。"));\n      return;\n    }',
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
            'if (!redemption.id) {\n      setStoreActionStatus(boundUiMessage("兌換券識別無效；目前不更新兌換券狀態。"));\n      return;\n    }',
        )
        for label, marker in (
            ("food community stale no-backend empty copy", "目前不查詢 backend"),
            ("food community stale local-preview-only intro copy", "目前為本機預覽，不取代理論資料或醫療建議。"),
            ("food community stale disabled share status copy", "食物分享尚未啟用；目前不寫入食物資料庫、不建立積分、不更新排行榜，也不串接商城兌換。"),
            ("store stale no-issue boundary copy", "但仍不發券、不建立出貨訂單，也不處理付款"),
            ("store stale redeemable reservation-only copy", "可用社群點數建立兌換 reservation；實際發券、出貨或 entitlement 仍需後續 fulfillment。"),
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
            ("direct profile settings option binding", "onPress={() => selectActiveProfileFromSettings(profile.sourceId)}"),
            ("direct llm model settings option binding", "onPress={() => selectLlmModelFromSettings(model.id)}"),
            ("direct stt model settings option binding", "onPress={() => selectSttModelFromSettings(model.id)}"),
            ("direct profile settings source binding", "onPress={() => selectSettingsProfileChoice(profile.sourceId)}"),
            ("direct llm model settings id binding", "onPress={() => selectSettingsLlmModelChoice(model.id)}"),
            ("direct stt model settings id binding", "onPress={() => selectSettingsSttModelChoice(model.id)}"),
            ("direct native whisper download kind binding", 'onPress={() => selectNativeDownloadKind("whisper")}'),
            ("direct native llama download kind binding", 'onPress={() => selectNativeDownloadKind("llama")}'),
            ("direct auth provider preview binding", "onPress={() => startAuthProviderChallenge(item.provider)}"),
            ("direct auth session management status binding", "onPress={() => showAuthSessionManagementStatus(item.actionStatus)}"),
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
            ("future module destination handler", "function openFutureModuleDestination(target: AppScreen | undefined, module: FutureModuleCard)"),
            ("future module destination press handler", "function pressFutureModuleDestination(item: ReturnType<typeof futureModuleCardDisplayItem>)"),
            ("future module card accessibility item", "accessibilityLabel: boundDisplayText(`查看${futureModuleText(value.title, \"未來模組\", maxDisplayTextLength)}整合狀態`, maxDisplayTextLength)"),
            ("future module card accessibility binding", "accessibilityLabel={item.accessibilityLabel}"),
            ("future module card button role", 'accessibilityRole="button"\n                  style={styles.recordCard}'),
            ("doctor share return handler", "function returnFromDoctorSharePreview()"),
            ("health integration return handler", "function returnFromHealthIntegrationPreview()"),
            ("community return handler", "function returnFromCommunityPreview()"),
            ("ranking return handler", "function returnFromRankingPreview()"),
            ("achievements return handler", "function returnFromAchievements()"),
            ("year review return handler", "function returnFromYearReview()"),
            ("store cart open handler", "function openStoreCart()"),
            ("store return handler", "function returnFromStore()"),
            ("store cart return store handler", "function returnFromStoreCartToStore()"),
            ("food photo return handler", "function returnFromFoodPhoto()"),
            ("achievement integration status handler", "function showAchievementIntegrationStatus()"),
            ("year review share status handler", "function showYearReviewShareStatus()"),
            ("store search input handler", "function updateStoreSearchInput(value: string)"),
            ("store category select handler", "function selectStoreCategory(category: StoreCategory)"),
            ("store category option press handler", "function pressStoreCategoryOption(category: ReturnType<typeof storeCategoryDisplayItem>)"),
            ("store product status handler", "function showStoreProductStatus(actionStatus: string)"),
            ("store product status press handler", "function pressStoreProductStatus(product: ReturnType<typeof storeProductDisplayItem>)"),
            ("store redemption status press handler", "function pressStoreRedemptionStatus(redemption: ReturnType<typeof storeRedemptionDisplayItem>)"),
            ("store redeemable fulfillment helper", "function storeRedeemableFulfillmentCopy(category: StoreCategory): string"),
            ("store immediate coupon discount code copy", "送出後 backend 會扣點並立即發出優惠券或折扣碼。"),
            ("store reservation fulfillment copy", "送出後 backend 會扣點並建立兌換 reservation，後續仍需 fulfillment。"),
            ("store backend-aware boundary copy", "優惠券與保健食品折扣可立即發碼，合作商品與會員福利仍需後續 fulfillment"),
            ("store backend-aware local boundary copy", "商城目前可同步點數、發出優惠券 / 折扣碼並建立兌換紀錄"),
            ("store catalog sync function", "async function loadStoreCatalogAndPoints()"),
            ("store rewards endpoint", 'requestJson<StoreApiReward[]>(normalizedApiBaseUrl, "/store/rewards"'),
            ("store points endpoint", 'requestJson<StoreApiPointsBalance>(normalizedApiBaseUrl, "/store/points"'),
            ("store redemptions endpoint", 'requestJson<StoreApiRedemption[]>(normalizedApiBaseUrl, "/store/redemptions?limit=20"'),
            ("store points balance boundary row", '"點數餘額"'),
            ("store redemption post endpoint", '"/store/redemptions"'),
            ("store redemption reward payload", "body: JSON.stringify({ reward_code: product.id })"),
            ("store redemption use endpoint", "`/store/redemptions/${redemption.id}/use`"),
            ("store redemption wallet label", "我的兌換券"),
            ("store redemption wallet render", "storeRedemptionDisplayItems.map((product) =>"),
            ("store redemption action binding", "onPress={() => pressStoreRedemptionStatus(product)}"),
            ("store redemption usable issued status", 'status === "issued" &&'),
            ("store redemption usable code required", "Boolean(code) &&"),
            ("store redemption usable coupon types", '(value.fulfillment_type === "coupon" || value.fulfillment_type === "discount_code") &&'),
            ("store redemption usable unused only", "!value.used_at;"),
            ("store redemption disabled state", "accessibilityState={{ disabled: !product.isUsable }}"),
            ("store coupon redemption category", '{ id: "coupons", label: "優惠券" }'),
            ("store supplement discount category", '{ id: "supplementDiscounts", label: "保健食品折扣" }'),
            ("store partner product category", '{ id: "partnerProducts", label: "合作商品" }'),
            ("store special badge category", '{ id: "specialBadges", label: "特殊徽章" }'),
            ("store member benefit category", '{ id: "memberBenefits", label: "特殊會員福利" }'),
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
            ("store backend special badge mapping", 'if (value === "special_badges")'),
            ("store special badge product", 'id: "annual_member_badge"'),
            ("store special badge redemption boundary", "優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利"),
            ("store points cost field", "pointsCost: boundDisplayText(value.pointsCost || \"點數未設定\", 40)"),
            ("store redemption boundary rows", "storeRedemptionBoundaryRows.map"),
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
            ("ranking return binding", "onPress={returnFromRankingPreview}"),
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
            ("achievement integration accessibility helper", "function achievementIntegrationButtonAccessibilityLabel()"),
            ("achievement sync unlock button label", 'return boundDisplayText("同步徽章解鎖", maxDisplayTextLength);'),
            ("achievement sync unlock accessibility copy", "同步成就徽章解鎖紀錄，不更新排行榜或公開資料"),
            ("year review share accessibility helper", "function yearReviewShareButtonAccessibilityLabel()"),
            ("store cart accessibility helper", "function storeCartButtonAccessibilityLabel()"),
            ("food photo integration accessibility helper", "function foodPhotoIntegrationButtonAccessibilityLabel()"),
            ("food photo retake accessibility helper", "function foodPhotoRetakeButtonAccessibilityLabel()"),
            ("achievement integration accessibility binding", "accessibilityLabel={achievementIntegrationAccessibilityDisplayLabel}"),
            ("achievement levels", "const achievementLevels = [10, 50, 100, 150, 200, 250];"),
            ("achievement categories", "const achievementCategoryDefinitions: Array<{"),
            ("achievement newly unlocked state", "const [achievementNewlyUnlockedItems, setAchievementNewlyUnlockedItems] = useState<AchievementItem[]>([])"),
            ("achievement newly unlocked display items", "const achievementNewlyUnlockedDisplayItems = useMemo("),
            ("achievement newly unlocked filter", "mappedSummaryItems.filter((item) => item.newlyUnlocked)"),
            ("achievement newly unlocked section", "本次新解鎖"),
            ("achievement unlocked history endpoint", "`/achievements/unlocks?${query.toString()}`"),
            ("achievement sync endpoint", "syncUnlocks ? `/achievements/sync?${query.toString()}` : `/achievements/summary?${query.toString()}`"),
            ("achievement sync method post", 'method: syncUnlocks ? "POST" : "GET"'),
            ("achievement sync handler passes true", "void loadAchievementSummary(true);"),
            ("achievement category sections", "achievementCategoryDisplaySections.map"),
            ("achievement section item render", "section.items.map"),
            ("achievement streak style", "displayItem.kind === \"streak\" ? styles.achievementBadgeStreak : null"),
            ("achievement badge level render", "{displayItem.level}"),
            ("achievement accessibility binding", "accessibilityLabel={displayItem.accessibilityLabel}"),
            ("achievement target lower bound", "const target = Math.max(1, boundAchievementProgress(value.target));"),
            ("achievement progress clamped to target", "const progress = Math.min(target, boundAchievementProgress(value.progress, target));"),
            ("achievement progress ratio bounded", "const progressRatio = Math.min(1, displayItem.progress / displayItem.target);"),
            ("year review target year helper", "function yearReviewTargetYear(value: Date)"),
            ("year review generation label helper", "function nextYearReviewGenerationLabel(value: Date)"),
            ("year review generation label copy", "return boundDisplayText(`${nextYear} 年 1 月 1 日自動產生前一年度回顧`, maxDisplayDetailTextLength);"),
            ("year review generation display value", "const yearReviewGenerationDisplayText = nextYearReviewGenerationLabel(new Date());"),
            ("year review live calculation uses generation label", "yearReviewLiveCalculationCopy(\n    yearReviewTargetDisplayYear,\n    yearReviewGenerationDisplayText\n  );"),
            ("year review annual stat rows", "yearlyReviewMetricRows.map"),
            ("year review annual record days", '["本年度總記錄天數",'),
            ("year review annual glucose count", '["本年度血糖記錄次數",'),
            ("year review annual meal count", '["本年度飲食記錄次數",'),
            ("year review annual exercise count", '["本年度運動記錄次數",'),
            ("year review annual longest streak", '["最長連續記錄天數",'),
            ("year review annual achieved badges", '["達成徽章數量",'),
            ("year review annual highest badge", '["解鎖最高等級徽章",'),
            ("year review health outcome rows", "yearlyHealthOutcomeRows.map"),
            ("year review average glucose outcome", '["年平均血糖",'),
            ("year review highest glucose outcome", '["年度最高血糖",'),
            ("year review lowest glucose outcome", '["年度最低血糖",'),
            ("year review AI observation", "yearlyAiObservationDisplayText"),
            ("year review AI encouragement", "yearlyAiEncouragementDisplayText"),
            ("year review backend-aware preview boundary", "backend ready 時可同步保存 snapshot，並準備 privacy-masked 年度分享 package。"),
            ("year review backend-aware share fallback", "backend ready 時可準備隱私遮罩分享卡並開啟原生分享。"),
            ("year review backend-aware badge material", "年度分享卡使用 backend 隱私遮罩摘要。"),
            ("year review share accessibility binding", "accessibilityLabel={yearReviewShareAccessibilityDisplayLabel}"),
            ("year review native share import", "Share,"),
            ("year review share asset endpoint", "`/year-reviews/${targetYear}/share-card/asset?${query.toString()}`"),
            ("year review share confirm endpoint", "`/year-reviews/${targetYear}/share-card/confirm?${query.toString()}`"),
            ("year review privacy acknowledgement payload", "body: JSON.stringify({ privacy_acknowledged: true })"),
            ("year review bounded share package id", "const confirmedSharePackageId = boundIdentifier(sharePackage.share_package_id);"),
            ("year review invalid share package guard", 'throw new Error("invalid_year_review_share_package_id");'),
            ("year review native share call", "const shareResult = await Share.share({"),
            ("year review bounded share text", "message: boundDisplayText(sharePackage.share_text, maxDisplayDetailTextLength)"),
            ("year review share result mapping", 'const shareResultKind = shareResult.action === Share.sharedAction ? "opened" : "dismissed";'),
            ("year review share result endpoint", "`/year-reviews/share-packages/${confirmedSharePackageId}/result`"),
            ("year review share result payload", "body: JSON.stringify({ share_result: shareResultKind })"),
            ("year review reported package id bounded state", "setYearReviewSharePackageId(boundIdentifier(reportedPackage.share_package_id) || confirmedSharePackageId);"),
            ("year review fallback package id bounded state", "setYearReviewSharePackageId(confirmedSharePackageId);"),
            ("year review revoke handler", "function revokeYearReviewShareStatus()"),
            ("year review revoke bounded package id", "const targetSharePackageId = boundIdentifier(yearReviewSharePackageId);"),
            ("year review invalid revoke package guard", "年度分享 package 識別無效；已清除本機撤回狀態。"),
            ("year review revoke endpoint", "`/year-reviews/share-packages/${targetSharePackageId}/revoke`"),
            ("store product button role", 'accessibilityRole="button"\n                  style={styles.roundActionButton}'),
            ("store cart accessibility binding", "accessibilityLabel={storeCartButtonAccessibilityDisplayLabel}"),
            ("food photo upload button role", 'accessibilityRole="button"\n              style={styles.uploadBox}'),
            ("food photo integration accessibility binding", "accessibilityLabel={foodPhotoIntegrationAccessibilityDisplayLabel}"),
            ("food photo retake accessibility binding", "accessibilityLabel={foodPhotoRetakeAccessibilityDisplayLabel}"),
            ("future commerce primary CTA button role", 'accessibilityRole="button"\n              style={styles.primaryButtonFull}'),
            ("future commerce secondary CTA button role", 'accessibilityRole="button"\n              style={styles.secondaryButton}'),
            ("future commerce action row CTA button role", 'accessibilityRole="button"\n                style={styles.secondaryButton}'),
            ("achievements return accessibility label", 'achievementsReturnAccessibility: boundDisplayText("返回上一個功能入口，不寫入成就資料", maxDisplayDetailTextLength)'),
            ("year review return accessibility label", 'yearReviewReturnAccessibility: boundDisplayText("返回上一個功能入口，不產生分享圖或公開資料", maxDisplayDetailTextLength)'),
            ("store return accessibility label", 'storeReturnAccessibility: boundDisplayText("返回上一個功能入口，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("store cart checkout accessibility label", 'storeCartCheckoutAccessibility: boundDisplayText("結帳尚未開放，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("store cart return accessibility label", 'storeCartReturnAccessibility: boundDisplayText("返回商城預覽，不建立訂單或付款", maxDisplayDetailTextLength)'),
            ("food photo return accessibility label", 'foodPhotoReturnAccessibility: boundDisplayText("返回上一個功能入口，不讀取照片或呼叫 Vision", maxDisplayDetailTextLength)'),
            ("achievements return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.achievementsReturnAccessibility}"),
            ("year review return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.yearReviewReturnAccessibility}"),
            ("store return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeReturnAccessibility}"),
            ("store cart checkout accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeCartCheckoutAccessibility}"),
            ("store cart checkout disabled state", "accessibilityState={{ disabled: true }}"),
            ("store cart return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.storeCartReturnAccessibility}"),
            ("food photo return accessibility binding", "accessibilityLabel={auxiliaryDisplayLabels.foodPhotoReturnAccessibility}"),
        ):
            _assert_contains(label, content, marker)
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
            "store category direct selection binding",
            content,
            "onPress={() => selectStoreCategory(category.value)}",
        )
        _assert_not_contains(
            "store product direct status binding",
            content,
            "onPress={() => showStoreProductStatus(product.actionStatus)}",
        )
        _assert_not_contains(
            "future module direct destination binding",
            content,
            "onPress={() => openFutureModuleDestination(item.target, item.module)}",
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
            ("subscription management open handler", "function openSubscriptionManagementFromSubscription()"),
            ("subscription membership status handler", "function openMembershipStatusFromSubscription()"),
            ("subscription management sync handler", "function syncSubscriptionManagementStatus()"),
            ("subscription management return handler", "function returnFromSubscriptionManagementToSettings()"),
            ("subscription management payment handler", "function showSubscriptionManagementPaymentStatus()"),
            ("membership return subscription handler", "function returnFromMembershipStatusToSubscription()"),
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
            "minimal Home mic entry and Record quick-entry affordances, "
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
