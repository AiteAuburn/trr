import { daysAgo, formatChartDateLabel, localDateKey } from "./dateTimeTransforms";
import type { RecordItem } from "./recordBounds";

const maxMobileCountValue = 1_000_000;
const maxMobileGlucoseValue = 1000;

export type AnalysisGlucoseRecord = {
  record: RecordItem;
  value: number;
};

export type BasicReportTransformSource = {
  profile_id: string;
  generated_at: string;
  record_count: number;
  glucose: {
    count: number;
    before_meal_count: number;
    after_meal_count: number;
    average: number | null;
    minimum: number | null;
    maximum: number | null;
    latest_value: number | null;
    latest_recorded_at: string | null;
  };
  meals: {
    count: number;
  };
  lifestyle: {
    exercise_count: number;
    medication_count: number;
    lifestyle_count: number;
    note_count: number;
  };
};

export type AnalysisChartPoint = {
  id: string;
  label: string;
  value: number;
  preview: boolean;
};

export type AnalysisDateBounds = {
  start: Date;
  end: Date;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function clampNullableNumber(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return clampNumber(value, min, max);
}

function boundDisplayText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, 80);
}

function boundOptionalDateTime(value?: string | null) {
  return typeof value === "string" ? boundDisplayText(value, 40) : null;
}

export function boundBasicReport<T extends BasicReportTransformSource>(value: T): T {
  return {
    ...value,
    profile_id: boundIdentifier(value.profile_id),
    generated_at: boundDisplayText(value.generated_at, 40),
    record_count: clampNumber(value.record_count, 0, maxMobileCountValue),
    glucose: {
      ...value.glucose,
      count: clampNumber(value.glucose.count, 0, maxMobileCountValue),
      before_meal_count: clampNumber(value.glucose.before_meal_count, 0, maxMobileCountValue),
      after_meal_count: clampNumber(value.glucose.after_meal_count, 0, maxMobileCountValue),
      average: clampNullableNumber(value.glucose.average, 0, maxMobileGlucoseValue),
      minimum: clampNullableNumber(value.glucose.minimum, 0, maxMobileGlucoseValue),
      maximum: clampNullableNumber(value.glucose.maximum, 0, maxMobileGlucoseValue),
      latest_value: clampNullableNumber(value.glucose.latest_value, 0, maxMobileGlucoseValue),
      latest_recorded_at: boundOptionalDateTime(value.glucose.latest_recorded_at)
    },
    meals: {
      ...value.meals,
      count: clampNumber(value.meals.count, 0, maxMobileCountValue)
    },
    lifestyle: {
      ...value.lifestyle,
      exercise_count: clampNumber(value.lifestyle.exercise_count, 0, maxMobileCountValue),
      medication_count: clampNumber(value.lifestyle.medication_count, 0, maxMobileCountValue),
      lifestyle_count: clampNumber(value.lifestyle.lifestyle_count, 0, maxMobileCountValue),
      note_count: clampNumber(value.lifestyle.note_count, 0, maxMobileCountValue)
    }
  };
}

export function normalizedGlucoseTiming(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isBeforeMealGlucoseTiming(value: unknown) {
  const timing = normalizedGlucoseTiming(value);
  return timing === "fasting" || timing === "before_meal" || timing === "before-meal" || timing === "before";
}

export function isAfterMealGlucoseTiming(value: unknown) {
  const timing = normalizedGlucoseTiming(value);
  return timing === "after_meal" || timing === "after-meal" || timing === "after";
}

export function analysisRecordsInDateRange(records: RecordItem[], bounds: AnalysisDateBounds) {
  return records.filter((record) => {
    const occurredAt = new Date(record.occurred_at);
    return occurredAt >= bounds.start && occurredAt <= bounds.end;
  });
}

export function analysisGlucoseRecords(records: RecordItem[]): AnalysisGlucoseRecord[] {
  return records
    .map((record) => ({
      record,
      value:
        record.record_type === "glucose" && typeof record.payload_json.value === "number"
          ? record.payload_json.value
          : null
    }))
    .filter((entry): entry is AnalysisGlucoseRecord => entry.value !== null);
}

export function analysisGlucoseValues(records: AnalysisGlucoseRecord[]) {
  return records.map((entry) => entry.value);
}

export function analysisChartPoints(records: AnalysisGlucoseRecord[]): AnalysisChartPoint[] {
  if (records.length === 0) {
    return [];
  }
  return records.slice(-12).map(({ record, value }) => ({
    id: record.id,
    label: formatChartDateLabel(record.occurred_at),
    value,
    preview: false
  }));
}

export function analysisChartRange(points: AnalysisChartPoint[]) {
  const values = points.map((point) => point.value);
  const minimum = values.length > 0 ? Math.min(...values, 80) : 80;
  const maximum = values.length > 0 ? Math.max(...values, 220) : 220;
  return {
    minimum,
    maximum,
    range: Math.max(1, maximum - minimum)
  };
}

export function selectedAnalysisChartPoint(points: AnalysisChartPoint[], index: number | null) {
  return index === null ? null : points[index] ?? null;
}

export function averageNumber(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function highestNumber(values: number[]) {
  return values.length === 0 ? null : Math.max(...values);
}

export function lowestNumber(values: number[]) {
  return values.length === 0 ? null : Math.min(...values);
}

export function beforeMealGlucoseCount(records: AnalysisGlucoseRecord[]) {
  return records.filter(({ record }) => isBeforeMealGlucoseTiming(record.payload_json.meal_timing)).length;
}

export function afterMealGlucoseCount(records: AnalysisGlucoseRecord[]) {
  return records.filter(({ record }) => isAfterMealGlucoseTiming(record.payload_json.meal_timing)).length;
}

export function recordTypeCount(records: RecordItem[], recordType: string) {
  return records.filter((record) => record.record_type === recordType).length;
}

export function recordsInYear(records: RecordItem[], targetYear: number) {
  return records.filter((record) => {
    const occurredAt = new Date(record.occurred_at);
    return !Number.isNaN(occurredAt.getTime()) && occurredAt.getFullYear() === targetYear;
  });
}

export function currentRecordStreakDays(records: RecordItem[]) {
  const recordedDays = new Set(records.map((record) => localDateKey(record.occurred_at)).filter(Boolean));
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = localDateKey(daysAgo(offset));
    if (!recordedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export function currentRecordTypeStreakDays(records: RecordItem[], recordType: string) {
  const recordedDays = new Set(
    records
      .filter((record) => record.record_type === recordType)
      .map((record) => localDateKey(record.occurred_at))
      .filter(Boolean)
  );
  let streak = 0;
  for (let offset = 0; offset < 366; offset += 1) {
    const day = localDateKey(daysAgo(offset));
    if (!recordedDays.has(day)) {
      break;
    }
    streak += 1;
  }
  return streak;
}

export function uniqueRecordDaysInLast(records: RecordItem[], days: number, predicate: (record: RecordItem) => boolean) {
  const start = daysAgo(days - 1);
  const now = new Date();
  const daysWithRecords = new Set<string>();
  for (const record of records) {
    const occurredAt = new Date(record.occurred_at);
    if (occurredAt >= start && occurredAt <= now && predicate(record)) {
      daysWithRecords.add(localDateKey(occurredAt));
    }
  }
  return daysWithRecords.size;
}

export function longestRecordStreakDays(records: RecordItem[]) {
  const sortedDays = Array.from(
    new Set(records.map((record) => localDateKey(record.occurred_at)).filter(Boolean))
  ).sort();
  let longest = 0;
  let current = 0;
  let previousTime: number | null = null;

  for (const day of sortedDays) {
    const currentTime = new Date(`${day}T00:00:00`).getTime();
    if (previousTime === null || currentTime - previousTime === 86_400_000) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    previousTime = currentTime;
  }

  return longest;
}
