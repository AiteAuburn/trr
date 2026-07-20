import type { DownloadedModel } from "./modelStorage";
import type { NativeBenchmarkResult } from "./nativeLocalModels";

export type NativeModelDownloadKind = "whisper" | "llama";
export type NativeModelDownloadProgressHandler = (progress: number) => void;
export type NativeWhisperInput = {
  modelPath: string;
  audioPath: string;
};
export type NativeWhisperInputSource = NativeWhisperInput;
export type NativeLlamaInput = {
  modelPath: string;
  transcript: string;
};
export type NativeLlamaInputSource = NativeLlamaInput;
export type NativeBenchmarkResultSource = {
  audioPath: string;
  whisperModelPath: string;
  llamaModelPath: string;
  transcript: string;
  benchmarkWhisper: (input: ReturnType<typeof nativeWhisperRequestArgs>) => Promise<NativeBenchmarkResult>;
  benchmarkLlama: (input: ReturnType<typeof nativeLlamaRequestArgs>) => Promise<NativeBenchmarkResult>;
};

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

export function nativeDebugInputValue(value: string) {
  return boundNativeDebugInput(value);
}

export function nativeModelDownloadRequestArgs({
  url,
  kind,
  onProgress
}: {
  url: string;
  kind: NativeModelDownloadKind;
  onProgress?: NativeModelDownloadProgressHandler;
}) {
  return {
    url,
    kind,
    onProgress
  };
}

export function nativeWhisperInput({ audioPath, modelPath }: NativeWhisperInputSource): NativeWhisperInput {
  return {
    audioPath: audioPath.trim(),
    modelPath: modelPath.trim()
  };
}

export function nativeWhisperRequestArgs(whisperInput: NativeWhisperInput) {
  return {
    modelPath: whisperInput.modelPath,
    audioPath: whisperInput.audioPath
  };
}

export function hasNativeWhisperInput(whisperInput: NativeWhisperInput) {
  return Boolean(whisperInput.modelPath && whisperInput.audioPath);
}

export async function appendNativeWhisperBenchmarkResult(
  results: NativeBenchmarkResult[],
  whisperInput: NativeWhisperInput,
  benchmarkWhisper: (input: ReturnType<typeof nativeWhisperRequestArgs>) => Promise<NativeBenchmarkResult>
) {
  if (hasNativeWhisperInput(whisperInput)) {
    results.push(await benchmarkWhisper(nativeWhisperRequestArgs(whisperInput)));
  }
}

export function nativeLlamaRequestArgs(llamaInput: NativeLlamaInput) {
  return {
    modelPath: llamaInput.modelPath,
    transcript: llamaInput.transcript
  };
}

export function nativeLlamaInput({ modelPath, transcript }: NativeLlamaInputSource): NativeLlamaInput {
  return {
    modelPath: modelPath.trim(),
    transcript: transcript.trim()
  };
}

export function hasNativeLlamaInput(llamaInput: NativeLlamaInput) {
  return Boolean(llamaInput.modelPath && llamaInput.transcript);
}

export async function appendNativeLlamaBenchmarkResult(
  results: NativeBenchmarkResult[],
  llamaInput: NativeLlamaInput,
  benchmarkLlama: (input: ReturnType<typeof nativeLlamaRequestArgs>) => Promise<NativeBenchmarkResult>
) {
  if (hasNativeLlamaInput(llamaInput)) {
    results.push(await benchmarkLlama(nativeLlamaRequestArgs(llamaInput)));
  }
}

export async function nativeBenchmarkResults({
  audioPath,
  whisperModelPath,
  llamaModelPath,
  transcript,
  benchmarkWhisper,
  benchmarkLlama
}: NativeBenchmarkResultSource) {
  const results: NativeBenchmarkResult[] = [];
  const whisperInput = nativeWhisperInput({ audioPath, modelPath: whisperModelPath });
  await appendNativeWhisperBenchmarkResult(results, whisperInput, benchmarkWhisper);
  const llamaInput = nativeLlamaInput({ modelPath: llamaModelPath, transcript });
  await appendNativeLlamaBenchmarkResult(results, llamaInput, benchmarkLlama);
  return results;
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

export function downloadedWhisperModels<T extends DownloadedModel>(models: T[]) {
  return models.filter((model) => model.kind === "whisper" && model.exists);
}

export function downloadedWhisperModelInitialPath(models: DownloadedModel[]) {
  return models[0]?.uri ?? "";
}

export function downloadedWhisperModelCount(models: DownloadedModel[]) {
  return models.length;
}
