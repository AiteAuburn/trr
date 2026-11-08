import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { parsePrometheusText, summarizeProcessMetrics } from "./adminMetrics";
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

type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

type OperationalEvent = {
  id: string;
  first_seen_at: string;
  last_seen_at: string;
  event_code: string;
  source: string;
  severity: Severity;
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

export type AdminView = "overview" | "users" | "events" | "metrics";

const ADMIN_VIEWS: Array<{ id: AdminView; label: string }> = [
  { id: "overview", label: "總覽" },
  { id: "users", label: "使用者" },
  { id: "events", label: "系統事件" },
  { id: "metrics", label: "API 與指標" },
];

const SEVERITY_LABELS: Record<Severity, string> = {
  CRITICAL: "嚴重",
  ERROR: "錯誤",
  WARNING: "警告",
  INFO: "稽核",
};

const EVENT_FILTERS: Array<{ id: "all" | Severity; label: string }> = [
  { id: "all", label: "全部" },
  { id: "CRITICAL", label: "嚴重" },
  { id: "ERROR", label: "錯誤" },
  { id: "WARNING", label: "警告" },
  { id: "INFO", label: "存取稽核" },
];

const PARSER_OUTCOME_LABELS: Record<string, string> = {
  success: "成功",
  failure: "失敗",
  fallback: "改用規則修復",
};

const PAGE_SIZE = 50;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function adminFetch(path: string, init?: RequestInit): Promise<Response> {
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
  return response;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return (await (await adminFetch(path, init)).json()) as T;
}

async function adminTextRequest(path: string): Promise<string> {
  return (await adminFetch(path)).text();
}

export function formatAdminInteger(value: number): string {
  return new Intl.NumberFormat("zh-TW").format(Math.max(0, value));
}

export function formatAdminPercent(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${((Math.max(0, part) / whole) * 100).toFixed(1)}%`;
}

export function adminEnvironmentLabel(hostname: string): string {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname) || hostname.endsWith(".localhost") ? "LOCAL" : "STAGING";
}

/** One entry per UTC day in the range, oldest first, so missing days show as empty bars. */
export function fillDailyRange(daily: DailyUsage[], days: number, today: Date = new Date()): DailyUsage[] {
  const byDate = new Map(daily.map((item) => [item.date, item]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const span = Math.max(1, Math.min(90, Math.floor(days)));
  return Array.from({ length: span }, (_, index) => {
    const date = new Date(end - (span - 1 - index) * 86_400_000).toISOString().slice(0, 10);
    return byDate.get(date) ?? { date, request_count: 0, error_count: 0, average_duration_ms: 0 };
  });
}

export function adminViewFromHash(hash: string): AdminView {
  const id = hash.replace(/^#/, "");
  return ADMIN_VIEWS.some((view) => view.id === id) ? (id as AdminView) : "overview";
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function severityClass(severity: Severity): string {
  return `admin-badge admin-badge-${severity.toLowerCase()}`;
}

function NavIcon({ view }: { view: AdminView }) {
  const common = { "aria-hidden": true, width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (view === "overview") {
    return <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>;
  }
  if (view === "users") {
    return <svg {...common}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.8c1.9.7 3.1 2.4 3.5 5.2" /></svg>;
  }
  if (view === "events") {
    return <svg {...common}><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>;
  }
  return <svg {...common}><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></svg>;
}

function Panel({ title, meta, action, children, className }: { title: string; meta?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`admin-panel ${className ?? ""}`} aria-label={title}>
      <div className="admin-panel-title">
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
        {action}
      </div>
      {children}
    </section>
  );
}

function RevealBlock({ revealed, onToggle, children }: { revealed: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className="admin-reveal">
      {revealed ? (
        <>
          {children}
          <button className="admin-button-quiet" onClick={onToggle} type="button">隱藏內容</button>
        </>
      ) : (
        <div className="admin-reveal-hidden">
          <span>內容已遮住</span>
          <button className="admin-button-outline" onClick={onToggle} type="button">顯示內容</button>
        </div>
      )}
    </div>
  );
}

export function AdminApp() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [view, setView] = useState<AdminView>(() =>
    typeof window === "undefined" ? "overview" : adminViewFromHash(window.location.hash),
  );
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userQuery, setUserQuery] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailOffset, setDetailOffset] = useState(0);
  const [detailTab, setDetailTab] = useState<"parses" | "daily" | "records">("parses");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const [operationalEvents, setOperationalEvents] = useState<OperationalEvent[]>([]);
  const [eventSeverity, setEventSeverity] = useState<"all" | Severity>("all");
  const [eventsUpdatedAt, setEventsUpdatedAt] = useState("");
  const [eventsError, setEventsError] = useState("");
  const [metricsText, setMetricsText] = useState("");
  const [metricsError, setMetricsError] = useState("");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [days, setDays] = useState(30);
  const [status, setStatus] = useState("正在確認管理員狀態…");
  const [busy, setBusy] = useState(false);

  const authenticated = Boolean(session?.authenticated);
  const environmentLabel = typeof window === "undefined" ? "STAGING" : adminEnvironmentLabel(window.location.hostname);

  const loadOverview = useCallback(async (rangeDays: number) => {
    setOverview(await adminRequest<UsageOverview>(`/admin/usage?days=${rangeDays}`));
  }, []);

  const loadUsers = useCallback(async (query: string, offset = 0) => {
    const data = await adminRequest<{ users: AdminUser[]; total: number }>(
      `/admin/users?q=${encodeURIComponent(query)}&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    setUsers(data.users);
    setUsersTotal(data.total);
    setUserPage(offset);
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const data = await adminRequest<{ events: OperationalEvent[]; generated_at: string }>("/admin/events?limit=50");
      setOperationalEvents(data.events);
      setEventsUpdatedAt(data.generated_at);
      setEventsError("");
    } catch {
      setEventsError("事件載入失敗；確認登入仍有效後重新整理。");
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    try {
      setMetricsText(await adminTextRequest("/metrics"));
      setMetricsError("");
    } catch {
      setMetricsError("指標載入失敗；確認登入仍有效後重新整理。");
    }
  }, []);

  useEffect(() => {
    adminRequest<AdminSession>("/admin/session")
      .then((nextSession) => {
        setSession(nextSession);
        setStatus("");
      })
      .catch(() => {
        setSession({ authenticated: false, username: "signed-out" });
        setStatus("");
      });
  }, []);

  useEffect(() => {
    const onHashChange = () => setView(adminViewFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    loadOverview(days).catch(() => setStatus("用量載入失敗，請重新登入後再試。"));
  }, [authenticated, days, loadOverview]);

  useEffect(() => {
    if (!authenticated) return;
    loadUsers("").catch(() => setStatus("使用者清單載入失敗，請重新登入後再試。"));
  }, [authenticated, loadUsers]);

  useEffect(() => {
    if (!authenticated) return;
    void loadEvents();
    const timer = window.setInterval(() => void loadEvents(), 10_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadEvents]);

  useEffect(() => {
    if (authenticated && view === "metrics") void loadMetrics();
  }, [authenticated, view, loadMetrics]);

  function openView(next: AdminView) {
    window.location.hash = next;
    setView(next);
  }

  async function loadUserDetail(accountId: string, offset: number) {
    setBusy(true);
    try {
      const detail = await adminRequest<UserDetail>(`/admin/users/${accountId}?limit=${PAGE_SIZE}&offset=${offset}`);
      if (detail.account.id !== userDetail?.account.id) {
        setDetailTab("parses");
      }
      setUserDetail(detail);
      setDetailOffset(offset);
      setRevealed(new Set());
      setStatus("");
      window.requestAnimationFrame(() => {
        const section = document.getElementById("admin-user-detail");
        if (section && section.getBoundingClientRect().top > window.innerHeight * 0.6) {
          section.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });
    } catch {
      setStatus("無法載入使用者資料，請重新登入後再試。");
    } finally {
      setBusy(false);
    }
  }

  function toggleReveal(id: string) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function login(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      const nextSession = await adminRequest<AdminSession>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setPassword("");
      setSession(nextSession);
      setStatus("");
    } catch {
      setPassword("");
      setStatus("登入失敗，請檢查帳號密碼。連續錯誤會暫時鎖住一段時間。");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await adminRequest<AdminSession>("/admin/logout", { method: "POST" });
    } catch {
      // The local state is cleared either way; an expired cookie is already signed out.
    } finally {
      setSession({ authenticated: false, username: "signed-out" });
      setOverview(null);
      setUsers([]);
      setUserDetail(null);
      setRevealed(new Set());
      setOperationalEvents([]);
      setMetricsText("");
      setBusy(false);
    }
  }

  async function refresh() {
    if (busy) return;
    setBusy(true);
    setStatus("");
    try {
      await Promise.all([loadOverview(days), loadEvents(), view === "metrics" ? loadMetrics() : Promise.resolve()]);
    } catch {
      setStatus("載入失敗，請重新登入後再試。");
    } finally {
      setBusy(false);
    }
  }

  const urgentEventCount = operationalEvents.filter((item) => item.severity === "ERROR" || item.severity === "CRITICAL").length;
  const processMetrics = useMemo(() => summarizeProcessMetrics(parsePrometheusText(metricsText)), [metricsText]);

  if (session === null) {
    return <main className="admin-login-shell"><p className="admin-status">{status}</p></main>;
  }

  if (!session.authenticated) {
    return (
      <main className="admin-login-shell">
        <form className="admin-login-card" onSubmit={login}>
          <div className="admin-brand">
            <span aria-hidden="true" className="admin-mark">糖</span>
            <div><strong>糖錄錄後台</strong><span className="admin-env">{environmentLabel}</span></div>
          </div>
          <div className="admin-login-heading">
            <h1>管理員登入</h1>
            <p>只限管理員。登入、登出與檢視使用者健康資料都會留下稽核紀錄。</p>
          </div>
          <label>
            帳號
            <input autoComplete="username" maxLength={64} onChange={(event) => setUsername(event.target.value)} required value={username} />
          </label>
          <label>
            密碼
            <input autoComplete="current-password" maxLength={256} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <button className="admin-button-primary" disabled={busy} type="submit">{busy ? "正在登入…" : "登入"}</button>
          {status && !busy ? <p className="admin-alert" role="status">{status}</p> : null}
        </form>
      </main>
    );
  }

  const viewTitle = ADMIN_VIEWS.find((item) => item.id === view)?.label ?? "總覽";

  return (
    <div className="admin-shell">
      <nav aria-label="後台導覽" className="admin-nav">
        <div className="admin-brand">
          <span aria-hidden="true" className="admin-mark">糖</span>
          <div><strong>糖錄錄後台</strong><span className="admin-env">{environmentLabel}</span></div>
        </div>
        <div className="admin-nav-links">
          {ADMIN_VIEWS.map((item) => (
            <a
              aria-current={view === item.id ? "page" : undefined}
              href={`#${item.id}`}
              key={item.id}
              onClick={(event) => { event.preventDefault(); openView(item.id); }}
            >
              <NavIcon view={item.id} />
              {item.label}
              {item.id === "events" && urgentEventCount > 0 ? <span className="admin-nav-count">{formatAdminInteger(urgentEventCount)}</span> : null}
            </a>
          ))}
        </div>
        <div className="admin-nav-account">
          <span>已登入管理員</span>
          <strong>{session.username}</strong>
          <button className="admin-button-outline" disabled={busy} onClick={logout} type="button">登出</button>
        </div>
      </nav>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{viewTitle}</h1>
            <p>
              {view === "events"
                ? eventsError || (eventsUpdatedAt ? `每 10 秒自動更新 · 最後更新 ${new Date(eventsUpdatedAt).toLocaleTimeString("zh-TW")} · 同一分鐘的相同事件會合併` : "正在載入事件…")
                : view === "users"
                  ? `共 ${formatAdminInteger(usersTotal)} 個帳戶`
                  : overview
                    ? `最後更新 ${new Date(overview.generated_at).toLocaleTimeString("zh-TW")} · 每日數字以 UTC 彙總`
                    : "正在載入用量…"}
            </p>
          </div>
          {view === "overview" || view === "metrics" ? (
            <div className="admin-actions">
              <label>
                期間
                <select onChange={(event) => setDays(Number(event.target.value))} value={days}>
                  <option value={7}>最近 7 天</option>
                  <option value={30}>最近 30 天</option>
                  <option value={90}>最近 90 天</option>
                </select>
              </label>
              <button className="admin-button-primary" disabled={busy} onClick={refresh} type="button">重新整理</button>
            </div>
          ) : view === "events" ? (
            <div className="admin-actions">
              <button className="admin-button-outline" disabled={busy} onClick={() => void loadEvents()} type="button">立即更新</button>
            </div>
          ) : null}
        </header>

        {status ? <p className="admin-alert" role="status">{status}</p> : null}

        {view === "overview" ? <OverviewView days={days} events={operationalEvents} onOpenEvents={() => openView("events")} overview={overview} /> : null}

        {view === "users" ? (
          <UsersView
            busy={busy}
            detail={userDetail}
            detailOffset={detailOffset}
            detailTab={detailTab}
            onLoadDetail={loadUserDetail}
            onSearch={(query, offset) => loadUsers(query, offset).catch(() => setStatus("使用者清單載入失敗，請重新登入後再試。"))}
            onSelectTab={setDetailTab}
            onToggleReveal={toggleReveal}
            query={userQuery}
            revealed={revealed}
            setQuery={setUserQuery}
            userPage={userPage}
            users={users}
            usersTotal={usersTotal}
          />
        ) : null}

        {view === "events" ? (
          <EventsView events={operationalEvents} onSelectSeverity={setEventSeverity} severity={eventSeverity} />
        ) : null}

        {view === "metrics" ? (
          <MetricsView endpoints={overview?.endpoints ?? []} error={metricsError} metrics={processMetrics} rawText={metricsText} />
        ) : null}
      </main>
    </div>
  );
}

function OverviewView({ overview, days, events, onOpenEvents }: { overview: UsageOverview | null; days: number; events: OperationalEvent[]; onOpenEvents: () => void }) {
  const models = overview?.models ?? [];
  const parseRequests = models.reduce((sum, item) => sum + item.request_count, 0);
  const parseSuccesses = models.reduce((sum, item) => sum + item.success_count, 0);
  const inputTokens = models.reduce((sum, item) => sum + item.input_tokens, 0);
  const outputTokens = models.reduce((sum, item) => sum + item.output_tokens, 0);
  const daily = overview ? fillDailyRange(overview.daily, days) : [];
  const maxDaily = Math.max(1, ...daily.map((item) => item.request_count));
  const labelStep = Math.max(1, Math.ceil(daily.length / 14));
  const urgent = events.filter((item) => item.severity !== "INFO").slice(0, 4);

  return (
    <>
      <section aria-label="使用量摘要" className="admin-kpis">
        <article><span>API 請求</span><strong>{formatAdminInteger(overview?.total_requests ?? 0)}</strong><small>最近 {days} 天</small></article>
        <article><span>錯誤率</span><strong>{formatAdminPercent(overview?.total_errors ?? 0, overview?.total_requests ?? 0)}</strong><small>錯誤 {formatAdminInteger(overview?.total_errors ?? 0)} 次</small></article>
        <article><span>AI tokens</span><strong>{formatAdminInteger(overview?.total_tokens ?? 0)}</strong><small>輸入 {formatAdminInteger(inputTokens)} · 輸出 {formatAdminInteger(outputTokens)}</small></article>
        <article><span>解析成功率</span><strong>{formatAdminPercent(parseSuccesses, parseRequests)}</strong><small>{formatAdminInteger(parseRequests)} 次解析</small></article>
      </section>

      <Panel
        meta={<span className="admin-legend"><i className="admin-legend-ok" />成功<i className="admin-legend-error" />錯誤</span>}
        title="每日 API 請求"
      >
        {daily.length ? (
          <>
            <div aria-label={`最近 ${daily.length} 天每日 API 請求長條圖`} className="admin-chart" role="img">
              {daily.map((item) => (
                <div className="admin-chart-column" key={item.date} title={`${item.date}：${formatAdminInteger(item.request_count)} 次，錯誤 ${formatAdminInteger(item.error_count)}`}>
                  <i className="admin-chart-error" style={{ height: `${(item.error_count / maxDaily) * 100}%` }} />
                  <i className="admin-chart-ok" style={{ height: `${(Math.max(0, item.request_count - item.error_count) / maxDaily) * 100}%` }} />
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="admin-chart-labels">
              {daily.map((item, index) => <span key={item.date}>{index % labelStep === 0 ? item.date.slice(5).replace("-", "/") : ""}</span>)}
            </div>
          </>
        ) : <p className="admin-empty">尚無 API 彙總資料。</p>}
      </Panel>

      <div className="admin-columns">
        <Panel className="admin-column-wide" meta="依模型彙總" title="模型與 Token">
          <div aria-label="模型用量表格，可水平捲動" className="admin-table-wrap" role="region" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">模型</th><th scope="col">請求</th><th scope="col">成功率</th><th scope="col">輸入</th><th scope="col">輸出</th><th scope="col">合計</th></tr></thead>
              <tbody>
                {models.map((item) => (
                  <tr key={`${item.provider}:${item.model_id}`}>
                    <td><div className="admin-cell-stack"><code>{item.model_id}</code><small>{item.provider}</small></div></td>
                    <td>{formatAdminInteger(item.request_count)}</td>
                    <td>{formatAdminPercent(item.success_count, item.request_count)}</td>
                    <td>{formatAdminInteger(item.input_tokens)}</td>
                    <td>{formatAdminInteger(item.output_tokens)}</td>
                    <td><strong>{formatAdminInteger(item.total_tokens)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!models.length ? <p className="admin-empty">這段期間沒有模型用量。</p> : null}
          </div>
        </Panel>

        <Panel
          action={<button className="admin-link-button" onClick={onOpenEvents} type="button">查看全部</button>}
          className="admin-column-narrow"
          title="需要注意的事件"
        >
          <ul className="admin-mini-events">
            {urgent.map((item) => (
              <li key={item.id}>
                <span className={severityClass(item.severity)}>{SEVERITY_LABELS[item.severity]}</span>
                <div>
                  <code>{item.event_code}</code>
                  <small>{item.event_count > 1 ? `×${formatAdminInteger(item.event_count)} · ` : ""}{formatDateTime(item.last_seen_at)}{item.route ? ` · ${item.method} ${item.route}` : ""}</small>
                </div>
              </li>
            ))}
          </ul>
          {!urgent.length ? <p className="admin-empty">最近 30 天沒有錯誤或警告。</p> : null}
        </Panel>
      </div>
    </>
  );
}

type UsersViewProps = {
  users: AdminUser[];
  usersTotal: number;
  userPage: number;
  query: string;
  setQuery: (value: string) => void;
  onSearch: (query: string, offset: number) => void;
  detail: UserDetail | null;
  detailOffset: number;
  detailTab: "parses" | "daily" | "records";
  onSelectTab: (tab: "parses" | "daily" | "records") => void;
  onLoadDetail: (accountId: string, offset: number) => void;
  revealed: Set<string>;
  onToggleReveal: (id: string) => void;
  busy: boolean;
};

function UsersView(props: UsersViewProps) {
  const { users, usersTotal, userPage, query, setQuery, onSearch, detail, detailOffset, detailTab, onSelectTab, onLoadDetail, revealed, onToggleReveal, busy } = props;
  const historyTotal = detail ? Math.max(detail.history_page.parser_submissions, detail.history_page.daily_records, detail.history_page.records) : 0;
  const tabs = detail
    ? [
        { id: "parses" as const, label: "AI 解析提交", count: detail.history_page.parser_submissions },
        { id: "daily" as const, label: "每日紀錄", count: detail.history_page.daily_records },
        { id: "records" as const, label: "健康紀錄", count: detail.history_page.records },
      ]
    : [];
  const profileName = (profileId: string) => detail?.profiles.find((profile) => profile.id === profileId)?.display_name ?? profileId;

  return (
    <>
      <p className="admin-privacy-note" role="note">
        健康資料只用於排查問題。打開使用者資料會留下稽核紀錄；逐字稿、AI 結果與健康紀錄預設遮住，按「顯示內容」才看得到。
      </p>
      <div className="admin-columns">
        <Panel className="admin-column-narrow" title="帳戶清單">
          <form className="admin-search" onSubmit={(event) => { event.preventDefault(); onSearch(query, 0); }} role="search">
            <input aria-label="搜尋使用者" maxLength={120} onChange={(event) => setQuery(event.target.value)} placeholder="姓名、Email 或個人資料名稱" type="search" value={query} />
            <button className="admin-button-primary" disabled={busy} type="submit">搜尋</button>
          </form>
          <ul className="admin-user-list">
            {users.map((user) => (
              <li key={user.id}>
                <button aria-pressed={detail?.account.id === user.id} disabled={busy} onClick={() => onLoadDetail(user.id, 0)} type="button">
                  <span><strong>{user.display_name}</strong><small>{user.email}</small></span>
                  <span className="admin-user-list-numbers"><strong>{formatAdminInteger(user.total_tokens)}</strong><small>{formatAdminInteger(user.parse_count)} 次解析</small></span>
                </button>
              </li>
            ))}
          </ul>
          {!users.length ? <p className="admin-empty">找不到使用者。</p> : null}
          <div className="admin-pagination">
            <button className="admin-button-outline" disabled={busy || userPage === 0} onClick={() => onSearch(query, Math.max(0, userPage - PAGE_SIZE))} type="button">上一頁</button>
            <span>第 {Math.floor(userPage / PAGE_SIZE) + 1} 頁 / 共 {Math.max(1, Math.ceil(usersTotal / PAGE_SIZE))} 頁</span>
            <button className="admin-button-outline" disabled={busy || userPage + users.length >= usersTotal} onClick={() => onSearch(query, userPage + PAGE_SIZE)} type="button">下一頁</button>
          </div>
        </Panel>

        {detail ? (
          <section aria-label="使用者詳細資料" className="admin-panel admin-column-wide admin-detail" id="admin-user-detail">
            <div className="admin-detail-head">
              <div>
                <h2>{detail.account.display_name}</h2>
                <span>{detail.account.email} · 建立於 {new Date(detail.account.created_at).toLocaleDateString("zh-TW")}</span>
              </div>
              <code>{detail.account.id}</code>
            </div>
            <div className="admin-detail-kpis">
              <div><span>解析次數</span><strong>{formatAdminInteger(detail.usage.parse_count)}</strong></div>
              <div><span>輸入 tokens</span><strong>{formatAdminInteger(detail.usage.input_tokens)}</strong></div>
              <div><span>輸出 tokens</span><strong>{formatAdminInteger(detail.usage.output_tokens)}</strong></div>
              <div><span>合計 tokens</span><strong>{formatAdminInteger(detail.usage.total_tokens)}</strong></div>
            </div>
            <div className="admin-detail-profiles">
              <h3>個人資料</h3>
              <div>
                {detail.profiles.map((profile) => <span key={profile.id}><strong>{profile.display_name}</strong>{profile.relationship}</span>)}
                {!detail.profiles.length ? <p className="admin-empty">沒有個人資料。</p> : null}
              </div>
            </div>

            <div aria-label="使用者資料分類" className="admin-tabs" role="tablist">
              {tabs.map((tab) => (
                <button aria-selected={detailTab === tab.id} key={tab.id} onClick={() => onSelectTab(tab.id)} role="tab" type="button">
                  {tab.label} <span>{formatAdminInteger(tab.count)}</span>
                </button>
              ))}
            </div>

            {detailTab === "parses" ? (
              <>
              <ul className="admin-history-list">
                {detail.parser_submissions.map((item) => (
                  <li key={item.id}>
                    <div className="admin-history-head">
                      <div>
                        <span className={item.status === "success" ? "admin-badge admin-badge-ok" : "admin-badge admin-badge-error"}>{item.status === "success" ? "成功" : item.status}</span>
                        <span className="admin-numeric">{formatDateTime(item.created_at)}</span>
                        <small>{profileName(item.profile_id)} · {item.llm_model_id}</small>
                      </div>
                      <strong className="admin-numeric">{formatAdminInteger(item.total_tokens)} tokens</strong>
                    </div>
                    {item.error_code ? <p className="admin-error-code">錯誤代碼：{item.error_code}</p> : null}
                    <RevealBlock onToggle={() => onToggleReveal(item.id)} revealed={revealed.has(item.id)}>
                      <h4>送出的原始文字</h4><pre>{item.transcript_text}</pre>
                      <h4>AI 分析結果</h4><pre>{item.result ? JSON.stringify(item.result, null, 2) : "沒有成功的分析結果。"}</pre>
                      <h4>模型用量</h4><pre>{JSON.stringify(item.models, null, 2)}</pre>
                    </RevealBlock>
                  </li>
                ))}
              </ul>
              {!detail.parser_submissions.length ? <p className="admin-empty">尚無解析提交紀錄。</p> : null}
              </>
            ) : null}

            {detailTab === "daily" ? (
              <>
              <ul className="admin-history-list">
                {detail.daily_records.map((item) => (
                  <li key={item.id}>
                    <div className="admin-history-head">
                      <div><strong className="admin-numeric">{item.record_date}</strong><small>{item.profile_name} · {item.source}</small></div>
                      <small>{formatAdminInteger(item.transcript_entries.length)} 段文字</small>
                    </div>
                    <RevealBlock onToggle={() => onToggleReveal(item.id)} revealed={revealed.has(item.id)}>
                      {item.summary_text ? <><h4>摘要</h4><pre>{item.summary_text}</pre></> : null}
                      <h4>原始文字片段</h4><pre>{JSON.stringify(item.transcript_entries, null, 2)}</pre>
                      <h4>儲存的分析分類</h4><pre>{JSON.stringify(item.analysis, null, 2)}</pre>
                    </RevealBlock>
                  </li>
                ))}
              </ul>
              {!detail.daily_records.length ? <p className="admin-empty">沒有已確認的每日紀錄。</p> : null}
              </>
            ) : null}

            {detailTab === "records" ? (
              <>
              <ul className="admin-history-list">
                {detail.records.map((item) => (
                  <li key={item.id}>
                    <div className="admin-history-head">
                      <div><span className="admin-numeric">{formatDateTime(item.occurred_at)}</span><code>{item.record_type}</code><small>{item.profile_name} · {item.source}</small></div>
                    </div>
                    <RevealBlock onToggle={() => onToggleReveal(item.id)} revealed={revealed.has(item.id)}>
                      <pre>{JSON.stringify({ payload: item.payload, metadata: item.metadata }, null, 2)}</pre>
                    </RevealBlock>
                  </li>
                ))}
              </ul>
              {!detail.records.length ? <p className="admin-empty">沒有已儲存的健康紀錄。</p> : null}
              </>
            ) : null}

            <div className="admin-pagination">
              <button className="admin-button-outline" disabled={busy || detailOffset === 0} onClick={() => onLoadDetail(detail.account.id, Math.max(0, detailOffset - PAGE_SIZE))} type="button">較新的 {PAGE_SIZE} 筆</button>
              <span>{historyTotal ? `第 ${formatAdminInteger(detailOffset + 1)}–${formatAdminInteger(Math.min(historyTotal, detailOffset + PAGE_SIZE))} 筆 / 共 ${formatAdminInteger(historyTotal)} 筆` : "沒有紀錄"}</span>
              <button className="admin-button-outline" disabled={busy || detailOffset + PAGE_SIZE >= historyTotal} onClick={() => onLoadDetail(detail.account.id, detailOffset + PAGE_SIZE)} type="button">較舊的 {PAGE_SIZE} 筆</button>
            </div>
          </section>
        ) : (
          <section aria-label="使用者詳細資料" className="admin-panel admin-column-wide admin-detail-empty">
            <p>從左邊選一個帳戶，查看用量、個人資料與紀錄。</p>
          </section>
        )}
      </div>
    </>
  );
}

function EventsView({ events, severity, onSelectSeverity }: { events: OperationalEvent[]; severity: "all" | Severity; onSelectSeverity: (value: "all" | Severity) => void }) {
  const visible = events.filter((item) => severity === "all" || item.severity === severity);
  return (
    <>
      <div aria-label="依等級篩選" className="admin-filter-row" role="group">
        {EVENT_FILTERS.map((filter) => (
          <button aria-pressed={severity === filter.id} key={filter.id} onClick={() => onSelectSeverity(filter.id)} type="button">
            {filter.label}
            <strong>{formatAdminInteger(filter.id === "all" ? events.length : events.filter((item) => item.severity === filter.id).length)}</strong>
          </button>
        ))}
      </div>
      <section aria-label="事件清單" className="admin-panel admin-event-panel">
        <ul className="admin-event-list">
          {visible.map((item) => (
            <li key={item.id}>
              <div className="admin-event-when">
                <span className={severityClass(item.severity)}>{SEVERITY_LABELS[item.severity]}</span>
                <small className="admin-numeric">{formatDateTime(item.last_seen_at)}</small>
              </div>
              <div className="admin-event-body">
                <div><code>{item.event_code}</code>{item.event_count > 1 ? <small>×{formatAdminInteger(item.event_count)}</small> : null}</div>
                <div className="admin-event-meta">
                  <span>來源 {item.source}</span>
                  {item.route ? <code>{item.method} {item.route}</code> : null}
                  {item.http_status ? <span>HTTP {item.http_status}</span> : null}
                  {item.error_type ? <span>錯誤類型 {item.error_type}</span> : null}
                  {item.provider ? <span>{item.provider} / {item.model_id}</span> : null}
                  {item.batch_number ? <span>batch {item.batch_number}</span> : null}
                  {item.duration_ms_max ? <span>最長 {formatAdminInteger(item.duration_ms_max)} ms</span> : null}
                  {item.actor ? <span>管理員 {item.actor}</span> : null}
                  {item.target_id ? <span>帳戶 {item.target_id}</span> : null}
                </div>
              </div>
              {item.request_id ? <code className="admin-event-request">req {item.request_id}</code> : null}
            </li>
          ))}
        </ul>
        {!visible.length ? <p className="admin-empty admin-event-empty">目前沒有符合條件的事件。</p> : null}
      </section>
    </>
  );
}

function MetricsView({ endpoints, metrics, rawText, error }: { endpoints: EndpointUsage[]; metrics: ReturnType<typeof summarizeProcessMetrics>; rawText: string; error: string }) {
  const parserTotal = metrics.parser.reduce((sum, item) => sum + item.count, 0);
  return (
    <>
      <Panel meta="平均超過 1 秒標成橘色 · 最多 50 條" title="API 路由">
        <div aria-label="API 路由表格，可水平捲動" className="admin-table-wrap" role="region" tabIndex={0}>
          <table>
            <thead><tr><th scope="col">路由</th><th scope="col">次數</th><th scope="col">錯誤</th><th scope="col">平均 ms</th><th scope="col">最慢 ms</th></tr></thead>
            <tbody>
              {endpoints.map((item) => (
                <tr key={`${item.method}:${item.route}`}>
                  <td><code className="admin-method">{item.method}</code><code>{item.route}</code></td>
                  <td>{formatAdminInteger(item.request_count)}</td>
                  <td className={item.error_count > 0 ? "admin-cell-error" : undefined}>{formatAdminInteger(item.error_count)}</td>
                  <td className={item.average_duration_ms > 1000 ? "admin-cell-slow" : undefined}>{item.average_duration_ms.toFixed(1)}</td>
                  <td>{formatAdminInteger(Math.round(item.max_duration_ms))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!endpoints.length ? <p className="admin-empty">這段期間沒有 API 彙總資料。</p> : null}
        </div>
      </Panel>

      <Panel meta="後端程序啟動後累計 · 重新部署會歸零 · 只有管理員看得到" title="後端程序指標">
        {error ? <p className="admin-alert" role="status">{error}</p> : null}
        <div className="admin-metric-cards">
          <article>
            <h3>AI 解析結果</h3>
            <ul className="admin-metric-bars">
              {metrics.parser.map((item) => (
                <li key={item.outcome}>
                  <div><span>{PARSER_OUTCOME_LABELS[item.outcome] ?? item.outcome}</span><strong className="admin-numeric">{formatAdminInteger(item.count)}</strong></div>
                  <i aria-hidden="true"><b className={`admin-metric-bar-${item.outcome === "success" ? "ok" : item.outcome === "failure" ? "error" : "warn"}`} style={{ width: `${parserTotal ? (item.count / parserTotal) * 100 : 0}%` }} /></i>
                </li>
              ))}
            </ul>
            {!metrics.parser.length ? <p className="admin-empty">程序啟動後還沒有解析。</p> : null}
          </article>
          <article>
            <h3>資料庫操作</h3>
            <ul className="admin-metric-rows">
              {metrics.database.map((item) => (
                <li key={item.operation}><code>{item.operation}</code><span className="admin-numeric">{formatAdminInteger(item.count)} 次 · 平均 {item.averageMs.toFixed(1)} ms</span></li>
              ))}
            </ul>
            {!metrics.database.length ? <p className="admin-empty">沒有資料庫操作紀錄。</p> : null}
          </article>
          <article>
            <h3>HTTP 狀態</h3>
            <ul className="admin-metric-rows">
              {metrics.statusClasses.map((item) => (
                <li key={item.statusClass}><span className={`admin-status-${item.statusClass}`}>{item.statusClass}</span><span className="admin-numeric">{formatAdminInteger(item.count)}</span></li>
              ))}
            </ul>
            {!metrics.statusClasses.length ? <p className="admin-empty">沒有請求紀錄。</p> : null}
          </article>
        </div>
        <details className="admin-raw-metrics">
          <summary>原始 Prometheus 文字</summary>
          <pre>{rawText || "（尚未載入）"}</pre>
        </details>
      </Panel>
    </>
  );
}
