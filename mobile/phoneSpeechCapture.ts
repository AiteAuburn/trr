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

export async function startPhoneSpeechCapture(options: PhoneSpeechCaptureOptions = {}): Promise<PhoneSpeechCapture> {
  const { ExpoSpeechRecognitionModule } = await import("expo-speech-recognition");
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
      lang: "zh-TW",
      interimResults: true,
      continuous: androidSupportsContinuousRecognition,
      maxAlternatives: 1,
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
