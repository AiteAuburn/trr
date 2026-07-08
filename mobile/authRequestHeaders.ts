import { allowMobileDevAuth } from "./appRuntimeConfig";
import { buildProtectedRequestHeaders } from "./authTransforms";

export function protectedRequestHeaders(accountId: string, accessToken: string): Record<string, string> {
  return buildProtectedRequestHeaders(accountId, accessToken, allowMobileDevAuth);
}
