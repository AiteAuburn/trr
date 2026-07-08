export const maxDateInputLength = 10;
export const maxTimeInputLength = 5;
export const maxListItems = 12;
export const maxIdentifierTextLength = 128;
export const maxDisplayTextLength = 120;
export const maxDisplayDetailTextLength = 240;
export const maxTranscriptTextLength = 1200;
export const maxStoreSearchTextLength = 80;
export const maxBackendUrlLength = 256;
export const maxNativeDebugInputLength = 1024;
export const maxUiMessageLength = 300;
export const maxMobilePreviewRecords = 20;
export const maxMobileRejectedEvents = 40;
export const maxMobileCountValue = 1_000_000;
export const maxMobileGlucoseValue = 1000;

export function normalizeApiBaseUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function boundNativeDebugInput(value: string) {
  return value.slice(0, maxNativeDebugInputLength);
}

export function boundStoreSearchText(value: string) {
  return value.slice(0, maxStoreSearchTextLength);
}

export function boundUiMessage(value: string) {
  return value.slice(0, maxUiMessageLength);
}

export function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

export function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

export function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
}

export function clampNullableNumber(value: number | null | undefined, min: number, max: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return clampNumber(value, min, max);
}
