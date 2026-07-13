import { boundUiMessage } from "./mobileBounds";

export type AppScreen =
  | "today"
  | "record"
  | "transcriptReview"
  | "aiReview"
  | "aiSaveConfirm"
  | "aiSaveFailure"
  | "aiRemoveConfirm"
  | "editPreviewRecord"
  | "saveSuccess"
  | "deleteSuccess"
  | "updateSuccess"
  | "manualRecord"
  | "manualRecordConfirm"
  | "recordDetail"
  | "editRecord"
  | "deleteConfirm"
  | "history"
  | "analysis"
  | "detailedReport"
  | "subscription"
  | "subscriptionManagement"
  | "membershipStatus"
  | "menu"
  | "settings"
  | "accountSecurity"
  | "profileSettings"
  | "recordingQuotaSettings"
  | "reminderSettings"
  | "privacySettings"
  | "tutorial"
  | "achievements"
  | "yearReview"
  | "store"
  | "storeCart"
  | "foodPhoto"
  | "doctorShare"
  | "healthIntegration"
  | "community"
  | "ranking"
  | "futureModuleDetail"
  | "futureModules";

const primaryScreens: Array<{ id: AppScreen; label: string }> = [
  { id: "today", label: "今日" },
  { id: "record", label: "記錄" },
  { id: "menu", label: "選單" }
];

const mvpFlowSteps: Array<{ id: AppScreen; label: string }> = [
  { id: "record", label: "記錄" },
  { id: "transcriptReview", label: "文字確認" },
  { id: "aiReview", label: "AI確認" },
  { id: "aiSaveConfirm", label: "儲存確認" },
  { id: "saveSuccess", label: "完成" }
];

const screenChrome: Record<AppScreen, { subtitle: string; backTo?: AppScreen; actionLabel?: string }> = {
  today: { subtitle: "" },
  record: { subtitle: "使用錄音預覽、文字輸入或手動新增紀錄。" },
  transcriptReview: { subtitle: "確認目前輸入的紀錄文字。", backTo: "record", actionLabel: "‹" },
  aiReview: { subtitle: "AI 已幫你整理完成，請確認資料是否正確。", backTo: "transcriptReview", actionLabel: "‹" },
  aiSaveConfirm: { subtitle: "確認要儲存 AI 候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  aiSaveFailure: { subtitle: "儲存未完成，請返回確認或改用手動新增。", backTo: "aiSaveConfirm", actionLabel: "‹" },
  aiRemoveConfirm: { subtitle: "確認要移除這筆 AI 候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  editPreviewRecord: { subtitle: "修改 AI 整理出的候選紀錄。", backTo: "aiReview", actionLabel: "‹" },
  saveSuccess: { subtitle: "紀錄已確認並完成儲存。", backTo: "today", actionLabel: "×" },
  deleteSuccess: { subtitle: "紀錄已從目前清單移除。", backTo: "today", actionLabel: "×" },
  updateSuccess: { subtitle: "紀錄已完成更新。", backTo: "today", actionLabel: "×" },
  manualRecord: { subtitle: "不經 AI，直接建立結構化紀錄。", backTo: "today", actionLabel: "‹" },
  manualRecordConfirm: { subtitle: "確認手動新增紀錄內容。", backTo: "manualRecord", actionLabel: "‹" },
  recordDetail: { subtitle: "查看單筆紀錄的完整內容。", backTo: "today", actionLabel: "‹" },
  editRecord: { subtitle: "修改紀錄欄位並儲存。", backTo: "recordDetail", actionLabel: "‹" },
  deleteConfirm: { subtitle: "確認是否刪除這筆紀錄。", backTo: "recordDetail", actionLabel: "‹" },
  history: { subtitle: "查詢過去的血糖、飲食與運動紀錄。" },
  analysis: { subtitle: "查看最近血糖趨勢與簡單摘要。" },
  detailedReport: { subtitle: "查看更完整的紀錄摘要。", backTo: "analysis", actionLabel: "‹" },
  subscription: { subtitle: "選擇適合你的方案，持續輕鬆記錄。", backTo: "menu", actionLabel: "‹" },
  subscriptionManagement: { subtitle: "查看訂閱管理、付款與權益同步邊界。", backTo: "settings", actionLabel: "‹" },
  membershipStatus: { subtitle: "查看試用、續訂與會員功能狀態。", backTo: "subscription", actionLabel: "‹" },
  menu: { subtitle: "快速前往你需要的功能。", backTo: "today", actionLabel: "×" },
  settings: { subtitle: "管理帳號、提醒與使用偏好。", backTo: "menu", actionLabel: "‹" },
  accountSecurity: { subtitle: "查看登入狀態與正式 auth 邊界。", backTo: "settings", actionLabel: "‹" },
  profileSettings: { subtitle: "查看個人資料與照護對象資料邊界。", backTo: "settings", actionLabel: "‹" },
  recordingQuotaSettings: { subtitle: "查看今日語音額度與付費方案限制。", backTo: "settings", actionLabel: "‹" },
  reminderSettings: { subtitle: "規劃記錄提醒與通知權限邊界。", backTo: "settings", actionLabel: "‹" },
  privacySettings: { subtitle: "查看通知、分享與資料權利邊界。", backTo: "settings", actionLabel: "‹" },
  tutorial: { subtitle: "簡單 4 步驟，輕鬆記錄每一天。", backTo: "menu", actionLabel: "‹" },
  achievements: { subtitle: "完成挑戰，養成穩定記錄習慣。", backTo: "menu", actionLabel: "‹" },
  yearReview: { subtitle: "看看前一年度的控糖成果。", backTo: "menu", actionLabel: "‹" },
  store: { subtitle: "同步點數商城、兌換券與購物車邊界。", backTo: "menu", actionLabel: "‹" },
  storeCart: { subtitle: "確認未來購物車與結帳狀態。", backTo: "store", actionLabel: "‹" },
  foodPhoto: { subtitle: "食物拍照分析預覽，Vision 尚未串接。", backTo: "menu", actionLabel: "‹" },
  doctorShare: { subtitle: "醫師合作授權與回診報表預覽。", backTo: "futureModules", actionLabel: "‹" },
  healthIntegration: { subtitle: "健康平台與血糖機匯入預覽。", backTo: "futureModules", actionLabel: "‹" },
  community: { subtitle: "同步食物升糖資料庫、分享、點數與公開排名。", backTo: "futureModules", actionLabel: "‹" },
  ranking: { subtitle: "查看 opt-in 公開社群排行與非敏感分數。", backTo: "futureModules", actionLabel: "‹" },
  futureModuleDetail: { subtitle: "查看未來模組的啟用條件與安全邊界。", backTo: "futureModules", actionLabel: "‹" },
  futureModules: { subtitle: "預留醫師、社群、串接與圖片辨識入口。", backTo: "menu", actionLabel: "‹" }
};

const menuScreens: Array<{ id: AppScreen; label: string; icon: string }> = [
  { id: "today", label: "今日錄音", icon: "🎙" },
  { id: "history", label: "歷史紀錄", icon: "🗂" },
  { id: "analysis", label: "基本分析", icon: "📊" },
  { id: "settings", label: "設定", icon: "⚙" }
];

const visualSmokeRouteJumps: Array<{ id: AppScreen; label: string }> = [
  { id: "today", label: "今日紀錄" },
  { id: "record", label: "快速記錄" },
  { id: "transcriptReview", label: "文字確認" },
  { id: "aiReview", label: "AI 整理確認" },
  { id: "editPreviewRecord", label: "AI 候選編輯" },
  { id: "aiRemoveConfirm", label: "AI 候選移除" },
  { id: "aiSaveConfirm", label: "AI 儲存確認" },
  { id: "aiSaveFailure", label: "AI 儲存失敗" },
  { id: "saveSuccess", label: "儲存完成" },
  { id: "deleteSuccess", label: "刪除完成" },
  { id: "updateSuccess", label: "更新完成" },
  { id: "manualRecordConfirm", label: "手動確認" },
  { id: "history", label: "歷史紀錄" },
  { id: "recordDetail", label: "記錄詳情" },
  { id: "editRecord", label: "編輯記錄" },
  { id: "deleteConfirm", label: "刪除確認" },
  { id: "manualRecord", label: "手動新增" },
  { id: "analysis", label: "基本分析" },
  { id: "detailedReport", label: "詳細報告" },
  { id: "subscription", label: "會員方案" },
  { id: "subscriptionManagement", label: "訂閱管理" },
  { id: "membershipStatus", label: "會員狀態" },
  { id: "settings", label: "設定" },
  { id: "accountSecurity", label: "帳號安全" },
  { id: "profileSettings", label: "個人資料" },
  { id: "recordingQuotaSettings", label: "錄音額度" },
  { id: "reminderSettings", label: "提醒設定" },
  { id: "privacySettings", label: "通知隱私" },
  { id: "tutorial", label: "使用教學" },
  { id: "menu", label: "功能選單" },
  { id: "futureModules", label: "未來擴充" },
  { id: "futureModuleDetail", label: "未來模組詳情" },
  { id: "doctorShare", label: "醫師合作" },
  { id: "healthIntegration", label: "健康串接" },
  { id: "community", label: "食物社群" },
  { id: "ranking", label: "排行榜" },
  { id: "achievements", label: "成就榜" },
  { id: "yearReview", label: "年度回顧" },
  { id: "store", label: "商城" },
  { id: "storeCart", label: "購物車" },
  { id: "foodPhoto", label: "食物拍照" }
];

const visualSmokeRouteJumpIds = visualSmokeRouteJumps.map((route) => route.id);

type HeaderBackTargetState = {
  menuReturnScreen: AppScreen;
  recordDetailReturnScreen: AppScreen;
  transcriptReviewReturnScreen: AppScreen;
  manualRecordReturnScreen: AppScreen;
  subscriptionReturnScreen: AppScreen;
  tutorialReturnScreen: AppScreen;
  foodPhotoReturnScreen: AppScreen;
  doctorShareReturnScreen: AppScreen;
  healthIntegrationReturnScreen: AppScreen;
  communityReturnScreen: AppScreen;
  rankingReturnScreen: AppScreen;
  achievementsReturnScreen: AppScreen;
  yearReviewReturnScreen: AppScreen;
  storeReturnScreen: AppScreen;
  saveSuccessReturnScreen: AppScreen;
};

const settingsSubpageScreens = new Set<AppScreen>([
  "subscriptionManagement",
  "accountSecurity",
  "profileSettings",
  "recordingQuotaSettings",
  "reminderSettings",
  "privacySettings"
]);

export function isSettingsSubpageScreen(screen: AppScreen) {
  return settingsSubpageScreens.has(screen);
}

export function isVisualSmokeRecordListScreen(screen: AppScreen) {
  return screen === "today" || screen === "history" || screen === "analysis";
}

export function isVisualSmokeAiPreviewScreen(screen: AppScreen) {
  return screen === "aiReview" || screen === "aiSaveConfirm";
}

function headerBackTargetForScreen(
  currentScreen: AppScreen,
  chrome: { backTo?: AppScreen },
  state: HeaderBackTargetState
) {
  if (currentScreen === "menu") {
    return state.menuReturnScreen;
  }
  if (currentScreen === "recordDetail") {
    return state.recordDetailReturnScreen;
  }
  if (currentScreen === "deleteConfirm") {
    return "recordDetail";
  }
  if (currentScreen === "manualRecordConfirm") {
    return "manualRecord";
  }
  if (currentScreen === "aiSaveConfirm") {
    return "aiReview";
  }
  if (currentScreen === "aiSaveFailure") {
    return "aiSaveConfirm";
  }
  if (currentScreen === "aiRemoveConfirm") {
    return "aiReview";
  }
  if (currentScreen === "transcriptReview") {
    return state.transcriptReviewReturnScreen;
  }
  if (currentScreen === "manualRecord") {
    return state.manualRecordReturnScreen;
  }
  if (currentScreen === "subscription") {
    return state.subscriptionReturnScreen;
  }
  if (isSettingsSubpageScreen(currentScreen)) {
    return "settings";
  }
  if (currentScreen === "tutorial") {
    return state.tutorialReturnScreen;
  }
  if (currentScreen === "foodPhoto") {
    return state.foodPhotoReturnScreen;
  }
  if (currentScreen === "doctorShare") {
    return state.doctorShareReturnScreen;
  }
  if (currentScreen === "healthIntegration") {
    return state.healthIntegrationReturnScreen;
  }
  if (currentScreen === "community") {
    return state.communityReturnScreen;
  }
  if (currentScreen === "ranking") {
    return state.rankingReturnScreen;
  }
  if (currentScreen === "achievements") {
    return state.achievementsReturnScreen;
  }
  if (currentScreen === "yearReview") {
    return state.yearReviewReturnScreen;
  }
  if (currentScreen === "store") {
    return state.storeReturnScreen;
  }
  if (currentScreen === "saveSuccess") {
    return state.saveSuccessReturnScreen;
  }
  return chrome.backTo ?? "menu";
}

function mvpFlowStepperState(value: {
  currentScreen: AppScreen;
  lastSaveEntryMethod: "ai" | "manual" | null;
  hasUnsavedPreviewRecords: boolean;
}) {
  const currentFlowScreen = value.currentScreen === "aiSaveFailure" ? "aiSaveConfirm" : value.currentScreen;
  const stepIndex = mvpFlowSteps.findIndex((step) => step.id === currentFlowScreen);
  return {
    stepIndex,
    show:
      stepIndex >= 0 &&
      value.currentScreen !== "today" &&
      (value.currentScreen !== "saveSuccess" || value.lastSaveEntryMethod !== "manual" || value.hasUnsavedPreviewRecords)
  };
}

function primaryTabNavigationState(value: { currentScreen: AppScreen; isAnyRequestInFlight: boolean }) {
  const items = primaryScreens.map((screen) => {
    const isCurrent = value.currentScreen === screen.id;
    return {
      ...screen,
      isCurrent,
      isLocked: value.isAnyRequestInFlight && !isCurrent
    };
  });
  return {
    items,
    show: value.currentScreen !== "today" && items.some((item) => item.isCurrent)
  };
}

function transcriptReviewReturnTargetForScreen(currentScreen: AppScreen) {
  return currentScreen === "today" ? "today" : "record";
}

function normalizeVisualSmokeInitialRoute(
  value: string,
  enableDebugTools: boolean,
  allowMobileDevAuth: boolean
): AppScreen | null {
  if (!enableDebugTools || !allowMobileDevAuth) {
    return null;
  }
  if (!visualSmokeRouteJumpIds.includes(value as AppScreen)) {
    return null;
  }
  return value as AppScreen;
}

function visualSmokeRouteFromDeepLinkUrl(
  value: string,
  enableDebugTools: boolean,
  allowMobileDevAuth: boolean
): AppScreen | null {
  if (!value.includes("visual-smoke")) {
    return null;
  }
  const queryText = value.includes("?") ? value.split("?")[1]?.split("#")[0] ?? "" : "";
  const route = new URLSearchParams(queryText).get("route") ?? new URLSearchParams(queryText).get("visualSmokeRoute") ?? "";
  return normalizeVisualSmokeInitialRoute(route, enableDebugTools, allowMobileDevAuth);
}

function visualSmokePreviewAuthStatusMessage() {
  return boundUiMessage("Visual smoke demo state only; no dev-login, token, backend, AI, STT, Vision, payment, or database writes.");
}

function visualSmokeBootSkippedDisplayMessages() {
  return {
    status: boundUiMessage("Visual smoke 本機路由預覽；已跳過 backend boot，不會呼叫 API 或寫入資料。"),
    authStatus: visualSmokePreviewAuthStatusMessage()
  };
}

function visualSmokeBootIgnoredDisplayMessages() {
  return {
    status: boundUiMessage("Visual smoke 本機路由預覽；backend boot 結果已忽略，不清除本機 demo records。"),
    authStatus: visualSmokePreviewAuthStatusMessage()
  };
}

function visualSmokeDeepLinkStatusMessage(route: AppScreen) {
  return boundUiMessage(`Visual smoke deep link opened ${route}; 本機路由預覽不呼叫 API 或寫入資料。`);
}

export {
  menuScreens,
  mvpFlowSteps,
  headerBackTargetForScreen,
  mvpFlowStepperState,
  normalizeVisualSmokeInitialRoute,
  primaryScreens,
  primaryTabNavigationState,
  screenChrome,
  transcriptReviewReturnTargetForScreen,
  visualSmokeBootIgnoredDisplayMessages,
  visualSmokeBootSkippedDisplayMessages,
  visualSmokeDeepLinkStatusMessage,
  visualSmokeRouteFromDeepLinkUrl,
  visualSmokeRouteJumps
};
