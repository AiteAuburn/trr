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

type AdminUser = {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  profile_count: number;
  parse_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type UserDetail = {
  account: { id: string; email: string; display_name: string; created_at: string; updated_at: string };
  usage: { parse_count: number; input_tokens: number; output_tokens: number; total_tokens: number };
  profiles: Array<{ id: string; display_name: string; relationship: string; created_at: string }>;
  parser_submissions: Array<{
    id: string; profile_id: string; transcript_text: string; stt_model_id: string; llm_model_id: string;
    status: string; result: Record<string, unknown> | null; models: ModelUsage[];
    input_tokens: number; output_tokens: number; total_tokens: number; error_code: string | null; created_at: string;
  }>;
  daily_records: Array<{
    id: string; profile_id: string; profile_name: string; record_date: string; summary_text: string;
    transcript_entries: unknown[]; analysis: unknown[]; source: string; updated_at: string;
  }>;
  records: Array<{
    id: string; profile_id: string; profile_name: string; record_type: string; occurred_at: string;
    payload: Record<string, unknown>; metadata: Record<string, unknown>; source: string;
  }>;
  history_page: { limit: number; offset: number; parser_submissions: number; daily_records: number; records: number };
};

type OperationalEvent = {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  event_code: string;
  source: string;
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  event_count: number;
  provider: string;
  model_id: string;
  route: string;
  method: string;
  http_status: number | null;
  error_type: string;
  batch_number: number | null;
  duration_ms_max: number;
  request_id: string;
  target_id: string;
  actor: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userQuery, setUserQuery] = useState("");
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailOffset, setDetailOffset] = useState(0);
  const [operationalEvents, setOperationalEvents] = useState<OperationalEvent[]>([]);
  const [eventSeverity, setEventSeverity] = useState("all");
  const [eventsUpdatedAt, setEventsUpdatedAt] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState("正在確認管理員狀態…");
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async (rangeDays: number) => {
    const data = await adminRequest<UsageOverview>(`/admin/usage?days=${rangeDays}`);
    setOverview(data);
  }, []);

  const loadUsers = useCallback(async (query: string, offset = 0) => {
    const data = await adminRequest<{ users: AdminUser[]; total: number }>(
      `/admin/users?q=${encodeURIComponent(query)}&limit=50&offset=${offset}`,
    );
    setUsers(data.users);
    setUsersTotal(data.total);
    setUserPage(offset);
  }, []);

  async function loadUserDetail(accountId: string, offset: number) {
    setStatus("正在載入使用者資料…");
    try {
      const detail = await adminRequest<UserDetail>(`/admin/users/${accountId}?limit=50&offset=${offset}`);
      setUserDetail(detail);
      setDetailOffset(offset);
      setStatus("");
    } catch {
      setStatus("無法載入使用者資料，請重新登入後再試。");
    }
  }

  useEffect(() => {
    adminRequest<AdminSession>("/admin/session")
      .then(async (nextSession) => {
        setSession(nextSession);
        await Promise.all([loadOverview(days), loadUsers(userQuery)]);
        setStatus("");
      })
      .catch(() => {
        setSession({ authenticated: false, username: "signed-out" });
        setStatus("");
      });
  }, [days, loadOverview, loadUsers]);

  useEffect(() => {
    if (!session?.authenticated) return;
    let active = true;
    const refreshEvents = async () => {
      try {
        const data = await adminRequest<{ events: OperationalEvent[]; generated_at: string }>("/admin/events?limit=50");
        if (!active) return;
        setOperationalEvents(data.events);
        setEventsUpdatedAt(data.generated_at);
        setEventsError("");
      } catch {
        if (active) setEventsError("事件載入失敗；確認登入仍有效後重新整理。");
      }
    };
    void refreshEvents();
    const timer = window.setInterval(() => void refreshEvents(), 10_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session?.authenticated]);

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
      await Promise.all([loadOverview(days), loadUsers(userQuery)]);
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
      setUsers([]);
      setUserDetail(null);
      setOperationalEvents([]);
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
          <p>僅限管理員檢視帳戶資料、使用者提交內容與 AI 分析結果。</p>
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
          <p>敏感健康資料僅供授權管理員排查；原始語音不保存，解析文字與結果依使用者及模型留存。</p>
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

      <section className="admin-panel" aria-label="即時系統事件">
        <div className="admin-panel-title">
          <div><h2>系統與存取事件</h2><span>模型錯誤、API 5xx、慢請求會按分鐘合併；另顯示登入/登出、session 與管理員健康資料檢視稽核</span></div>
          <div className="admin-live-actions">
            <label>等級
              <select aria-label="依等級篩選事件" onChange={(event) => setEventSeverity(event.target.value)} value={eventSeverity}>
                <option value="all">全部</option><option value="ERROR">錯誤</option><option value="CRITICAL">嚴重</option><option value="WARNING">警告</option><option value="INFO">存取稽核</option>
              </select>
            </label>
            <button disabled={busy} onClick={async () => {
              try {
                const data = await adminRequest<{ events: OperationalEvent[]; generated_at: string }>("/admin/events?limit=50");
                setOperationalEvents(data.events);
                setEventsUpdatedAt(data.generated_at);
                setEventsError("");
              } catch { setEventsError("事件載入失敗；確認登入仍有效後重新整理。"); }
            }} type="button">立即更新</button>
          </div>
        </div>
        <p className="admin-live-meta" aria-live="polite">
          {eventsError || (eventsUpdatedAt ? `最後更新 ${new Date(eventsUpdatedAt).toLocaleTimeString("zh-TW")} · 每 10 秒自動更新` : "正在載入事件…")}
        </p>
        <div className="admin-event-list">
          {operationalEvents.filter((item) => eventSeverity === "all" || item.severity === eventSeverity).map((item) => (
            <article className={`admin-event-card admin-event-${item.severity.toLowerCase()}`} key={item.id}>
              <div className="admin-event-leading">
                <span className="admin-severity">{item.severity}</span>
                <strong>{item.event_code}</strong>
                {item.event_count > 1 ? <span className="admin-event-count">×{formatAdminInteger(item.event_count)}</span> : null}
              </div>
              <div className="admin-event-detail">
                <span>{new Date(item.last_seen_at).toLocaleString("zh-TW")}</span>
                <span>來源：{item.source}</span>
                {item.provider ? <span>模型：{item.provider} / {item.model_id}</span> : null}
                {item.route ? <span>{item.method} {item.route}</span> : null}
                {item.http_status ? <span>HTTP {item.http_status}</span> : null}
                {item.error_type ? <span>錯誤類型：{item.error_type}</span> : null}
                {item.batch_number ? <span>Batch {item.batch_number}</span> : null}
                {item.duration_ms_max ? <span>最長 {formatAdminInteger(item.duration_ms_max)} ms</span> : null}
                {item.actor ? <span>管理員：{item.actor}</span> : null}
                {item.target_id ? <span>目標帳戶 ID：{item.target_id}</span> : null}
                {item.request_id ? <code>Request ID: {item.request_id}</code> : null}
              </div>
            </article>
          ))}
          {!operationalEvents.filter((item) => eventSeverity === "all" || item.severity === eventSeverity).length
            ? <p className="admin-empty">目前沒有符合條件的重要事件。</p>
            : null}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-title"><h2>使用者與個人資料</h2><span>逐字稿、分析結果僅管理員可見</span></div>
        <div className="admin-user-search">
          <input
            aria-label="搜尋使用者"
            maxLength={120}
            onChange={(event) => setUserQuery(event.target.value)}
            placeholder="搜尋姓名、Email 或個人資料名稱"
            value={userQuery}
          />
          <button disabled={busy} onClick={() => loadUsers(userQuery)} type="button">搜尋</button>
        </div>
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="使用者清單，可水平捲動">
          <table>
            <thead><tr><th>帳戶</th><th>Profiles</th><th>解析次數</th><th>Input tokens</th><th>Output tokens</th><th>Total</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="admin-user-cell">
                    <button onClick={() => loadUserDetail(user.id, 0)} type="button">
                      <strong>{user.display_name}</strong><small>{user.email}</small>
                    </button>
                  </td>
                  <td>{formatAdminInteger(user.profile_count)}</td>
                  <td>{formatAdminInteger(user.parse_count)}</td>
                  <td>{formatAdminInteger(user.input_tokens)}</td>
                  <td>{formatAdminInteger(user.output_tokens)}</td>
                  <td><strong>{formatAdminInteger(user.total_tokens)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length ? <p className="admin-empty">找不到使用者。</p> : null}
        </div>
        <div className="admin-history-pagination">
          <button disabled={busy || userPage === 0} onClick={() => loadUsers(userQuery, Math.max(0, userPage - 50))} type="button">上一頁</button>
          <span>第 {Math.floor(userPage / 50) + 1} 頁</span>
          <button disabled={busy || userPage + users.length >= usersTotal} onClick={() => loadUsers(userQuery, userPage + 50)} type="button">下一頁</button>
        </div>
      </section>

      {userDetail ? (
        <section className="admin-panel admin-user-detail">
          <div className="admin-panel-title">
            <div><h2>{userDetail.account.display_name}</h2><span>{userDetail.account.email} · 建立於 {new Date(userDetail.account.created_at).toLocaleString("zh-TW")}</span></div>
            <button className="admin-secondary" onClick={() => setUserDetail(null)} type="button">關閉</button>
          </div>
          <div className="admin-user-kpis">
            <article><span>解析次數</span><strong>{formatAdminInteger(userDetail.usage.parse_count)}</strong></article>
            <article><span>Input tokens</span><strong>{formatAdminInteger(userDetail.usage.input_tokens)}</strong></article>
            <article><span>Output tokens</span><strong>{formatAdminInteger(userDetail.usage.output_tokens)}</strong></article>
            <article><span>Total tokens</span><strong>{formatAdminInteger(userDetail.usage.total_tokens)}</strong></article>
          </div>
          <h3>個人資料</h3>
          <div className="admin-profile-list">
            {userDetail.profiles.map((profile) => <article key={profile.id}><strong>{profile.display_name}</strong><span>{profile.relationship}</span><code>{profile.id}</code></article>)}
            {!userDetail.profiles.length ? <p className="admin-empty">沒有個人資料。</p> : null}
          </div>
          <h3>AI 解析提交（第 {Math.floor(detailOffset / 50) + 1} 頁）</h3>
          {userDetail.parser_submissions.map((item) => (
            <details className="admin-audit-card" key={item.id}>
              <summary><span>{new Date(item.created_at).toLocaleString("zh-TW")} · {item.status} · {item.llm_model_id}</span><strong>{formatAdminInteger(item.total_tokens)} tokens</strong></summary>
              <p className="admin-audit-meta">語音模型：{item.stt_model_id} · LLM：{item.llm_model_id} · Profile：{userDetail.profiles.find((profile) => profile.id === item.profile_id)?.display_name ?? item.profile_id}</p>
              {item.error_code ? <p className="admin-error">錯誤代碼：{item.error_code}</p> : null}
              <h4>送出的原始文字</h4><pre>{item.transcript_text}</pre>
              <h4>AI 分析結果</h4><pre>{item.result ? JSON.stringify(item.result, null, 2) : "沒有成功的分析結果。"}</pre>
              <h4>模型用量</h4><pre>{JSON.stringify(item.models, null, 2)}</pre>
            </details>
          ))}
          {!userDetail.parser_submissions.length ? <p className="admin-empty">尚無解析提交紀錄；新提交才會開始逐次留存。</p> : null}
          <h3>已確認的每日紀錄（第 {Math.floor(detailOffset / 50) + 1} 頁）</h3>
          {userDetail.daily_records.map((item) => (
            <details className="admin-audit-card" key={item.id}>
              <summary><span>{item.record_date} · {item.profile_name} · {item.source}</span><strong>{item.summary_text || "已確認紀錄"}</strong></summary>
              <h4>原始文字片段</h4><pre>{JSON.stringify(item.transcript_entries, null, 2)}</pre>
              <h4>儲存的分析分類</h4><pre>{JSON.stringify(item.analysis, null, 2)}</pre>
            </details>
          ))}
          <h3>健康紀錄（第 {Math.floor(detailOffset / 50) + 1} 頁）</h3>
          <div className="admin-record-list">
            {userDetail.records.map((item) => <details className="admin-audit-card" key={item.id}><summary><span>{new Date(item.occurred_at).toLocaleString("zh-TW")} · {item.profile_name}</span><strong>{item.record_type}</strong></summary><pre>{JSON.stringify({ payload: item.payload, metadata: item.metadata }, null, 2)}</pre></details>)}
            {!userDetail.records.length ? <p className="admin-empty">沒有已儲存的健康紀錄。</p> : null}
          </div>
          <div className="admin-history-pagination">
            <button disabled={detailOffset === 0} onClick={() => loadUserDetail(userDetail.account.id, Math.max(0, detailOffset - 50))} type="button">載入較新的 50 筆</button>
            <span>{detailOffset + 1}–{detailOffset + 50} / 最多 {Math.max(userDetail.history_page.parser_submissions, userDetail.history_page.daily_records, userDetail.history_page.records)}</span>
            <button
              disabled={detailOffset + 50 >= Math.max(userDetail.history_page.parser_submissions, userDetail.history_page.daily_records, userDetail.history_page.records)}
              onClick={() => loadUserDetail(userDetail.account.id, detailOffset + 50)}
              type="button"
            >載入較舊的 50 筆</button>
          </div>
          <p className="admin-history-note">個人資料已存內容與逐次解析紀錄分開呈現；分頁不會重複寫入資料。</p>
        </section>
      ) : null}

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
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="常用 API 表格，可水平捲動">
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
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="模型用量表格，可水平捲動">
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
