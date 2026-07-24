import { analysisEmptyStateDisplayBundle } from "./analysisCopy";
import { historyEmptyStateDisplayBundle } from "./historyCopy";

export function emptyStateRuntimeDisplayBundle() {
  return {
    history: historyEmptyStateDisplayBundle(),
    analysis: analysisEmptyStateDisplayBundle()
  };
}
