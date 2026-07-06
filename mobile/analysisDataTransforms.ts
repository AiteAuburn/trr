import { formatChartDateLabel } from "./dateTimeTransforms";
import type { RecordItem } from "./recordBounds";

export type AnalysisGlucoseRecord = {
  record: RecordItem;
  value: number;
};

export type AnalysisChartPoint = {
  id: string;
  label: string;
  value: number;
  preview: boolean;
};

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
