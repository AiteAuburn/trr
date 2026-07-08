import type { BasicReportTransformSource } from "./analysisDataTransforms";
import type { AuthSessionDisplaySource } from "./authSessionDisplay";
import type { AccountTransformSource, ProfileTransformSource } from "./accountTransforms";
import type { AiModelOptionTransformSource, AiModelOptionsTransformSource } from "./aiModelTransforms";
import type { AuthTokenResponseTransformSource } from "./authTransforms";
import type { VoiceQuotaTransformSource } from "./subscriptionTransforms";

export type Account = AccountTransformSource;
export type Profile = ProfileTransformSource;
export type AiModelOption = AiModelOptionTransformSource;
export type AiModelOptions = AiModelOptionsTransformSource<AiModelOption>;

export type VoiceQuota = VoiceQuotaTransformSource;
export type AuthTokenResponse = AuthTokenResponseTransformSource;
export type AuthSessionItem = AuthSessionDisplaySource;
export type BasicReport = BasicReportTransformSource;

export type SaveEntryMethod = "ai" | "manual" | null;
