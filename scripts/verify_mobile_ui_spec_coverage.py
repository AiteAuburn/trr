#!/usr/bin/env python3
"""Verify canonical UI spec screens are represented in the mobile app source."""

from __future__ import annotations

import re
import sys
import ast
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = REPO_ROOT / "mobile" / "App.tsx"
NAVIGATION_CONFIG_PATH = REPO_ROOT / "mobile" / "navigationConfig.ts"
SPEC_PATH = REPO_ROOT / "ai_context" / "UI_UX_SPEC.md"
HARNESS_PATH = REPO_ROOT / "scripts" / "generate_mobile_visual_smoke_harness.py"
EXPECTED_APP_SCREEN_COUNT = 41


@dataclass(frozen=True)
class SpecScreen:
    section: str
    heading: str
    screen: str
    markers: tuple[str, ...]


CANONICAL_SPEC_SCREENS = (
    SpecScreen("4.1", "首頁 / 今日紀錄", "today", ("homeMinimalSection", "homeMicButton")),
    SpecScreen("4.2", "歷史紀錄頁", "history", ("HistoryCalendarMonthPicker", "HistoryDailySummaryTable", "HistorySelectedDatePanel")),
    SpecScreen("4.3", "基本分析頁", "analysis", ("AnalysisRangeSelector", "rows={analysisMetricRows}")),
    SpecScreen("4.4", "會員方案選擇頁", "subscription", ("rows={subscriptionComparisonDisplayRows}", "subscriptionSyncButtonDisplayLabel")),
    SpecScreen("4.4.1", "訂閱管理頁", "subscriptionManagement", ("rows={subscriptionManagementDisplayRows}", "subscriptionManagementReadinessChecklistItems")),
    SpecScreen("4.5", "功能選單頁", "menu", ("menuDisplayItems.map", "styles.menuIconCenter")),
    SpecScreen("4.6", "設定頁", "settings", ("rows={settingsDisplayRows}", "developerSettingsBox")),
    SpecScreen("4.6.1", "帳號與登入安全頁", "accountSecurity", ("AuthProviderPreviewList", "SessionManagementPreviewList")),
    SpecScreen("4.6.2", "個人資料頁", "profileSettings", ("rows={profileSettingsBoundaryRows}", "profileReadinessChecklistItems")),
    SpecScreen("4.6.3", "錄音額度頁", "recordingQuotaSettings", ("rows={recordingQuotaBoundaryRows}", "quotaReadinessChecklistItems")),
    SpecScreen("4.6.4", "提醒設定頁", "reminderSettings", ("rows={reminderPreviewDisplayItems}", "reminderReadinessChecklistItems")),
    SpecScreen("4.6.5", "通知與隱私頁", "privacySettings", ("rows={privacyBoundaryRows}", "privacyReadinessChecklistItems")),
    SpecScreen("4.7", "記錄詳情頁", "recordDetail", ("selectedRecordDisplayItem", "RecordDetailInfoPanel")),
    SpecScreen("4.7.1", "刪除確認頁", "deleteConfirm", ("items={deleteConfirmChecklistItems}", "deleteSelectedRecord")),
    SpecScreen("4.8", "編輯記錄頁", "editRecord", ("updateSelectedRecord", "RecordEditFooterActions")),
    SpecScreen("4.8.1", "手動新增確認頁", "manualRecordConfirm", ("ManualRecordConfirmPreviewBlock", "ManualRecordConfirmFooterActions")),
    SpecScreen("4.9", "使用教學頁", "tutorial", ("tutorialDisplaySteps.map", "tutorialSafetyChecklistItems")),
    SpecScreen("4.10", "會員方案狀態頁", "membershipStatus", ("rows={membershipFeatureRows}", "membershipTrialHeroLabelDisplayText")),
    SpecScreen("4.11", "成就榜頁", "achievements", ("achievementCategoryDisplaySections.map", "achievementBadgeDisplaySummary")),
    SpecScreen(
        "4.12",
        "年度回顧頁",
        "yearReview",
        ("rows={yearlyReviewMetricRows}", "rows={yearlyHealthOutcomeRows}", "yearlyAiObservationDisplayText"),
    ),
    SpecScreen("4.13", "商城頁", "store", ("rows={storeRedemptionBoundaryRows}", "visibleStoreProducts")),
    SpecScreen("4.14", "食物拍照分析頁", "foodPhoto", ("items={foodPhotoReadinessChecklistItems}", "styles.uploadBox")),
    SpecScreen("4.14.1", "未來模組詳情頁", "futureModuleDetail", ("selectedFutureModuleDisplay", "futureModuleDetailBoundaryDisplayText")),
    SpecScreen("4.14.2", "醫師 / 醫院合作預覽頁", "doctorShare", ("items={doctorShareReadinessChecklistItems}", "doctorShareActionStatus")),
    SpecScreen("4.14.3", "HealthKit / Health Connect / 血糖機預覽頁", "healthIntegration", ("items={healthIntegrationReadinessChecklistItems}", "healthIntegrationActionStatus")),
    SpecScreen("4.14.4", "食物社群頁", "community", ("<SegmentSelector\n              options={foodCommunityCategoryDisplayOptions}", "rows={foodCommunityShareFieldRows}")),
    SpecScreen("4.14.5", "排行榜預覽頁", "ranking", ("rankingReadinessChecklistItems.map", "rankingActionStatus")),
    SpecScreen("4.15", "文字確認頁", "transcriptReview", ("items={transcriptReviewCostBoundaryChecklistItems}", "parseTranscript")),
    SpecScreen("4.16", "AI 整理確認頁", "aiReview", ("previewRecordDisplayItems.map", "rejectedPreviewDisplayItems.map")),
    SpecScreen("4.16.0", "AI 候選移除確認頁", "aiRemoveConfirm", ("removePreviewRecord", "items={aiCandidateRemoveChecklistItems}")),
    SpecScreen("4.16.1", "AI 儲存確認頁", "aiSaveConfirm", ("savePreviewRecords", "rows={aiSaveConfirmBoundaryRows}")),
    SpecScreen(
        "4.17",
        "每日紀錄頁（AI 整理完成頁）",
        "aiSaveConfirm",
        ("dailyRecordSectionItems.map", "todayTranscriptTitleDisplayText", "fixedSaveBar"),
    ),
    SpecScreen("4.16.2", "AI 儲存失敗頁", "aiSaveFailure", ("items={aiSaveFailureChecklistItems}", "openManualRecord")),
)

TOP_LEVEL_MENU_SCREENS = {
    "today",
    "history",
    "analysis",
    "settings",
}


def _match_block(content: str, pattern: str, name: str) -> str:
    match = re.search(pattern, content, flags=re.DOTALL | re.MULTILINE)
    if match is None:
        raise AssertionError(f"Could not find {name}.")
    return match.group(1)


def _screen_union(content: str) -> set[str]:
    block = _match_block(content, r"type AppScreen =([\s\S]*?);", "AppScreen union")
    return set(re.findall(r'\|\s+"([^"]+)"', block))


def _screen_chrome_keys(content: str) -> set[str]:
    block = _match_block(
        content,
        r"const screenChrome:[\s\S]*?= \{([\s\S]*?)\};\n\nconst menuScreens",
        "screenChrome",
    )
    return set(re.findall(r"^\s+([A-Za-z][A-Za-z0-9]*): \{", block, flags=re.MULTILINE))


def _menu_destinations(content: str) -> set[str]:
    block = _match_block(content, r"const menuScreens:[\s\S]*?= \[([\s\S]*?)\];", "menuScreens")
    return set(re.findall(r'id: "([^"]+)"', block))


def _primary_destinations(content: str) -> set[str]:
    block = _match_block(content, r"const primaryScreens:[\s\S]*?= \[([\s\S]*?)\];", "primaryScreens")
    return set(re.findall(r'id: "([^"]+)"', block))


def _visual_smoke_destinations(content: str) -> set[str]:
    block = _match_block(
        content,
        r"const visualSmokeRouteJumps:[\s\S]*?= \[([\s\S]*?)\];",
        "visualSmokeRouteJumps",
    )
    return set(re.findall(r'id: "([^"]+)"', block))


def _harness_destinations(content: str) -> set[str]:
    tree = ast.parse(content)
    routes: set[str] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        if not isinstance(node.func, ast.Name) or node.func.id != "RoutePreview":
            continue
        for keyword in node.keywords:
            if keyword.arg == "route" and isinstance(keyword.value, ast.Constant):
                if isinstance(keyword.value.value, str):
                    routes.add(keyword.value.value)
    return routes


def _spec_headings(content: str) -> set[tuple[str, str]]:
    return {
        (section, heading.strip())
        for section, heading in re.findall(r"^###\s+(4\.[0-9.]+)\s+(.+)$", content, flags=re.MULTILINE)
    }


def _assert_contains(name: str, haystack: str, needle: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"{name} missing expected marker: {needle}")


def verify(spec_content: str, app_content: str, navigation_content: str) -> str:
    spec_headings = _spec_headings(spec_content)
    app_screens = _screen_union(navigation_content)
    chrome_keys = _screen_chrome_keys(navigation_content)
    menu_destinations = _menu_destinations(navigation_content)
    primary_destinations = _primary_destinations(navigation_content)
    visual_smoke_destinations = _visual_smoke_destinations(navigation_content)
    harness_destinations = _harness_destinations(HARNESS_PATH.read_text(encoding="utf-8"))

    if len(app_screens) != EXPECTED_APP_SCREEN_COUNT:
        raise AssertionError(
            f"AppScreen union must contain {EXPECTED_APP_SCREEN_COUNT} screens, found {len(app_screens)}."
        )
    if chrome_keys != app_screens:
        raise AssertionError(
            "screenChrome keys must match AppScreen union: "
            f"missing={sorted(app_screens - chrome_keys)} extra={sorted(chrome_keys - app_screens)}"
        )
    if visual_smoke_destinations != app_screens:
        raise AssertionError(
            "visualSmokeRouteJumps must cover every AppScreen: "
            f"missing={sorted(app_screens - visual_smoke_destinations)} "
            f"extra={sorted(visual_smoke_destinations - app_screens)}"
        )
    if harness_destinations != app_screens:
        raise AssertionError(
            "static visual-smoke harness routes must cover every AppScreen: "
            f"missing={sorted(app_screens - harness_destinations)} "
            f"extra={sorted(harness_destinations - app_screens)}"
        )
    for screen in sorted(app_screens):
        _assert_contains("AppScreen render branch", app_content, f'currentScreen === "{screen}"')

    for item in CANONICAL_SPEC_SCREENS:
        if (item.section, item.heading) not in spec_headings:
            raise AssertionError(f"UI spec missing canonical heading {item.section} {item.heading}.")
        if item.screen not in app_screens:
            raise AssertionError(f"{item.section} {item.heading} missing AppScreen value {item.screen}.")
        _assert_contains(
            f"{item.section} {item.heading} render branch",
            app_content,
            f'currentScreen === "{item.screen}"',
        )
        for marker in item.markers:
            _assert_contains(f"{item.section} {item.heading}", app_content, marker)

    missing_menu = sorted(TOP_LEVEL_MENU_SCREENS - menu_destinations)
    if missing_menu:
        raise AssertionError("Top-level menu missing destinations: " + ", ".join(missing_menu))
    if primary_destinations != {"today", "record", "menu"}:
        raise AssertionError(
            "Primary tabs must only include Today, Record, and Menu; "
            f"found={sorted(primary_destinations)}"
        )

    extra_spec_sections = sorted(
        spec_headings - {(item.section, item.heading) for item in CANONICAL_SPEC_SCREENS}
    )
    if extra_spec_sections:
        detail = ", ".join(f"{section} {heading}" for section, heading in extra_spec_sections)
        raise AssertionError("UI spec has uncovered 4.x sections: " + detail)

    return (
        "Mobile UI spec coverage verified: "
        f"{len(CANONICAL_SPEC_SCREENS)} canonical 4.x screens, "
        f"{len(app_screens)} AppScreen routes, "
        f"{len(TOP_LEVEL_MENU_SCREENS)} top-level menu destinations, "
        "screenChrome/render/visual-smoke/harness markers aligned."
    )


def main() -> int:
    try:
        print(
            verify(
                SPEC_PATH.read_text(encoding="utf-8"),
                APP_PATH.read_text(encoding="utf-8"),
                NAVIGATION_CONFIG_PATH.read_text(encoding="utf-8"),
            )
        )
    except AssertionError as exc:
        print(f"Mobile UI spec coverage verification failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
