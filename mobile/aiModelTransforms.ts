const maxIdentifierTextLength = 128;
const maxDisplayTextLength = 120;
const maxDisplayDetailTextLength = 240;
const maxMobileModelOptions = 30;

export type AiModelOptionTransformSource = {
  id: string;
  label: string;
  kind: "stt" | "llm";
  runtime: "browser" | "local" | "server_api" | "server_stub" | "cloud_disabled";
  available: boolean;
  description: string;
};

export type AiModelOptionsTransformSource<T extends AiModelOptionTransformSource = AiModelOptionTransformSource> = {
  stt_models: T[];
  llm_models: T[];
};

function boundDisplayText(value: string, maxLength = maxDisplayTextLength) {
  return value.slice(0, maxLength);
}

function boundIdentifier(value: string) {
  return value.slice(0, maxIdentifierTextLength);
}

export function boundAiModelOption<T extends AiModelOptionTransformSource>(value: T): T {
  return {
    ...value,
    id: boundIdentifier(value.id),
    label: boundDisplayText(value.label),
    kind: value.kind,
    runtime: value.runtime,
    available: Boolean(value.available),
    description: boundDisplayText(value.description, maxDisplayDetailTextLength)
  };
}

export function boundAiModelOptions<T extends AiModelOptionTransformSource>(
  value: AiModelOptionsTransformSource<T>
): AiModelOptionsTransformSource<T> {
  return {
    stt_models: value.stt_models.slice(0, maxMobileModelOptions).map(boundAiModelOption),
    llm_models: value.llm_models.slice(0, maxMobileModelOptions).map(boundAiModelOption)
  };
}
