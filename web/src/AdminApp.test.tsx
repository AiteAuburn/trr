import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AdminApp,
  adminEnvironmentLabel,
  adminViewFromHash,
  fillDailyRange,
  formatAdminInteger,
  formatAdminPercent,
} from "./AdminApp";


describe("AdminApp", () => {
  it("renders a bounded loading state before checking the HttpOnly admin session", () => {
    const html = renderToString(<AdminApp />);

    expect(html).toContain("正在確認管理員狀態");
    expect(html).not.toContain("password");
  });

  it("formats non-negative aggregate values", () => {
    expect(formatAdminInteger(12345)).toBe("12,345");
    expect(formatAdminInteger(-1)).toBe("0");
  });

  it("formats percentages and shows a dash when there is nothing to divide by", () => {
    expect(formatAdminPercent(37, 12480)).toBe("0.3%");
    expect(formatAdminPercent(5, 0)).toBe("—");
    expect(formatAdminPercent(-3, 10)).toBe("0.0%");
  });

  it("fills every UTC day in the range so missing days render as empty bars", () => {
    const filled = fillDailyRange(
      [{ date: "2026-11-06", request_count: 5, error_count: 1, average_duration_ms: 12 }],
      3,
      new Date("2026-11-07T20:00:00Z"),
    );

    expect(filled.map((item) => item.date)).toEqual(["2026-11-05", "2026-11-06", "2026-11-07"]);
    expect(filled.map((item) => item.request_count)).toEqual([0, 5, 0]);
    expect(fillDailyRange([], 500, new Date("2026-11-07T00:00:00Z"))).toHaveLength(90);
  });

  it("labels local hosts separately from the staging server", () => {
    expect(adminEnvironmentLabel("localhost")).toBe("LOCAL");
    expect(adminEnvironmentLabel("app.localhost")).toBe("LOCAL");
    expect(adminEnvironmentLabel("54-145-41-106.sslip.io")).toBe("STAGING");
  });

  it("maps the URL hash to a known view and falls back to the overview", () => {
    expect(adminViewFromHash("#users")).toBe("users");
    expect(adminViewFromHash("#metrics")).toBe("metrics");
    expect(adminViewFromHash("#events")).toBe("events");
    expect(adminViewFromHash("")).toBe("overview");
    expect(adminViewFromHash("#settings")).toBe("overview");
  });
});
