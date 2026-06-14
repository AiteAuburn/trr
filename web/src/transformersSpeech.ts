type TranscriberOutput = {
  text?: string;
};

type Transcriber = (
  input: string,
  options?: Record<string, unknown>,
) => Promise<TranscriberOutput | TranscriberOutput[]>;

let transcriberPromise: Promise<Transcriber> | null = null;

function hasWebGpu() {
  return "gpu" in navigator;
}

async function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = import("@huggingface/transformers").then(async ({ pipeline }) => {
      const options: { device: "webgpu" | "wasm" } = {
        device: hasWebGpu() ? "webgpu" : "wasm",
      };
      return (await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-tiny",
        options,
      )) as Transcriber;
    });
  }

  return transcriberPromise;
}

export async function transcribeWithTransformersWhisper(blob: Blob) {
  const transcriber = await getTranscriber();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const output = await transcriber(objectUrl, {
      language: "zh",
      task: "transcribe",
    });
    const result = Array.isArray(output) ? output[0] : output;
    return result?.text?.trim() ?? "";
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
