const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string, maxLength = 80) {
  return value.slice(0, maxLength);
}

type ProfileChoiceDisplaySource = {
  id: string;
  display_name: string;
};

type ModelChoiceDisplaySource = {
  id: string;
  label: string;
  available: boolean;
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
