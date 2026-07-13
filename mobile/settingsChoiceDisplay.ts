import { authSessionDisplayListItems, type AuthSessionDisplaySource } from "./authSessionDisplay";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxNativeDebugInputLength = 1024;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string, maxLength = 80) {
  return value.slice(0, maxLength);
}

function boundUiMessage(value: string) {
  return value.slice(0, 300);
}

function boundNativeDebugInput(value: string) {
  return value.slice(0, maxNativeDebugInputLength);
}

export type ProfileChoiceDisplaySource = {
  id: string;
  display_name: string;
};

export type ModelChoiceDisplaySource = {
  id: string;
  label: string;
  available: boolean;
};

type DownloadedModelDisplaySource = {
  kind: string;
  fileName: string;
  uri: string;
  md5?: string;
  exists?: boolean;
};

function displayTextValue(value: unknown, maxLength = maxDisplayDetailTextLength) {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return boundDisplayText(value, maxLength);
  }
  return boundDisplayText(String(value), maxLength);
}

export function modelOptionDisplayLabel(model: ModelChoiceDisplaySource) {
  const label = displayTextValue(model.label, 80);
  return boundDisplayText(model.available ? label : `${label}（未啟用）`, 100);
}

export function settingsProfileChoiceDisplayItem(profile: ProfileChoiceDisplaySource) {
  const label = boundDisplayText(profile.display_name);
  return {
    id: boundIdentifier(profile.id),
    sourceId: profile.id,
    label,
    accessibilityLabel: boundDisplayText(
      `選擇照護對象：${label}；只切換本機 active profile，不寫入個資`,
      maxDisplayDetailTextLength
    )
  };
}

export function settingsProfileChoiceDisplayItems(profiles: ProfileChoiceDisplaySource[]) {
  return profiles.map(settingsProfileChoiceDisplayItem);
}

export function settingsModelChoiceDisplayItem<T extends ModelChoiceDisplaySource>(model: T, kind: "LLM" | "STT") {
  const label = modelOptionDisplayLabel(model);
  return {
    ...model,
    id: boundIdentifier(model.id),
    sourceId: model.id,
    label,
    accessibilityLabel: boundDisplayText(
      `選擇${kind}模型：${label}；未啟用模型不可選，雲端 fallback 預設停用`,
      maxDisplayDetailTextLength
    )
  };
}

export function settingsModelChoiceDisplayItems<T extends ModelChoiceDisplaySource>(models: T[], kind: "LLM" | "STT") {
  return models.map((model) => settingsModelChoiceDisplayItem(model, kind));
}

export function settingsChoiceDisplayBundle<
  LlmModel extends ModelChoiceDisplaySource,
  SttModel extends ModelChoiceDisplaySource
>(value: {
  profiles: ProfileChoiceDisplaySource[];
  llmModels: LlmModel[];
  sttModels: SttModel[];
  authSessions: AuthSessionDisplaySource[];
}) {
  return {
    profileChoiceDisplayItems: settingsProfileChoiceDisplayItems(value.profiles),
    llmModelChoiceDisplayItems: settingsModelChoiceDisplayItems(value.llmModels, "LLM"),
    sttModelChoiceDisplayItems: settingsModelChoiceDisplayItems(value.sttModels, "STT"),
    authSessionDisplayItems: authSessionDisplayListItems(value.authSessions)
  };
}

export function downloadedModelDisplayLabel(value: DownloadedModelDisplaySource) {
  const fileName = boundDisplayText(value.fileName || "model file", 80);
  const checksum = value.md5 ? ` · md5 ${boundIdentifier(value.md5).slice(0, 12)}` : "";
  return boundUiMessage(`${value.kind} · ${fileName}${checksum}`);
}

export function downloadedWhisperModelDisplayItem(value: DownloadedModelDisplaySource) {
  const fileName = boundDisplayText(value.fileName || "whisper model", 80);
  const checksum = value.md5 ? ` · md5 ${boundIdentifier(value.md5).slice(0, 12)}` : "";
  const label = boundDisplayText(fileName, maxDisplayTextLength);
  const summary = boundDisplayText(`Whisper · ${fileName}${checksum}`, maxDisplayDetailTextLength);
  return {
    sourceUri: boundNativeDebugInput(value.uri),
    label,
    summary,
    selectedLabel: boundDisplayText("使用中", 24),
    accessibilityLabel: boundDisplayText(`選擇本機 Whisper 模型：${fileName}，只用於本機錄音轉文字`, maxDisplayDetailTextLength)
  };
}

export function downloadedWhisperModelDisplayItems(values: DownloadedModelDisplaySource[]) {
  return values
    .filter((model) => model.kind === "whisper" && model.exists)
    .map(downloadedWhisperModelDisplayItem);
}
