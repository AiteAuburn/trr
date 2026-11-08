/** Turns the backend's admin-only Prometheus text into the numbers the admin console shows. */

export type MetricSample = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

export type ProcessMetrics = {
  parser: Array<{ outcome: string; count: number }>;
  database: Array<{ operation: string; count: number; averageMs: number }>;
  statusClasses: Array<{ statusClass: string; count: number }>;
  totalRequests: number;
};

const MAX_LINES = 5_000;
const SAMPLE_PATTERN = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{(.*)\})?\s+(-?[0-9.eE+]+|NaN|\+Inf|-Inf)$/;
const LABEL_PATTERN = /([a-zA-Z_][a-zA-Z0-9_]*)="((?:[^"\\]|\\.)*)"/g;

export function parsePrometheusText(text: string): MetricSample[] {
  const samples: MetricSample[] = [];
  for (const rawLine of text.split("\n").slice(0, MAX_LINES)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = SAMPLE_PATTERN.exec(line);
    if (!match) continue;
    const value = Number(match[4]);
    if (!Number.isFinite(value)) continue;
    const labels: Record<string, string> = {};
    for (const label of (match[3] ?? "").matchAll(LABEL_PATTERN)) {
      labels[label[1]] = label[2].replace(/\\(.)/g, "$1");
    }
    samples.push({ name: match[1], labels, value });
  }
  return samples;
}

function addTo(map: Map<string, number>, key: string, value: number) {
  map.set(key, (map.get(key) ?? 0) + value);
}

function byCountDesc<T extends { count: number }>(items: T[]): T[] {
  return items.sort((left, right) => right.count - left.count);
}

export function summarizeProcessMetrics(samples: MetricSample[]): ProcessMetrics {
  const parser = new Map<string, number>();
  const dbCounts = new Map<string, number>();
  const dbSeconds = new Map<string, number>();
  const statusClasses = new Map<string, number>();
  let totalRequests = 0;

  for (const sample of samples) {
    if (sample.name === "app_parser_results_total") {
      addTo(parser, sample.labels.outcome || "unknown", sample.value);
    } else if (sample.name === "app_db_operations_total") {
      addTo(dbCounts, sample.labels.operation || "other", sample.value);
    } else if (sample.name === "app_db_operation_duration_seconds_sum") {
      addTo(dbSeconds, sample.labels.operation || "other", sample.value);
    } else if (sample.name === "app_http_requests_total") {
      const status = sample.labels.status ?? "";
      addTo(statusClasses, /^[1-5]/.test(status) ? `${status[0]}xx` : "other", sample.value);
      totalRequests += sample.value;
    }
  }

  return {
    parser: byCountDesc([...parser].map(([outcome, count]) => ({ outcome, count }))),
    database: byCountDesc(
      [...dbCounts].map(([operation, count]) => ({
        operation,
        count,
        averageMs: count > 0 ? ((dbSeconds.get(operation) ?? 0) / count) * 1000 : 0,
      })),
    ),
    statusClasses: [...statusClasses]
      .map(([statusClass, count]) => ({ statusClass, count }))
      .sort((left, right) => left.statusClass.localeCompare(right.statusClass)),
    totalRequests,
  };
}
