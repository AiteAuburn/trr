#!/usr/bin/env python3
"""Generate PHI-safe local visual evidence for mobile preview routes.

This is a non-production fallback harness for routes whose Android screenshots
are blocked by local native runtime issues. It does not start Expo, call the
backend, write app data, trigger AI, or use secrets.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = Path("/tmp/bloodsugar-mobile-visual-smoke/2026-06-02-t698-harness")

BACKGROUND = "#FAFAF8"
CARD = "#FFFFFF"
MINT = "#EAF6F1"
GREEN = "#3FA67F"
DEEP_GREEN = "#0F3F37"
TEXT = "#1E1E1E"
MUTED = "#5F666A"
BORDER = "#E3E8E5"
WARNING = "#C85D5D"


@dataclass(frozen=True)
class RoutePreview:
    route: str
    title: str
    subtitle: str
    icon: str
    sections: tuple[tuple[str, str], ...]
    cta: str
    note: str


ROUTES: tuple[RoutePreview, ...] = (
    RoutePreview(
        route="today",
        title="糖錄錄",
        subtitle="按住開始說話記錄。",
        icon="🎙",
        sections=(
            ("大型麥克風", "首頁第一視覺只保留按住錄音入口。"),
            ("提示文字", "下方固定顯示「按住開始說話記錄」與「放開即結束」。"),
            ("選單入口", "其他 MVP 功能從右上角漢堡選單進入。"),
        ),
        cta="按住錄音",
        note="Today harness mirrors the minimal MVP home screen; no lists, text input, stats, or secondary CTAs.",
    ),
    RoutePreview(
        route="record",
        title="快速記錄",
        subtitle="用語音或文字快速新增紀錄。",
        icon="錄",
        sections=(
            ("按住錄音", "放開結束；靜音裁切後才送轉錄"),
            ("文字輸入", "自然語言與語音後段共用同一條 parse pipeline"),
            ("低成本路徑", "手動新增可完全避開 parser / LLM"),
        ),
        cta="整理紀錄",
        note="Record native evidence 已接受；harness 檢查核心入口仍是單層版面。",
    ),
    RoutePreview(
        route="history",
        title="歷史紀錄",
        subtitle="查詢過去的血糖、飲食與運動紀錄。",
        icon="史",
        sections=(
            ("月曆模式", "有紀錄日期亮燈，沒紀錄日期暗色"),
            ("日期詳情", "點擊日期後優先顯示 AI 整理後的結構化紀錄"),
            ("原始紀錄", "可切換 bounded 語音轉文字內容或安全 fallback"),
        ),
        cta="查看紀錄詳情",
        note="History harness mirrors MVP calendar mode; no range tabs or date-range inputs.",
    ),
    RoutePreview(
        route="analysis",
        title="基本分析",
        subtitle="查看最近血糖趨勢與簡單摘要。",
        icon="圖",
        sections=(
            ("血糖趨勢", "本週 / 本月 / 自訂日期區間切換，圖表只顯示 bounded series"),
            ("摘要", "最高、最低、平均、測量總次數、飯前與飯後次數"),
            ("安全邊界", "只做描述性統計，不提供診療建議"),
        ),
        cta="查看詳細報告",
        note="Analysis native evidence 目前 route-correct 但 chart data 不足；harness 補充 chart-card layout。",
    ),
    RoutePreview(
        route="detailedReport",
        title="詳細報告",
        subtitle="查看更完整的紀錄摘要。",
        icon="報",
        sections=(
            ("資料來源", "本機 seeded summary，最多 bounded query limit"),
            ("統計", "紀錄 3 筆、平均 138、AI 成本 0 次"),
            ("安全邊界", "只做描述性摘要，不提供醫療建議"),
        ),
        cta="回基本分析",
        note="Detailed Report route 保護分析延伸頁，不應重新觸發 AI 或大量查詢。",
    ),
    RoutePreview(
        route="settings",
        title="設定",
        subtitle="管理帳號、提醒與使用偏好。",
        icon="設",
        sections=(
            ("帳號卡", "顯示 demo profile，不使用真實電話或 email"),
            ("設定列表", "個人資料、提醒、錄音額度、通知隱私、教學、訂閱"),
            ("Dev reset", "只可在 debug/dev context 顯示，未來 production 必須移除"),
        ),
        cta="返回功能選單",
        note="Settings native evidence 目前為 scrolled capture；harness 補充 header/top layout。",
    ),
    RoutePreview(
        route="menu",
        title="功能選單",
        subtitle="快速前往你需要的功能。",
        icon="☰",
        sections=(
            ("2 欄 grid", "每個功能卡 icon 與文字置中，不顯示 MVP badge"),
            ("查看更多功能", "置中 pill，不使用大面積白色外框"),
            ("Debug controls", "visual smoke route jumps 與 dev reset 只在本機 debug 顯示"),
        ),
        cta="查看更多功能",
        note="Menu native evidence 已接受；harness 保護 no nested panel 設計。",
    ),
    RoutePreview(
        route="subscription",
        title="會員方案",
        subtitle="選擇適合你的方案，持續輕鬆記錄。",
        icon="會",
        sections=(
            ("7 天免費試用", "提示自動轉年費，但不啟動 payment"),
            ("年費會員", "NT$1,490 / 年，優惠資格由 backend policy 決定"),
            ("功能比較", "語音記錄、AI 整理、分析、歷史紀錄"),
        ),
        cta="開始 7 天試用",
        note="Subscription native evidence 已接受；harness 確認 paywall 不觸發金流。",
    ),
    RoutePreview(
        route="transcriptReview",
        title="確認文字內容",
        subtitle="確認目前輸入的紀錄文字。",
        icon="文",
        sections=(
            ("可編輯文字框", "使用者先確認文字；不自動送 parser"),
            ("成本邊界", "下一步整理只送目前文字一次，不批次載入歷史"),
            ("安全狀態", "backend 未 ready 時停在確認頁，不呼叫 AI"),
        ),
        cta="下一步整理",
        note="文字確認頁是 MVP 信任流程，不可省略。",
    ),
    RoutePreview(
        route="aiReview",
        title="AI 整理確認",
        subtitle="AI 已幫你整理完成，請確認資料是否正確。",
        icon="AI",
        sections=(
            ("日期時間", "今天 08:10"),
            ("血糖", "空腹 138 mg/dL，信心 99%"),
            ("操作", "每筆候選可編輯或移除，確認前不寫入資料庫"),
        ),
        cta="進入儲存確認",
        note="候選資料使用 seeded demo；不保留 raw prompt 或 raw model output。",
    ),
    RoutePreview(
        route="editPreviewRecord",
        title="修改整理結果",
        subtitle="修改 AI 整理出的候選紀錄。",
        icon="修",
        sections=(
            ("候選資料", "血糖 138 mg/dL，來源為 seeded demo"),
            ("表單邊界", "日期、時間、數值與 chip 都走 bounded update handler"),
            ("儲存前", "只更新候選 preview，不寫入正式紀錄"),
        ),
        cta="儲存候選修改",
        note="AI 候選編輯頁保護確認前修正流程，仍不呼叫 backend 或 LLM。",
    ),
    RoutePreview(
        route="aiRemoveConfirm",
        title="移除候選紀錄",
        subtitle="確認要移除這筆 AI 候選紀錄。",
        icon="移",
        sections=(
            ("移除範圍", "只移除待確認候選，不影響正式紀錄"),
            ("候選摘要", "空腹血糖 138 mg/dL"),
            ("返回", "取消後回 AI 整理確認頁"),
        ),
        cta="確認移除",
        note="移除確認頁確保使用者主動決定，不讓 AI 自動丟棄紀錄。",
    ),
    RoutePreview(
        route="aiSaveConfirm",
        title="確認儲存",
        subtitle="確認要儲存 AI 候選紀錄。",
        icon="✓",
        sections=(
            ("儲存前檢查", "需要帳號、照護對象、後端與權限 ready"),
            ("候選紀錄", "血糖、飲食、運動逐筆確認"),
            ("成本控制", "確認儲存不會再次呼叫 parser 或 LLM"),
        ),
        cta="確認儲存",
        note="寫入前最後一道確認，確保醫療紀錄不被 AI 自動亂存。",
    ),
    RoutePreview(
        route="aiSaveFailure",
        title="儲存未完成",
        subtitle="儲存未完成，請返回確認或改用手動新增。",
        icon="!",
        sections=(
            ("失敗摘要", "Visual smoke demo save failure"),
            ("保留狀態", "候選紀錄仍留在 preview，可返回確認"),
            ("低成本 fallback", "可改用手動新增，不重新呼叫 parser / LLM"),
        ),
        cta="回 AI 確認",
        note="儲存失敗頁保護 partial failure recovery，不可清掉候選資料。",
    ),
    RoutePreview(
        route="saveSuccess",
        title="儲存完成",
        subtitle="紀錄已確認並完成儲存。",
        icon="✓",
        sections=(
            ("結果摘要", "Visual smoke demo save result"),
            ("下一步", "今日紀錄、歷史紀錄、基本分析"),
            ("資料邊界", "完成後清空目前輸入，不保留 raw model output"),
        ),
        cta="回今日紀錄",
        note="完成頁使用單層 destination cards，不包進大 panel。",
    ),
    RoutePreview(
        route="deleteSuccess",
        title="刪除完成",
        subtitle="紀錄已從目前清單移除。",
        icon="刪",
        sections=(
            ("結果摘要", "Visual smoke demo delete result"),
            ("下一步", "查看歷史紀錄或回到今日頁"),
            ("資料邊界", "soft delete / sync retry 由正式 backend 流程處理"),
        ),
        cta="查看歷史",
        note="刪除完成頁只顯示 bounded result summary，不保留 raw record payload。",
    ),
    RoutePreview(
        route="updateSuccess",
        title="更新完成",
        subtitle="紀錄已完成更新。",
        icon="更",
        sections=(
            ("結果摘要", "Visual smoke demo update result"),
            ("下一步", "查看更新後詳情、歷史或基本分析"),
            ("同步邊界", "不在結果頁重新呼叫 AI 或批次載入資料"),
        ),
        cta="查看詳情",
        note="更新完成頁維持 destination card flow，避免結果頁變成二次編輯表單。",
    ),
    RoutePreview(
        route="recordDetail",
        title="記錄詳情",
        subtitle="查看單筆紀錄的完整內容。",
        icon="血",
        sections=(
            ("日期時間", "今天 08:10"),
            ("數值", "空腹血糖 138 mg/dL"),
            ("來源", "visual_smoke_demo，只作本機預覽"),
        ),
        cta="編輯",
        note="詳情頁只顯示 bounded display item，不直接 render raw payload。",
    ),
    RoutePreview(
        route="editRecord",
        title="編輯記錄",
        subtitle="修改紀錄欄位並儲存。",
        icon="筆",
        sections=(
            ("日期 / 時間", "使用固定格式欄位與 accessibility label"),
            ("血糖數值", "138 mg/dL"),
            ("更新邊界", "送出前驗證；backend unavailable 時 fail-closed"),
        ),
        cta="儲存修改",
        note="表單欄位使用固定長度上限，避免 mobile state 無界累積。",
    ),
    RoutePreview(
        route="deleteConfirm",
        title="刪除確認",
        subtitle="確認是否刪除這筆紀錄。",
        icon="!",
        sections=(
            ("危險操作", "刪除前顯示單筆紀錄摘要"),
            ("確認清單", "說明同步、復原與資料邊界"),
            ("操作", "取消回詳情；確認才進入刪除流程"),
        ),
        cta="確認刪除",
        note="刪除確認頁是正式紀錄的安全防線，不可用 alert-only 取代。",
    ),
    RoutePreview(
        route="manualRecord",
        title="手動新增紀錄",
        subtitle="不經 AI，直接建立結構化紀錄。",
        icon="＋",
        sections=(
            ("紀錄類型", "血糖、飲食、運動、用藥、備註"),
            ("省 token 路徑", "完全避開 parser / LLM"),
            ("仍需確認", "送出前進入手動新增確認頁"),
        ),
        cta="下一步確認",
        note="手動新增是低成本 fallback，也是 backend unavailable 時的安全入口。",
    ),
    RoutePreview(
        route="manualRecordConfirm",
        title="確認手動紀錄",
        subtitle="確認手動新增紀錄內容。",
        icon="確",
        sections=(
            ("紀錄摘要", "空腹血糖 138 mg/dL"),
            ("成本", "0 次 AI / LLM / STT 呼叫"),
            ("送出前", "仍需 backend account 與 profile ready"),
        ),
        cta="確認建立",
        note="手動確認頁讓低成本路徑仍保有使用者確認與資料安全。",
    ),
    RoutePreview(
        route="subscriptionManagement",
        title="訂閱管理",
        subtitle="查看訂閱管理、付款與權益同步邊界。",
        icon="卡",
        sections=(
            ("付款來源", "App Store / Play Store 尚未串接"),
            ("Receipt validation", "後端 webhook 決定 entitlement"),
            ("優惠資格", "創始會員價與導流碼由 server-side policy 決定"),
        ),
        cta="同步方案狀態",
        note="付款 UI 不啟動金流，不改變會員狀態。",
    ),
    RoutePreview(
        route="membershipStatus",
        title="會員方案狀態",
        subtitle="查看試用、續訂與會員功能狀態。",
        icon="星",
        sections=(
            ("7 天免費試用即將結束", "還剩 2 天"),
            ("會員專屬功能", "語音記錄、AI 整理、基本分析、歷史回顧"),
            ("創始會員年費", "NT$1,490，正式收款前不改 entitlement"),
        ),
        cta="管理方案",
        note="狀態頁只呈現 entitlement preview，不觸發 payment。",
    ),
    RoutePreview(
        route="tutorial",
        title="使用教學",
        subtitle="簡單 4 步驟，輕鬆記錄每一天。",
        icon="教",
        sections=(
            ("步驟 1", "先用語音、文字或手動新增建立候選紀錄"),
            ("步驟 2", "確認文字與 AI 整理結果後才送出"),
            ("安全原則", "AI 不自動寫入；手動路徑可省 token"),
        ),
        cta="開始記錄",
        note="教學頁維持單層內容，幫助使用者理解多頁 MVP flow。",
    ),
    RoutePreview(
        route="accountSecurity",
        title="帳號與登入安全",
        subtitle="查看登入狀態與正式 auth 邊界。",
        icon="鑰",
        sections=(
            ("Provider", "Apple / Google / Email token exchange 待串接"),
            ("Secure storage", "refresh token 需 Keychain / Keystore"),
            ("Session revoke", "登出全部裝置需 server-side revoke"),
        ),
        cta="返回設定",
        note="正式 auth 前 dev auth 必須保持隔離，不可混入 production。",
    ),
    RoutePreview(
        route="profileSettings",
        title="個人資料",
        subtitle="查看個人資料與照護對象資料邊界。",
        icon="人",
        sections=(
            ("顯示名稱", "王小華 demo"),
            ("登入方式", "本機預覽，不使用真實電話或 email"),
            ("資料邊界", "profile payload 需 bounded 後才渲染"),
        ),
        cta="返回設定",
        note="不記錄真實個資或 PHI，只顯示 demo 文案。",
    ),
    RoutePreview(
        route="recordingQuotaSettings",
        title="錄音額度",
        subtitle="查看今日語音額度與付費方案限制。",
        icon="麥",
        sections=(
            ("試用版", "每日 5 分鐘"),
            ("年費會員", "每日 10 分鐘"),
            ("低額度提醒", "剩餘 2 分鐘時才提醒"),
        ),
        cta="同步額度",
        note="額度狀態由 backend entitlement 決定；本機不自行信任。",
    ),
    RoutePreview(
        route="reminderSettings",
        title="提醒設定",
        subtitle="規劃記錄提醒與通知權限邊界。",
        icon="鈴",
        sections=(
            ("早餐前", "08:00 demo reminder"),
            ("晚餐後", "20:30 demo reminder"),
            ("通知權限", "正式版需 OS permission 與後端偏好同步"),
        ),
        cta="設定提醒",
        note="目前只顯示提醒 preview，不建立真實通知。",
    ),
    RoutePreview(
        route="privacySettings",
        title="通知與隱私",
        subtitle="查看通知、分享與資料權利邊界。",
        icon="盾",
        sections=(
            ("醫師分享", "需要授權碼、到期與撤銷"),
            ("社群公開", "預設關閉，逐項 opt-in"),
            ("資料匯出 / 刪除", "需要身份驗證、批次狀態與稽核"),
        ),
        cta="返回設定",
        note="隱私頁不公開任何健康紀錄。",
    ),
    RoutePreview(
        route="futureModules",
        title="未來擴充",
        subtitle="預留醫師、社群、串接與圖片辨識入口。",
        icon="＋",
        sections=(
            ("醫師 / 醫院合作", "授權碼、回診報表、醫療端只讀摘要"),
            ("社群 / 成就 / 排行榜", "公開資料 opt-in，預設保護隱私"),
            ("食物拍照辨識", "圖片來源與營養估算都需使用者確認"),
        ),
        cta="返回功能選單",
        note="開放式頁面背景，不用大白色外框包住整頁。",
    ),
    RoutePreview(
        route="futureModuleDetail",
        title="未來模組詳情",
        subtitle="查看未來模組的啟用條件與安全邊界。",
        icon="◎",
        sections=(
            ("目前狀態", "Preview only，尚未啟用資料寫入"),
            ("安全邊界", "不呼叫 backend、AI、Vision、payment 或 production credentials"),
            ("資料模型", "保留 source / permission / audit 欄位"),
        ),
        cta="返回未來擴充",
        note="邊界說明維持 inline，不做卡片包卡片。",
    ),
    RoutePreview(
        route="doctorShare",
        title="醫師 / 醫院合作",
        subtitle="醫師合作授權與回診報表預覽。",
        icon="醫",
        sections=(
            ("授權碼", "未產生，需 production auth 與 permission model"),
            ("醫師權限", "唯讀預留；可撤銷與到期"),
            ("報表來源", "使用 bounded report summary，不暴露 raw payload"),
        ),
        cta="查看授權狀態",
        note="醫師合作 preview 不產生 share token，也不呼叫報表 API。",
    ),
    RoutePreview(
        route="healthIntegration",
        title="HealthKit / Health Connect / 血糖機",
        subtitle="健康平台與血糖機匯入預覽。",
        icon="串",
        sections=(
            ("來源", "HealthKit / Health Connect / meter import"),
            ("權限", "正式版需 OS permission 與 backend import batch"),
            ("AI 成本", "匯入不應呼叫 LLM"),
        ),
        cta="查看權限狀態",
        note="健康串接 preview 只說明 boundary，不讀取裝置健康資料。",
    ),
    RoutePreview(
        route="community",
        title="食物社群",
        subtitle="真實食物升糖分享、點數與公開排行榜入口。",
        icon="社",
        sections=(
            ("食物血糖資料庫", "分類、搜尋與食物資料頁可同步 backend"),
            ("分享紀錄", "食物名稱、食用前後血糖、上升值與備註心得"),
            ("積分與商城", "分享得點數，未來兌換優惠券、商品折扣與會員福利"),
        ),
        cta="查看食物分享狀態",
        note="visual smoke 不送貼文、不寫食物資料庫、不建立積分。",
    ),
    RoutePreview(
        route="ranking",
        title="社群排行",
        subtitle="分享次數、貢獻度與食物測試達人公開榜單。",
        icon="榜",
        sections=(
            ("連續記錄", "本機 demo streak，只顯示非敏感統計"),
            ("公開排名", "預設關閉，需要使用者 opt-in"),
            ("健康數值", "不可公開血糖、飲食或用藥細節"),
        ),
        cta="查看排名狀態",
        note="排行榜 preview 只使用 bounded aggregate，不公開個人健康資料。",
    ),
    RoutePreview(
        route="achievements",
        title="成就榜",
        subtitle="完成挑戰，養成穩定記錄習慣。",
        icon="★",
        sections=(
            ("分類", "血糖記錄、飲食記錄、運動記錄"),
            ("級距", "10 / 50 / 100 / 150 / 200 / 250"),
            ("徽章樣式", "累積型共用圖樣換色與數字；連續型採獨立款式"),
        ),
        cta="返回功能選單",
        note="成就列依分類呈現，在窄螢幕可換行，避免巢狀 panel。",
    ),
    RoutePreview(
        route="yearReview",
        title="年度回顧",
        subtitle="看看前一年度的控糖成果。",
        icon="↻",
        sections=(
            ("1 月 1 日", "自動產生前一年度回顧"),
            ("年度統計", "總天數、血糖、飲食、運動、連續天數與徽章"),
            ("AI 觀察與鼓勵", "preview 不呼叫 AI，不產生分享圖"),
        ),
        cta="查看分享整合狀態",
        note="年度回顧 preview 不產生公開分享圖或社群貼文。",
    ),
    RoutePreview(
        route="store",
        title="商城",
        subtitle="點數商城、兌換券與購物車整合入口。",
        icon="□",
        sections=(
            ("優惠券", "backend ready 時可扣點並立即發出 bounded coupon code"),
            ("保健食品折扣", "backend ready 時可扣點並立即發出 bounded discount code"),
            ("合作商品 / 會員福利", "可建立 reservation，後續仍需 fulfillment"),
        ),
        cta="查看購物車整合狀態",
        note="visual smoke 不扣點、不發券、不啟動結帳或金流整合。",
    ),
    RoutePreview(
        route="storeCart",
        title="購物車",
        subtitle="確認未來購物車與結帳狀態。",
        icon="▣",
        sections=(
            ("購物車尚未啟用", "目前只顯示未來商城資料邊界"),
            ("結帳狀態", "Disabled CTA，不能觸發 payment"),
            ("合規提示", "商品與交易功能需另行接法務與金流"),
        ),
        cta="返回商城",
        note="停用結帳按鈕可見，但本機 evidence 不觸發交易。",
    ),
    RoutePreview(
        route="foodPhoto",
        title="食物拍照分析",
        subtitle="食物拍照分析預覽，Vision 尚未串接。",
        icon="○",
        sections=(
            ("拍攝或上傳照片", "本機版面佔位，不開相機或上傳"),
            ("AI 分析結果", "辨識、熱量、碳水、糖分皆等待未來 Vision 串接"),
            ("加入紀錄", "必須先讓使用者確認修正"),
        ),
        cta="返回功能選單",
        note="不做圖片上傳、Vision、營養 API 或寫入",
    ),
)


def _font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc" if bold else "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def _text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, font: ImageFont.ImageFont, fill: str) -> None:
    draw.text(xy, value, font=font, fill=fill)


def _wrap_text_to_width(
    draw: ImageDraw.ImageDraw,
    value: str,
    font: ImageFont.ImageFont,
    *,
    max_width: int,
) -> list[str]:
    def tokenize(text: str) -> list[str]:
        tokens: list[str] = []
        current_ascii = ""
        for char in text:
            if char.isspace():
                if current_ascii:
                    tokens.append(current_ascii)
                    current_ascii = ""
                tokens.append(char)
                continue
            if char.isascii() and char.isalnum():
                current_ascii += char
                continue
            if current_ascii:
                tokens.append(current_ascii)
                current_ascii = ""
            if char in "，。；：、,.!?)]}%":
                if tokens:
                    tokens[-1] += char
                else:
                    tokens.append(char)
            else:
                tokens.append(char)
        if current_ascii:
            tokens.append(current_ascii)
        return tokens

    lines: list[str] = []
    current = ""
    for token in tokenize(value):
        candidate = current + token
        if draw.textlength(candidate, font=font) <= max_width:
            current = candidate
            continue
        if current:
            lines.append(current.rstrip())
        if draw.textlength(token, font=font) <= max_width:
            current = token.lstrip()
            continue
        current = ""
        for char in token:
            candidate = current + char
            if draw.textlength(candidate, font=font) <= max_width:
                current = candidate
                continue
            if current:
                lines.append(current)
            current = char
    if current:
        lines.append(current.rstrip())
    return lines or [""]


def _wrapped_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    value: str,
    font: ImageFont.ImageFont,
    fill: str,
    *,
    max_width: int,
    line_height: int,
) -> int:
    y = xy[1]
    for line in _wrap_text_to_width(draw, value, font, max_width=max_width):
        _text(draw, (xy[0], y), line, font, fill)
        y += line_height
    return y


def _rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=26, fill=fill, outline=outline, width=width)


def _route_png(route: RoutePreview, output_dir: Path) -> dict[str, object]:
    image = Image.new("RGB", (390, 844), BACKGROUND)
    draw = ImageDraw.Draw(image)

    title_font = _font(38, bold=True)
    subtitle_font = _font(17)
    label_font = _font(20, bold=True)
    body_font = _font(16)
    small_font = _font(13)
    button_font = _font(19, bold=True)
    icon_font = _font(32, bold=True)

    _text(draw, (28, 44), "糖錄錄", title_font, DEEP_GREEN)
    _text(draw, (30, 95), route.subtitle, subtitle_font, MUTED)
    _rounded(draw, (316, 44, 362, 90), MINT, None)
    _text(draw, (332, 50), "×", _font(25, bold=True), DEEP_GREEN)

    _rounded(draw, (28, 138, 362, 242), MINT, None)
    draw.ellipse((54, 165, 116, 227), fill=CARD)
    _text(draw, (76, 178), route.icon, icon_font, GREEN)
    _text(draw, (134, 164), route.title, label_font, DEEP_GREEN)
    _wrapped_text(draw, (134, 196), route.subtitle, body_font, MUTED, max_width=205, line_height=22)

    y = 276
    for heading, copy in route.sections:
        copy_lines = _wrap_text_to_width(draw, copy, body_font, max_width=225)
        card_height = max(96, 54 + len(copy_lines) * 21)
        _rounded(draw, (28, y, 362, y + card_height), CARD, BORDER)
        icon_y = y + max(28, (card_height - 40) // 2)
        draw.ellipse((48, icon_y, 88, icon_y + 40), fill=MINT)
        _text(draw, (61, icon_y + 3), "✓", _font(18, bold=True), GREEN)
        _text(draw, (104, y + 18), heading, label_font, TEXT)
        _wrapped_text(draw, (104, y + 50), copy, body_font, MUTED, max_width=225, line_height=21)
        y += card_height + 20

    note_lines = _wrap_text_to_width(draw, route.note, small_font, max_width=290)
    note_height = 48 + len(note_lines) * 20
    _rounded(draw, (28, y + 4, 362, y + 4 + note_height), MINT, None)
    _text(draw, (50, y + 20), "DEV ONLY", small_font, WARNING)
    _wrapped_text(draw, (50, y + 43), route.note, small_font, MUTED, max_width=290, line_height=20)

    draw.rounded_rectangle((28, 748, 362, 812), radius=24, fill=GREEN)
    _text(draw, (64, 766), route.cta, button_font, "#FFFFFF")

    filename = f"{route.route}.png"
    path = output_dir / filename
    image.save(path)
    return {
        "route": route.route,
        "title": route.title,
        "cta": route.cta,
        "section_count": len(route.sections),
        "section_headings": [heading for heading, _ in route.sections],
        "file": filename,
        "size": {"width": image.width, "height": image.height},
        "checks": [
            "open background",
            "single-layer repeated cards",
            "visible title/subtitle",
            "visible CTA",
            "PHI-safe seeded text",
        ],
    }


def generate(output_dir: Path) -> dict[str, object]:
    output_dir.mkdir(parents=True, exist_ok=True)
    previews = [_route_png(route, output_dir) for route in ROUTES]
    manifest = {
        "kind": "mobile_visual_smoke_harness",
        "production": False,
        "runtime": "PIL static renderer",
        "source": "scripts/generate_mobile_visual_smoke_harness.py",
        "routes": previews,
        "safety": {
            "phi_safe_seeded_text_only": True,
            "backend_calls": False,
            "database_writes": False,
            "ai_llm_stt_vision_calls": False,
            "payment_calls": False,
            "production_credentials": False,
        },
        "android_runtime_blocker": (
            "Native Android screenshots may be incomplete when the local emulator display capture hangs "
            "or the non-16 KB AVD cannot restart because the Windows SDK drive lacks space."
        ),
    }
    (output_dir / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return manifest


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    args = parser.parse_args()

    manifest = generate(args.output_dir)
    route_list = ", ".join(route["route"] for route in manifest["routes"])
    print(f"Generated mobile visual-smoke harness evidence for: {route_list}")
    print(f"Output: {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
