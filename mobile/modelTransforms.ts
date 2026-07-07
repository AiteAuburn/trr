import type { DownloadedModel } from "./modelStorage";

const maxIdentifierTextLength = 128;
const maxDisplayTextLength = 120;
const maxNativeDebugInputLength = 1024;
const maxDownloadedModelRows = 20;

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

function boundNativeDebugInput(value: string) {
  return value.slice(0, maxNativeDebugInputLength);
}

export function boundDownloadedModel<T extends DownloadedModel>(value: T): T {
  return {
    ...value,
    kind: value.kind,
    fileName: boundDisplayText(value.fileName),
    uri: boundNativeDebugInput(value.uri),
    exists: Boolean(value.exists),
    size: typeof value.size === "number" && Number.isFinite(value.size) && value.size >= 0 ? value.size : undefined,
    md5: value.md5 ? boundIdentifier(value.md5) : undefined
  };
}

export function boundDownloadedModels<T extends DownloadedModel>(value: T[]) {
  return value.slice(0, maxDownloadedModelRows).map(boundDownloadedModel);
}
