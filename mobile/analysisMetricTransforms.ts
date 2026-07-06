const maxDisplayTextLength = 160;
const maxMobileCountValue = 1_000_000;
const maxMobileGlucoseValue = 1000;

export type MetricRow = {
  label: string;
  value: string;
};

type NullableNumber = number | null | undefined;

type AnalysisMetricInput = {
  average: NullableNumber;
  highest: NullableNumber;
  lowest: NullableNumber;
  glucoseCount: number;
  beforeMealCount: number;
  afterMealCount: number;
};

type DetailedReportMetricInput = {
  average: NullableNumber;
  minimum: NullableNumber;
  maximum: NullableNumber;
  beforeMealCount: number;
  afterMealCount: number;
  mealCount: number;
  exerciseCount: number;
  medicationCount: number;
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

function clampNullableNumber(value: NullableNumber, min: number, max: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return clampNumber(value, min, max);
}

function metricDisplayItem(value: readonly [string, string]): MetricRow {
  return {
    label: boundDisplayText(value[0] || "指標", 60),
    value: boundDisplayText(value[1] || "尚無", 80)
  };
}

export function analysisMetricRows(value: AnalysisMetricInput) {
  const average = clampNullableNumber(value.average, 0, maxMobileGlucoseValue);
  const highest = clampNullableNumber(value.highest, 0, maxMobileGlucoseValue);
  const lowest = clampNullableNumber(value.lowest, 0, maxMobileGlucoseValue);
  const glucoseCount = clampNumber(value.glucoseCount, 0, maxMobileCountValue);
  const beforeMealCount = clampNumber(value.beforeMealCount, 0, maxMobileCountValue);
  const afterMealCount = clampNumber(value.afterMealCount, 0, maxMobileCountValue);
  return ([
    ["最高血糖", highest === null ? "尚無" : String(highest)],
    ["最低血糖", lowest === null ? "尚無" : String(lowest)],
    ["平均血糖", average === null ? "尚無" : String(average)],
    ["血糖測量總次數", String(glucoseCount)],
    ["飯前血糖次數", String(beforeMealCount)],
    ["飯後血糖次數", String(afterMealCount)]
  ] as const).map(metricDisplayItem);
}

export function detailedReportMetricRows(value: DetailedReportMetricInput) {
  const average = clampNullableNumber(value.average, 0, maxMobileGlucoseValue);
  const minimum = clampNullableNumber(value.minimum, 0, maxMobileGlucoseValue);
  const maximum = clampNullableNumber(value.maximum, 0, maxMobileGlucoseValue);
  const beforeMealCount = clampNumber(value.beforeMealCount, 0, maxMobileCountValue);
  const afterMealCount = clampNumber(value.afterMealCount, 0, maxMobileCountValue);
  const mealCount = clampNumber(value.mealCount, 0, maxMobileCountValue);
  const exerciseCount = clampNumber(value.exerciseCount, 0, maxMobileCountValue);
  const medicationCount = clampNumber(value.medicationCount, 0, maxMobileCountValue);
  return ([
    ["血糖平均", average === null ? "尚無" : `${average} mg/dL`],
    ["最低血糖", minimum === null ? "尚無" : `${minimum} mg/dL`],
    ["最高血糖", maximum === null ? "尚無" : `${maximum} mg/dL`],
    ["飯前血糖", `${beforeMealCount} 次`],
    ["飯後血糖", `${afterMealCount} 次`],
    ["飲食紀錄", `${mealCount} 筆`],
    ["運動紀錄", `${exerciseCount} 筆`],
    ["用藥紀錄", `${medicationCount} 筆`]
  ] as const).map(metricDisplayItem);
}
