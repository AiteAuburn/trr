import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminApp, formatAdminInteger } from "./AdminApp";


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
});
