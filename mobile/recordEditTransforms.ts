import { textValue } from "./recordDisplay";

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
