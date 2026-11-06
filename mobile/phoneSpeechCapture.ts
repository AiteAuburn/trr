import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

export type PhoneSpeechCaptureResult = {
  transcript: string;
  audioUri: string | null;
  error: string | null;
};

export type PhoneSpeechCapture = {
  stop: () => Promise<PhoneSpeechCaptureResult>;
  release: () => Promise<void>;
};

const stopTimeoutMs = 8_000;

type SpeechResultEvent = {
  results: { transcript?: string }[];
  isFinal: boolean;
};

type SpeechAudioEndEvent = { uri?: string | null };
type SpeechErrorEvent = { error: string; message?: string };

export async function discardPhoneSpeechAudio(audioUri: string | null) {
  if (!audioUri || audioUri === "file://null") return;
  try {
    await FileSystem.deleteAsync(audioUri, { idempotent: true });
  } catch {
    // Best-effort cleanup; keep the transcript flow independent of file deletion.
  }
}

export type PhoneSpeechCaptureOptions = {
  /** Called with the running transcript (final segments plus the current partial). */
  onTranscript?: (transcript: string) => void;
  /** Called once if the recognizer ends on its own (silence timeout, single-utterance mode). */
  onEnd?: () => void;
};

const recognitionLocale = "zh-TW";

/** Recognizers name Taiwan Mandarin differently (zh-TW, zh_TW, zh-Hant-TW, cmn-Hant-TW). */
export function isTaiwanChineseLocale(locale: string) {
  const normalized = locale.trim().toLowerCase().replace(/_/g, "-");
  return ["zh-tw", "zh-hant-tw", "cmn-tw", "cmn-hant-tw"].includes(normalized);
}

type OnDeviceRecognitionModule = {
  supportsOnDeviceRecognition: () => boolean;
  getSupportedLocales: (options: object) => Promise<{ locales: string[]; installedLocales: string[] }>;
  androidTriggerOfflineModelDownload: (options: { locale: string }) => Promise<unknown>;
};

let offlineModelDownloadRequested = false;

/**
 * Whether this phone can recognize Taiwan Mandarin without sending audio over the network.
 * Recognition stays on the phone when it can; otherwise the phone's normal (possibly
 * cloud) recognizer is used so voice input keeps working on every device.
 */
export async function canRecognizeOnDevice(module: OnDeviceRecognitionModule): Promise<boolean> {
  try {
    if (!module.supportsOnDeviceRecognition()) return false;
    // iOS only turns on-device mode on when the recognizer supports it, so the flag is safe there.
    if (Platform.OS !== "android") return true;
    // Android 13+ creates a strict on-device recognizer, which fails if the language pack is missing.
    if (Number(Platform.Version) < 33) return false;
    const { locales, installedLocales } = await module.getSupportedLocales({});
    if (installedLocales.some(isTaiwanChineseLocale)) return true;
    // Android 14+ downloads the pack quietly in the background (13 would open a dialog mid-recording).
    if (!offlineModelDownloadRequested && Number(Platform.Version) >= 34 && locales.some(isTaiwanChineseLocale)) {
      offlineModelDownloadRequested = true;
      void module.androidTriggerOfflineModelDownload({ locale: recognitionLocale }).catch(() => undefined);
    }
    return false;
  } catch {
    return false;
  }
}

export async function startPhoneSpeechCapture(options: PhoneSpeechCaptureOptions = {}): Promise<PhoneSpeechCapture> {
  const { ExpoSpeechRecognitionModule } = await import("expo-speech-recognition");
  const onDevice = await canRecognizeOnDevice(ExpoSpeechRecognitionModule);
  let finished = false;
  let ended = false;
  let audioUri: string | null = null;
  let error: string | null = null;
  let partialTranscript = "";
  const finalTranscripts: string[] = [];
  let resolveEnded: (() => void) | null = null;
  const endedPromise = new Promise<void>((resolve) => {
    resolveEnded = resolve;
  });

  const resultSubscription = ExpoSpeechRecognitionModule.addListener("result", (event: SpeechResultEvent) => {
    const nextTranscript = event.results[0]?.transcript?.trim() ?? "";
    if (!nextTranscript) return;
    if (event.isFinal) {
      finalTranscripts.push(nextTranscript);
      partialTranscript = "";
    } else {
      partialTranscript = nextTranscript;
    }
    if (!finished) {
      options.onTranscript?.([...finalTranscripts, partialTranscript].filter(Boolean).join(" ").trim());
    }
  });
  const audioEndSubscription = ExpoSpeechRecognitionModule.addListener("audioend", (event: SpeechAudioEndEvent) => {
    audioUri = event.uri ?? audioUri;
  });
  const errorSubscription = ExpoSpeechRecognitionModule.addListener("error", (event: SpeechErrorEvent) => {
    if (event.error !== "aborted") error = event.message || event.error;
  });
  const endSubscription = ExpoSpeechRecognitionModule.addListener("end", () => {
    ended = true;
    resolveEnded?.();
    if (!finished) options.onEnd?.();
  });

  const removeListeners = () => {
    resultSubscription.remove();
    audioEndSubscription.remove();
    errorSubscription.remove();
    endSubscription.remove();
  };

  try {
    const androidSupportsContinuousRecognition =
      Platform.OS !== "android" || Number(Platform.Version) >= 33;
    const androidSupportsPersistedAudio =
      Platform.OS !== "android" || Number(Platform.Version) >= 33;
    ExpoSpeechRecognitionModule.start({
      lang: recognitionLocale,
      interimResults: true,
      continuous: androidSupportsContinuousRecognition,
      maxAlternatives: 1,
      requiresOnDeviceRecognition: onDevice,
      ...(androidSupportsPersistedAudio ? { recordingOptions: { persist: true } } : {})
    });
  } catch (startError) {
    removeListeners();
    throw startError;
  }

  return {
    release: async () => {
      if (finished) return;
      finished = true;
      if (!ended) ExpoSpeechRecognitionModule.abort();
      removeListeners();
    },
    stop: async () => {
      if (finished) {
        return {
          transcript: [...finalTranscripts, partialTranscript].filter(Boolean).join(" ").trim(),
          audioUri,
          error
        };
      }
      if (!ended) {
        ExpoSpeechRecognitionModule.stop();
        await Promise.race([
          endedPromise,
          new Promise<void>((resolve) => setTimeout(resolve, stopTimeoutMs))
        ]);
      }
      finished = true;
      removeListeners();
      return {
        transcript: [...finalTranscripts, partialTranscript].filter(Boolean).join(" ").trim(),
        audioUri,
        error
      };
    }
  };
}
