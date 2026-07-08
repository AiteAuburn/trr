import { normalizeVisualSmokeInitialRoute } from "./navigationConfig";

export const defaultApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const enableDebugTools = process.env.EXPO_PUBLIC_ENABLE_DEBUG_TOOLS === "true";
export const allowMobileDevAuth = process.env.EXPO_PUBLIC_ALLOW_DEV_AUTH === "true";
export const visualSmokeInitialRoute = process.env.EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE ?? "";

export const sampleText =
  "今天早上空腹血糖 138，早餐吃蛋餅跟無糖豆漿，下午散步 30 分鐘。";

export const initialVisualSmokeScreen = normalizeVisualSmokeInitialRoute(
  visualSmokeInitialRoute,
  enableDebugTools,
  allowMobileDevAuth
);

export const mobileRecordSyncLimit = 100;
export const maxMobileRecordCacheLimit = 500;
export const mobileReportQueryLimit = 500;
