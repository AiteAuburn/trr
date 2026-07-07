import {
  boundParsePreviewResponse,
  boundRecordItem,
  boundRecordsList,
  type ParsePreviewResponse,
  type RecordItem
} from "./recordBounds";
import {
  boundBasicReport,
  type BasicReportTransformSource
} from "./analysisDataTransforms";
import {
  recordPayloadToEditFields,
  type RecordEditFields
} from "./recordEditTransforms";
import type { AppScreen } from "./navigationConfig";

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function visualSmokeDemoDate(hoursAgo: number) {
  const value = new Date(Date.now() - clampNumber(hoursAgo, 1, 72) * 60 * 60 * 1000);
  value.setSeconds(0, 0);
  return value;
}

function visualSmokeDemoOccurredAt() {
  const value = visualSmokeDemoDate(3);
  value.setMinutes(10, 0, 0);
  return value.toISOString();
}

function visualSmokeDemoIsoAt(hoursAgo: number, minute: number) {
  const value = visualSmokeDemoDate(hoursAgo);
  value.setMinutes(minute, 0, 0);
  return value.toISOString();
}

export function visualSmokeDemoRecord(): RecordItem {
  return boundRecordItem({
    id: "visual-smoke-record-001",
    profile_id: "visual-smoke-profile",
    record_type: "glucose",
    occurred_at: visualSmokeDemoOccurredAt(),
    payload_json: {
      value: 138,
      unit: "mg/dL",
      meal_timing: "fasting"
    },
    metadata_json: {},
    source: "visual_smoke_demo",
    created_at: visualSmokeDemoIsoAt(3, 12)
  });
}

export function visualSmokeDemoRecords(): RecordItem[] {
  return boundRecordsList([
    visualSmokeDemoRecord(),
    {
      id: "visual-smoke-record-002",
      profile_id: "visual-smoke-profile",
      record_type: "meal",
      occurred_at: visualSmokeDemoIsoAt(2, 30),
      payload_json: {
        meal_type: "breakfast",
        food_items: [{ name: "水煮蛋" }, { name: "無糖豆漿" }]
      },
      metadata_json: {},
      source: "visual_smoke_demo",
      created_at: visualSmokeDemoIsoAt(2, 32)
    },
    {
      id: "visual-smoke-record-003",
      profile_id: "visual-smoke-profile",
      record_type: "exercise",
      occurred_at: visualSmokeDemoIsoAt(1, 50),
      payload_json: {
        activity: "步行",
        minutes: 25
      },
      metadata_json: {},
      source: "visual_smoke_demo",
      created_at: visualSmokeDemoIsoAt(1, 52)
    }
  ]);
}

export function visualSmokeDemoPreview(): ParsePreviewResponse {
  return boundParsePreviewResponse({
    transcript: "",
    normalized_text: "",
    stt_model_id: "visual-smoke-stt",
    llm_model_id: "visual-smoke-parser",
    segments: [
      {
        segment_id: "visual-smoke-segment-001",
        segment_type: "glucose",
        source_text: "Visual smoke demo text only.",
        confidence: 0.99
      }
    ],
    records: [
      {
        profile_id: "visual-smoke-profile",
        record_type: "glucose",
        occurred_at: visualSmokeDemoOccurredAt(),
        payload_json: {
          value: 138,
          unit: "mg/dL",
          meal_timing: "fasting"
        },
        metadata_json: {
          source_text: "Visual smoke demo text only."
        },
        source: "visual_smoke_demo",
        confidence: 0.99,
        decision_trace: "visual-smoke-local-seed"
      }
    ],
    rejected_events: []
  });
}

export function visualSmokeDemoReport(): BasicReportTransformSource {
  return boundBasicReport({
    profile_id: "visual-smoke-profile",
    generated_at: visualSmokeDemoIsoAt(0, 0),
    record_count: 3,
    glucose: {
      count: 1,
      before_meal_count: 1,
      after_meal_count: 0,
      average: 138,
      minimum: 138,
      maximum: 138,
      latest_value: 138,
      latest_recorded_at: visualSmokeDemoOccurredAt()
    },
    meals: {
      count: 1
    },
    lifestyle: {
      exercise_count: 1,
      medication_count: 0,
      lifestyle_count: 1,
      note_count: 0
    }
  });
}

export function visualSmokeDemoRecordEditFields(): RecordEditFields {
  return recordPayloadToEditFields(visualSmokeDemoRecord());
}

export function visualSmokeNeedsPreview(screen: AppScreen | null) {
  return (
    screen === "aiReview" ||
    screen === "editPreviewRecord" ||
    screen === "aiRemoveConfirm" ||
    screen === "aiSaveConfirm" ||
    screen === "aiSaveFailure"
  );
}

export function visualSmokeNeedsRecord(screen: AppScreen | null) {
  return (
    screen === "today" ||
    screen === "history" ||
    screen === "analysis" ||
    screen === "detailedReport" ||
    screen === "recordDetail" ||
    screen === "editRecord" ||
    screen === "deleteConfirm" ||
    screen === "deleteSuccess" ||
    screen === "updateSuccess" ||
    screen === "saveSuccess"
  );
}

export function visualSmokeNeedsSelectedRecord(screen: AppScreen | null) {
  return (
    screen === "recordDetail" ||
    screen === "editRecord" ||
    screen === "deleteConfirm" ||
    screen === "updateSuccess" ||
    screen === "saveSuccess"
  );
}
