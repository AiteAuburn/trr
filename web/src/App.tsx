import { useEffect, useRef, useState } from "react";
import { transcribeWithTransformersWhisper } from "./transformersSpeech";

type HealthResponse = {
  status: string;
  service: string;
  env: string;
};

type Account = {
  id: string;
  email: string;
  display_name: string;
};

type Profile = {
  id: string;
  account_id: string;
  display_name: string;
  relationship: string;
};

type VoiceQuota = {
  plan_code: string;
  status: string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  referral_code?: string | null;
  preserves_intro_price: boolean;
  daily_limit_seconds: number;
  used_seconds_today: number;
  remaining_seconds_today: number;
};

type ApiErrorDetail = {
  code?: string;
  message?: string;
  hint?: string;
};

class ApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly code?: string;
  readonly hint?: string;

  constructor(path: string, status: number, detail: ApiErrorDetail | null) {
    super(formatApiErrorMessage(path, status, detail));
    this.name = "ApiError";
    this.path = path;
    this.status = status;
    this.code = detail?.code;
    this.hint = detail?.hint;
  }
}

type RecordItem = {
  id: string;
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json: Record<string, unknown>;
  source: string;
};

type AppViewId =
  | "home"
  | "today"
  | "history"
  | "analysis"
  | "subscription"
  | "settings"
  | "tutorial"
  | "trialStatus"
  | "achievements"
  | "yearReview"
  | "store"
  | "foodPhoto";
type HistoryRange = "all" | "today" | "7d" | "30d" | "date";
type AnalysisRange = "7d" | "30d";

type PendingRecord = {
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json?: Record<string, unknown>;
  source: string;
  confidence?: number;
  decision_trace?: string;
};

type AiModelOption = {
  id: string;
  label: string;
  kind: "stt" | "llm";
  runtime: "browser" | "local" | "server_stub" | "cloud_disabled";
  available: boolean;
  description: string;
};

type AiModelOptions = {
  stt_models: AiModelOption[];
  llm_models: AiModelOption[];
};

type ParsePreviewResponse = {
  transcript: string;
  normalized_text: string;
  stt_model_id: string;
  llm_model_id: string;
  segments: TranscriptSegment[];
  records: PendingRecord[];
  rejected_events: RejectedEvent[];
};

type ParseProgressEvent =
  | { event: "received"; message: string }
  | { event: "normalized"; normalized_text: string }
  | { event: "segments_ready"; count: number }
  | { event: "llm_batch_active"; message: string; segment_count: number }
  | { event: "llm_fallback"; reason: string; message: string; code?: string; hint?: string }
  | { event: "llm_batch_done"; record_count: number; rejected_count: number }
  | {
      event: "segment_active";
      index: number;
      total: number;
      segment: TranscriptSegment;
    }
  | {
      event: "segment_done";
      index: number;
      total: number;
      record_count: number;
      rejected_count: number;
    }
  | { event: "validated"; record_count: number }
  | { event: "final"; preview: ParsePreviewResponse }
  | { event: "error"; message: string; code?: string; hint?: string; index?: number; total?: number };

type TranscriptSegment = {
  segment_id: string;
  segment_type: string;
  source_text: string;
  normalized_text: string;
  time_hint?: string | null;
  certainty: "certain" | "uncertain";
  is_negative_event: boolean;
  confidence: number;
};

type RejectedEvent = {
  segment_id: string;
  source_text: string;
  reason: string;
  time_hint?: string | null;
};

type ProcessingStep = {
  id: string;
  label: string;
  detail: string;
  status: "waiting" | "active" | "done" | "error";
};

type ActiveAtomicEvent = {
  index: number;
  total: number;
  segment: TranscriptSegment;
};

type ActionProposal = {
  intent:
    | "NAVIGATE"
    | "CREATE_RECORD"
    | "QUERY_DATA"
    | "GENERATE_REPORT"
    | "SWITCH_PROFILE"
    | "SET_REMINDER"
    | "UNKNOWN";
  action: string;
  actions: Array<{
    action_type: string;
    record_type?: string | null;
    payload: Record<string, unknown>;
    metadata_json?: Record<string, unknown>;
  }>;
  payload: Record<string, unknown>;
  requires_confirmation: boolean;
  confidence: number;
  decision_trace: string;
  ui_response: {
    type: "navigate" | "confirmation" | "report" | "message";
    message: string;
    target?: string | null;
  };
};

type CommandProposalResponse = {
  transcript: string;
  stt_model_id: string;
  llm_model_id: string;
  proposal: ActionProposal;
};

type SpeechRecognitionResultLike = ArrayLike<{ transcript: string }> & {
  isFinal: boolean;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const enableDebugTools = import.meta.env.VITE_ENABLE_DEBUG_TOOLS === "true";
const voicePlan = import.meta.env.VITE_VOICE_PLAN === "paid" ? "paid" : "trial";
const trialDailyVoiceSeconds = Number(import.meta.env.VITE_TRIAL_DAILY_VOICE_SECONDS ?? 300);
const paidDailyVoiceSeconds = Number(import.meta.env.VITE_PAID_DAILY_VOICE_SECONDS ?? 600);
const singleRecordingLimitSeconds = Number(
  import.meta.env.VITE_SINGLE_RECORDING_LIMIT_SECONDS ?? 60,
);
const voiceQuotaWarningSeconds = Number(import.meta.env.VITE_VOICE_QUOTA_WARNING_SECONDS ?? 120);
const silentAudioMinBytes = Number(import.meta.env.VITE_SILENT_AUDIO_MIN_BYTES ?? 1024);
const fallbackDailyVoiceLimitSeconds =
  voicePlan === "paid" ? paidDailyVoiceSeconds : trialDailyVoiceSeconds;

const appViews: Array<{ id: AppViewId; label: string; description: string }> = [
  { id: "home", label: "首頁", description: "快速記錄" },
  { id: "today", label: "今日紀錄", description: "今天所有事件" },
  { id: "history", label: "歷史紀錄", description: "依時間回看" },
  { id: "analysis", label: "基本分析", description: "7 / 30 天摘要" },
  { id: "subscription", label: "訂閱方案", description: "試用與權益" },
  { id: "tutorial", label: "使用教學", description: "四步驟上手" },
  { id: "trialStatus", label: "試用狀態", description: "到期與續訂" },
  { id: "achievements", label: "成就榜", description: "未來預覽" },
  { id: "yearReview", label: "年度回顧", description: "未來預覽" },
  { id: "store", label: "商城", description: "未來預覽" },
  { id: "foodPhoto", label: "食物拍照", description: "未來預覽" },
  { id: "settings", label: "帳號設定", description: "對象與系統" },
];

const tutorialSteps = [
  {
    title: "按住說話",
    description: "按住首頁大按鈕開始錄音。",
  },
  {
    title: "放開結束",
    description: "放開後系統會自動整理內容。",
  },
  {
    title: "確認內容",
    description: "檢查血糖、飲食、運動是否正確。",
  },
  {
    title: "儲存完成",
    description: "確認後送出，即可加入今日紀錄。",
  },
];

const achievementPreview = [
  { title: "連續記錄 7 天", description: "恭喜你！已連續記錄 7 天", status: "完成" },
  { title: "連續記錄 30 天", description: "太棒了！已連續記錄 30 天", status: "完成" },
  { title: "早晨血糖達人", description: "連續 7 天記錄早晨空腹血糖", status: "完成" },
  { title: "運動小能手", description: "連續 30 天記錄並完成運動", status: "24/30 天" },
  { title: "體重管理家", description: "連續 14 天記錄體重", status: "5/14 天" },
];

const storePreview = [
  {
    tag: "人氣",
    title: "苦瓜胜肽膠囊",
    description: "幫助維持健康代謝的商品預覽。",
    price: "NT$880",
  },
  {
    tag: "推薦",
    title: "控糖飲食指南",
    description: "飲食記錄與營養觀念參考書預覽。",
    price: "NT$320",
  },
  {
    tag: "會員",
    title: "會員專屬折價券",
    description: "優惠券介面預覽，尚未啟用交易。",
    price: "NT$100 折價券",
  },
];

const voiceProcessingPlan = [
  {
    id: "mic",
    label: "取得麥克風",
    detail: "確認瀏覽器可錄音，等待使用者放開按鈕。",
  },
  {
    id: "capture",
    label: "收集音訊",
    detail: "只在本機暫存音訊片段，尚未建立任何健康紀錄。",
  },
  {
    id: "stt",
    label: "語音轉文字",
    detail: "把音訊轉成可修改文字，後續才交給 parser。",
  },
  {
    id: "ready",
    label: "等待整理",
    detail: "使用者可先修正文字，再產生候選紀錄。",
  },
] satisfies Array<Omit<ProcessingStep, "status">>;

const parseProcessingPlan = [
  {
    id: "input",
    label: "文字已收到",
    detail: "使用目前畫面的文字，不直接寫入資料庫。",
  },
  {
    id: "normalize",
    label: "清理文字",
    detail: "整理標點、空白與常見語音辨識格式。",
  },
  {
    id: "llm",
    label: "送入本地 LLM",
    detail: "要求模型輸出 compact JSON IR，不顯示隱藏推理。",
  },
  {
    id: "segment",
    label: "切成原子事件",
    detail: "每個血糖、飲食、運動、用藥事件分開處理。",
  },
  {
    id: "schema",
    label: "Schema 驗證",
    detail: "確認欄位、型別與 record_type 符合合約。",
  },
  {
    id: "safety",
    label: "安全與負面事件檢查",
    detail: "不把「沒量血糖」這類內容建立成紀錄。",
  },
  {
    id: "cards",
    label: "產生確認卡片",
    detail: "只顯示結構化候選紀錄，等待使用者確認。",
  },
  {
    id: "confirm",
    label: "等待使用者確認",
    detail: "確認後才會儲存，儲存時會移除原始文字。",
  },
] satisfies Array<Omit<ProcessingStep, "status">>;

const debugProcessingPlan = [
  {
    id: "input",
    label: "文字已收到",
    detail: "使用目前輸入內容進行本機 debug。",
  },
  {
    id: "request",
    label: "連線本地 LLM",
    detail: "呼叫 Ollama/OpenAI-compatible streaming endpoint。",
  },
  {
    id: "stream",
    label: "串流模型輸出",
    detail: "逐字顯示 raw output，僅供本機 debug。",
  },
  {
    id: "done",
    label: "Debug 完成",
    detail: "raw output 不寫入資料庫或後端 log。",
  },
] satisfies Array<Omit<ProcessingStep, "status">>;

function buildProcessingSteps(
  plan: Array<Omit<ProcessingStep, "status">>,
  activeIndex: number,
  errorIndex?: number,
) {
  return plan.map((step, index) => {
    let status: ProcessingStep["status"] = "waiting";
    if (errorIndex !== undefined && index === errorIndex) {
      status = "error";
    } else if (index < activeIndex) {
      status = "done";
    } else if (index === activeIndex) {
      status = "active";
    }
    return { ...step, status };
  });
}

function completeProcessingSteps(plan: Array<Omit<ProcessingStep, "status">>) {
  return plan.map((step) => ({ ...step, status: "done" as const }));
}

function formatRecordPayload(recordType: string, payload: Record<string, unknown>) {
  if (recordType === "glucose") {
    const value = payload.value;
    const unit = typeof payload.unit === "string" ? payload.unit : "mg/dL";
    const timing = typeof payload.meal_timing === "string" ? ` · ${payload.meal_timing}` : "";
    return value === undefined ? JSON.stringify(payload) : `血糖 ${String(value)} ${unit}${timing}`;
  }

  if (recordType === "meal") {
    const items = payload.food_items;
    if (Array.isArray(items)) {
      const names = items
        .map((item) =>
          typeof item === "object" && item !== null && "name" in item
            ? String((item as { name: unknown }).name)
            : "",
        )
        .filter(Boolean);
      if (names.length > 0) {
        return `飲食：${names.join("、")}`;
      }
    }
  }

  if (recordType === "exercise") {
    const activity = typeof payload.activity === "string" ? payload.activity : "運動";
    const minutes = payload.minutes;
    return minutes === undefined || minutes === null
      ? activity
      : `${activity} ${String(minutes)} 分鐘`;
  }

  if (recordType === "medication") {
    const name = typeof payload.name === "string" ? payload.name : "用藥";
    return `用藥：${name}`;
  }

  return JSON.stringify(payload);
}

function recordTypeLabel(recordType: string) {
  const labels: Record<string, string> = {
    glucose: "血糖",
    meal: "飲食",
    exercise: "運動",
    medication: "用藥",
    lifestyle: "生活",
    note: "備註",
    blood_pressure: "血壓",
    body_metric: "身體數值",
  };
  return labels[recordType] ?? recordType;
}

function truncateText(value: unknown, maxLength = 160) {
  const text = String(value ?? "");
  if (!text) {
    return "無";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

function recordEvidence(metadata?: Record<string, unknown>) {
  return truncateText(metadata?.source_text);
}

const metadataTextKeys = new Set([
  "transcript",
  "source_text",
  "raw_transcript",
  "raw_text",
  "original_text",
  "normalized_text",
]);

const payloadTextKeys = new Set([
  ...metadataTextKeys,
  "description",
  "text",
  "note",
  "notes",
  "free_text",
]);

function stripBlockedKeys(value: unknown, blockedKeys: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripBlockedKeys(item, blockedKeys));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !blockedKeys.has(key))
        .map(([key, item]) => [key, stripBlockedKeys(item, blockedKeys)]),
    );
  }
  return value;
}

export function sanitizePendingRecordForCreate(pendingRecord: PendingRecord): PendingRecord {
  const payload = stripBlockedKeys(pendingRecord.payload_json, payloadTextKeys);
  const metadata = stripBlockedKeys(pendingRecord.metadata_json ?? {}, metadataTextKeys);
  return {
    ...pendingRecord,
    payload_json: payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {},
    metadata_json:
      metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata : {},
  };
}

export function formatParsePreviewDebugSummary(preview: ParsePreviewResponse) {
  return JSON.stringify(
    {
      stt_model_id: preview.stt_model_id,
      llm_model_id: preview.llm_model_id,
      segment_count: preview.segments.length,
      record_count: preview.records.length,
      rejected_count: preview.rejected_events.length,
      record_types: preview.records.map((record) => record.record_type),
    },
    null,
    2,
  );
}

export function formatCommandProposalDebugSummary(response: CommandProposalResponse) {
  const { proposal } = response;
  return JSON.stringify(
    {
      stt_model_id: response.stt_model_id,
      llm_model_id: response.llm_model_id,
      intent: proposal.intent,
      action: proposal.action,
      action_count: proposal.actions.length,
      requires_confirmation: proposal.requires_confirmation,
      action_types: proposal.actions.map((action) => action.action_type),
      record_types: proposal.actions
        .map((action) => action.record_type)
        .filter((recordType): recordType is string => typeof recordType === "string"),
    },
    null,
    2,
  );
}

function isSameLocalDate(value: string, date: Date) {
  const target = new Date(value);
  return (
    target.getFullYear() === date.getFullYear() &&
    target.getMonth() === date.getMonth() &&
    target.getDate() === date.getDate()
  );
}

function isWithinDays(value: string, days: number) {
  const target = new Date(value).getTime();
  const now = Date.now();
  return target >= now - days * 24 * 60 * 60 * 1000 && target <= now;
}

function localDateValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function glucoseValue(record: RecordItem) {
  if (record.record_type !== "glucose") {
    return null;
  }
  const value = record.payload_json.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function glucoseMealTiming(record: RecordItem) {
  const timing = record.payload_json.meal_timing;
  return typeof timing === "string" ? timing : "";
}

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.code === undefined || typeof candidate.code === "string") &&
    (candidate.message === undefined || typeof candidate.message === "string") &&
    (candidate.hint === undefined || typeof candidate.hint === "string")
  );
}

export function formatApiErrorMessage(
  path: string,
  status: number,
  detail: ApiErrorDetail | null,
) {
  if (detail?.code === "local_parser_failed") {
    return "AI 整理暫時失敗，請改用文字輸入、切換可用模型，或稍後重試。";
  }
  if (detail?.code === "local_parser_unavailable") {
    if (detail.hint === "set_gemma4_parser_url") {
      return "選定的 Gemma 4 本地解析服務尚未設定，請到設定切換可用模型。";
    }
    return "選定的本地解析模型目前不可用，請到設定切換可用模型。";
  }
  if (detail?.code === "llm_model_unavailable") {
    if (detail.hint === "set_gemma4_parser_url") {
      return "選定的 Gemma 4 本地解析服務尚未設定，請到設定切換可用模型。";
    }
    return "選定的 AI 整理模型目前不可用，請到設定切換可用模型。";
  }
  if (detail?.code === "transcript_too_complex") {
    return "這次內容包含太多事件，請分成較短的幾次記錄。";
  }
  if (detail?.code === "voice_quota_exceeded") {
    return "今日語音額度已用完，請改用文字輸入。";
  }
  return `${path} failed: ${status}`;
}

export function formatParserProgressErrorMessage(event: {
  code?: string;
  hint?: string;
  message: string;
}) {
  if (event.code === "local_parser_failed" || event.code === "local_parser_unavailable") {
    return formatApiErrorMessage("/ai/parse-preview/progress-stream", 200, {
      code: event.code,
      hint: event.hint,
    });
  }
  return event.message;
}

async function apiErrorFromResponse(path: string, response: Response) {
  let detail: ApiErrorDetail | null = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as unknown;
      if (payload && typeof payload === "object" && "detail" in payload) {
        const rawDetail = (payload as { detail: unknown }).detail;
        detail = isApiErrorDetail(rawDetail) ? rawDetail : null;
      }
    } catch {
      detail = null;
    }
  }
  return new ApiError(path, response.status, detail);
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) {
    throw await apiErrorFromResponse(path, response);
  }
  return (await response.json()) as T;
}

async function createProfile(accountId: string, displayName: string, relationship: string) {
  return requestJson<Profile>("/profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({ display_name: displayName, relationship }),
  });
}

async function getVoiceQuota(accountId: string) {
  return requestJson<VoiceQuota>("/subscriptions/voice-quota", {
    headers: { "X-Account-Id": accountId },
  });
}

async function listRecords(accountId: string, profileId: string) {
  return requestJson<RecordItem[]>(`/records?profile_id=${profileId}`, {
    headers: { "X-Account-Id": accountId },
  });
}

async function createRecord(accountId: string, pendingRecord: PendingRecord) {
  return requestJson<RecordItem>("/records", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify(sanitizePendingRecordForCreate(pendingRecord)),
  });
}

async function updateRecord(accountId: string, recordId: string, payload: Record<string, unknown>) {
  return requestJson<RecordItem>(`/records/${recordId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({ payload_json: payload }),
  });
}

async function deleteRecord(accountId: string, recordId: string) {
  const response = await fetch(`${apiBaseUrl}/records/${recordId}`, {
    method: "DELETE",
    headers: { "X-Account-Id": accountId },
  });
  if (!response.ok) {
    throw await apiErrorFromResponse(`/records/${recordId}`, response);
  }
}

async function parsePreview(
  accountId: string,
  profileId: string,
  transcript: string,
  sttModelId: string,
  llmModelId: string,
  voiceSeconds: number,
) {
  return requestJson<ParsePreviewResponse>("/ai/parse-preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({
      profile_id: profileId,
      transcript,
      stt_model_id: sttModelId,
      llm_model_id: llmModelId,
      voice_seconds: voiceSeconds,
    }),
  });
}

async function streamParsePreviewProgress(
  accountId: string,
  profileId: string,
  transcript: string,
  sttModelId: string,
  llmModelId: string,
  voiceSeconds: number,
  onEvent: (event: ParseProgressEvent) => void,
) {
  const response = await fetch(`${apiBaseUrl}/ai/parse-preview/progress-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({
      profile_id: profileId,
      transcript,
      stt_model_id: sttModelId,
      llm_model_id: llmModelId,
      voice_seconds: voiceSeconds,
    }),
  });
  if (!response.ok) {
    throw await apiErrorFromResponse("/ai/parse-preview/progress-stream", response);
  }
  if (!response.body) {
    const preview = await parsePreview(
      accountId,
      profileId,
      transcript,
      sttModelId,
      llmModelId,
      voiceSeconds,
    );
    onEvent({ event: "final", preview });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }
      onEvent(JSON.parse(line) as ParseProgressEvent);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
    onEvent(JSON.parse(buffer) as ParseProgressEvent);
  }
}

async function commandProposal(
  accountId: string,
  profileId: string,
  transcript: string,
  sttModelId: string,
  llmModelId: string,
  voiceSeconds: number,
) {
  return requestJson<CommandProposalResponse>("/ai/command-proposal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({
      profile_id: profileId,
      transcript,
      stt_model_id: sttModelId,
      llm_model_id: llmModelId,
      voice_seconds: voiceSeconds,
    }),
  });
}

async function streamLlmDebugOutput(
  accountId: string,
  profileId: string,
  transcript: string,
  sttModelId: string,
  llmModelId: string,
  onChunk: (chunk: string) => void,
) {
  if (!enableDebugTools) {
    throw new Error("Debug tools are disabled.");
  }
  const response = await fetch(`${apiBaseUrl}/ai/parse-preview/debug-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Account-Id": accountId,
    },
    body: JSON.stringify({
      profile_id: profileId,
      transcript,
      stt_model_id: sttModelId,
      llm_model_id: llmModelId,
    }),
  });
  if (!response.ok) {
    throw await apiErrorFromResponse("/ai/parse-preview/debug-stream", response);
  }
  if (!response.body) {
    throw new Error("Browser does not support response streaming.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    onChunk(decoder.decode(value, { stream: true }));
  }
  const finalChunk = decoder.decode();
  if (finalChunk) {
    onChunk(finalChunk);
  }
}

export function App() {
  const [currentView, setCurrentView] = useState<AppViewId>("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("all");
  const [historyDate, setHistoryDate] = useState(localDateValue(new Date().toISOString()));
  const [analysisRange, setAnalysisRange] = useState<AnalysisRange>("7d");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>("");
  const [profileName, setProfileName] = useState("");
  const [profileStatus, setProfileStatus] = useState("正在載入紀錄對象...");
  const [transcript, setTranscript] = useState("");
  const [isTranscriptReviewOpen, setIsTranscriptReviewOpen] = useState(false);
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([]);
  const [normalizedText, setNormalizedText] = useState("");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [rejectedEvents, setRejectedEvents] = useState<RejectedEvent[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);
  const [recordEditText, setRecordEditText] = useState("");
  const [recordStatus, setRecordStatus] = useState("輸入文字後可先整理預覽。");
  const [aiModels, setAiModels] = useState<AiModelOptions | null>(null);
  const [selectedSttModel, setSelectedSttModel] = useState("browser-web-speech");
  const [selectedLlmModel, setSelectedLlmModel] = useState("local-llm-schema-stub");
  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveFinalTranscript, setLiveFinalTranscript] = useState("");
  const [liveInterimTranscript, setLiveInterimTranscript] = useState("");
  const [llmDebugOutput, setLlmDebugOutput] = useState("");
  const [isStreamingLlmDebug, setIsStreamingLlmDebug] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [activeAtomicEvent, setActiveAtomicEvent] = useState<ActiveAtomicEvent | null>(null);
  const [completedAtomicEvents, setCompletedAtomicEvents] = useState(0);
  const [isProcessingPreview, setIsProcessingPreview] = useState(false);
  const [commandDebugOutput, setCommandDebugOutput] = useState("");
  const [commandMessage, setCommandMessage] = useState("");
  const [voiceSecondsUsedToday, setVoiceSecondsUsedToday] = useState(0);
  const [pendingVoiceSeconds, setPendingVoiceSeconds] = useState(0);
  const [voiceQuota, setVoiceQuota] = useState<VoiceQuota | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const recordingLimitTimerRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    requestJson<HealthResponse>("/health")
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unknown health check error");
      });
  }, []);

  useEffect(() => {
    requestJson<AiModelOptions>("/ai/models")
      .then((models) => {
        setAiModels(models);
        setSelectedSttModel(models.stt_models.find((model) => model.available)?.id ?? "");
        setSelectedLlmModel(models.llm_models.find((model) => model.available)?.id ?? "");
      })
      .catch((err: unknown) => {
        setRecordStatus(err instanceof Error ? err.message : "AI 模型列表載入失敗");
      });
  }, []);

  useEffect(() => {
    async function loadProfiles() {
      try {
        const login = await requestJson<Account>("/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "demo@example.com", display_name: "Demo User" }),
        });
        setAccount(login);
        const quota = await getVoiceQuota(login.id);
        setVoiceQuota(quota);
        setVoiceSecondsUsedToday(quota.used_seconds_today);

        let nextProfiles = await requestJson<Profile[]>("/profiles", {
          headers: { "X-Account-Id": login.id },
        });

        if (nextProfiles.length === 0) {
          const self = await createProfile(login.id, "自己", "self");
          nextProfiles = [self];
        }

        setProfiles(nextProfiles);
        setActiveProfileId((current) => current || nextProfiles[0]?.id || "");
        setProfileStatus("已連到本機開發 API");
      } catch (err: unknown) {
        setProfileStatus(err instanceof Error ? err.message : "紀錄對象載入失敗");
      }
    }

    void loadProfiles();
  }, []);

  const activeProfile =
    profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0] ?? null;

  useEffect(() => {
    async function loadRecords() {
      if (!account || !activeProfile) {
        return;
      }

      try {
      const nextRecords = await listRecords(account.id, activeProfile.id);
      setRecords(nextRecords);
      setSelectedRecord(null);
      setRecordEditText("");
      setRecordStatus(nextRecords.length > 0 ? "已載入目前對象的紀錄。" : "目前尚無紀錄。");
      } catch (err: unknown) {
        setRecordStatus(err instanceof Error ? err.message : "紀錄載入失敗");
      }
    }

    void loadRecords();
  }, [account, activeProfile]);

  async function handleAddProfile() {
    const displayName = profileName.trim();
    if (!account || displayName.length === 0) {
      return;
    }

    setProfileStatus("正在新增紀錄對象...");
    try {
      const profile = await createProfile(account.id, displayName, "care_recipient");
      setProfiles((current) => [...current, profile]);
      setActiveProfileId(profile.id);
      setProfileName("");
      setProfileStatus("已新增並切換紀錄對象");
    } catch (err: unknown) {
      setProfileStatus(err instanceof Error ? err.message : "新增紀錄對象失敗");
    }
  }

  function speechRecognitionConstructor() {
    const globalWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return globalWindow.SpeechRecognition ?? globalWindow.webkitSpeechRecognition;
  }

  function stopMediaStream() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function clearRecordingLimitTimer() {
    if (recordingLimitTimerRef.current !== null) {
      window.clearTimeout(recordingLimitTimerRef.current);
      recordingLimitTimerRef.current = null;
    }
  }

  function remainingVoiceSeconds() {
    const limit = voiceQuota?.daily_limit_seconds ?? fallbackDailyVoiceLimitSeconds;
    return Math.max(0, limit - voiceSecondsUsedToday);
  }

  function canStartVoiceRecording() {
    if (remainingVoiceSeconds() <= 0) {
      setRecordStatus("今日語音額度已用完，請改用文字輸入。");
      return false;
    }
    return true;
  }

  function startVoiceQuotaTimer() {
    const remaining = remainingVoiceSeconds();
    const limitSeconds = Math.max(1, Math.min(singleRecordingLimitSeconds, remaining));
    const startedAt = Date.now();
    recordingStartedAtRef.current = startedAt;
    clearRecordingLimitTimer();
    recordingLimitTimerRef.current = window.setTimeout(() => {
      handleStopVoiceInput();
      setRecordStatus(`已達單次錄音上限 ${formatDuration(limitSeconds)}，已自動停止。`);
    }, limitSeconds * 1000);
  }

  function finishVoiceQuotaTimer() {
    clearRecordingLimitTimer();
    if (recordingStartedAtRef.current === null) {
      return;
    }
    const elapsedSeconds = Math.max(
      1,
      Math.ceil((Date.now() - recordingStartedAtRef.current) / 1000),
    );
    setPendingVoiceSeconds((current) => current + elapsedSeconds);
    setVoiceSecondsUsedToday((current) =>
      Math.min(
        voiceQuota?.daily_limit_seconds ?? fallbackDailyVoiceLimitSeconds,
        current + elapsedSeconds,
      ),
    );
    recordingStartedAtRef.current = null;
  }

  function voiceQuotaStatus() {
    const remaining = remainingVoiceSeconds();
    if (remaining <= voiceQuotaWarningSeconds) {
      return `語音額度剩餘 ${formatDuration(remaining)}`;
    }
    return `今日已用 ${formatDuration(voiceSecondsUsedToday)}`;
  }

  function voicePlanLabel() {
    const planCode = voiceQuota?.plan_code ?? voicePlan;
    return planCode === "annual" || planCode === "paid" ? "付費版" : "試用版";
  }

  function mediaRecorderOptions() {
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      return { mimeType: "audio/webm;codecs=opus" };
    }
    if (MediaRecorder.isTypeSupported("audio/webm")) {
      return { mimeType: "audio/webm" };
    }
    return undefined;
  }

  async function handleStartTransformersWhisper() {
    if (!canStartVoiceRecording()) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordStatus("此瀏覽器不支援 MediaRecorder，請改用 Browser Web Speech 或文字輸入。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      mediaChunksRef.current = [];
      const recorder = new MediaRecorder(stream, mediaRecorderOptions());
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        finishVoiceQuotaTimer();
        setRecordStatus("Transformers.js 錄音失敗，請改用 Browser Web Speech 或文字輸入。");
        setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 1, 1));
        setIsListening(false);
        stopMediaStream();
      };
      recorder.onstop = () => {
        const chunks = [...mediaChunksRef.current];
        mediaChunksRef.current = [];
        finishVoiceQuotaTimer();
        stopMediaStream();
        setIsListening(false);

        const audioBytes = chunks.reduce((total, chunk) => total + chunk.size, 0);
        if (chunks.length === 0 || audioBytes < silentAudioMinBytes) {
          setRecordStatus("幾乎沒有收到聲音，未送出轉錄。請重試或改用文字輸入。");
          setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 1, 1));
          return;
        }

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        setRecordStatus("正在用 Transformers.js Whisper Tiny 轉文字，第一次會下載模型...");
        setLiveInterimTranscript("Whisper Tiny 轉錄中...");
        setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 2));

        void transcribeWithTransformersWhisper(audioBlob)
          .then((text) => {
            if (text.length === 0) {
              setRecordStatus("Transformers.js Whisper Tiny 沒有辨識到文字。");
              setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 2, 2));
              setLiveInterimTranscript("");
              return;
            }
            setTranscript((current) => [current.trim(), text].filter(Boolean).join(" "));
            setLiveFinalTranscript(text);
            setLiveInterimTranscript("");
            setProcessingSteps(completeProcessingSteps(voiceProcessingPlan));
            setRecordStatus("Transformers.js Whisper Tiny 轉錄完成，可整理預覽。");
          })
          .catch((err: unknown) => {
            setLiveInterimTranscript("");
            setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 2, 2));
            setRecordStatus(
              err instanceof Error
                ? `Transformers.js Whisper Tiny 轉錄失敗：${err.message}`
                : "Transformers.js Whisper Tiny 轉錄失敗。",
            );
          });
      };

      recorder.start();
      startVoiceQuotaTimer();
      setIsListening(true);
      setLiveFinalTranscript("");
      setLiveInterimTranscript("正在錄音，放開後才會用 Whisper Tiny 轉錄。");
      setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 1));
      setRecordStatus("Transformers.js Whisper Tiny 錄音中...");
    } catch (err: unknown) {
      finishVoiceQuotaTimer();
      stopMediaStream();
      setIsListening(false);
      setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 0, 0));
      setRecordStatus(err instanceof Error ? err.message : "無法取得麥克風權限。");
    }
  }

  function handleStartVoiceInput() {
    if (selectedSttModel === "web-transformers-whisper-tiny") {
      void handleStartTransformersWhisper();
      return;
    }

    if (!canStartVoiceRecording()) {
      return;
    }

    const canUseWebSpeech =
      selectedSttModel === "browser-web-speech" ||
      selectedSttModel === "local-whisper-tiny-placeholder";
    if (!canUseWebSpeech) {
      setRecordStatus("這個 STT 模型目前還不能在 web 模擬器使用。");
      return;
    }

    const Recognition = speechRecognitionConstructor();
    if (!Recognition) {
      setRecordStatus("此瀏覽器不支援 Web Speech，請先用文字輸入。");
      return;
    }

    const baseTranscript = transcript.trim();
    const recognition = new Recognition();
    recognition.lang = "zh-TW";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const finalText: string[] = [];
      const interimText: string[] = [];

      for (const result of Array.from(event.results)) {
        const text = result[0]?.transcript?.trim() ?? "";
        if (text.length === 0) {
          continue;
        }
        if (result.isFinal) {
          finalText.push(text);
        } else {
          interimText.push(text);
        }
      }

      const nextFinal = finalText.join(" ").trim();
      const nextInterim = interimText.join(" ").trim();
      setLiveFinalTranscript(nextFinal);
      setLiveInterimTranscript(nextInterim);
      setTranscript([baseTranscript, nextFinal].filter(Boolean).join(" "));
    };
    recognition.onerror = () => {
      finishVoiceQuotaTimer();
      setRecordStatus("語音辨識失敗，請重試或改用文字輸入。");
      setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 2, 2));
      setIsListening(false);
    };
    recognition.onend = () => {
      finishVoiceQuotaTimer();
      setIsListening(false);
      setProcessingSteps(completeProcessingSteps(voiceProcessingPlan));
    };
    recognition.start();
    startVoiceQuotaTimer();
    setSpeechRecognition(recognition);
    setIsListening(true);
    setLiveFinalTranscript("");
    setLiveInterimTranscript("");
    setProcessingSteps(buildProcessingSteps(voiceProcessingPlan, 2));
    setRecordStatus(
      selectedSttModel === "local-whisper-tiny-placeholder"
        ? "Web 模擬器正在用 Browser Web Speech 代替 Whisper Tiny 收音；parser 仍會收到 Whisper Tiny model id。"
        : "正在辨識語音...",
    );
  }

  function handleStopVoiceInput() {
    finishVoiceQuotaTimer();
    if (selectedSttModel === "web-transformers-whisper-tiny") {
      const recorder = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      return;
    }

    speechRecognition?.stop();
    setSpeechRecognition(null);
    setIsListening(false);
  }

  async function handleBuildPreview(skipTranscriptReview = false) {
    if (!account || !activeProfile || transcript.trim().length === 0) {
      setRecordStatus("請先輸入要記錄的內容。");
      return;
    }
    if (!skipTranscriptReview) {
      setIsTranscriptReviewOpen(true);
      setRecordStatus("請先確認文字內容，確認後才會交給 AI 整理。");
      return;
    }

    setIsTranscriptReviewOpen(false);
    setIsProcessingPreview(true);
    setActiveAtomicEvent(null);
    setCompletedAtomicEvents(0);
    setPendingRecords([]);
    setSegments([]);
    setRejectedEvents([]);
    setNormalizedText("");
    setRecordStatus("正在建立處理流程...");
    setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 0));
    setLlmDebugOutput("Waiting for parser progress...");
    try {
      let finalPreview: ParsePreviewResponse | null = null;
      await streamParsePreviewProgress(
        account.id,
        activeProfile.id,
        transcript.trim(),
        selectedSttModel,
        selectedLlmModel,
        pendingVoiceSeconds,
        (event) => {
          if (event.event === "received") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 1));
            setRecordStatus("文字已收到，準備清理與切段。");
            return;
          }
          if (event.event === "normalized") {
            setNormalizedText(event.normalized_text);
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 2));
            setRecordStatus("文字已清理，準備送入本地 LLM。");
            return;
          }
          if (event.event === "segments_ready") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 3));
            setRecordStatus(`已建立 ${event.count} 個 atomic event queue。`);
            return;
          }
          if (event.event === "llm_batch_active") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 2));
            setRecordStatus(
              `本地 LLM 正在一次解析完整文字，包含 ${event.segment_count} 個 atomic event。`,
            );
            return;
          }
          if (event.event === "llm_fallback") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 4));
            setRecordStatus(event.message);
            setLlmDebugOutput((current) =>
              [current, `LLM fallback: ${event.reason}`].filter(Boolean).join("\n"),
            );
            return;
          }
          if (event.event === "llm_batch_done") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 4));
            setRecordStatus(
              `LLM 批次解析完成，產生 ${event.record_count} 筆候選紀錄，${event.rejected_count} 筆不建立紀錄。`,
            );
            return;
          }
          if (event.event === "segment_active") {
            setActiveAtomicEvent({
              index: event.index,
              total: event.total,
              segment: event.segment,
            });
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 5));
            setRecordStatus(
              `正在檢查第 ${event.index}/${event.total} 個 atomic event 的對照結果。`,
            );
            return;
          }
          if (event.event === "segment_done") {
            setCompletedAtomicEvents(event.index);
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 4));
            setRecordStatus(
              `第 ${event.index}/${event.total} 個 atomic event 完成，產生 ${event.record_count} 筆候選紀錄。`,
            );
            return;
          }
          if (event.event === "validated") {
            setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 6));
            setRecordStatus(`Schema 與安全檢查完成，候選紀錄 ${event.record_count} 筆。`);
            return;
          }
          if (event.event === "final") {
            finalPreview = event.preview;
            setPendingRecords(event.preview.records);
            setPendingVoiceSeconds(0);
            if (account) {
              void getVoiceQuota(account.id).then((quota) => {
                setVoiceQuota(quota);
                setVoiceSecondsUsedToday(quota.used_seconds_today);
              });
            }
            if (event.preview.normalized_text) {
              setNormalizedText(event.preview.normalized_text);
            }
            setSegments(event.preview.segments);
            setRejectedEvents(event.preview.rejected_events);
            setLlmDebugOutput(formatParsePreviewDebugSummary(event.preview));
            setActiveAtomicEvent(null);
            setProcessingSteps([
              ...completeProcessingSteps(parseProcessingPlan.slice(0, 7)),
              { ...parseProcessingPlan[7], status: "active" },
            ]);
            setRecordStatus(
              `已整理 ${event.preview.records.length} 筆候選紀錄，確認後才會儲存。`,
            );
            return;
          }
          if (event.event === "error") {
            throw new Error(formatParserProgressErrorMessage(event));
          }
        },
      );
      if (!finalPreview) {
        throw new Error("Parser progress stream did not return a final preview.");
      }
    } catch (err: unknown) {
      setLlmDebugOutput(err instanceof Error ? err.message : "整理預覽失敗");
      setProcessingSteps(buildProcessingSteps(parseProcessingPlan, 2, 2));
      setActiveAtomicEvent(null);
      setRecordStatus(err instanceof Error ? err.message : "整理預覽失敗");
    } finally {
      setIsProcessingPreview(false);
    }
  }

  async function handleStreamLlmDebug() {
    if (!account || !activeProfile || transcript.trim().length === 0) {
      setRecordStatus("請先輸入要 debug 的內容。");
      return;
    }

    setIsStreamingLlmDebug(true);
    setRecordStatus("正在串流本地 LLM raw output...");
    setProcessingSteps(buildProcessingSteps(debugProcessingPlan, 1));
    setActiveAtomicEvent(null);
    setLlmDebugOutput("");
    try {
      await streamLlmDebugOutput(
        account.id,
        activeProfile.id,
        transcript.trim(),
        selectedSttModel,
        selectedLlmModel,
        (chunk) => {
          setProcessingSteps(buildProcessingSteps(debugProcessingPlan, 2));
          setLlmDebugOutput((current) => `${current}${chunk}`);
        },
      );
      setProcessingSteps(completeProcessingSteps(debugProcessingPlan));
      setRecordStatus("LLM debug stream 完成。");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "LLM debug stream 失敗";
      setLlmDebugOutput((current) => `${current}\n${message}`);
      setProcessingSteps(buildProcessingSteps(debugProcessingPlan, 2, 2));
      setRecordStatus(message);
    } finally {
      setIsStreamingLlmDebug(false);
    }
  }

  function pendingRecordsFromProposal(proposal: ActionProposal) {
    const records = proposal.payload.records;
    return Array.isArray(records) ? (records as PendingRecord[]) : [];
  }

  function routeForCommandTarget(target?: string | null): AppViewId | null {
    if (target === "home") {
      return "home";
    }
    if (target === "trend" || target === "report") {
      return "analysis";
    }
    if (target === "history") {
      return "history";
    }
    if (target === "today") {
      return "today";
    }
    return null;
  }

  async function handleCommandProposal() {
    if (!account || !activeProfile || transcript.trim().length === 0) {
      setRecordStatus("請先輸入語音指令或文字。");
      return;
    }

    setCommandMessage("正在解析語音操作...");
    setCommandDebugOutput("Waiting for command proposal...");
    try {
      const response = await commandProposal(
        account.id,
        activeProfile.id,
        transcript.trim(),
        selectedSttModel,
        selectedLlmModel,
        pendingVoiceSeconds,
      );
      const { proposal } = response;
      setPendingVoiceSeconds(0);
      const quota = await getVoiceQuota(account.id);
      setVoiceQuota(quota);
      setVoiceSecondsUsedToday(quota.used_seconds_today);
      setCommandDebugOutput(formatCommandProposalDebugSummary(response));
      setCommandMessage(proposal.ui_response.message);

      if (proposal.intent === "CREATE_RECORD") {
        setPendingRecords(pendingRecordsFromProposal(proposal));
        setRecordStatus("語音操作已建立候選紀錄，確認後才會儲存。");
      } else if (proposal.intent === "NAVIGATE") {
        const route = routeForCommandTarget(proposal.ui_response.target);
        if (route) {
          switchView(route);
          setRecordStatus(`語音操作已切換頁面：${proposal.ui_response.message}`);
        } else {
          setRecordStatus(`語音操作尚未支援這個頁面：${proposal.ui_response.message}`);
        }
      } else if (proposal.intent === "GENERATE_REPORT") {
        setAnalysisRange(proposal.payload.range_days === 30 ? "30d" : "7d");
        switchView("analysis");
        setRecordStatus("語音操作已打開基本分析；未寫入任何資料。");
      } else if (proposal.intent === "QUERY_DATA") {
        switchView("history");
        setRecordStatus("語音查詢已辨識；目前先打開歷史紀錄，後續再接查詢結果卡。");
      } else {
        setRecordStatus(proposal.ui_response.message);
      }
    } catch (err: unknown) {
      setCommandDebugOutput(err instanceof Error ? err.message : "語音操作解析失敗");
      setCommandMessage(err instanceof Error ? err.message : "語音操作解析失敗");
    }
  }

  async function handleSaveRecord() {
    if (!account || pendingRecords.length === 0) {
      return;
    }
    if (!window.confirm("確認儲存這些結構化紀錄？")) {
      return;
    }

    setProcessingSteps([
      ...completeProcessingSteps(parseProcessingPlan),
      {
        id: "save",
        label: "寫入本機紀錄",
        detail: "只儲存結構化欄位，移除 transcript、evidence、source_text。",
        status: "active",
      },
    ]);
    setRecordStatus("正在儲存紀錄...");
    try {
      const savedRecords = await Promise.all(
        pendingRecords.map((pendingRecord) => createRecord(account.id, pendingRecord)),
      );
      setRecords((current) => [...savedRecords, ...current]);
      setTranscript("");
      setPendingRecords([]);
      setIsTranscriptReviewOpen(false);
      setNormalizedText("");
      setSegments([]);
      setRejectedEvents([]);
      setProcessingSteps([]);
      setActiveAtomicEvent(null);
      setCompletedAtomicEvents(0);
      setRecordStatus("紀錄已儲存。");
    } catch (err: unknown) {
      setProcessingSteps((current) =>
        current.map((step) => (step.id === "save" ? { ...step, status: "error" } : step)),
      );
      setRecordStatus(err instanceof Error ? err.message : "紀錄儲存失敗");
    }
  }

  function updatePendingRecordPayloadFromText(index: number, value: string) {
    try {
      const payload = JSON.parse(value) as unknown;
      if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        throw new Error("payload must be an object");
      }
      setPendingRecords((current) =>
        current.map((record, recordIndex) =>
          recordIndex === index
            ? { ...record, payload_json: payload as Record<string, unknown> }
            : record,
        ),
      );
      setRecordStatus("候選紀錄已更新，確認後才會儲存。");
    } catch (err: unknown) {
      setRecordStatus(err instanceof Error ? `JSON 格式錯誤：${err.message}` : "JSON 格式錯誤");
    }
  }

  function openRecordDetail(record: RecordItem) {
    setSelectedRecord(record);
    setRecordEditText(JSON.stringify(record.payload_json, null, 2));
  }

  async function handleUpdateSelectedRecord() {
    if (!account || !selectedRecord) {
      return;
    }
    try {
      const payload = JSON.parse(recordEditText) as unknown;
      if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
        throw new Error("payload must be an object");
      }
      const updated = await updateRecord(
        account.id,
        selectedRecord.id,
        payload as Record<string, unknown>,
      );
      setRecords((current) =>
        current.map((record) => (record.id === updated.id ? updated : record)),
      );
      setSelectedRecord(updated);
      setRecordEditText(JSON.stringify(updated.payload_json, null, 2));
      setRecordStatus("紀錄已更新。");
    } catch (err: unknown) {
      setRecordStatus(err instanceof Error ? `更新失敗：${err.message}` : "更新失敗");
    }
  }

  async function handleDeleteSelectedRecord() {
    if (!account || !selectedRecord) {
      return;
    }
    if (!window.confirm("確認刪除這筆紀錄？")) {
      return;
    }
    try {
      await deleteRecord(account.id, selectedRecord.id);
      setRecords((current) => current.filter((record) => record.id !== selectedRecord.id));
      setSelectedRecord(null);
      setRecordEditText("");
      setRecordStatus("紀錄已刪除。");
    } catch (err: unknown) {
      setRecordStatus(err instanceof Error ? `刪除失敗：${err.message}` : "刪除失敗");
    }
  }

  const activeProcessingStep = processingSteps.find((step) => step.status === "active");
  const processingProgress =
    processingSteps.length === 0
      ? 0
      : Math.round(
          (processingSteps.filter((step) => step.status === "done").length /
            processingSteps.length) *
            100,
        );
  const shouldShowLoadingSheet =
    isListening || isProcessingPreview || (enableDebugTools && isStreamingLlmDebug);
  const todayRecords = records.filter((record) => isSameLocalDate(record.occurred_at, new Date()));
  const sevenDayRecords = records.filter((record) => isWithinDays(record.occurred_at, 7));
  const thirtyDayRecords = records.filter((record) => isWithinDays(record.occurred_at, 30));
  const historyRecords = records.filter((record) => {
    if (historyRange === "today") {
      return todayRecords.includes(record);
    }
    if (historyRange === "7d") {
      return sevenDayRecords.includes(record);
    }
    if (historyRange === "30d") {
      return thirtyDayRecords.includes(record);
    }
    if (historyRange === "date") {
      return localDateValue(record.occurred_at) === historyDate;
    }
    return true;
  });
  const analysisRecords = analysisRange === "7d" ? sevenDayRecords : thirtyDayRecords;
  const analysisGlucoseRecords = analysisRecords
    .filter((record) => glucoseValue(record) !== null)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const analysisGlucoseValues = analysisGlucoseRecords
    .map(glucoseValue)
    .filter((value): value is number => value !== null);
  const fastingAverage = average(
    analysisGlucoseRecords
      .filter((record) => glucoseMealTiming(record).includes("fasting") || glucoseMealTiming(record).includes("空腹"))
      .map(glucoseValue)
      .filter((value): value is number => value !== null),
  );
  const postMealAverage = average(
    analysisGlucoseRecords
      .filter((record) => {
        const timing = glucoseMealTiming(record);
        return timing.includes("post") || timing.includes("飯後") || timing.includes("餐後");
      })
      .map(glucoseValue)
      .filter((value): value is number => value !== null),
  );
  const highestGlucose =
    analysisGlucoseValues.length > 0 ? Math.max(...analysisGlucoseValues) : null;
  const latestGlucose = records.map(glucoseValue).find((value): value is number => value !== null);
  const currentViewMeta = appViews.find((view) => view.id === currentView) ?? appViews[0];
  const trialDaysLeft = voiceQuota?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(voiceQuota.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      )
    : 2;

  function switchView(view: AppViewId) {
    setCurrentView(view);
    setIsMenuOpen(false);
  }

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-bar">
          <div>
            <p className="eyebrow">AI 語音血糖日記</p>
            <h1>糖錄錄</h1>
            <p className="summary">
              {currentViewMeta.label} · {currentViewMeta.description}
            </p>
          </div>
          <button
            className="menu-button"
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="開啟功能選單"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            ☰
          </button>
        </div>
        {isMenuOpen ? (
          <nav className="app-menu" aria-label="功能選單">
            {appViews.map((view) => (
              <button
                className={view.id === currentView ? "active" : ""}
                key={view.id}
                type="button"
                onClick={() => switchView(view.id)}
              >
                <strong>{view.label}</strong>
                <span>{view.description}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </section>

      <section className="active-context" aria-label="Active profile context">
        <strong>目前對象：{activeProfile?.display_name ?? "自己"}</strong>
        <span>今日 {todayRecords.length} 筆 · 全部 {records.length} 筆</span>
      </section>

      {currentView === "settings" ? (
        <section className="panel" aria-label="Backend health">
        <div>
          <h2>Backend</h2>
          <p className="muted">Docker-first local development check</p>
        </div>
        {health ? (
          <span className="status ok">
            {health.service}: {health.status} ({health.env})
          </span>
        ) : (
          <span className="status pending">{error ?? "Checking..."}</span>
        )}
        </section>
      ) : null}

      {currentView === "settings" ? (
        <section className="profile-panel" aria-label="Profile switcher">
        <div>
          <h2>紀錄對象</h2>
          <p className="muted">照顧者可以在同一支手機快速切換，不混用個人資料。</p>
        </div>
        <div className="profile-controls">
          <label>
            <span>目前對象</span>
            <select
              value={activeProfile?.id ?? ""}
              onChange={(event) => {
                setActiveProfileId(event.target.value);
              }}
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </select>
          </label>
          <div className="add-profile">
            <input
              aria-label="新增紀錄對象名稱"
              placeholder="新增對象，例如：媽媽"
              value={profileName}
              onChange={(event) => {
                setProfileName(event.target.value);
              }}
            />
            <button type="button" onClick={() => void handleAddProfile()}>
              新增
            </button>
          </div>
          <p className="muted">{profileStatus}</p>
        </div>
        </section>
      ) : null}

      {currentView === "settings" ? (
        <section className="settings-panel" aria-label="AI model settings">
          <div>
            <h2>AI 設定</h2>
            <p className="muted">開發階段可切換 STT / LLM；首頁保持快速記錄。</p>
          </div>
          <div className="model-grid" aria-label="AI model controls">
            <label>
              <span>STT 模型</span>
              <select
                value={selectedSttModel}
                onChange={(event) => {
                  setSelectedSttModel(event.target.value);
                }}
              >
                {(aiModels?.stt_models ?? []).map((model) => (
                  <option key={model.id} value={model.id} disabled={!model.available}>
                    {model.label}
                    {model.available ? "" : "（尚未啟用）"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>LLM 模型</span>
              <select
                value={selectedLlmModel}
                onChange={(event) => {
                  setSelectedLlmModel(event.target.value);
                }}
              >
                {(aiModels?.llm_models ?? []).map((model) => (
                  <option key={model.id} value={model.id} disabled={!model.available}>
                    {model.label}
                    {model.available ? "" : "（尚未啟用）"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {enableDebugTools ? (
            <button
              className="secondary-action"
              type="button"
              disabled={isProcessingPreview || isStreamingLlmDebug}
              onClick={() => void handleCommandProposal()}
            >
              語音操作解析
            </button>
          ) : null}
        </section>
      ) : null}

      {currentView === "home" ? (
        <section className="recorder" aria-label="Record mock">
        <div className="profile">正在記錄：{activeProfile?.display_name ?? "自己"}</div>
        <div className="quota-hint" aria-label="Voice quota status">
          <span>{voicePlanLabel()}</span>
          <strong>{voiceQuotaStatus()}</strong>
        </div>
        <button
          type="button"
          disabled={isProcessingPreview || isStreamingLlmDebug}
          onMouseDown={handleStartVoiceInput}
          onMouseUp={handleStopVoiceInput}
          onMouseLeave={handleStopVoiceInput}
          onTouchStart={handleStartVoiceInput}
          onTouchEnd={handleStopVoiceInput}
        >
          {isListening ? "辨識中..." : "按住說話"}
        </button>
        <textarea
          placeholder="也可以直接輸入：今天早上空腹血糖 138..."
          value={transcript}
          onChange={(event) => {
            setTranscript(event.target.value);
          }}
        />
        <div className="live-transcript" aria-label="Live speech result">
          <div>
            <strong>即時辨識</strong>
            <p>{liveInterimTranscript || "尚無即時結果"}</p>
          </div>
          <div>
            <strong>已確認文字</strong>
            <p>{liveFinalTranscript || transcript || "尚無確認文字"}</p>
          </div>
        </div>
        <button
          className="secondary-action"
          type="button"
          disabled={isProcessingPreview || isStreamingLlmDebug}
          onClick={() => void handleBuildPreview()}
        >
          {isProcessingPreview ? "整理中..." : "整理預覽"}
        </button>
        {enableDebugTools ? (
          <button
            className="secondary-action"
            type="button"
            disabled={isProcessingPreview || isStreamingLlmDebug}
            onClick={() => void handleStreamLlmDebug()}
          >
            {isStreamingLlmDebug ? "LLM 串流中..." : "即時 LLM Debug"}
          </button>
        ) : null}
        <p className="muted">{recordStatus}</p>
        </section>
      ) : null}

      {isTranscriptReviewOpen ? (
        <section className="transcript-review" aria-label="Transcript confirmation">
          <div>
            <h2>確認語音文字</h2>
            <p className="muted">可先修改辨識內容，下一步才會交給 AI 整理。</p>
          </div>
          <textarea
            value={transcript}
            onChange={(event) => {
              setTranscript(event.target.value);
            }}
          />
          <div className="confirmation-actions">
            <button type="button" onClick={() => setIsTranscriptReviewOpen(false)}>
              重新修改
            </button>
            <button type="button" onClick={() => void handleBuildPreview(true)}>
              下一步整理
            </button>
          </div>
        </section>
      ) : null}

      {shouldShowLoadingSheet ? (
        <section className="loading-sheet" aria-live="polite" aria-label="Loading status">
          <div className="spinner" aria-hidden="true" />
          <div>
            <strong>{activeProcessingStep?.label ?? "處理中"}</strong>
            <p>{activeProcessingStep?.detail ?? recordStatus}</p>
          </div>
          <div className="progress-meter" aria-label={`處理進度 ${processingProgress}%`}>
            <span style={{ width: `${processingProgress}%` }} />
          </div>
          {enableDebugTools && activeAtomicEvent ? (
            <div className="atomic-now">
              <span>
                Atomic {activeAtomicEvent.index}/{activeAtomicEvent.total}
              </span>
              <p>{activeAtomicEvent.segment.source_text}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {processingSteps.length > 0 ? (
        <section className="processing-panel" aria-label="Processing status">
          <div className="processing-head">
            <div>
              <h2>處理進度</h2>
              <p className="muted">
                {completedAtomicEvents > 0
                  ? `已完成 ${completedAtomicEvents} 個 atomic event。`
                  : "顯示使用者可理解的處理狀態，不暴露 chain-of-thought。"}
              </p>
            </div>
            <strong>{processingProgress}%</strong>
          </div>
          <ol>
            {processingSteps.map((step) => (
              <li className={step.status} key={step.id}>
                <span>
                  {step.status === "done"
                    ? "✓"
                    : step.status === "active"
                      ? "…"
                      : step.status === "error"
                        ? "!"
                        : ""}
                </span>
                <div>
                  <strong>{step.label}</strong>
                  <p>{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {enableDebugTools ? (
        <section className="debug-panel" aria-label="Command debug output">
          <div>
            <h2>Command Debug</h2>
            <p className="muted">parser 只產生 action proposal，不直接寫入資料。</p>
          </div>
          {commandMessage ? <p className="command-message">{commandMessage}</p> : null}
          <pre>{commandDebugOutput || "尚無 command proposal"}</pre>
        </section>
      ) : null}

      {enableDebugTools ? (
        <section className="debug-panel" aria-label="LLM debug output">
          <div>
            <h2>LLM Debug</h2>
            <p className="muted">可即時顯示 Qwen/Ollama raw output；只在本機畫面，不寫入 log。</p>
          </div>
          <pre>{llmDebugOutput || "尚無 LLM 輸出"}</pre>
        </section>
      ) : null}

      {enableDebugTools && (segments.length > 0 || rejectedEvents.length > 0) ? (
        <section className="pipeline-panel" aria-label="Transcript processing pipeline">
          <div>
            <h2>語意切段</h2>
            <p className="muted">raw transcript 先整理成片段，再產生候選紀錄。</p>
          </div>
          {normalizedText ? (
            <div className="normalized-text">
              <strong>整理後文字</strong>
              <p>{normalizedText}</p>
            </div>
          ) : null}
          {segments.length > 0 ? (
            <div className="segment-list">
              {segments.map((segment) => (
                <div className="segment-row" key={segment.segment_id}>
                  <span>{segment.segment_id}</span>
                  <strong>{segment.segment_type}</strong>
                  <p>{segment.source_text}</p>
                  <small>
                    {segment.time_hint ?? "no_time"} · {segment.certainty} ·{" "}
                    {Math.round(segment.confidence * 100)}%
                  </small>
                </div>
              ))}
            </div>
          ) : null}
          {rejectedEvents.length > 0 ? (
            <div className="rejected-list">
              <strong>不建立紀錄</strong>
              {rejectedEvents.map((event) => (
                <p key={event.segment_id}>
                  {event.source_text}：{event.reason}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {pendingRecords.length > 0 ? (
        <section className="confirmation" aria-label="Record confirmation">
          <div>
            <h2>待確認整理卡</h2>
            <p className="muted">由選定 LLM 模型產生候選紀錄；確認後才會儲存。</p>
          </div>
          {pendingRecords.map((pendingRecord, index) => (
            <dl key={`${pendingRecord.record_type}-${index}`}>
              <div>
                <dt>對象</dt>
                <dd>{activeProfile?.display_name ?? "自己"}</dd>
              </div>
              <div>
                <dt>類型</dt>
                <dd>{pendingRecord.record_type}</dd>
              </div>
              <div>
                <dt>信心</dt>
                <dd>{Math.round((pendingRecord.confidence ?? 0) * 100)}%</dd>
              </div>
              <div>
                <dt>內容</dt>
                <dd>{formatRecordPayload(pendingRecord.record_type, pendingRecord.payload_json)}</dd>
              </div>
              <div>
                <dt>編輯</dt>
                <dd>
                  <textarea
                    defaultValue={JSON.stringify(pendingRecord.payload_json, null, 2)}
                    aria-label={`編輯候選紀錄 ${index + 1}`}
                    onBlur={(event) =>
                      updatePendingRecordPayloadFromText(index, event.currentTarget.value)
                    }
                  />
                </dd>
              </div>
              <div>
                <dt>原文</dt>
                <dd>{recordEvidence(pendingRecord.metadata_json)}</dd>
              </div>
              <div>
                <dt>判斷</dt>
                <dd>{pendingRecord.decision_trace}</dd>
              </div>
            </dl>
          ))}
          <div className="confirmation-actions">
            <button type="button" onClick={() => setPendingRecords([])}>
              修改
            </button>
            <button type="button" onClick={() => void handleSaveRecord()}>
              確認儲存
            </button>
          </div>
        </section>
      ) : null}

      {selectedRecord ? (
        <section className="record-detail" aria-label="Record detail">
          <div>
            <h2>紀錄詳情</h2>
            <p className="muted">可編輯結構化欄位；更新與刪除會走後端權限檢查與 audit event。</p>
          </div>
          <div className="record-hero">
            <span>{selectedRecord.record_type}</span>
            <strong>{formatRecordPayload(selectedRecord.record_type, selectedRecord.payload_json)}</strong>
            <small>{new Date(selectedRecord.occurred_at).toLocaleString()}</small>
          </div>
          <label className="json-editor">
            <span>payload_json</span>
            <textarea
              value={recordEditText}
              onChange={(event) => setRecordEditText(event.target.value)}
            />
          </label>
          <div className="confirmation-actions">
            <button type="button" onClick={() => void handleDeleteSelectedRecord()}>
              刪除
            </button>
            <button type="button" onClick={() => void handleUpdateSelectedRecord()}>
              儲存修改
            </button>
          </div>
        </section>
      ) : null}

      {currentView === "today" ? (
        <section className="records" aria-label="Today records">
          <div>
            <h2>今日紀錄</h2>
            <p className="muted">依目前對象顯示今天建立的所有紀錄。</p>
          </div>
          {todayRecords.length > 0 ? (
            <ul>
              {todayRecords.map((record) => (
                <li key={record.id}>
                  <strong>{recordTypeLabel(record.record_type)}</strong>
                  <span>{new Date(record.occurred_at).toLocaleString()}</span>
                  <p>{formatRecordPayload(record.record_type, record.payload_json)}</p>
                  <button type="button" onClick={() => openRecordDetail(record)}>
                    詳情
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">今天還沒有紀錄</p>
          )}
        </section>
      ) : null}

      {currentView === "history" ? (
        <section className="records" aria-label="History records">
          <div>
            <h2>歷史紀錄</h2>
            <p className="muted">依目前對象查詢指定日期或快速範圍。</p>
          </div>
          <div className="range-tabs" aria-label="History quick ranges">
            <button
              className={historyRange === "today" ? "active" : ""}
              type="button"
              onClick={() => setHistoryRange("today")}
            >
              今天 {todayRecords.length}
            </button>
            <button
              className={historyRange === "7d" ? "active" : ""}
              type="button"
              onClick={() => setHistoryRange("7d")}
            >
              近7天 {sevenDayRecords.length}
            </button>
            <button
              className={historyRange === "30d" ? "active" : ""}
              type="button"
              onClick={() => setHistoryRange("30d")}
            >
              近30天 {thirtyDayRecords.length}
            </button>
          </div>
          <label className="date-filter">
            <span>指定日期</span>
            <input
              type="date"
              value={historyDate}
              onChange={(event) => {
                setHistoryDate(event.target.value);
                setHistoryRange("date");
              }}
            />
          </label>
          <button className="plain-action" type="button" onClick={() => setHistoryRange("all")}>
            顯示全部紀錄
          </button>
          {historyRecords.length > 0 ? (
            <ul>
              {historyRecords.map((record) => (
                <li key={record.id}>
                  <strong>{recordTypeLabel(record.record_type)}</strong>
                  <span>{new Date(record.occurred_at).toLocaleString()}</span>
                  <p>{formatRecordPayload(record.record_type, record.payload_json)}</p>
                  <button type="button" onClick={() => openRecordDetail(record)}>
                    詳情
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty">這個範圍沒有紀錄</p>
          )}
        </section>
      ) : null}

      {currentView === "analysis" ? (
        <section className="analysis-panel" aria-label="Basic analysis">
          <div>
            <h2>基本分析</h2>
            <p className="muted">只做紀錄摘要，不提供診療建議。</p>
          </div>
          <div className="analysis-tabs" aria-label="Analysis range">
            <button
              className={analysisRange === "7d" ? "active" : ""}
              type="button"
              onClick={() => setAnalysisRange("7d")}
            >
              7天
            </button>
            <button
              className={analysisRange === "30d" ? "active" : ""}
              type="button"
              onClick={() => setAnalysisRange("30d")}
            >
              30天
            </button>
          </div>
          <div className="trend-chart" aria-label="Blood glucose trend">
            {analysisGlucoseRecords.length > 0 ? (
              analysisGlucoseRecords.map((record) => {
                const value = glucoseValue(record) ?? 0;
                const height = Math.min(100, Math.max(14, (value / 250) * 100));
                return (
                  <span
                    key={record.id}
                    style={{ height: `${height}%` }}
                    title={`${new Date(record.occurred_at).toLocaleDateString()} ${value}`}
                  />
                );
              })
            ) : (
              <p className="empty">這個範圍還沒有血糖紀錄</p>
            )}
          </div>
          <div className="metric-grid">
            <div>
              <span>{analysisRange === "7d" ? "7天平均" : "30天平均"}</span>
              <strong>{average(analysisGlucoseValues) ?? "無"}</strong>
            </div>
            <div>
              <span>空腹平均</span>
              <strong>{fastingAverage ?? "無"}</strong>
            </div>
            <div>
              <span>飯後平均</span>
              <strong>{postMealAverage ?? "無"}</strong>
            </div>
            <div>
              <span>記錄次數</span>
              <strong>{analysisRecords.length}</strong>
            </div>
            <div>
              <span>最高血糖</span>
              <strong>{highestGlucose ?? "無"}</strong>
            </div>
            <div>
              <span>最新血糖</span>
              <strong>{latestGlucose ?? "無"}</strong>
            </div>
          </div>
        </section>
      ) : null}

      {currentView === "subscription" ? (
        <section className="subscription-panel" aria-label="Subscription plan">
          <div>
            <h2>會員 / 訂閱</h2>
            <p className="muted">MVP 保留試用、年費、優惠資格與訂閱管理入口。</p>
          </div>
          <div className="pricing-card">
            <span>7 天免費試用</span>
            <strong>NT$1490 / 年</strong>
            <p>語音記錄、AI 整理、歷史紀錄與基本分析。</p>
          </div>
        </section>
      ) : null}

      {currentView === "tutorial" ? (
        <section className="future-panel" aria-label="Tutorial">
          <div>
            <h2>使用教學</h2>
            <p className="muted">簡單 4 步驟，輕鬆記錄每一天。</p>
          </div>
          <div className="feature-grid">
            {tutorialSteps.map((step, index) => (
              <article className="feature-card" key={step.title}>
                <span className="icon-badge">{index + 1}</span>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
          <p className="soft-note">小提醒：也可以直接用文字輸入，會走同一條 AI 整理與確認流程。</p>
          <button className="primary-action" type="button" onClick={() => switchView("home")}>
            開始使用
          </button>
        </section>
      ) : null}

      {currentView === "trialStatus" ? (
        <section className="future-panel" aria-label="Trial ending status">
          <div>
            <h2>會員方案</h2>
            <p className="muted">顯示試用狀態與續訂入口；實際付款流程尚未在本機預覽啟用。</p>
          </div>
          <div className="hero-card">
            <span>7 天免費試用即將結束</span>
            <strong>還剩 {trialDaysLeft} 天</strong>
            <p>續訂後可保留語音記錄、AI 整理、基本分析與完整歷史回顧。</p>
          </div>
          <div className="feature-grid">
            {["語音記錄", "AI 整理", "基本分析", "歷史回顧"].map((item) => (
              <article className="feature-card" key={item}>
                <span className="icon-badge">✓</span>
                <strong>{item}</strong>
                <p>會員功能預覽，實際權益以後端 entitlement 為準。</p>
              </article>
            ))}
          </div>
          <div className="pricing-card">
            <span>創始會員年費</span>
            <strong>NT$1,490</strong>
            <p>持續訂閱可保有優惠價。付款與管理方案需接正式訂閱系統後才啟用。</p>
          </div>
          <button className="primary-action" type="button" disabled>
            立即續訂（尚未啟用）
          </button>
        </section>
      ) : null}

      {currentView === "achievements" ? (
        <section className="future-panel" aria-label="Achievements preview">
          <div>
            <h2>成就榜</h2>
            <p className="muted">Future read-only preview；不影響 MVP 紀錄流程。</p>
          </div>
          <div className="hero-card subtle">
            <span>已解鎖</span>
            <strong>8 項成就</strong>
            <p>下一個徽章還差 3 天。正式版會由後端 streak / achievement table 計算。</p>
          </div>
          <div className="achievement-list">
            {achievementPreview.map((achievement) => (
              <article className="achievement-card" key={achievement.title}>
                <div>
                  <strong>{achievement.title}</strong>
                  <p>{achievement.description}</p>
                </div>
                <span>{achievement.status}</span>
              </article>
            ))}
          </div>
          <button className="secondary-action" type="button" disabled>
            查看全部徽章（尚未啟用）
          </button>
        </section>
      ) : null}

      {currentView === "yearReview" ? (
        <section className="future-panel" aria-label="Year review preview">
          <div>
            <h2>年度回顧</h2>
            <p className="muted">看看你今年的控糖成果；正式統計需年度 aggregate job。</p>
          </div>
          <div className="hero-card">
            <span>2026 年</span>
            <strong>你今年共記錄 286 次</strong>
            <p>這是 UI preview，不代表目前帳號的真實年度統計。</p>
          </div>
          <div className="metric-grid">
            <div>
              <span>血糖記錄</span>
              <strong>286 次</strong>
            </div>
            <div>
              <span>最長連續</span>
              <strong>42 天</strong>
            </div>
            <div>
              <span>運動記錄</span>
              <strong>93 次</strong>
            </div>
            <div>
              <span>飲食記錄</span>
              <strong>210 次</strong>
            </div>
          </div>
          <div className="soft-list">
            <strong>今年亮點</strong>
            <p>3 月是你記錄最穩定的月份。</p>
            <p>平均空腹血糖較去年下降。</p>
            <p>你最常記錄的是早餐前血糖。</p>
          </div>
          <button className="secondary-action" type="button" disabled>
            分享我的年度回顧（尚未啟用）
          </button>
        </section>
      ) : null}

      {currentView === "store" ? (
        <section className="future-panel" aria-label="Store preview">
          <div>
            <h2>商城</h2>
            <p className="muted">商品卡是 未來預覽；本機預覽不處理購買、付款或庫存。</p>
          </div>
          <label className="date-filter">
            <span>搜尋商品</span>
            <input value="" placeholder="搜尋商品" readOnly />
          </label>
          <div className="range-tabs" aria-label="Store categories">
            <button className="active" type="button">
              保健食品
            </button>
            <button type="button">書籍</button>
            <button type="button">優惠券</button>
          </div>
          <div className="store-list">
            {storePreview.map((product) => (
              <article className="store-card" key={product.title}>
                <span>{product.tag}</span>
                <strong>{product.title}</strong>
                <p>{product.description}</p>
                <b>{product.price}</b>
              </article>
            ))}
          </div>
          <button className="secondary-action" type="button" disabled>
            查看購物車（尚未啟用）
          </button>
        </section>
      ) : null}

      {currentView === "foodPhoto" ? (
        <section className="future-panel" aria-label="Food photo analysis preview">
          <div>
            <h2>食物拍照分析</h2>
            <p className="muted">拍下餐點，AI 幫你估算；正式版需圖片上傳、模型與使用者確認流程。</p>
          </div>
          <div className="upload-preview" role="button" aria-disabled="true">
            <span className="icon-badge">+</span>
            <strong>拍攝或上傳照片</strong>
            <p>本機預覽不會開啟相機或上傳圖片。</p>
          </div>
          <div className="soft-list">
            <strong>AI 分析結果預覽</strong>
            <p>辨識食物：白飯、煎蛋、青菜。</p>
            <p>估計熱量：約 520 kcal。</p>
            <p>碳水化合物：約 48 g。</p>
            <p>糖分：約 6 g。</p>
            <small>以上為估算 UI 範例，加入紀錄前必須允許使用者手動修正。</small>
          </div>
          <div className="confirmation-actions">
            <button type="button" disabled>
              加入紀錄（尚未啟用）
            </button>
            <button type="button" disabled>
              重新拍攝（尚未啟用）
            </button>
          </div>
        </section>
      ) : null}

    </main>
  );
}
