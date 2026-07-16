#!/usr/bin/env python3
"""Verify deterministic source-level evidence for mobile visual-smoke routes."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = REPO_ROOT / "mobile" / "App.tsx"
APP_RUNTIME_CONFIG_PATH = REPO_ROOT / "mobile" / "appRuntimeConfig.ts"
NAVIGATION_CONFIG_PATH = REPO_ROOT / "mobile" / "navigationConfig.ts"
VISUAL_SMOKE_FIXTURES_PATH = REPO_ROOT / "mobile" / "visualSmokeFixtures.ts"

VISUAL_SMOKE_ROUTES = {
    "today": [
        'currentScreen === "today"',
        "styles.homeMinimalSection",
        "styles.homeMicButton",
        "按住開始說話記錄",
    ],
    "record": [
        'currentScreen === "record"',
        "quickEntryModeDisplayItemsForRender.map",
        "styles.recordHoldButton",
    ],
    "transcriptReview": [
        'currentScreen === "transcriptReview"',
        "transcriptReviewCostBoundaryChecklistItems.map",
        "onSubmitPress={submitTranscriptParse}",
    ],
    "aiReview": [
        'currentScreen === "aiReview"',
        "previewRecordDisplayItems.map",
        "coreFlowDisplayLabels.enterSaveConfirm",
    ],
    "editPreviewRecord": [
        'currentScreen === "editPreviewRecord"',
        "previewRecordEditBoundaryDisplayText",
        "selectedPreviewRecordDisplayItem",
        "onApplyPress={savePreviewRecordEdit}",
    ],
    "aiRemoveConfirm": [
        'currentScreen === "aiRemoveConfirm"',
        "aiCandidateRemoveChecklistItems.map",
        "pendingPreviewRemoveDisplayItem",
        "onConfirmPress={confirmPreviewRecordRemove}",
    ],
    "aiSaveConfirm": [
        'currentScreen === "aiSaveConfirm"',
        "aiSaveConfirmBoundaryRows.map",
        "dailyRecordSectionItems.map",
        "aiSaveConfirmSummaryLabelDisplayText",
        "todayTranscriptTitleDisplayText",
    ],
    "aiSaveFailure": [
        'currentScreen === "aiSaveFailure"',
        "aiSaveFailureChecklistItems.map",
        "onBackPress={returnFromAiSaveFailureToAiReview}",
    ],
    "saveSuccess": [
        'currentScreen === "saveSuccess"',
        "saveSuccessBoundaryChecklistItems.map",
        "saveSuccessDestinationItems.map",
    ],
    "deleteSuccess": [
        'currentScreen === "deleteSuccess"',
        "deleteSuccessBoundaryChecklistItems.map",
        "deleteSuccessDestinationItems.map",
    ],
    "updateSuccess": [
        'currentScreen === "updateSuccess"',
        "updateSuccessBoundaryChecklistItems.map",
        "updateSuccessDestinationItems.map",
    ],
    "history": [
        'currentScreen === "history"',
        "HistoryCalendarMonthPicker",
        "HistoryDailySummaryTable",
        "HistorySelectedDatePanel",
        "selectedHistoryRawDisplayItems",
    ],
    "recordDetail": [
        'currentScreen === "recordDetail"',
        "RecordDetailInfoPanel",
        "selectedRecordDetailRows",
    ],
    "editRecord": [
        'currentScreen === "editRecord"',
        "RecordEditFooterActions",
        "onSubmitPress={submitRecordUpdate}",
    ],
    "deleteConfirm": [
        'currentScreen === "deleteConfirm"',
        "deleteConfirmChecklistItems.map",
        "onConfirmPress={submitRecordDelete}",
    ],
    "manualRecord": [
        'currentScreen === "manualRecord"',
        "ManualRecordHeaderIntro",
        "ManualRecordDateTimeFields",
        "ManualRecordTypeSelector",
        "ManualRecordGlucoseFields",
        "ManualRecordMealFields",
        "ManualRecordExerciseFields",
        "ManualRecordMedicationFields",
        "ManualRecordNoteFields",
        "ManualRecordCreatePreviewAction",
    ],
    "manualRecordConfirm": [
        'currentScreen === "manualRecordConfirm"',
        "ManualRecordConfirmPreviewBlock",
        "ManualRecordConfirmFooterActions",
        "onSubmitPress={submitManualRecordCreate}",
    ],
    "analysis": [
        'currentScreen === "analysis"',
        "AnalysisRangeSelector",
        "analysisCustomStart",
        "analysisMetricRows.map",
        "analysisChartPoints",
    ],
    "detailedReport": [
        'currentScreen === "detailedReport"',
        "detailedReportBoundaryRows.map",
        "detailedReportMetricRows.map",
        "detailedReportNoteItems.map",
    ],
    "subscription": [
        'currentScreen === "subscription"',
        "subscriptionComparisonDisplayRows.map",
        "subscriptionSyncButtonDisplayLabel",
    ],
    "subscriptionManagement": [
        'currentScreen === "subscriptionManagement"',
        "subscriptionManagementDisplayRows.map",
        "subscriptionManagementReadinessChecklistItems.map",
    ],
    "membershipStatus": [
        'currentScreen === "membershipStatus"',
        "membershipFeatureRows.map",
        "membershipTrialHeroLabelDisplayText",
    ],
    "settings": [
        'currentScreen === "settings"',
        "settingsDisplayRows.map",
        "styles.developerSettingsBox",
    ],
    "accountSecurity": [
        'currentScreen === "accountSecurity"',
        "authProviderDisplayItems.map",
        "sessionManagementDisplayItems.map",
    ],
    "profileSettings": [
        'currentScreen === "profileSettings"',
        "profileSettingsBoundaryRows.map",
        "profileReadinessChecklistItems.map",
    ],
    "recordingQuotaSettings": [
        'currentScreen === "recordingQuotaSettings"',
        "recordingQuotaBoundaryRows.map",
        "quotaReadinessChecklistItems.map",
    ],
    "reminderSettings": [
        'currentScreen === "reminderSettings"',
        "reminderPreviewDisplayItems.map",
        "reminderReadinessChecklistItems.map",
    ],
    "privacySettings": [
        'currentScreen === "privacySettings"',
        "privacyBoundaryRows.map",
        "privacyControlDisplayRows.map",
    ],
    "tutorial": [
        'currentScreen === "tutorial"',
        "tutorialDisplaySteps.map",
        "tutorialSafetyChecklistItems.map",
    ],
    "menu": [
        'currentScreen === "menu"',
        "menuDisplayItems.map",
        "visualSmokeRouteJumpDisplayItems.map",
    ],
    "futureModules": [
        'currentScreen === "futureModules"',
        "未來擴充",
        "futureModuleDisplayCards.map",
        "onPress={returnFromFutureModulesToMenu}",
        "onPress={() => pressFutureModuleDestination(item)}",
    ],
    "futureModuleDetail": [
        'currentScreen === "futureModuleDetail"',
        "selectedFutureModuleDisplay.title",
        "futureModuleDetailBoundaryDisplayText",
        "futurePreviewDisplayLabels.returnFutureModules",
    ],
    "doctorShare": [
        'currentScreen === "doctorShare"',
        "doctorShareReadinessChecklistItems.map",
        "doctorShareBoundaryRows.map",
        "onPress={returnFromDoctorSharePreview}",
    ],
    "healthIntegration": [
        'currentScreen === "healthIntegration"',
        "healthIntegrationReadinessChecklistItems.map",
        "healthIntegrationBoundaryRows.map",
        "onPress={returnFromHealthIntegrationPreview}",
    ],
    "community": [
        'currentScreen === "community"',
        "<SegmentSelector\n              options={foodCommunityCategoryDisplayOptions}",
        "visibleFoodCommunityItems.map",
        "foodCommunityShareFieldRows.map",
        "foodCommunityPointRows.map",
        "communityReadinessChecklistItems.map",
        "communityBoundaryRows.map",
        "onPress={returnFromCommunityPreview}",
    ],
    "ranking": [
        'currentScreen === "ranking"',
        "rankingReadinessChecklistItems.map",
        "rankingBoundaryRows.map",
        "onPress={rankingReturnFutureModulesPressTarget}",
    ],
    "achievements": [
        'currentScreen === "achievements"',
        "成就榜",
        "achievementNewlyUnlockedDisplayItems",
        "achievementCategoryDisplaySections.map",
        "achievementUnlockedCardLevel(displayItem)",
        "achievementsReturnButtonDisplayLabel",
        "onPress={returnFromAchievements}",
    ],
    "yearReview": [
        'currentScreen === "yearReview"',
        "年度回顧",
        "yearlyReviewMetricRows.map",
        "yearlyHealthOutcomeRows.map",
        "yearlyAiObservationDisplayText",
        "yearReviewReturnButtonDisplayLabel",
        "onPress={returnFromYearReview}",
    ],
    "store": [
        'currentScreen === "store"',
        "商城",
        "storeRedemptionBoundaryRows.map",
        "<SegmentSelector\n              options={storeCategoryDisplayOptions}",
        "visibleStoreProducts",
        "storeCartButtonDisplayLabel",
        "storeReturnButtonDisplayLabel",
        "onPress={openStoreCart}",
        "onPress={returnFromStore}",
    ],
    "storeCart": [
        'currentScreen === "storeCart"',
        "購物車",
        "storeCheckoutReadinessChecklistItems",
        "disabled",
        "storeCartReturnButtonDisplayLabel",
        "onPress={returnFromStoreCartToStore}",
    ],
    "foodPhoto": [
        'currentScreen === "foodPhoto"',
        "食物拍照分析",
        "styles.uploadBox",
        "foodPhotoReadinessChecklistItems",
        "foodPhotoReturnButtonDisplayLabel",
        "onPress={returnFromFoodPhoto}",
    ],
}

VISUAL_SMOKE_ROUTE_IDENTITIES = {
    "today": "按住開始說話記錄",
    "record": "快速記錄",
    "transcriptReview": "確認文字內容",
    "aiReview": "AI 整理確認",
    "editPreviewRecord": "修改整理結果",
    "aiRemoveConfirm": "aiRemoveConfirmTitleDisplayText",
    "aiSaveConfirm": "aiSaveConfirmTitleDisplayText",
    "aiSaveFailure": "儲存未完成",
    "saveSuccess": "coreFlowDisplayLabels.saveResult",
    "deleteSuccess": "刪除完成",
    "updateSuccess": "更新完成",
    "history": "歷史紀錄",
    "recordDetail": "記錄詳情",
    "editRecord": "編輯記錄",
    "deleteConfirm": "刪除確認",
    "manualRecord": "手動新增紀錄",
    "manualRecordConfirm": "確認手動紀錄",
    "analysis": "基本分析",
    "detailedReport": "詳細報告",
    "subscription": "會員方案",
    "subscriptionManagement": "訂閱管理",
    "membershipStatus": "會員方案狀態",
    "settings": "設定",
    "accountSecurity": "帳號與登入安全",
    "profileSettings": "個人資料",
    "recordingQuotaSettings": "錄音額度",
    "reminderSettings": "提醒設定",
    "privacySettings": "通知與隱私",
    "tutorial": "使用教學",
    "menu": "功能選單",
    "futureModules": "未來擴充",
    "futureModuleDetail": "selectedFutureModuleDisplay.title",
    "doctorShare": "醫師 / 醫院合作",
    "healthIntegration": "HealthKit / Health Connect / 血糖機",
    "community": "communityScreenTitleLabel()",
    "ranking": "rankingScreenTitleLabel()",
    "achievements": "成就榜",
    "yearReview": "年度回顧",
    "store": "商城",
    "storeCart": "購物車",
    "foodPhoto": "食物拍照分析",
}

FORBIDDEN_ROUTE_JUMP_TOKENS = {
    "apiFetch",
    "fetch(",
    "resetDevelopmentData",
    "requestJson",
    "parseTranscript",
    "submitParser",
    "savePreviewRecords",
    "createManualRecord",
    "updateSelectedRecord",
    "deleteSelectedRecord",
    "downloadNativeModel",
    "runNativeBenchmark",
    "runNativeWhisper",
    "runNativeLlama",
    "payment",
    "checkout",
}

ROUTES_WITH_RETURN_LABEL = {
    "achievements",
    "yearReview",
    "store",
    "foodPhoto",
}

ROUTES_WITHOUT_PAGE_SECTION_REQUIREMENT = {"today"}


def _extract_function(content: str, name: str) -> str:
    signature = f"function {name}"
    start = content.find(signature)
    if start < 0:
        raise AssertionError(f"Missing function {name}.")
    brace_start = content.find("{", start)
    if brace_start < 0:
        raise AssertionError(f"Missing function body for {name}.")
    depth = 0
    for index in range(brace_start, len(content)):
        char = content[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return content[start : index + 1]
    raise AssertionError(f"Unterminated function {name}.")


def _extract_branch(content: str, route: str) -> str:
    match = re.search(rf'\{{\s*currentScreen === "{re.escape(route)}"', content)
    if match is None:
        raise AssertionError(f"Missing render branch for {route}.")
    start = match.start()
    next_match = re.search(r'\n\s+\{currentScreen === "[^"]+"', content[start + 1 :])
    if next_match is None:
        end_marker = "\n      </ScrollView>"
        end = content.find(end_marker, start)
        if end < 0:
            raise AssertionError(f"Could not determine render branch end for {route}.")
        return content[start:end]
    return content[start : start + 1 + next_match.start()]


def _visual_smoke_route_ids(content: str) -> set[str]:
    match = re.search(
        r"const visualSmokeRouteJumps:[\s\S]*?= \[([\s\S]*?)\];",
        content,
        flags=re.MULTILINE,
    )
    if match is None:
        raise AssertionError("Missing visualSmokeRouteJumps list.")
    return set(re.findall(r'id: "([^"]+)"', match.group(1)))


def _assert_contains(name: str, haystack: str, needle: str) -> None:
    if needle not in haystack:
        raise AssertionError(f"{name} missing expected marker: {needle}")


def verify(
    content: str,
    app_runtime_config_content: str,
    navigation_content: str,
    visual_smoke_fixtures_content: str,
) -> dict[str, object]:
    route_ids = _visual_smoke_route_ids(navigation_content)
    expected_route_ids = set(VISUAL_SMOKE_ROUTES)
    if route_ids != expected_route_ids:
        raise AssertionError(
            "visualSmokeRouteJumps mismatch: "
            f"missing={sorted(expected_route_ids - route_ids)} "
            f"extra={sorted(route_ids - expected_route_ids)}"
        )
    identity_route_ids = set(VISUAL_SMOKE_ROUTE_IDENTITIES)
    if identity_route_ids != expected_route_ids:
        raise AssertionError(
            "VISUAL_SMOKE_ROUTE_IDENTITIES mismatch: "
            f"missing={sorted(expected_route_ids - identity_route_ids)} "
            f"extra={sorted(identity_route_ids - expected_route_ids)}"
        )

    _assert_contains(
        "visual smoke menu render gate",
        content,
        "{allowMobileDevAuth && enableDebugTools ? (",
    )
    _assert_contains(
        "visual smoke initial route env",
        app_runtime_config_content,
        "EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE",
    )
    _assert_contains(
        "visual smoke initial route debug gate",
        content,
        "if (!enableDebugTools || !allowMobileDevAuth)",
    )
    _assert_contains(
        "visual smoke initial route current screen",
        content,
        'useState<AppScreen>(initialVisualSmokeScreen ?? "today")',
    )
    _assert_contains(
        "visual smoke initial route skips backend boot",
        content,
        "if (initialVisualSmokeScreen)",
    )
    _assert_contains(
        "visual smoke initial route no boot side effect",
        navigation_content,
        "Visual smoke 本機路由預覽；已跳過 backend boot",
    )
    _assert_contains(
        "visual smoke initial route no boot helper binding",
        content,
        "const display = visualSmokeBootSkippedDisplayMessages();",
    )
    _assert_contains(
        "visual smoke deep link listener",
        content,
        'Linking.addEventListener("url"',
    )
    _assert_contains(
        "visual smoke deep link parser",
        content,
        "visualSmokeRouteFromDeepLinkUrl",
    )
    _assert_contains(
        "visual smoke deep link parser helper",
        navigation_content,
        "function visualSmokeRouteFromDeepLinkUrl(",
    )
    _assert_contains(
        "visual smoke deep link reuses route jump handler",
        content,
        "openVisualSmokeRoute(deepLinkRoute)",
    )
    _assert_contains(
        "visual smoke deep link route marker",
        navigation_content,
        'value.includes("visual-smoke")',
    )
    _assert_contains(
        "visual smoke preview active ref",
        content,
        "const visualSmokePreviewActive = useRef(Boolean(initialVisualSmokeScreen))",
    )
    _assert_contains(
        "visual smoke preview activator",
        content,
        "function activateVisualSmokePreview()",
    )
    _assert_contains(
        "visual smoke load records guard",
        content,
        "if (visualSmokePreviewActive.current)",
    )
    _assert_contains(
        "visual smoke record sync status",
        content,
        "visualSmokeRecordSyncStatusMessage",
    )
    _assert_contains(
        "visual smoke display records source",
        content,
        "const recordsForDisplay = useMemo",
    )
    _assert_contains(
        "visual smoke display records mode",
        content,
        "isVisualSmokePreviewMode ? visualSmokeDemoRecords() : records",
    )
    for label, marker in (
        ("visual smoke demo record fixture", "export function visualSmokeDemoRecord(): RecordItem"),
        ("visual smoke demo records fixture", "export function visualSmokeDemoRecords(): RecordItem[]"),
        ("visual smoke demo preview fixture", "export function visualSmokeDemoPreview(): ParsePreviewResponse"),
        ("visual smoke demo report fixture", "export function visualSmokeDemoReport(): BasicReportTransformSource"),
        ("visual smoke selected-record predicate", "export function visualSmokeNeedsSelectedRecord(screen: AppScreen | null)"),
    ):
        _assert_contains(label, visual_smoke_fixtures_content, marker)
    _assert_contains(
        "future module destination press wrapper",
        content,
        "function pressFutureModuleDestination(item: ReturnType<typeof futureModuleCardDisplayItem>)",
    )
    _assert_contains(
        "daily record fixed save dock outside scroll",
        content,
        "</ScrollView>\n      {isDailyRecordFixedSaveDockVisible ? (",
    )
    _assert_contains(
        "daily record fixed save dock submit binding",
        content,
        "onPress={submitAiSaveConfirm}",
    )

    route_jump_handler = _extract_function(content, "openVisualSmokeRoute")
    _assert_contains(
        "visual smoke route jump handler guard",
        route_jump_handler,
        "if (!enableDebugTools || !allowMobileDevAuth)",
    )
    _assert_contains(
        "visual smoke route jump activates preview guard",
        route_jump_handler,
        "activateVisualSmokePreview();",
    )
    for token in sorted(FORBIDDEN_ROUTE_JUMP_TOKENS):
        if token in route_jump_handler:
            raise AssertionError(
                f"visual smoke route jump handler must not call runtime side-effect token: {token}"
            )

    route_evidence: dict[str, list[str]] = {}
    for route, markers in VISUAL_SMOKE_ROUTES.items():
        branch = _extract_branch(content, route)
        _assert_contains(
            f"{route} visual identity marker",
            branch,
            VISUAL_SMOKE_ROUTE_IDENTITIES[route],
        )
        for marker in markers:
            _assert_contains(f"{route} render branch", branch, marker)
        if route not in ROUTES_WITHOUT_PAGE_SECTION_REQUIREMENT:
            _assert_contains(f"{route} render branch page section", branch, "styles.pageSection")
        if route in ROUTES_WITH_RETURN_LABEL:
            _assert_contains(f"{route} return CTA", branch, "ReturnButtonDisplayLabel")
        route_evidence[route] = markers

    return {
        "app": str(APP_PATH.relative_to(REPO_ROOT)),
        "routes": route_evidence,
        "route_identity_markers": VISUAL_SMOKE_ROUTE_IDENTITIES,
        "dev_gated": True,
        "side_effect_free_route_jump_handler": True,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--evidence",
        type=Path,
        help="Optional path for PHI-safe JSON evidence generated from source inspection.",
    )
    args = parser.parse_args()

    content = APP_PATH.read_text(encoding="utf-8")
    app_runtime_config_content = APP_RUNTIME_CONFIG_PATH.read_text(encoding="utf-8")
    navigation_content = NAVIGATION_CONFIG_PATH.read_text(encoding="utf-8")
    visual_smoke_fixtures_content = VISUAL_SMOKE_FIXTURES_PATH.read_text(encoding="utf-8")
    try:
      evidence = verify(content, app_runtime_config_content, navigation_content, visual_smoke_fixtures_content)
    except AssertionError as exc:
        print(f"Mobile visual-smoke route verification failed: {exc}", file=sys.stderr)
        return 1

    if args.evidence is not None:
        args.evidence.parent.mkdir(parents=True, exist_ok=True)
        args.evidence.write_text(
            json.dumps(evidence, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(
        "Mobile visual-smoke routes verified: "
        + ", ".join(sorted(VISUAL_SMOKE_ROUTES))
        + "; route identity markers and jumps are debug-gated and side-effect free."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
