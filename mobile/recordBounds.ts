const maxListItems = 12;
const maxDisplayTextLength = 160;
const maxIdentifierTextLength = 128;
const maxDisplayDetailTextLength = 240;
const maxMobilePreviewRecords = 20;
const maxMobilePreviewSegments = 40;
const maxMobileRejectedEvents = 40;
const maxMobileCountValue = 1_000_000;
const maxMobileVoiceSeconds = 86_400;
const maxMobileGlucoseValue = 1000;
const maxMobileRecordCacheLimit = 500;

export type PendingRecord = {
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json?: Record<string, unknown>;
  source: string;
  confidence?: number;
  decision_trace?: string;
};

export type TranscriptSegment = {
  segment_id: string;
  segment_type: string;
  source_text: string;
  confidence: number;
};

export type RejectedEvent = {
  segment_id: string;
  source_text: string;
  reason: string;
};

export type ParsePreviewResponse = {
  transcript: string;
  normalized_text: string;
  stt_model_id: string;
  llm_model_id: string;
  segments: TranscriptSegment[];
  records: PendingRecord[];
  rejected_events: RejectedEvent[];
};

export type RecordItem = {
  id: string;
  profile_id: string;
  record_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown>;
  metadata_json: Record<string, unknown>;
  source: string;
  created_at: string;
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return boundDisplayText(value, maxIdentifierTextLength);
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function stripRawTextMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return undefined;
  }
  const blockedKeys = new Set([
    "transcript",
    "raw_transcript",
    "raw_text",
    "rawText",
    "original_text",
    "normalized_text",
    "evidence",
    "description"
  ]);
  const sanitized = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !blockedKeys.has(key))
  );
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function boundMetadataValue(value: unknown): unknown {
  if (typeof value === "string") {
    return boundDisplayText(value, maxDisplayDetailTextLength);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "boolean" || value === null) {
    return value;
  }
  return undefined;
}

export function boundMetadata(metadata?: Record<string, unknown>, preserveSourceText = false) {
  if (!metadata) {
    return undefined;
  }
  const sanitized = preserveSourceText
    ? {
        ...stripRawTextMetadata(metadata),
        ...(typeof metadata.source_text === "string"
          ? { source_text: boundDisplayText(metadata.source_text, maxDisplayDetailTextLength) }
          : {})
      }
    : stripRawTextMetadata(metadata);
  if (!sanitized) {
    return undefined;
  }
  const entries = Object.entries(sanitized)
    .slice(0, maxListItems)
    .map(([key, value]) => [boundIdentifier(key), boundMetadataValue(value)] as const)
    .filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function isRawPayloadKey(key: string) {
  const normalized = key.toLowerCase();
  return [
    "transcript",
    "normalized_text",
    "raw_text",
    "raw_prompt",
    "raw_model_output",
    "source_text",
    "decision_trace",
    "rawtext",
    "rawprompt",
    "rawmodeloutput",
    "sourcetext",
    "decisiontrace"
  ].includes(normalized);
}

function boundRecordPayloadValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return boundDisplayText(value, maxDisplayDetailTextLength);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? clampNumber(value, -maxMobileCountValue, maxMobileCountValue) : undefined;
  }
  if (typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= 2) {
      return undefined;
    }
    const items = value
      .slice(0, maxListItems)
      .map((item) => boundRecordPayloadValue(item, depth + 1))
      .filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "object" && value !== null) {
    if (depth >= 2) {
      return undefined;
    }
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !isRawPayloadKey(key))
      .slice(0, maxListItems)
      .map(([key, item]) => [boundIdentifier(key), boundRecordPayloadValue(item, depth + 1)] as const)
      .filter(([, item]) => item !== undefined);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return undefined;
}

function boundRecordPayload(recordType: string, payload: Record<string, unknown>): Record<string, unknown> {
  const bounded = boundRecordPayloadValue(payload);
  const result = bounded && typeof bounded === "object" && !Array.isArray(bounded)
    ? (bounded as Record<string, unknown>)
    : {};
  if (recordType === "glucose" && typeof result.value === "number") {
    result.value = clampNumber(result.value, 0, maxMobileGlucoseValue);
  }
  if (recordType === "exercise" && typeof result.minutes === "number") {
    result.minutes = clampNumber(result.minutes, 0, maxMobileVoiceSeconds);
  }
  return result;
}

export function boundRecordItem(value: RecordItem): RecordItem {
  const recordType = boundIdentifier(value.record_type);
  return {
    ...value,
    id: boundIdentifier(value.id),
    profile_id: boundIdentifier(value.profile_id),
    record_type: recordType,
    occurred_at: boundDisplayText(value.occurred_at, 40),
    payload_json: boundRecordPayload(recordType, value.payload_json),
    metadata_json: boundMetadata(value.metadata_json) ?? {},
    source: boundDisplayText(value.source, 40),
    created_at: boundDisplayText(value.created_at, 40)
  };
}

export function lowConfidencePendingRecordCount(records: PendingRecord[]) {
  return records.filter((record) => (record.confidence ?? 1) < 0.7).length;
}

export function mergeRecordsByCursorOrder(current: RecordItem[], incoming: RecordItem[]) {
  const byId = new Map<string, RecordItem>();
  for (const record of [...current, ...incoming].map(boundRecordItem)) {
    if (record.id) {
      byId.set(record.id, record);
    }
  }
  return Array.from(byId.values())
    .sort((left, right) => {
      const occurredDelta = Date.parse(right.occurred_at) - Date.parse(left.occurred_at);
      if (Number.isFinite(occurredDelta) && occurredDelta !== 0) {
        return occurredDelta;
      }
      const createdDelta = Date.parse(right.created_at) - Date.parse(left.created_at);
      return Number.isFinite(createdDelta) ? createdDelta : 0;
    })
    .slice(0, maxMobileRecordCacheLimit);
}

export function boundRecordsList(value: RecordItem[], limit = maxMobileRecordCacheLimit) {
  return value.slice(0, limit).map(boundRecordItem);
}

export function recordsListWithUpdatedRecord(current: RecordItem[], updated: RecordItem) {
  return boundRecordsList(current.map((record) => (record.id === updated.id ? updated : record)));
}

export function recordsListWithoutDeletedRecord(current: RecordItem[], recordId: string) {
  return current.filter((record) => record.id !== recordId);
}

function boundPendingRecord(value: PendingRecord): PendingRecord {
  return {
    ...value,
    profile_id: boundIdentifier(value.profile_id),
    record_type: boundIdentifier(value.record_type),
    occurred_at: boundDisplayText(value.occurred_at, 40),
    metadata_json: boundMetadata(value.metadata_json, true),
    source: boundDisplayText(value.source, 40),
    confidence:
      typeof value.confidence === "number" && Number.isFinite(value.confidence)
        ? Math.max(0, Math.min(1, value.confidence))
        : undefined,
    decision_trace: value.decision_trace
      ? boundDisplayText(value.decision_trace, maxDisplayDetailTextLength)
      : undefined
  };
}

function boundTranscriptSegment(value: TranscriptSegment): TranscriptSegment {
  return {
    segment_id: boundIdentifier(value.segment_id),
    segment_type: boundDisplayText(value.segment_type, 40),
    source_text: boundDisplayText(value.source_text, maxDisplayDetailTextLength),
    confidence: Number.isFinite(value.confidence) ? Math.max(0, Math.min(1, value.confidence)) : 0
  };
}

function boundRejectedEvent(value: RejectedEvent): RejectedEvent {
  return {
    segment_id: boundIdentifier(value.segment_id),
    source_text: boundDisplayText(value.source_text, maxDisplayDetailTextLength),
    reason: boundDisplayText(value.reason, 80)
  };
}

export function boundParsePreviewResponse(value: ParsePreviewResponse): ParsePreviewResponse {
  return {
    transcript: "",
    normalized_text: "",
    stt_model_id: boundIdentifier(value.stt_model_id),
    llm_model_id: boundIdentifier(value.llm_model_id),
    segments: value.segments.slice(0, maxMobilePreviewSegments).map(boundTranscriptSegment),
    records: value.records.slice(0, maxMobilePreviewRecords).map(boundPendingRecord),
    rejected_events: value.rejected_events.slice(0, maxMobileRejectedEvents).map(boundRejectedEvent)
  };
}
