import { describe, expect, it, vi } from "vitest";

import {
  disabledPublicFeatureFlags,
  fetchPublicFeatureFlags,
  parsePublicFeatureFlags,
} from "./featureFlags";


describe("public feature flags", () => {
  it("accepts only explicit true values from contract version 1", () => {
    expect(parsePublicFeatureFlags({
      contract_version: "1",
      flags: {
        food_photo_analysis: true,
        health_integrations: "true",
        unknown_feature: true,
      },
    })).toEqual({
      food_photo_analysis: true,
      health_integrations: false,
    });
  });

  it("fails closed for an unknown contract", () => {
    expect(parsePublicFeatureFlags({ contract_version: "2", flags: {} }))
      .toEqual(disabledPublicFeatureFlags);
  });

  it("fails closed when refresh cannot reach the backend", async () => {
    const failingFetch = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(fetchPublicFeatureFlags("https://api.example.test/", failingFetch))
      .resolves.toEqual(disabledPublicFeatureFlags);
  });
});
