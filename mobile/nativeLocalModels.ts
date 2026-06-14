type NativeModuleStatus = {
  whisperReady: boolean;
  llamaReady: boolean;
  message: string;
};

type WhisperTranscribeInput = {
  modelPath: string;
  audioPath: string;
};

type LlamaParseInput = {
  modelPath: string;
  transcript: string;
};

export type NativeBenchmarkResult = {
  task: "whisper" | "llama";
  durationMs: number;
  outputChars: number;
  ok: boolean;
  errorMessage?: string;
};

export const compactIrJsonSchema = {
  type: "object",
  properties: {
    records: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["glucose", "meal", "exercise", "medication", "note"]
          },
          value: { type: ["number", "null"] },
          unit: { type: ["string", "null"] },
          meal_timing: {
            type: "string",
            enum: ["fasting", "before_meal", "after_meal", "bedtime", "unknown"]
          },
          time_hint: {
            type: "string",
            enum: ["am", "noon", "pm", "eve", "night", "unknown"]
          },
          items: { type: "array", items: { type: "string" } },
          duration_min: { type: ["integer", "null"] },
          confidence: { type: "number" },
          flags: { type: "array", items: { type: "string" } },
          evidence: { type: "string" }
        },
        required: ["type", "evidence"]
      }
    },
    rejected: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["negative_event"] },
          evidence: { type: "string" }
        },
        required: ["type", "evidence"]
      }
    },
    needs_confirmation: { type: "boolean" }
  },
  required: ["records", "rejected", "needs_confirmation"]
} as const;

function localParserPrompt(transcript: string) {
  return [
    "You are a health record parser.",
    "Output compact JSON only.",
    "Do not provide medical advice.",
    "Do not hallucinate missing values.",
    "Each record must be one atomic event.",
    "If user explicitly says did not measure, put it in rejected and do not create a record.",
    `Transcript: ${transcript}`
  ].join("\n");
}

export async function checkNativeLocalModules(): Promise<NativeModuleStatus> {
  const failures: string[] = [];
  let whisperReady = false;
  let llamaReady = false;

  try {
    await import("whisper.rn");
    whisperReady = true;
  } catch (error) {
    failures.push(`whisper.rn: ${error instanceof Error ? error.message : "not available"}`);
  }

  try {
    await import("llama.rn");
    llamaReady = true;
  } catch (error) {
    failures.push(`llama.rn: ${error instanceof Error ? error.message : "not available"}`);
  }

  return {
    whisperReady,
    llamaReady,
    message:
      failures.length === 0
        ? "Native local modules are available."
        : failures.join("\n")
  };
}

export async function transcribeWithNativeWhisper({
  modelPath,
  audioPath
}: WhisperTranscribeInput) {
  const { initWhisper } = await import("whisper.rn");
  const context = await initWhisper({ filePath: modelPath, useGpu: true });
  try {
    const { promise } = context.transcribe(audioPath, {
      language: "zh",
      translate: false
    });
    const result = await promise;
    return result.result.trim();
  } finally {
    await context.release();
  }
}

export async function benchmarkNativeWhisper(
  input: WhisperTranscribeInput
): Promise<NativeBenchmarkResult> {
  const startedAt = Date.now();
  try {
    const output = await transcribeWithNativeWhisper(input);
    return {
      task: "whisper",
      durationMs: Date.now() - startedAt,
      outputChars: output.length,
      ok: true
    };
  } catch (error) {
    return {
      task: "whisper",
      durationMs: Date.now() - startedAt,
      outputChars: 0,
      ok: false,
      errorMessage: error instanceof Error ? error.message : "Whisper benchmark failed"
    };
  }
}

export async function parseWithNativeLlama({ modelPath, transcript }: LlamaParseInput) {
  const { initLlama } = await import("llama.rn");
  const context = await initLlama({
    model: modelPath,
    n_ctx: 2048,
    n_gpu_layers: 99
  });

  try {
    const result = await context.completion({
      messages: [
        {
          role: "user",
          content: localParserPrompt(transcript)
        }
      ],
      n_predict: 700,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: compactIrJsonSchema
        }
      }
    });
    return (result.content || result.text).trim();
  } finally {
    await context.release();
  }
}

export async function benchmarkNativeLlama(input: LlamaParseInput): Promise<NativeBenchmarkResult> {
  const startedAt = Date.now();
  try {
    const output = await parseWithNativeLlama(input);
    return {
      task: "llama",
      durationMs: Date.now() - startedAt,
      outputChars: output.length,
      ok: true
    };
  } catch (error) {
    return {
      task: "llama",
      durationMs: Date.now() - startedAt,
      outputChars: 0,
      ok: false,
      errorMessage: error instanceof Error ? error.message : "llama.cpp benchmark failed"
    };
  }
}
