// @ts-ignore - the PCM recorder package ships runtime JS but incomplete typings.
import LiveAudioStream from "@fugood/react-native-audio-pcm-stream";

const sampleRateHz = 16_000;
const channels = 1;
const bytesPerSample = 2;

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function combinePcmChunks(chunks: Uint8Array[]) {
  const totalBytes = chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined;
}

function pcmBase64ToBytes(encoded: string) {
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  const bytes = new Uint8Array(Math.max(0, (encoded.length * 3) / 4 - padding));
  let output = 0;

  for (let offset = 0; offset < encoded.length; offset += 4) {
    const first = base64Alphabet.indexOf(encoded[offset] ?? "A");
    const second = base64Alphabet.indexOf(encoded[offset + 1] ?? "A");
    const thirdCharacter = encoded[offset + 2] ?? "=";
    const fourthCharacter = encoded[offset + 3] ?? "=";
    const third = thirdCharacter === "=" ? 0 : base64Alphabet.indexOf(thirdCharacter);
    const fourth = fourthCharacter === "=" ? 0 : base64Alphabet.indexOf(fourthCharacter);

    bytes[output++] = (first << 2) | (second >> 4);
    if (thirdCharacter !== "=") bytes[output++] = ((second & 0x0f) << 4) | (third >> 2);
    if (fourthCharacter !== "=") bytes[output++] = ((third & 0x03) << 6) | fourth;
  }

  return bytes;
}

export type WhisperPcmCapture = {
  stop: () => Promise<ArrayBuffer>;
  release: () => Promise<void>;
};

export async function startWhisperPcmCapture(): Promise<WhisperPcmCapture> {
  const chunks: Uint8Array[] = [];
  let stopped = false;
  let recording = false;
  let dataSubscription: { remove: () => void } | null = null;

  dataSubscription = LiveAudioStream.on("data", (base64Data: string) => {
    const data = pcmBase64ToBytes(base64Data);
    if (data.byteLength > 0) chunks.push(data);
  });

  try {
    await LiveAudioStream.init({
      sampleRate: sampleRateHz,
      channels,
      bitsPerSample: 16,
      audioSource: 6,
      bufferSize: 16 * 1024,
      wavFile: "",
    });
    LiveAudioStream.start();
    recording = true;
  } catch (error) {
    stopped = true;
    chunks.length = 0;
    dataSubscription?.remove();
    dataSubscription = null;
    throw error;
  }

  const release = async () => {
    if (stopped) return;
    stopped = true;
    try {
      if (recording) {
        await LiveAudioStream.stop();
      }
    } finally {
      recording = false;
      dataSubscription?.remove();
      dataSubscription = null;
    }
  };

  return {
    release,
    stop: async () => {
      await release();
      const pcm = combinePcmChunks(chunks);
      chunks.length = 0;
      if (pcm.byteLength < sampleRateHz * channels * bytesPerSample / 2) {
        throw new Error("Recording was too short to transcribe.");
      }
      return pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength);
    }
  };
}
