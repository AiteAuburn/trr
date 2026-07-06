import type { AnalysisRange } from "./analysisCopy";

const maxFutureSkewMs = 5 * 60 * 1000;
const maxDateInputLength = 10;
const maxTimeInputLength = 5;

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

export function formatLocalDateInput(value: Date) {
  return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
}

export function formatLocalTimeInput(value: Date) {
  return `${padDatePart(value.getHours())}:${padDatePart(value.getMinutes())}`;
}

export function boundDateInputText(value: string) {
  return value.slice(0, maxDateInputLength);
}

export function boundTimeInputText(value: string) {
  return value.slice(0, maxTimeInputLength);
}

export function isSameLocalDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function localDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatLocalDateInput(date);
}

export function formatChartDateLabel(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function daysAgo(days: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

function startOfCurrentWeek() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const mondayOffset = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

export function startOfCurrentMonth() {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function parseDateBoundary(value: string, edge: "start" | "end") {
  const date = new Date(`${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function analysisDateBounds(range: AnalysisRange, customStart: string, customEnd: string) {
  const now = endOfToday();
  if (range === "week") {
    return { start: startOfCurrentWeek(), end: now };
  }
  if (range === "month") {
    return { start: startOfCurrentMonth(), end: now };
  }
  const start = parseDateBoundary(customStart, "start");
  const end = parseDateBoundary(customEnd, "end");
  if (start && end && start <= end) {
    return { start, end };
  }
  return { start: startOfCurrentMonth(), end: now };
}

export function localDateTimeInputs(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return {
      date: formatLocalDateInput(now),
      time: formatLocalTimeInput(now)
    };
  }
  return {
    date: formatLocalDateInput(date),
    time: formatLocalTimeInput(date)
  };
}

export function parseLocalDateTimeInput(dateText: string, timeText: string) {
  const date = dateText.trim();
  const time = timeText.trim() || "00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error("請使用 YYYY-MM-DD 日期與 HH:mm 時間格式");
  }
  const parsed = new Date(`${date}T${time}:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("日期或時間格式不正確");
  }
  if (parsed.getTime() > Date.now() + maxFutureSkewMs) {
    throw new Error("紀錄時間不能是明顯未來時間");
  }
  return parsed;
}

export function localDateTimeToIso(dateText: string, timeText: string) {
  return parseLocalDateTimeInput(dateText, timeText).toISOString();
}
