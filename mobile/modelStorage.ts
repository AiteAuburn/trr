import * as FileSystem from "expo-file-system/legacy";

export const defaultWhisperModel = {
  fileName: "ggml-base-q5_1.bin",
  sizeLabel: "約 57 MiB",
  minimumBytes: 50 * 1024 * 1024,
  maximumBytes: 65 * 1024 * 1024,
  url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/5359861c739e955e79d9a303bcbc70fb988958b1/ggml-base-q5_1.bin?download=true"
} as const;

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
      const info = await FileSystem.getInfoAsync(uri, { md5: true });
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
  const info = await FileSystem.getInfoAsync(result.uri, { md5: true });
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

export async function ensureDefaultWhisperModel(onProgress?: (progress: number) => void) {
  const directory = await ensureModelDirectory();
  const uri = `${directory}${defaultWhisperModel.fileName}`;
  const current = await FileSystem.getInfoAsync(uri);
  if (current.exists && "size" in current && current.size >= defaultWhisperModel.minimumBytes && current.size <= defaultWhisperModel.maximumBytes) {
    return uri;
  }
  if (current.exists) {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  const downloadedUri = await downloadModel({
    url: defaultWhisperModel.url,
    kind: "whisper",
    maxBytes: defaultWhisperModel.maximumBytes,
    onProgress
  });
  const downloaded = await FileSystem.getInfoAsync(downloadedUri);
  if (!downloaded.exists || !("size" in downloaded) || downloaded.size < defaultWhisperModel.minimumBytes) {
    await FileSystem.deleteAsync(downloadedUri, { idempotent: true });
    throw new Error("Whisper model download was incomplete.");
  }
  return downloadedUri;
}
