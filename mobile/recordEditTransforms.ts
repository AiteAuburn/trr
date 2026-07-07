import { parseLocalDateTimeInput } from "./dateTimeTransforms";
import { textValue } from "./recordDisplay";

export type ManualRecordType = "glucose" | "meal" | "exercise" | "medication" | "note";

export type RecordEditFields = {
  glucoseValue: string;
  glucoseUnit: string;
  glucoseTiming: string;
  mealType: string;
  foodItems: string;
  exerciseActivity: string;
  exerciseMinutes: string;
  medicationName: string;
  medicationDose: string;
  noteKind: string;
  noteTags: string;
  fallbackJson: string;
};

const maxFormTextLength = 160;
const maxFormLongTextLength = 500;
const maxFormJsonTextLength = 4000;
const maxListItems = 12;

export const manualRecordTypes: Array<{ id: ManualRecordType; label: string }> = [
  { id: "glucose", label: "血糖" },
  { id: "meal", label: "飲食" },
  { id: "exercise", label: "運動" },
  { id: "medication", label: "用藥" },
  { id: "note", label: "備註" }
];

export const glucoseUnitOptions = ["mg/dL", "mmol/L"] as const;

export const glucoseTimingOptions = [
  ["fasting", "空腹"],
  ["before_meal", "飯前"],
  ["after_meal", "飯後"],
  ["bedtime", "睡前"],
  ["unknown", "未指定"]
] as const;

export const mealTypeOptions = [
  ["breakfast", "早餐"],
  ["lunch", "午餐"],
  ["dinner", "晚餐"],
  ["snack", "點心"],
  ["unknown", "未指定"]
] as const;

export function recordEditFieldMaxLength(field: keyof RecordEditFields) {
  if (field === "fallbackJson") {
    return maxFormJsonTextLength;
  }
  if (field === "foodItems" || field === "noteTags") {
    return maxFormLongTextLength;
  }
  return maxFormTextLength;
}

export function boundRecordEditField<K extends keyof RecordEditFields>(
  field: K,
  value: RecordEditFields[K]
): RecordEditFields[K] {
  return value.slice(0, recordEditFieldMaxLength(field)) as RecordEditFields[K];
}

export function emptyRecordEditFields(): RecordEditFields {
  return {
    glucoseValue: "",
    glucoseUnit: "mg/dL",
    glucoseTiming: "unknown",
    mealType: "unknown",
    foodItems: "",
    exerciseActivity: "",
    exerciseMinutes: "",
    medicationName: "",
    medicationDose: "",
    noteKind: "",
    noteTags: "",
    fallbackJson: "{}"
  };
}

export function recordPayloadToEditFields(record: { record_type: string; payload_json: Record<string, unknown> }): RecordEditFields {
  const fields = emptyRecordEditFields();
  const payload = record.payload_json;
  fields.fallbackJson = boundRecordEditField("fallbackJson", JSON.stringify(payload, null, 2));

  if (record.record_type === "glucose") {
    fields.glucoseValue = boundRecordEditField(
      "glucoseValue",
      payload.value === undefined || payload.value === null ? "" : String(payload.value)
    );
    fields.glucoseUnit = boundRecordEditField("glucoseUnit", textValue(payload.unit) || "mg/dL");
    fields.glucoseTiming = boundRecordEditField("glucoseTiming", textValue(payload.meal_timing) || "unknown");
  }

  if (record.record_type === "meal") {
    fields.mealType = boundRecordEditField("mealType", textValue(payload.meal_type) || "unknown");
    if (Array.isArray(payload.food_items)) {
      fields.foodItems = boundRecordEditField(
        "foodItems",
        payload.food_items
          .slice(0, maxListItems)
          .map((item) => {
            if (!item || typeof item !== "object") {
              return "";
            }
            const candidate = item as Record<string, unknown>;
            const name = textValue(candidate.name);
            const amount = textValue(candidate.amount);
            return [name, amount].filter(Boolean).join(" ");
          })
          .filter(Boolean)
          .join("、")
      );
    }
  }

  if (record.record_type === "exercise") {
    fields.exerciseActivity = boundRecordEditField("exerciseActivity", textValue(payload.activity));
    fields.exerciseMinutes = boundRecordEditField(
      "exerciseMinutes",
      payload.minutes === undefined || payload.minutes === null ? "" : String(payload.minutes)
    );
  }

  if (record.record_type === "medication") {
    fields.medicationName = boundRecordEditField("medicationName", textValue(payload.name));
    fields.medicationDose = boundRecordEditField(
      "medicationDose",
      textValue(payload.dose) || textValue(payload.dose_text)
    );
  }

  if (record.record_type === "note") {
    fields.noteKind = boundRecordEditField("noteKind", textValue(payload.kind));
    fields.noteTags = boundRecordEditField(
      "noteTags",
      Array.isArray(payload.tags)
        ? payload.tags
            .slice(0, maxListItems)
            .filter((tag): tag is string => typeof tag === "string")
            .join("、")
        : ""
    );
  }

  return fields;
}

export function splitListText(value: string) {
  return value
    .split(/[、,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxListItems);
}

export function isTooLong(value: string, maxLength = maxFormTextLength) {
  return value.trim().length > maxLength;
}

export function validateRecordForm(
  recordType: string,
  fields: RecordEditFields,
  dateText: string,
  timeText: string
) {
  try {
    parseLocalDateTimeInput(dateText, timeText);
  } catch (error) {
    return error instanceof Error ? error.message : "日期或時間格式不正確";
  }

  if (recordType === "glucose") {
    const value = Number(fields.glucoseValue);
    if (!fields.glucoseValue.trim() || !Number.isFinite(value) || value < 20 || value > 600) {
      return "血糖數值需介於 20 到 600";
    }
    return null;
  }

  if (recordType === "meal") {
    const foodItems = splitListText(fields.foodItems);
    if (isTooLong(fields.foodItems, maxFormLongTextLength)) {
      return "飲食內容過長，請縮短後再儲存";
    }
    if (foodItems.length === 0) {
      return "請至少輸入一項飲食內容";
    }
    return null;
  }

  if (recordType === "exercise") {
    if (isTooLong(fields.exerciseActivity)) {
      return "運動類型過長，請縮短後再儲存";
    }
    if (!fields.exerciseActivity.trim()) {
      return "請輸入運動類型";
    }
    if (fields.exerciseMinutes.trim()) {
      const minutes = Number(fields.exerciseMinutes);
      if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) {
        return "運動時長需介於 0 到 1440 分鐘";
      }
    }
    return null;
  }

  if (recordType === "medication") {
    if (isTooLong(fields.medicationName) || isTooLong(fields.medicationDose)) {
      return "用藥欄位過長，請縮短後再儲存";
    }
    if (!fields.medicationName.trim()) {
      return "請輸入藥名或胰島素描述";
    }
    return null;
  }

  if (recordType === "note") {
    if (isTooLong(fields.noteKind) || isTooLong(fields.noteTags, maxFormLongTextLength)) {
      return "備註欄位過長，請縮短後再儲存";
    }
    if (!fields.noteKind.trim() && splitListText(fields.noteTags).length === 0) {
      return "備註需至少輸入類型或標籤";
    }
    return null;
  }

  try {
    if (fields.fallbackJson.length > maxFormJsonTextLength) {
      return "payload_json 過長，請縮短後再儲存";
    }
    const payload = JSON.parse(fields.fallbackJson) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return "payload_json 必須是物件";
    }
  } catch {
    return "payload_json 不是有效 JSON";
  }
  return null;
}

export function buildPayloadFromEditFields(recordType: string, fields: RecordEditFields) {
  if (recordType === "glucose") {
    return {
      value: Number(fields.glucoseValue),
      unit: fields.glucoseUnit || "mg/dL",
      meal_timing: fields.glucoseTiming || "unknown"
    };
  }

  if (recordType === "meal") {
    return {
      meal_type: fields.mealType || "unknown",
      food_items: splitListText(fields.foodItems).map((name) => ({ name }))
    };
  }

  if (recordType === "exercise") {
    return {
      activity: fields.exerciseActivity.trim(),
      minutes: fields.exerciseMinutes.trim() ? Number(fields.exerciseMinutes) : undefined
    };
  }

  if (recordType === "medication") {
    return {
      name: fields.medicationName.trim(),
      dose: fields.medicationDose.trim() || undefined
    };
  }

  if (recordType === "note") {
    const tags = splitListText(fields.noteTags);
    return {
      kind: fields.noteKind.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined
    };
  }

  return JSON.parse(fields.fallbackJson) as Record<string, unknown>;
}
