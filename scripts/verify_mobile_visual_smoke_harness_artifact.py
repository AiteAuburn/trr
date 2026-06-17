#!/usr/bin/env python3
"""Verify generated mobile visual-smoke harness PNG evidence."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

DEFAULT_OUTPUT_DIR = Path("/tmp/bloodsugar-mobile-visual-smoke/2026-06-02-t698-harness")

REQUIRED_ROUTES = {
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

EXPECTED_TITLES = {
    "today": "快速開始記錄",
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
    "community": "食物社群",
    "ranking": "社群排行",
    "achievements": "成就榜",
    "yearReview": "年度回顧",
    "store": "商城",
    "storeCart": "購物車",
    "foodPhoto": "食物拍照分析",
}

EXPECTED_CTAS = {
    "today": "查看分析",
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
    "community": "查看發文狀態",
    "ranking": "查看排名狀態",
    "achievements": "返回功能選單",
    "yearReview": "查看分享整合狀態",
    "store": "查看購物車整合狀態",
    "storeCart": "返回商城",
    "foodPhoto": "返回功能選單",
}

EXPECTED_SIZE = (390, 844)
EXPECTED_SECTION_COUNT = 3

REQUIRED_CHECKS = {
    "open background",
    "single-layer repeated cards",
    "visible title/subtitle",
    "visible CTA",
    "PHI-safe seeded text",
}

EXPECTED_SAFETY = {
    "phi_safe_seeded_text_only": True,
    "backend_calls": False,
    "database_writes": False,
    "ai_llm_stt_vision_calls": False,
    "payment_calls": False,
    "production_credentials": False,
}


def _unique_color_count(image: Image.Image) -> int:
    colors = image.convert("RGB").getcolors(maxcolors=image.width * image.height)
    return 0 if colors is None else len(colors)


def _image_is_nonblank(image: Image.Image) -> bool:
    extrema = image.convert("RGB").getextrema()
    return any(low != high for low, high in extrema) and _unique_color_count(image) >= 6


def verify(output_dir: Path) -> list[str]:
    errors: list[str] = []
    manifest_path = output_dir / "manifest.json"
    if not manifest_path.exists():
        return [f"missing manifest: {manifest_path}"]

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"invalid manifest JSON: {exc}"]

    if manifest.get("kind") != "mobile_visual_smoke_harness":
        errors.append("unexpected manifest kind")
    if manifest.get("production") is not False:
        errors.append("manifest production flag must be false")
    if manifest.get("runtime") != "PIL static renderer":
        errors.append("manifest runtime must be PIL static renderer")
    if manifest.get("safety") != EXPECTED_SAFETY:
        errors.append("manifest safety flags do not match expected PHI-safe contract")

    route_entries = manifest.get("routes")
    if not isinstance(route_entries, list):
        return errors + ["manifest routes must be a list"]

    routes = {entry.get("route") for entry in route_entries if isinstance(entry, dict)}
    missing_routes = sorted(REQUIRED_ROUTES - routes)
    if missing_routes:
        errors.append("missing artifact routes: " + ", ".join(missing_routes))

    extra_routes = sorted(route for route in routes - REQUIRED_ROUTES if isinstance(route, str))
    if extra_routes:
        errors.append("unexpected artifact routes: " + ", ".join(extra_routes))

    for entry in route_entries:
        if not isinstance(entry, dict):
            errors.append("route entry is not an object")
            continue

        route = entry.get("route")
        filename = entry.get("file")
        if not isinstance(route, str):
            errors.append("route entry missing route string")
            continue
        if not isinstance(filename, str):
            errors.append(f"{route}: missing file string")
            continue

        expected_title = EXPECTED_TITLES.get(route)
        if entry.get("title") != expected_title:
            errors.append(
                f"{route}: manifest title mismatch, "
                f"expected {expected_title!r}, got {entry.get('title')!r}"
            )
        expected_cta = EXPECTED_CTAS.get(route)
        if entry.get("cta") != expected_cta:
            errors.append(
                f"{route}: manifest CTA mismatch, "
                f"expected {expected_cta!r}, got {entry.get('cta')!r}"
            )
        if entry.get("section_count") != EXPECTED_SECTION_COUNT:
            errors.append(
                f"{route}: manifest section_count mismatch, "
                f"expected {EXPECTED_SECTION_COUNT}, got {entry.get('section_count')!r}"
            )
        section_headings = entry.get("section_headings")
        if not (
            isinstance(section_headings, list)
            and len(section_headings) == EXPECTED_SECTION_COUNT
            and all(isinstance(heading, str) and heading.strip() for heading in section_headings)
        ):
            errors.append(f"{route}: manifest section_headings must be {EXPECTED_SECTION_COUNT} non-empty strings")

        checks = entry.get("checks")
        if not isinstance(checks, list) or not REQUIRED_CHECKS.issubset(set(checks)):
            errors.append(f"{route}: missing expected manifest checks")

        size = entry.get("size")
        if size != {"width": EXPECTED_SIZE[0], "height": EXPECTED_SIZE[1]}:
            errors.append(f"{route}: manifest size mismatch")

        path = output_dir / filename
        if not path.exists():
            errors.append(f"{route}: missing PNG {filename}")
            continue
        if path.stat().st_size < 10_000:
            errors.append(f"{route}: PNG is suspiciously small")

        try:
            with Image.open(path) as image:
                if image.size != EXPECTED_SIZE:
                    errors.append(f"{route}: PNG dimensions are {image.size}, expected {EXPECTED_SIZE}")
                if image.format != "PNG":
                    errors.append(f"{route}: file is not a PNG")
                if not _image_is_nonblank(image):
                    errors.append(f"{route}: PNG appears blank")
        except OSError as exc:
            errors.append(f"{route}: cannot open PNG: {exc}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    errors = verify(args.output_dir)
    if errors:
        for error in errors:
            print(f"Mobile visual-smoke harness artifact verification failed: {error}", file=sys.stderr)
        return 1

    print(
        "Mobile visual-smoke harness artifact verified: "
        f"{len(REQUIRED_ROUTES)} PNGs, manifest titles/CTAs/section headings, dimensions, "
        "nonblank images, PHI-safe flags."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
