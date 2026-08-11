export const publicFeatureFlagNames = [
  "food_photo_analysis",
  "health_integrations",
  "community_sharing",
  "store_redemptions"
] as const;

export type PublicFeatureFlagName = (typeof publicFeatureFlagNames)[number];
export type PublicFeatureFlags = Record<PublicFeatureFlagName, boolean>;

export const disabledPublicFeatureFlags: PublicFeatureFlags = {
  food_photo_analysis: false,
  health_integrations: false,
  community_sharing: false,
  store_redemptions: false
};

export function parsePublicFeatureFlags(value: unknown): PublicFeatureFlags {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ...disabledPublicFeatureFlags };
  }
  const payload = value as { contract_version?: unknown; flags?: unknown };
  if (payload.contract_version !== "1" || !payload.flags || typeof payload.flags !== "object" || Array.isArray(payload.flags)) {
    return { ...disabledPublicFeatureFlags };
  }
  const flags = payload.flags as Record<string, unknown>;
  return Object.fromEntries(
    publicFeatureFlagNames.map((name) => [name, flags[name] === true])
  ) as PublicFeatureFlags;
}

export async function fetchPublicFeatureFlags(
  apiBaseUrl: string,
  fetchImpl: typeof fetch = fetch
): Promise<PublicFeatureFlags> {
  try {
    const response = await fetchImpl(`${apiBaseUrl.replace(/\/$/, "")}/feature-flags`);
    if (!response.ok) {
      return { ...disabledPublicFeatureFlags };
    }
    return parsePublicFeatureFlags(await response.json());
  } catch {
    return { ...disabledPublicFeatureFlags };
  }
}
