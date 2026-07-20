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

export function previewRecordsForSave(records: PendingRecord[], recordCount: number): PendingRecord[] {
  const clientSaveBatchId = createClientSaveBatchId();
  return records.map((record, index) => {
    const sanitizedRecord = pendingRecordForSave(record);
    return {
      ...sanitizedRecord,
      metadata_json: {
        ...(sanitizedRecord.metadata_json ?? {}),
        client_save_batch_id: clientSaveBatchId,
        client_save_sequence: index + 1,
        client_save_batch_size: recordCount,
        entry_method: "ai_confirmation"
      }
    };
  });
}
