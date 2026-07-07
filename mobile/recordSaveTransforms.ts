import {
  boundMetadata,
  type PendingRecord
} from "./recordBounds";

export function pendingRecordForSave(record: PendingRecord): PendingRecord {
  const sanitizedMetadata = boundMetadata(record.metadata_json, true);
  return {
    ...record,
    ...(sanitizedMetadata ? { metadata_json: sanitizedMetadata } : { metadata_json: undefined })
  };
}

export function createClientSaveBatchId() {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `mobile-save-${timestamp}-${randomSuffix}`;
}
