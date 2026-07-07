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
