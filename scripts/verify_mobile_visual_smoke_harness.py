#!/usr/bin/env python3
"""Verify the static mobile visual-smoke harness route and safety contract."""

from __future__ import annotations

import ast
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
HARNESS_PATH = REPO_ROOT / "scripts" / "generate_mobile_visual_smoke_harness.py"

REQUIRED_HARNESS_ROUTES = {
    "today",
    "record",
    "history",
    "analysis",
    "settings",
    "menu",
    "subscription",
    "transcriptReview",
    "aiReview",
    "editPreviewRecord",
    "aiRemoveConfirm",
    "aiSaveConfirm",
    "aiSaveFailure",
    "saveSuccess",
    "deleteSuccess",
    "updateSuccess",
    "recordDetail",
    "editRecord",
    "deleteConfirm",
    "manualRecord",
    "manualRecordConfirm",
    "detailedReport",
    "subscriptionManagement",
    "membershipStatus",
    "accountSecurity",
    "profileSettings",
    "recordingQuotaSettings",
    "reminderSettings",
    "privacySettings",
    "tutorial",
    "futureModules",
    "futureModuleDetail",
    "doctorShare",
    "healthIntegration",
    "community",
    "ranking",
    "achievements",
    "yearReview",
    "store",
    "storeCart",
    "foodPhoto",
}

EXPECTED_SECTION_COUNT = 3

REQUIRED_HARNESS_TITLES = {
    "today": "糖錄錄",
    "record": "快速記錄",
    "history": "歷史紀錄",
    "analysis": "基本分析",
    "detailedReport": "詳細報告",
    "settings": "設定",
    "menu": "功能選單",
    "subscription": "會員方案",
    "transcriptReview": "確認文字內容",
    "aiReview": "AI 整理確認",
    "editPreviewRecord": "修改整理結果",
    "aiRemoveConfirm": "移除候選紀錄",
    "aiSaveConfirm": "確認儲存",
    "aiSaveFailure": "儲存未完成",
    "saveSuccess": "儲存完成",
    "deleteSuccess": "刪除完成",
    "updateSuccess": "更新完成",
    "recordDetail": "記錄詳情",
    "editRecord": "編輯記錄",
    "deleteConfirm": "刪除確認",
    "manualRecord": "手動新增紀錄",
    "manualRecordConfirm": "確認手動紀錄",
    "subscriptionManagement": "訂閱管理",
    "membershipStatus": "會員方案狀態",
    "accountSecurity": "帳號與登入安全",
    "profileSettings": "個人資料",
    "recordingQuotaSettings": "錄音額度",
    "reminderSettings": "提醒設定",
    "privacySettings": "通知與隱私",
    "tutorial": "使用教學",
    "futureModules": "未來擴充",
    "futureModuleDetail": "未來模組詳情",
    "doctorShare": "醫師 / 醫院合作",
    "healthIntegration": "HealthKit / Health Connect / 血糖機",
    "community": "社群",
    "ranking": "排行榜",
    "achievements": "成就榜",
    "yearReview": "年度回顧",
    "store": "商城",
    "storeCart": "購物車",
    "foodPhoto": "食物拍照分析",
}

REQUIRED_HARNESS_CTAS = {
    "today": "按住錄音",
    "record": "整理紀錄",
    "history": "查看紀錄詳情",
    "analysis": "查看詳細報告",
    "detailedReport": "回基本分析",
    "settings": "返回功能選單",
    "menu": "查看更多功能",
    "subscription": "開始 7 天試用",
    "transcriptReview": "下一步整理",
    "aiReview": "進入儲存確認",
    "editPreviewRecord": "儲存候選修改",
    "aiRemoveConfirm": "確認移除",
    "aiSaveConfirm": "確認儲存",
    "aiSaveFailure": "回 AI 確認",
    "saveSuccess": "回今日紀錄",
    "deleteSuccess": "查看歷史",
    "updateSuccess": "查看詳情",
    "recordDetail": "編輯",
    "editRecord": "儲存修改",
    "deleteConfirm": "確認刪除",
    "manualRecord": "下一步確認",
    "manualRecordConfirm": "確認建立",
    "subscriptionManagement": "同步方案狀態",
    "membershipStatus": "管理方案",
    "accountSecurity": "返回設定",
    "profileSettings": "返回設定",
    "recordingQuotaSettings": "同步額度",
    "reminderSettings": "設定提醒",
    "privacySettings": "返回設定",
    "tutorial": "開始記錄",
    "futureModules": "返回功能選單",
    "futureModuleDetail": "返回未來擴充",
    "doctorShare": "查看授權狀態",
    "healthIntegration": "查看權限狀態",
    "community": "查看食物分享狀態",
    "ranking": "查看排名狀態",
    "achievements": "返回功能選單",
    "yearReview": "查看分享整合狀態",
    "store": "查看兌換整合狀態",
    "storeCart": "返回商城",
    "foodPhoto": "返回功能選單",
}

FORBIDDEN_IMPORTS = {"subprocess", "requests", "httpx", "urllib.request"}

FORBIDDEN_CALL_MARKERS = {
    "Popen(",
    "run(",
    "check_call(",
    "check_output(",
    "system(",
    "requests.",
    "httpx.",
    "urllib.request",
    "fetch(",
    "openai.",
}

REQUIRED_SAFETY_FLAGS = {
    "phi_safe_seeded_text_only",
    "backend_calls",
    "database_writes",
    "ai_llm_stt_vision_calls",
    "payment_calls",
    "production_credentials",
}


def _route_literals(tree: ast.AST) -> set[str]:
    routes: set[str] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Name) or func.id != "RoutePreview":
            continue
        for keyword in node.keywords:
            if keyword.arg == "route" and isinstance(keyword.value, ast.Constant):
                if isinstance(keyword.value.value, str):
                    routes.add(keyword.value.value)
    return routes


def _route_titles(tree: ast.AST) -> dict[str, str]:
    titles: dict[str, str] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Name) or func.id != "RoutePreview":
            continue
        values: dict[str, str] = {}
        for keyword in node.keywords:
            if keyword.arg not in {"route", "title"}:
                continue
            if isinstance(keyword.value, ast.Constant) and isinstance(keyword.value.value, str):
                values[keyword.arg] = keyword.value.value
        route = values.get("route")
        title = values.get("title")
        if route and title:
            titles[route] = title
    return titles


def _route_ctas(tree: ast.AST) -> dict[str, str]:
    ctas: dict[str, str] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Name) or func.id != "RoutePreview":
            continue
        values: dict[str, str] = {}
        for keyword in node.keywords:
            if keyword.arg not in {"route", "cta"}:
                continue
            if isinstance(keyword.value, ast.Constant) and isinstance(keyword.value.value, str):
                values[keyword.arg] = keyword.value.value
        route = values.get("route")
        cta = values.get("cta")
        if route and cta:
            ctas[route] = cta
    return ctas


def _route_section_counts(tree: ast.AST) -> dict[str, int]:
    section_counts: dict[str, int] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Name) or func.id != "RoutePreview":
            continue
        route: str | None = None
        section_count: int | None = None
        for keyword in node.keywords:
            if keyword.arg == "route" and isinstance(keyword.value, ast.Constant):
                if isinstance(keyword.value.value, str):
                    route = keyword.value.value
            elif keyword.arg == "sections" and isinstance(keyword.value, ast.Tuple):
                section_count = len(keyword.value.elts)
        if route and section_count is not None:
            section_counts[route] = section_count
    return section_counts


def _route_section_texts(tree: ast.AST) -> dict[str, list[tuple[str, str]]]:
    section_texts: dict[str, list[tuple[str, str]]] = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        if not isinstance(func, ast.Name) or func.id != "RoutePreview":
            continue
        route: str | None = None
        sections: list[tuple[str, str]] | None = None
        for keyword in node.keywords:
            if keyword.arg == "route" and isinstance(keyword.value, ast.Constant):
                if isinstance(keyword.value.value, str):
                    route = keyword.value.value
            elif keyword.arg == "sections" and isinstance(keyword.value, ast.Tuple):
                parsed_sections: list[tuple[str, str]] = []
                for section_node in keyword.value.elts:
                    if not isinstance(section_node, ast.Tuple) or len(section_node.elts) != 2:
                        continue
                    heading_node, copy_node = section_node.elts
                    if not (
                        isinstance(heading_node, ast.Constant)
                        and isinstance(heading_node.value, str)
                        and isinstance(copy_node, ast.Constant)
                        and isinstance(copy_node.value, str)
                    ):
                        continue
                    parsed_sections.append((heading_node.value, copy_node.value))
                sections = parsed_sections
        if route and sections is not None:
            section_texts[route] = sections
    return section_texts


def _string_literals(tree: ast.AST) -> set[str]:
    values: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            values.add(node.value)
    return values


def _import_names(tree: ast.AST) -> set[str]:
    names: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            names.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            names.add(node.module)
    return names


def main() -> int:
    source = HARNESS_PATH.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(HARNESS_PATH))

    errors: list[str] = []

    routes = _route_literals(tree)
    missing_routes = sorted(REQUIRED_HARNESS_ROUTES - routes)
    if missing_routes:
        errors.append("missing harness routes: " + ", ".join(missing_routes))

    extra_routes = sorted(routes - REQUIRED_HARNESS_ROUTES)
    if extra_routes:
        errors.append("unexpected harness routes: " + ", ".join(extra_routes))

    titles = _route_titles(tree)
    if set(titles) != REQUIRED_HARNESS_ROUTES:
        errors.append(
            "harness route title coverage mismatch: "
            f"missing={sorted(REQUIRED_HARNESS_ROUTES - set(titles))} "
            f"extra={sorted(set(titles) - REQUIRED_HARNESS_ROUTES)}"
        )
    for route, expected_title in sorted(REQUIRED_HARNESS_TITLES.items()):
        title = titles.get(route)
        if title != expected_title:
            errors.append(
                f"harness route title mismatch for {route}: "
                f"expected {expected_title!r}, got {title!r}"
            )

    ctas = _route_ctas(tree)
    if set(ctas) != REQUIRED_HARNESS_ROUTES:
        errors.append(
            "harness route CTA coverage mismatch: "
            f"missing={sorted(REQUIRED_HARNESS_ROUTES - set(ctas))} "
            f"extra={sorted(set(ctas) - REQUIRED_HARNESS_ROUTES)}"
        )
    for route, expected_cta in sorted(REQUIRED_HARNESS_CTAS.items()):
        cta = ctas.get(route)
        if cta != expected_cta:
            errors.append(
                f"harness route CTA mismatch for {route}: "
                f"expected {expected_cta!r}, got {cta!r}"
            )

    section_counts = _route_section_counts(tree)
    if set(section_counts) != REQUIRED_HARNESS_ROUTES:
        errors.append(
            "harness route section coverage mismatch: "
            f"missing={sorted(REQUIRED_HARNESS_ROUTES - set(section_counts))} "
            f"extra={sorted(set(section_counts) - REQUIRED_HARNESS_ROUTES)}"
        )
    for route, section_count in sorted(section_counts.items()):
        if section_count != EXPECTED_SECTION_COUNT:
            errors.append(
                f"harness route section count mismatch for {route}: "
                f"expected {EXPECTED_SECTION_COUNT}, got {section_count}"
            )

    section_texts = _route_section_texts(tree)
    if set(section_texts) != REQUIRED_HARNESS_ROUTES:
        errors.append(
            "harness route section text coverage mismatch: "
            f"missing={sorted(REQUIRED_HARNESS_ROUTES - set(section_texts))} "
            f"extra={sorted(set(section_texts) - REQUIRED_HARNESS_ROUTES)}"
        )
    for route, sections in sorted(section_texts.items()):
        if len(sections) != EXPECTED_SECTION_COUNT:
            errors.append(
                f"harness route section text count mismatch for {route}: "
                f"expected {EXPECTED_SECTION_COUNT}, got {len(sections)}"
            )
            continue
        for index, (heading, copy) in enumerate(sections, start=1):
            if not heading.strip():
                errors.append(f"harness route {route} section {index} heading is empty")
            if not copy.strip():
                errors.append(f"harness route {route} section {index} copy is empty")

    imports = _import_names(tree)
    forbidden_imports = sorted(name for name in imports if name in FORBIDDEN_IMPORTS)
    if forbidden_imports:
        errors.append("forbidden imports: " + ", ".join(forbidden_imports))

    for marker in sorted(FORBIDDEN_CALL_MARKERS):
        if marker in source:
            errors.append(f"forbidden executable marker present: {marker}")

    literals = _string_literals(tree)
    for flag in sorted(REQUIRED_SAFETY_FLAGS):
        if flag not in literals:
            errors.append(f"missing manifest safety flag: {flag}")

    required_safety_values = {
        '"backend_calls": False',
        '"database_writes": False',
        '"ai_llm_stt_vision_calls": False',
        '"payment_calls": False',
        '"production_credentials": False',
    }
    for marker in sorted(required_safety_values):
        if marker not in source:
            errors.append(f"missing false safety marker: {marker}")

    if "PIL static renderer" not in literals:
        errors.append("missing static renderer manifest marker")
    if "production" not in literals:
        errors.append("missing production manifest marker")

    if errors:
        for error in errors:
            print(f"Mobile visual-smoke harness verification failed: {error}", file=sys.stderr)
        return 1

    print(
        "Mobile visual-smoke harness verified: "
        f"{len(routes)} routes, aligned titles/CTAs, {EXPECTED_SECTION_COUNT} non-empty sections each, "
        "static renderer, PHI-safe fallback contract."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
