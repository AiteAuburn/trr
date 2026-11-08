import { describe, expect, it } from "vitest";

import { parsePrometheusText, summarizeProcessMetrics } from "./adminMetrics";

const SAMPLE = `# HELP app_http_requests_total Total HTTP requests by method, route, and status.
# TYPE app_http_requests_total counter
app_http_requests_total{method="GET",route="/records",status="200"} 30
app_http_requests_total{method="POST",route="/ai/parse-preview",status="200"} 10
app_http_requests_total{method="GET",route="/records",status="404"} 2
app_http_requests_total{method="GET",route="/records",status="500"} 1
app_parser_results_total{model_id="deepseek-v4-flash",outcome="success",reason="ok"} 9
app_parser_results_total{model_id="rules-repair",outcome="success",reason="repair"} 2
app_parser_results_total{model_id="deepseek-v4-flash",outcome="failure",reason="timeout"} 1
app_db_operations_total{operation="select"} 4
app_db_operation_duration_seconds_sum{operation="select"} 0.010000
not a metric line
`;

describe("admin metrics", () => {
  it("parses samples and labels, skipping comments and junk", () => {
    const samples = parsePrometheusText(SAMPLE);

    expect(samples).toHaveLength(9);
    expect(samples[0]).toEqual({
      name: "app_http_requests_total",
      labels: { method: "GET", route: "/records", status: "200" },
      value: 30,
    });
  });

  it("summarizes parser outcomes, database timing, and status classes", () => {
    const summary = summarizeProcessMetrics(parsePrometheusText(SAMPLE));

    expect(summary.totalRequests).toBe(43);
    expect(summary.parser).toEqual([
      { outcome: "success", count: 11 },
      { outcome: "failure", count: 1 },
    ]);
    expect(summary.database).toEqual([{ operation: "select", count: 4, averageMs: 2.5 }]);
    expect(summary.statusClasses).toEqual([
      { statusClass: "2xx", count: 40 },
      { statusClass: "4xx", count: 2 },
      { statusClass: "5xx", count: 1 },
    ]);
  });

  it("returns empty summaries for empty text", () => {
    expect(summarizeProcessMetrics(parsePrometheusText(""))).toEqual({
      parser: [],
      database: [],
      statusClasses: [],
      totalRequests: 0,
    });
  });
});
