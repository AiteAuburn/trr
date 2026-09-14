import { FormEvent, useCallback, useEffect, useState } from "react";

import "./admin.css";


type AdminSession = {
  authenticated: boolean;
  username: string;
};

type EndpointUsage = {
  method: string;
  route: string;
  request_count: number;
  error_count: number;
  average_duration_ms: number;
  max_duration_ms: number;
};

type DailyUsage = {
  date: string;
  request_count: number;
  error_count: number;
  average_duration_ms: number;
};

type ModelUsage = {
  provider: string;
  model_id: string;
  request_count: number;
  success_count: number;
  failure_count: number;
  usage_reported_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type UsageOverview = {
  generated_at: string;
  days: number;
  total_requests: number;
  total_errors: number;
  total_tokens: number;
  endpoints: EndpointUsage[];
  daily: DailyUsage[];
  models: ModelUsage[];
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`admin_request_${response.status}`);
  }
  return (await response.json()) as T;
}

export function formatAdminInteger(value: number): string {
  return new Intl.NumberFormat("zh-TW").format(Math.max(0, value));
}

export function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState("正在確認管理員狀態…");
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async (rangeDays: number) => {
    const data = await adminRequest<UsageOverview>(`/admin/usage?days=${rangeDays}`);
    setOverview(data);
  }, []);

  useEffect(() => {
    adminRequest<AdminSession>("/admin/session")
      .then(async (nextSession) => {
        setSession(nextSession);
        await loadOverview(days);
        setStatus("");
      })
      .catch(() => {
        setSession({ authenticated: false, username: "signed-out" });
        setStatus("");
      });
  }, [days, loadOverview]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus("正在登入…");
    try {
      const nextSession = await adminRequest<AdminSession>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      setSession(nextSession);
      await loadOverview(days);
      setStatus("");
    } catch {
      setPassword("");
      setStatus("登入失敗，請檢查帳號密碼或稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await adminRequest<AdminSession>("/admin/logout", { method: "POST" });
    } finally {
      setSession({ authenticated: false, username: "signed-out" });
      setOverview(null);
      setBusy(false);
    }
  }

  async function refresh() {
    if (busy) return;
    setBusy(true);
    setStatus("正在更新…");
    try {
      await loadOverview(days);
      setStatus("");
    } catch {
      setStatus("載入失敗，請重新登入後再試。");
    } finally {
      setBusy(false);
    }
  }

  if (session === null) {
    return <main className="admin-shell"><p className="admin-status">{status}</p></main>;
  }

  if (!session.authenticated) {
    return (
      <main className="admin-shell admin-login-shell">
        <form className="admin-login-card" onSubmit={login}>
          <p className="admin-eyebrow">糖錄錄營運後台</p>
          <h1>Admin 登入</h1>
          <p>只顯示彙總使用量，不顯示健康內容、逐字稿或使用者密碼。</p>
          <label>
            帳號
            <input
              autoComplete="username"
              maxLength={64}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label>
            密碼
            <input
              autoComplete="current-password"
              maxLength={256}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button disabled={busy} type="submit">登入</button>
          {status ? <p className="admin-error" role="status">{status}</p> : null}
        </form>
      </main>
    );
  }

  const errorRate = overview?.total_requests
    ? (overview.total_errors / overview.total_requests) * 100
    : 0;
  const maxDailyRequests = Math.max(1, ...(overview?.daily.map((item) => item.request_count) ?? [1]));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">糖錄錄營運後台</p>
          <h1>API 與模型用量</h1>
          <p>按 UTC 日期彙總；不保存 request body、語音或健康內容。</p>
        </div>
        <div className="admin-actions">
          <select
            aria-label="分析期間"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          >
            <option value={7}>最近 7 天</option>
            <option value={30}>最近 30 天</option>
            <option value={90}>最近 90 天</option>
          </select>
          <button disabled={busy} onClick={refresh} type="button">更新</button>
          <button className="admin-secondary" disabled={busy} onClick={logout} type="button">登出</button>
        </div>
      </header>

      {status ? <p className="admin-status" role="status">{status}</p> : null}

      <section className="admin-kpis" aria-label="使用量摘要">
        <article><span>API requests</span><strong>{formatAdminInteger(overview?.total_requests ?? 0)}</strong></article>
        <article><span>錯誤率</span><strong>{errorRate.toFixed(1)}%</strong></article>
        <article><span>總 tokens</span><strong>{formatAdminInteger(overview?.total_tokens ?? 0)}</strong></article>
        <article><span>模型數量</span><strong>{formatAdminInteger(overview?.models.length ?? 0)}</strong></article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title"><h2>每日 API 流量</h2><span>UTC</span></div>
        <div className="admin-bars">
          {(overview?.daily ?? []).map((item) => (
            <div className="admin-bar-row" key={item.date}>
              <span>{item.date.slice(5)}</span>
              <div><i style={{ width: `${Math.max(2, item.request_count / maxDailyRequests * 100)}%` }} /></div>
              <strong>{formatAdminInteger(item.request_count)}</strong>
            </div>
          ))}
          {!overview?.daily.length ? <p className="admin-empty">尚無 API 彙總資料。</p> : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title"><h2>常用 API</h2><span>最多 50 條 route</span></div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>Method</th><th>Route</th><th>次數</th><th>錯誤</th><th>平均 ms</th><th>最慢 ms</th></tr></thead>
            <tbody>
              {(overview?.endpoints ?? []).map((item) => (
                <tr key={`${item.method}:${item.route}`}>
                  <td><code>{item.method}</code></td><td><code>{item.route}</code></td>
                  <td>{formatAdminInteger(item.request_count)}</td><td>{formatAdminInteger(item.error_count)}</td>
                  <td>{item.average_duration_ms.toFixed(1)}</td><td>{item.max_duration_ms.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title"><h2>模型與 Token</h2><span>依 provider/model ID 彙總</span></div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>Provider</th><th>Model ID</th><th>請求</th><th>成功 / 失敗</th><th>Input</th><th>Output</th><th>Total</th></tr></thead>
            <tbody>
              {(overview?.models ?? []).map((item) => (
                <tr key={`${item.provider}:${item.model_id}`}>
                  <td>{item.provider}</td><td><code>{item.model_id}</code></td>
                  <td>{formatAdminInteger(item.request_count)}</td>
                  <td>{formatAdminInteger(item.success_count)} / {formatAdminInteger(item.failure_count)}</td>
                  <td>{formatAdminInteger(item.input_tokens)}</td><td>{formatAdminInteger(item.output_tokens)}</td>
                  <td><strong>{formatAdminInteger(item.total_tokens)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
