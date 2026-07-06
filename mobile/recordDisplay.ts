const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxListItems = 12;

export type DailyRecordSectionId = "glucose" | "meal" | "exercise" | "weight" | "medication" | "note";

export type DailyRecordSectionDefinition = {
  id: DailyRecordSectionId;
  title: string;
  icon: string;
  acceptedRecordTypes: string[];
  emptyCopy: string;
};

export const dailyRecordSectionDefinitions: DailyRecordSectionDefinition[] = [
  {
    id: "glucose",
    title: "血糖紀錄",
    icon: "🩸",
    acceptedRecordTypes: ["glucose"],
    emptyCopy: "今天尚未提到血糖；保持空白。"
  },
  {
    id: "meal",
    title: "飲食紀錄",
    icon: "🍽️",
    acceptedRecordTypes: ["meal"],
    emptyCopy: "今天尚未提到飲食；保持空白。"
  },
  {
    id: "exercise",
    title: "運動紀錄",
    icon: "🏃",
    acceptedRecordTypes: ["exercise"],
    emptyCopy: "今天尚未提到運動；保持空白。"
  },
  {
    id: "weight",
    title: "體重紀錄",
    icon: "⚖️",
    acceptedRecordTypes: ["weight", "body_measurement"],
    emptyCopy: "今天尚未提到體重；保持空白。"
  },
  {
    id: "medication",
    title: "用藥紀錄",
    icon: "💊",
    acceptedRecordTypes: ["medication"],
    emptyCopy: "今天尚未提到用藥；保持空白。"
  },
  {
    id: "note",
    title: "其他備註",
    icon: "😊",
    acceptedRecordTypes: ["note"],
    emptyCopy: "今天尚未提到其他備註；保持空白。"
  }
];

export function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

export function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

export function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function displayTextValue(value: unknown, maxLength = maxDisplayTextLength) {
  return boundDisplayText(textValue(value), maxLength);
}

export function displayJsonPayload(payload: Record<string, unknown>) {
  try {
    return boundDisplayText(JSON.stringify(payload), maxDisplayDetailTextLength);
  } catch {
    return "payload 無法顯示";
  }
}

export function displayPayload(recordType: string, payload: Record<string, unknown>) {
  if (recordType === "glucose") {
    const unit = displayTextValue(payload.unit, 20) || "mg/dL";
    const timing = payload.meal_timing ? ` · ${glucoseTimingLabel(payload.meal_timing)}` : "";
    return payload.value === undefined
      ? displayJsonPayload(payload)
      : boundDisplayText(`血糖 ${boundDisplayText(String(payload.value), 20)} ${unit}${timing}`);
  }

  if (recordType === "meal") {
    const items = payload.food_items;
    if (Array.isArray(items)) {
      const names = items
        .slice(0, maxListItems)
        .map((item) =>
          typeof item === "object" && item !== null && "name" in item
            ? displayTextValue((item as { name: unknown }).name, 40)
            : ""
        )
        .filter(Boolean);
      if (names.length > 0) {
        return boundDisplayText(`飲食：${names.join("、")}`);
      }
    }
  }

  if (recordType === "exercise") {
    const activity = displayTextValue(payload.activity, 60) || "運動";
    const minutes = payload.minutes;
    return minutes === undefined || minutes === null
      ? activity
      : boundDisplayText(`${activity} ${boundDisplayText(String(minutes), 20)} 分鐘`);
  }

  if (recordType === "medication") {
    return boundDisplayText(`用藥：${displayTextValue(payload.name, 60) || "未命名"}`);
  }

  if (recordType === "weight" || recordType === "body_measurement") {
    const kind = displayTextValue(payload.kind, 40);
    const value = payload.value;
    const unit = displayTextValue(payload.unit, 20) || "kg";
    if (value !== undefined && (!kind || kind === "weight")) {
      return boundDisplayText(`體重 ${boundDisplayText(String(value), 20)} ${unit}`);
    }
  }

  return displayJsonPayload(payload);
}

export function recordTypeLabel(recordType: string) {
  if (recordType === "glucose") {
    return "血糖";
  }
  if (recordType === "meal") {
    return "飲食";
  }
  if (recordType === "exercise") {
    return "運動";
  }
  if (recordType === "medication") {
    return "用藥";
  }
  if (recordType === "note") {
    return "備註";
  }
  if (recordType === "weight" || recordType === "body_measurement") {
    return "體重";
  }
  return boundDisplayText(recordType, 40);
}

export function recordTypeIcon(recordType: string) {
  if (recordType === "glucose") {
    return "💧";
  }
  if (recordType === "meal") {
    return "🥣";
  }
  if (recordType === "exercise") {
    return "🚶";
  }
  if (recordType === "medication") {
    return "💊";
  }
  if (recordType === "note") {
    return "📝";
  }
  if (recordType === "weight" || recordType === "body_measurement") {
    return "⚖️";
  }
  return "•";
}

export function glucoseTimingLabel(value: unknown) {
  if (value === "fasting") {
    return "空腹";
  }
  if (value === "before_meal") {
    return "飯前";
  }
  if (value === "after_meal") {
    return "飯後";
  }
  if (value === "bedtime") {
    return "睡前";
  }
  return "未指定";
}

export function mealTypeLabel(value: unknown) {
  if (value === "breakfast") {
    return "早餐";
  }
  if (value === "lunch") {
    return "午餐";
  }
  if (value === "dinner") {
    return "晚餐";
  }
  if (value === "snack") {
    return "點心";
  }
  return "未指定";
}

export function foodItemsLabel(value: unknown) {
  if (!Array.isArray(value)) {
    return "未填寫";
  }
  const items = value
    .slice(0, maxListItems)
    .map((item) => {
      if (!item || typeof item !== "object") {
        return "";
      }
      const candidate = item as Record<string, unknown>;
      return [displayTextValue(candidate.name, 40), displayTextValue(candidate.amount, 30)]
        .filter(Boolean)
        .join(" ");
    })
    .filter(Boolean);
  return items.length > 0 ? boundDisplayText(items.join("、"), maxDisplayDetailTextLength) : "未填寫";
}

export function recordPayloadDetailRows(recordType: string, payload: Record<string, unknown>) {
  if (recordType === "glucose") {
    const unit = displayTextValue(payload.unit, 20) || "mg/dL";
    return [
      { label: "測量情境", value: glucoseTimingLabel(payload.meal_timing) },
      {
        label: "血糖值",
        value: payload.value === undefined ? "未填寫" : `${boundDisplayText(String(payload.value), 20)} ${unit}`
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "meal") {
    return [
      { label: "餐別", value: mealTypeLabel(payload.meal_type) },
      { label: "飲食內容", value: foodItemsLabel(payload.food_items) },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "exercise") {
    return [
      { label: "運動內容", value: displayTextValue(payload.activity, maxDisplayDetailTextLength) || "未填寫" },
      {
        label: "運動時長",
        value: payload.minutes === undefined ? "未填寫" : `${boundDisplayText(String(payload.minutes), 20)} 分鐘`
      },
      { label: "強度／備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "medication") {
    return [
      { label: "藥物名稱", value: displayTextValue(payload.name, maxDisplayDetailTextLength) || "未填寫" },
      {
        label: "劑量",
        value:
          displayTextValue(payload.dose, maxDisplayDetailTextLength) ||
          displayTextValue(payload.dose_text, maxDisplayDetailTextLength) ||
          "未填寫"
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "weight" || recordType === "body_measurement") {
    const kind = displayTextValue(payload.kind, maxDisplayDetailTextLength) || "weight";
    const unit = displayTextValue(payload.unit, 20) || "kg";
    return [
      { label: "類型", value: kind === "weight" ? "體重" : kind },
      {
        label: "體重",
        value: payload.value === undefined ? "未填寫" : `${boundDisplayText(String(payload.value), 20)} ${unit}`
      },
      { label: "備註", value: displayTextValue(payload.note, maxDisplayDetailTextLength) || "無" }
    ];
  }

  if (recordType === "note") {
    const tags = Array.isArray(payload.tags)
      ? payload.tags
          .slice(0, maxListItems)
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => boundDisplayText(tag, 40))
          .join("、")
      : "";
    return [
      { label: "類型", value: displayTextValue(payload.kind, maxDisplayDetailTextLength) || "未填寫" },
      { label: "標籤", value: boundDisplayText(tags, maxDisplayDetailTextLength) || "無" }
    ];
  }

  return [{ label: "payload", value: displayJsonPayload(payload) }];
}
