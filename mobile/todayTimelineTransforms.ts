import { boundDisplayText, clampNumber, maxMobileCountValue } from "./mobileBounds";
import type { RecordItem } from "./recordBounds";
import { recordListDisplayItems } from "./recordDisplay";

export type TodayTimelineSummary = {
  latestGlucoseValue: string;
  latestGlucoseMeta: string;
  recordCountText: string;
  exerciseMinutesText: string;
};

function occurredAtMs(record: RecordItem) {
  const ms = new Date(record.occurred_at).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

/** 24-hour "07:30" so the narrow time column never wraps an AM/PM suffix. */
export function todayTimelineClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Today's records oldest-first, so the timeline reads like the day went. */
export function todayTimelineDisplayItems(todayRecords: RecordItem[]) {
  const ordered = [...todayRecords].sort((a, b) => occurredAtMs(a) - occurredAtMs(b));
  return recordListDisplayItems(ordered, "today-timeline").map((item) => ({
    ...item,
    timeLabel: todayTimelineClock(item.record.occurred_at)
  }));
}

function finiteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function todayTimelineSummary(todayRecords: RecordItem[]): TodayTimelineSummary {
  const glucoseRecords = todayRecords
    .filter((record) => record.record_type === "glucose" && finiteNumber(record.payload_json?.value) !== null)
    .sort((a, b) => occurredAtMs(b) - occurredAtMs(a));
  const latestGlucose = glucoseRecords[0];
  const exerciseMinutes = todayRecords
    .filter((record) => record.record_type === "exercise")
    .reduce((total, record) => total + Math.max(0, finiteNumber(record.payload_json?.minutes) ?? 0), 0);
  const unit = latestGlucose ? boundDisplayText(String(latestGlucose.payload_json?.unit || "mg/dL"), 20) : "";
  return {
    latestGlucoseValue: latestGlucose
      ? boundDisplayText(String(finiteNumber(latestGlucose.payload_json?.value)), 20)
      : "—",
    latestGlucoseMeta: latestGlucose ? `${unit} · ${todayTimelineClock(latestGlucose.occurred_at)}` : "還沒量",
    recordCountText: String(clampNumber(todayRecords.length, 0, maxMobileCountValue)),
    exerciseMinutesText: String(clampNumber(Math.round(exerciseMinutes), 0, maxMobileCountValue))
  };
}
