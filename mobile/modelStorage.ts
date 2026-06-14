import * as FileSystem from "expo-file-system";

export type DownloadedModel = {
  kind: "whisper" | "llama";
  fileName: string;
  uri: string;
  exists: boolean;
  size?: number;
  md5?: string;
};

const modelDirectory = `${FileSystem.documentDirectory ?? ""}models/`;

function safeFileName(url: string, fallback: string) {
  const name = url.split("?")[0]?.split("/").filter(Boolean).pop() ?? fallback;
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getModelDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document directory is not available on this platform.");
  }
  return modelDirectory;
}

export async function ensureModelDirectory() {
  const directory = getModelDirectory();
  const info = await FileSystem.getInfoAsync(directory);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  }
  return directory;
}

export async function listDownloadedModels(): Promise<DownloadedModel[]> {
  const directory = await ensureModelDirectory();
  const files = await FileSystem.readDirectoryAsync(directory);
  const models = await Promise.all(
    files.map(async (fileName) => {
      const uri = `${directory}${fileName}`;
      const info = await FileSystem.getInfoAsync(uri, { md5: true, size: true });
      return {
        kind: fileName.endsWith(".gguf") ? "llama" : "whisper",
        fileName,
        uri,
        exists: info.exists,
        size: info.exists && "size" in info ? info.size : undefined,
        md5: info.exists && "md5" in info ? info.md5 ?? undefined : undefined
      } satisfies DownloadedModel;
    })
  );
  return models.sort((a, b) => a.fileName.localeCompare(b.fileName));
}

export async function downloadModel({
  url,
  kind,
  expectedMd5,
  maxBytes,
  onProgress
}: {
  url: string;
  kind: "whisper" | "llama";
  expectedMd5?: string;
  maxBytes?: number;
  onProgress?: (progress: number) => void;
}) {
  if (!url.trim()) {
    throw new Error("Model URL is required.");
  }
  const directory = await ensureModelDirectory();
  const fallback = kind === "llama" ? "model.gguf" : "whisper.bin";
  const fileName = safeFileName(url.trim(), fallback);
  const uri = `${directory}${fileName}`;
  const task = FileSystem.createDownloadResumable(
    url.trim(),
    uri,
    {},
    ({ totalBytesExpectedToWrite, totalBytesWritten }) => {
      if (totalBytesExpectedToWrite > 0) {
        onProgress?.(totalBytesWritten / totalBytesExpectedToWrite);
      }
    }
  );
  const result = await task.downloadAsync();
  if (!result?.uri) {
    throw new Error("Model download did not finish.");
  }
  const info = await FileSystem.getInfoAsync(result.uri, { md5: true, size: true });
  if (!info.exists) {
    throw new Error("Downloaded model is missing.");
  }
  const size = "size" in info ? info.size : 0;
  if (maxBytes !== undefined && size > maxBytes) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error("Downloaded model exceeds the allowed size.");
  }
  const md5 = "md5" in info ? info.md5 : null;
  if (expectedMd5 && md5 !== expectedMd5) {
    await FileSystem.deleteAsync(result.uri, { idempotent: true });
    throw new Error("Downloaded model checksum did not match.");
  }
  return result.uri;
}
