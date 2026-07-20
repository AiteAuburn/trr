import type { PendingRecord, RecordItem, RejectedEvent } from "./recordBounds";
import { aiReviewRejectedReasonCopy } from "./recordWorkflowCopy";

const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxIdentifierTextLength = 128;
const maxListItems = 12;
const maxMobileCountValue = 1_000_000;
const maxMobilePreviewRecords = 20;

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

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
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

export function recordTimeDisplay(value?: string) {
  if (!value) {
    return "尚無";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚無";
  }
  return boundDisplayText(
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    }),
    40
  );
}

export function dailyRecordTimeDetailLabel(recordType: string) {
  if (recordType === "glucose" || recordType === "weight" || recordType === "body_measurement") {
    return "測量時間";
  }
  if (recordType === "meal") {
    return "用餐時間";
  }
  if (recordType === "exercise") {
    return "開始時間";
  }
  if (recordType === "medication") {
    return "用藥時間／情境";
  }
  return "時間";
}

export function dailyRecordEntryDisplayItem(record: PendingRecord, index: number) {
  const recordType = boundIdentifier(record.record_type);
  const typeLabel = boundDisplayText(recordTypeLabel(recordType), 80);
  const timeLabel = boundDisplayText(recordTimeDisplay(record.occurred_at), 40);
  const payloadSummary = boundDisplayText(displayPayload(recordType, record.payload_json), maxDisplayDetailTextLength);
  return {
    key: `daily-${recordType}-${clampNumber(index, 0, maxMobilePreviewRecords)}`,
    index: clampNumber(index, 0, maxMobilePreviewRecords),
    typeLabel,
    timeLabel,
    payloadSummary,
    detailRows: [
      {
        label: dailyRecordTimeDetailLabel(recordType),
        value: timeLabel
      },
      ...recordPayloadDetailRows(recordType, record.payload_json)
    ].map((row) => ({
      label: boundDisplayText(row.label, 40),
      value: boundDisplayText(row.value, maxDisplayDetailTextLength)
    })),
    manageLabel: boundDisplayText("⋯", 4),
    accessibilityLabel: boundDisplayText(
      `管理第 ${clampNumber(index + 1, 1, maxMobilePreviewRecords)} 筆${typeLabel}，可編輯或刪除`,
      maxDisplayDetailTextLength
    ),
    editLabel: boundDisplayText("編輯", maxDisplayTextLength),
    editAccessibilityLabel: boundDisplayText(`編輯每日紀錄中的${typeLabel}`, maxDisplayDetailTextLength),
    removeLabel: boundDisplayText("刪除", maxDisplayTextLength),
    removeAccessibilityLabel: boundDisplayText(`刪除每日紀錄中的${typeLabel}`, maxDisplayDetailTextLength)
  };
}

export function buildDailyRecordSectionDisplayItems(records: PendingRecord[]) {
  return dailyRecordSectionDefinitions.map((definition) => {
    const entries = records
      .map((record, index) => ({ record, index }))
      .filter(({ record }) => definition.acceptedRecordTypes.includes(record.record_type))
      .map(({ record, index }) => dailyRecordEntryDisplayItem(record, index));
    return {
      ...definition,
      title: boundDisplayText(definition.title, 80),
      icon: boundDisplayText(definition.icon, 4),
      description: boundDisplayText("欄位依分類顯示；沒有提到的欄位保持空白。", maxDisplayDetailTextLength),
      emptyCopy: boundDisplayText(definition.emptyCopy, maxDisplayDetailTextLength),
      countLabel: boundDisplayText(`${clampNumber(entries.length, 0, maxMobilePreviewRecords)} 筆`, 20),
      entries
    };
  });
}

export function recordListDisplayItem(record: RecordItem, keyPrefix = "record") {
  const typeLabel = boundDisplayText(recordTypeLabel(record.record_type), 80);
  const payloadSummary = boundDisplayText(
    displayPayload(record.record_type, record.payload_json),
    maxDisplayDetailTextLength
  );
  const timeLabel = boundDisplayText(recordTimeDisplay(record.occurred_at), 40);
  return {
    key: `${keyPrefix}-${boundIdentifier(record.id)}`,
    record,
    icon: boundDisplayText(recordTypeIcon(record.record_type), 4),
    typeLabel,
    payloadSummary,
    timeLabel,
    accessibilityLabel: boundDisplayText(`查看${typeLabel}紀錄：${payloadSummary}，時間 ${timeLabel}`, maxDisplayDetailTextLength)
  };
}

export function recordListDisplayItems(records: RecordItem[], keyPrefix = "record") {
  return records.map((record) => recordListDisplayItem(record, keyPrefix));
}

export function groupedRecordListDisplaySections(groupedRecords: Array<readonly [string, RecordItem[]]>) {
  return groupedRecords.map(([date, sectionRecords], sectionIndex) => ({
    key: `history-section-${boundIdentifier(date)}-${clampNumber(sectionIndex, 0, maxMobileCountValue)}`,
    dateLabel: boundDisplayText(date, 40),
    records: recordListDisplayItems(sectionRecords, "history")
  }));
}

export function groupedRecordListDisplaySectionsForRecords(records: RecordItem[]) {
  const groups = new Map<string, RecordItem[]>();
  for (const record of records) {
    const key = new Date(record.occurred_at).toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric",
      weekday: "short"
    });
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return groupedRecordListDisplaySections(Array.from(groups.entries()));
}

export function recordDateDisplay(value?: string) {
  if (!value) {
    return "尚無";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚無";
  }
  return boundDisplayText(date.toLocaleDateString(), 40);
}

export function recordDateTimeDisplay(value?: string) {
  if (!value) {
    return "尚未選擇紀錄";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "尚未選擇紀錄";
  }
  return boundDisplayText(date.toLocaleString(), 80);
}

export function recordSourceDisplay(value?: string) {
  return boundDisplayText(value || "尚無", 40);
}

function shortDecisionTrace(trace?: string) {
  const trimmed = trace?.trim();
  if (!trimmed) {
    return "";
  }
  return boundDisplayText(trimmed, 80);
}

export function confidencePercentDisplay(value: unknown) {
  const numericValue = typeof value === "number" ? value : 0;
  return clampNumber(Math.round(numericValue * 100), 0, 100);
}

export function pendingRecordSourceDisplayText(record: PendingRecord) {
  return typeof record.metadata_json?.source_text === "string"
    ? boundDisplayText(record.metadata_json.source_text, maxDisplayDetailTextLength)
    : "等待使用者確認";
}

export function pendingRecordDisplayItem(record: PendingRecord, index: number, keyPrefix = "candidate") {
  const decisionTrace = shortDecisionTrace(record.decision_trace);
  const lowConfidence = (record.confidence ?? 1) < 0.7;
  const typeLabel = boundDisplayText(recordTypeLabel(record.record_type), 80);
  const payloadSummary = boundDisplayText(
    displayPayload(record.record_type, record.payload_json),
    maxDisplayDetailTextLength
  );
  return {
    key: `${keyPrefix}-${boundIdentifier(record.record_type)}-${clampNumber(index, 0, maxMobilePreviewRecords)}`,
    index,
    record,
    icon: boundDisplayText(recordTypeIcon(record.record_type), 4),
    typeLabel,
    payloadSummary,
    editAccessibilityLabel: boundDisplayText(`修改${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength),
    removeAccessibilityLabel: boundDisplayText(`移除${typeLabel}候選紀錄：${payloadSummary}`, maxDisplayDetailTextLength),
    sourceText: pendingRecordSourceDisplayText(record),
    confidencePercent: confidencePercentDisplay(record.confidence),
    lowConfidence,
    decisionTraceDisplayText: decisionTrace
      ? boundDisplayText(`建立理由：${decisionTrace}`, maxDisplayDetailTextLength)
      : ""
  };
}

export function pendingRecordDisplayItems(records: PendingRecord[], keyPrefix = "candidate") {
  return records.map((record, index) => pendingRecordDisplayItem(record, index, keyPrefix));
}

export function rejectedReasonLabel(reason?: string) {
  const normalized = reason?.trim().toLowerCase();
  if (!normalized) {
    return "未建立原因尚未提供";
  }
  if (normalized.includes("negative")) {
    return "這句像是否定或未量測事件";
  }
  if (normalized.includes("invalid")) {
    return "內容不符合可儲存紀錄格式";
  }
  if (normalized.includes("duplicate")) {
    return "可能與既有候選重複";
  }
  if (normalized.includes("unsupported")) {
    return "目前尚未支援這類紀錄";
  }
  if (normalized.includes("unknown")) {
    return "無法判斷可儲存紀錄類型";
  }
  return boundDisplayText(normalized, 80);
}

export function rejectedPreviewDisplayItems(events: RejectedEvent[]) {
  return events.map((event) => {
    const reasonLabel = boundDisplayText(rejectedReasonLabel(event.reason), 80);
    return {
      id: boundIdentifier(event.segment_id),
      sourceText: boundDisplayText(event.source_text, maxDisplayDetailTextLength),
      reasonLabel,
      reasonDisplayText: aiReviewRejectedReasonCopy(reasonLabel)
    };
  });
}

type RejectedPreviewDisplayItem = ReturnType<typeof rejectedPreviewDisplayItems>[number];

export function rejectedPreviewEventKey(event: RejectedPreviewDisplayItem) {
  return event.id;
}

export function rejectedPreviewEventSourceText(event: RejectedPreviewDisplayItem) {
  return event.sourceText;
}

export function rejectedPreviewEventReasonText(event: RejectedPreviewDisplayItem) {
  return event.reasonDisplayText;
}

export function recordDetailDisplayItem(record: RecordItem) {
  const listItem = recordListDisplayItem(record, "selected");
  return {
    ...listItem,
    dateLabel: boundDisplayText(recordDateDisplay(record.occurred_at), 40),
    dateTimeLabel: boundDisplayText(recordDateTimeDisplay(record.occurred_at), 80),
    sourceLabel: recordSourceDisplay(record.source),
    exerciseSummary:
      record.record_type === "exercise"
        ? boundDisplayText(displayPayload("exercise", record.payload_json), maxDisplayDetailTextLength)
        : "無",
    medicationSummary:
      record.record_type === "medication"
        ? boundDisplayText(displayPayload("medication", record.payload_json), maxDisplayDetailTextLength)
        : "無",
    detailRows: recordPayloadDetailRows(record.record_type, record.payload_json).map((row) => ({
      label: boundDisplayText(row.label, 40),
      value: boundDisplayText(row.value, maxDisplayDetailTextLength)
    }))
  };
}

type RecordDetailDisplayItem = ReturnType<typeof recordDetailDisplayItem>;

export function selectedRecordDetailDateTimeLabel(item: RecordDetailDisplayItem | null) {
  return item?.dateTimeLabel ?? "尚未選擇紀錄";
}

export function selectedRecordDetailDisplayRows(item: RecordDetailDisplayItem | null) {
  return item?.detailRows ?? [];
}

export function selectedRecordDetailDateLabel(item: RecordDetailDisplayItem | null) {
  return item?.dateLabel ?? "尚無";
}

export function selectedRecordDetailExerciseSummary(item: RecordDetailDisplayItem | null) {
  return item?.exerciseSummary ?? "無";
}

export function selectedRecordDetailMedicationSummary(item: RecordDetailDisplayItem | null) {
  return item?.medicationSummary ?? "無";
}

export function selectedRecordDetailPayloadSummary(item: RecordDetailDisplayItem | null) {
  return item?.payloadSummary ?? "沒有資料";
}

export function selectedRecordDetailSourceLabel(item: RecordDetailDisplayItem | null) {
  return item?.sourceLabel ?? "尚無";
}

export function selectedRecordDetailTimeLabel(item: RecordDetailDisplayItem | null) {
  return item?.timeLabel ?? "尚無";
}

export function selectedRecordDetailTypeLabel(item: RecordDetailDisplayItem | null) {
  return item?.typeLabel ?? "請從今日或歷史紀錄選擇一筆真實紀錄。";
}

export function recordEditHeaderTypeLabel(item: RecordDetailDisplayItem | null) {
  return item?.typeLabel ?? "紀錄";
}

export function manualRecordConfirmDisplayItem(
  recordType: string,
  payload: Record<string, unknown> | null,
  date: string,
  time: string
) {
  return {
    icon: boundDisplayText(recordTypeIcon(recordType), 4),
    typeLabel: boundDisplayText(recordTypeLabel(recordType), 80),
    payloadSummary:
      payload === null
        ? "尚未完成必填欄位"
        : boundDisplayText(displayPayload(recordType, payload), maxDisplayDetailTextLength),
    sourceLine: boundDisplayText(`${date} ${time} · source: manual`, maxDisplayDetailTextLength)
  };
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
