#!/usr/bin/env python3
"""Verify backend AI parser cost and memory guardrails remain source-enforced."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
AI_PIPELINE_PATH = REPO_ROOT / "backend" / "app" / "services" / "ai_pipeline.py"
CONFIG_PATH = REPO_ROOT / "backend" / "app" / "core" / "config.py"


def main() -> int:
    errors: list[str] = []
    ai_pipeline = AI_PIPELINE_PATH.read_text(encoding="utf-8")
    config = CONFIG_PATH.read_text(encoding="utf-8")

    errors.extend(verify_local_llm_token_caps(ai_pipeline, config))
    errors.extend(verify_no_cloud_ai_fallback(ai_pipeline))
    errors.extend(verify_repair_fallback_is_deterministic(ai_pipeline, config))

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Backend AI cost boundaries verified: local token caps, no cloud fallback, deterministic repair fallback.")
    return 0


def verify_local_llm_token_caps(ai_pipeline: str, config: str) -> list[str]:
    errors: list[str] = []
    for marker in (
        "LOCAL_LLM_BATCH_MAX_TOKENS = 960",
        "LOCAL_LLM_BATCH_MIN_TOKENS = 240",
        "LOCAL_LLM_TOKENS_PER_EXTRA_SEGMENT = 120",
        "LOCAL_LLM_RESPONSE_CHAR_BUDGET = 12000",
        "LOCAL_LLM_HTTP_RESPONSE_CHAR_BUDGET = LOCAL_LLM_RESPONSE_CHAR_BUDGET + 4096",
    ):
        if marker not in ai_pipeline:
            errors.append(f"backend/app/services/ai_pipeline.py missing AI cost marker: {marker}")

    formula = extract_function_body(ai_pipeline, "_local_llm_max_tokens_for_segments")
    for marker in (
        "LOCAL_LLM_BATCH_MIN_TOKENS",
        "max(segment_count, 1) - 1",
        "LOCAL_LLM_TOKENS_PER_EXTRA_SEGMENT",
        "min(configured_max, LOCAL_LLM_BATCH_MAX_TOKENS, requested_tokens)",
    ):
        if marker not in formula:
            errors.append(f"_local_llm_max_tokens_for_segments missing bounded formula marker: {marker}")

    if "local_llm_max_tokens: int = Field(default=960, ge=1, le=960)" not in config:
        errors.append("LOCAL_LLM_MAX_TOKENS config must default to 960 and be capped with le=960")
    return errors


def verify_no_cloud_ai_fallback(ai_pipeline: str) -> list[str]:
    errors: list[str] = []
    disabled_model_block = extract_model_option_block(ai_pipeline, 'id="openai-fallback-disabled"')
    for marker in (
        'runtime="cloud_disabled"',
        "available=False",
        "Disabled in v1.",
    ):
        if marker not in disabled_model_block:
            errors.append(f"openai-fallback-disabled model option missing marker: {marker}")

    forbidden_patterns = (
        r"from\s+openai\s+import\b",
        r"import\s+openai\b",
        r"api\.openai\.com",
        r"OPENAI_API_KEY",
        r"ChatCompletion",
        r"responses\.create",
    )
    for pattern in forbidden_patterns:
        if re.search(pattern, ai_pipeline):
            errors.append(f"backend AI pipeline must not wire cloud AI fallback pattern: {pattern}")
    return errors


def verify_repair_fallback_is_deterministic(ai_pipeline: str, config: str) -> list[str]:
    errors: list[str] = []
    if "local_llm_repair_fallback_enabled: bool = False" not in config:
        errors.append("LOCAL_LLM_REPAIR_FALLBACK_ENABLED must default to false")

    for function_name in (
        "_call_openai_compatible_local_parser",
        "_call_ollama_structured_parser",
    ):
        body = extract_function_body(ai_pipeline, function_name)
        if not body:
            errors.append(f"missing parser function: {function_name}")
            continue
        for marker in (
            "settings.local_llm_repair_fallback_enabled",
            "_build_deterministic_parse_preview(",
            "parser_repair_reason=",
        ):
            if marker not in body:
                errors.append(f"{function_name} missing deterministic repair fallback marker: {marker}")

        fallback_lines = [
            line.strip()
            for line in body.splitlines()
            if "fallback" in line or "_build_deterministic_parse_preview" in line
        ]
        forbidden_fallback_calls = (
            "_request_local_parser_json",
            "_request_ollama_structured_json",
            "_call_openai",
            "api.openai.com",
        )
        for line in fallback_lines:
            for forbidden in forbidden_fallback_calls:
                if forbidden in line:
                    errors.append(f"{function_name} fallback path must not call parser/LLM again: {line}")
    return errors


def extract_model_option_block(source: str, marker: str) -> str:
    marker_index = source.find(marker)
    if marker_index == -1:
        return ""
    start = source.rfind("AiModelOption(", 0, marker_index)
    if start == -1:
        return ""
    depth = 0
    for index in range(start, len(source)):
        char = source[index]
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return source[start : index + 1]
    return ""


def extract_function_body(source: str, function_name: str) -> str:
    match = re.search(rf"\bdef\s+{re.escape(function_name)}\b[^\:]*\:", source)
    if not match:
        return ""
    start = match.end()
    next_function = re.search(r"\n(?=def\s+|async\s+def\s+)", source[start:])
    if not next_function:
        return source[start:]
    return source[start : start + next_function.start()]


if __name__ == "__main__":
    raise SystemExit(main())
