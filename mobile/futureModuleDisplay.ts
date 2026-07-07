import type { AppScreen } from "./navigationConfig";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxListItems = 12;

export type FutureModuleCard = {
  id: string;
  title: string;
  description: string;
  readiness: string;
  requirements: string[];
  safety: string;
  icon: string;
  target?: AppScreen;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

function futureModuleText(value: string | undefined, fallback: string, maxLength = maxDisplayDetailTextLength) {
  return boundDisplayText(value || fallback, maxLength);
}

function futureModuleIcon(value: string | undefined) {
  return boundDisplayText(value || "模", 4);
}

function futureModuleRequirements(value: string[] | undefined) {
  const requirements = value && value.length > 0 ? value : ["從未來擴充清單選擇模組"];
  return requirements.slice(0, maxListItems).map((requirement) => boundDisplayText(requirement, maxDisplayDetailTextLength));
}

export function futureModuleCardDisplayItem(value: FutureModuleCard) {
  return {
    key: boundIdentifier(value.id),
    module: value,
    target: value.target,
    icon: futureModuleIcon(value.icon),
    title: futureModuleText(value.title, "未來模組", maxDisplayTextLength),
    description: futureModuleText(value.description, "尚未設定說明。"),
    accessibilityLabel: boundDisplayText(`查看${futureModuleText(value.title, "未來模組", maxDisplayTextLength)}整合狀態`, maxDisplayTextLength),
    readiness: futureModuleText(value.readiness, "尚未設定啟用狀態。"),
    safety: futureModuleText(value.safety, "正式啟用前必須完成權限、成本與隱私設計。"),
    requirements: futureModuleRequirements(value.requirements).map((requirement, index) => ({
      key: `${boundIdentifier(value.id)}-${clampNumber(index, 0, maxListItems)}-${boundIdentifier(requirement)}`,
      text: requirement
    }))
  };
}

export function selectedFutureModuleDisplayItem(value: FutureModuleCard | null) {
  const id = value?.id ?? "none";
  return {
    key: `selected-${boundIdentifier(id)}`,
    icon: futureModuleIcon(value?.icon),
    title: futureModuleText(value?.title, "未來模組詳情", maxDisplayTextLength),
    description: futureModuleText(value?.description, "請從未來擴充清單選擇一個模組。"),
    readiness: futureModuleText(value?.readiness, "尚未選擇模組。"),
    safety: futureModuleText(value?.safety, "正式啟用前必須完成權限、稽核、成本與隱私設計。"),
    requirements: futureModuleRequirements(value?.requirements).map((requirement, index) => ({
      key: `selected-${boundIdentifier(id)}-${clampNumber(index, 0, maxListItems)}-${boundIdentifier(requirement)}`,
      text: requirement
    }))
  };
}

export function futurePreviewSectionLabels() {
  const doctorTokenButton = boundDisplayText("查看授權碼狀態", maxDisplayTextLength);
  const doctorReportButton = boundDisplayText("查看報表邊界", maxDisplayTextLength);
  const healthPermissionButton = boundDisplayText("查看平台權限狀態", maxDisplayTextLength);
  const healthMeterButton = boundDisplayText("查看血糖機同步狀態", maxDisplayTextLength);
  const communityPostButton = boundDisplayText("查看發文狀態", maxDisplayTextLength);
  const communityPrivacyButton = boundDisplayText("查看隱私邊界", maxDisplayTextLength);
  const rankingPublicButton = boundDisplayText("查看排名狀態", maxDisplayTextLength);
  const rankingOptInButton = boundDisplayText("查看 Opt-in 邊界", maxDisplayTextLength);
  return {
    readiness: boundDisplayText("啟用前條件", maxDisplayTextLength),
    formalReadiness: boundDisplayText("正式啟用前需要完成", maxDisplayTextLength),
    integrationStatus: boundDisplayText("未來模組整合狀態", maxDisplayTextLength),
    mvpScope: boundDisplayText("MVP 範圍邊界", maxDisplayTextLength),
    currentStatus: boundDisplayText("目前狀態", maxDisplayTextLength),
    implementationOrder: boundDisplayText("建議實作順序", maxDisplayTextLength),
    backendFoundation: boundDisplayText("後端基礎邊界", maxDisplayTextLength),
    externalDataBoundary: boundDisplayText("外部資料邊界", maxDisplayTextLength),
    doctorStatus: boundDisplayText("醫師合作整合狀態", maxDisplayTextLength),
    healthStatus: boundDisplayText("健康串接整合狀態", maxDisplayTextLength),
    communityStatus: boundDisplayText("社群整合狀態", maxDisplayTextLength),
    rankingStatus: boundDisplayText("排行榜整合狀態", maxDisplayTextLength),
    returnFutureModules: boundDisplayText("返回未來擴充", maxDisplayTextLength),
    viewPreview: boundDisplayText("查看預覽 ›", maxDisplayTextLength),
    viewIntegration: boundDisplayText("查看整合狀態 ›", maxDisplayTextLength),
    doctorTokenButton,
    doctorTokenAccessibility: boundDisplayText(`${doctorTokenButton}，只顯示授權碼與 share token 邊界`, maxDisplayDetailTextLength),
    doctorReportButton,
    doctorReportAccessibility: boundDisplayText(`${doctorReportButton}，只顯示報表與醫師端唯讀邊界`, maxDisplayDetailTextLength),
    healthPermissionButton,
    healthPermissionAccessibility: boundDisplayText(`${healthPermissionButton}，不請求平台權限或讀取健康資料`, maxDisplayDetailTextLength),
    healthMeterButton,
    healthMeterAccessibility: boundDisplayText(`${healthMeterButton}，不掃描血糖機或寫入紀錄`, maxDisplayDetailTextLength),
    communityPostButton,
    communityPostAccessibility: boundDisplayText(`${communityPostButton}，不建立貼文或公開紀錄`, maxDisplayDetailTextLength),
    communityPrivacyButton,
    communityPrivacyAccessibility: boundDisplayText(`${communityPrivacyButton}，只顯示公開資料邊界`, maxDisplayDetailTextLength),
    rankingPublicButton,
    rankingPublicAccessibility: boundDisplayText(`${rankingPublicButton}，只讀取 opt-in 公開榜單，不公開健康數值`, maxDisplayDetailTextLength),
    rankingOptInButton,
    rankingOptInAccessibility: boundDisplayText(`${rankingOptInButton}，只顯示公開排名 opt-in 邊界`, maxDisplayDetailTextLength),
    returnFutureModulesAccessibility: boundDisplayText("返回未來擴充，不建立 future module 資料或呼叫 backend", maxDisplayDetailTextLength)
  };
}
