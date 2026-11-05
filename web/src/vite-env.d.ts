/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENABLE_DEBUG_TOOLS?: string;
  readonly VITE_VOICE_PLAN?: "trial" | "paid";
  readonly VITE_TRIAL_DAILY_VOICE_SECONDS?: string;
  readonly VITE_PAID_DAILY_VOICE_SECONDS?: string;
  readonly VITE_SINGLE_RECORDING_LIMIT_SECONDS?: string;
  readonly VITE_VOICE_QUOTA_WARNING_SECONDS?: string;
  readonly VITE_SILENT_AUDIO_MIN_BYTES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
