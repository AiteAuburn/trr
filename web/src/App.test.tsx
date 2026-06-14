import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  App,
  formatCommandProposalDebugSummary,
  formatApiErrorMessage,
  formatParsePreviewDebugSummary,
  formatParserProgressErrorMessage,
  sanitizePendingRecordForCreate,
} from "./App";

describe("App", () => {
  it("renders the product name and primary recording action", () => {
    const html = renderToString(<App />);

    expect(html).toContain("糖錄錄");
    expect(html).toContain("首頁 · 快速記錄");
    expect(html).toContain("開啟功能選單");
    expect(html).toContain("目前對象");
    expect(html).toContain("今日 0 筆");
    expect(html).toContain("試用版");
    expect(html).toContain("今日已用 0:00");
    expect(html).toContain("按住說話");
    expect(html).toContain("整理預覽");
    expect(html).toContain("即時辨識");
    expect(html).not.toContain("STT 模型");
    expect(html).not.toContain("LLM 模型");
    expect(html).not.toContain("語音操作解析");
    expect(html).not.toContain("Command Debug");
    expect(html).not.toContain("LLM Debug");
    expect(html).not.toContain("即時 LLM Debug");
    expect(html).toContain("正在記錄");
    expect(html).toContain("自己");
  });

  it("maps structured parser errors to non-PHI user guidance", () => {
    expect(
      formatApiErrorMessage("/ai/parse-preview", 502, {
        code: "local_parser_failed",
        message: "Selected local parser could not produce a valid structured preview.",
      }),
    ).toBe("AI 整理暫時失敗，請改用文字輸入、切換可用模型，或稍後重試。");

    expect(
      formatApiErrorMessage("/ai/parse-preview", 503, {
        code: "local_parser_unavailable",
        hint: "set_gemma4_parser_url",
      }),
    ).toBe("選定的 Gemma 4 本地解析服務尚未設定，請到設定切換可用模型。");

    expect(
      formatApiErrorMessage("/ai/parse-preview", 400, {
        code: "llm_model_unavailable",
        hint: "select_available_llm_model",
      }),
    ).toBe("選定的 AI 整理模型目前不可用，請到設定切換可用模型。");

    expect(
      formatApiErrorMessage("/ai/parse-preview", 400, {
        code: "transcript_too_complex",
        message: "too many segments with 空腹血糖 188",
      }),
    ).toBe("這次內容包含太多事件，請分成較短的幾次記錄。");

    const message = formatApiErrorMessage("/ai/parse-preview", 502, {
      code: "local_parser_failed",
      message: "raw output contained 空腹血糖 188",
    });
    expect(message).not.toContain("空腹血糖");
    expect(message).not.toContain("188");
  });

  it("maps parser progress error events by code instead of raw message", () => {
    const message = formatParserProgressErrorMessage({
      code: "local_parser_failed",
      hint: "retry_or_switch_model",
      message: 'raw stream message with 空腹血糖 188 and {"evidence":"hidden"}',
    });

    expect(message).toBe("AI 整理暫時失敗，請改用文字輸入、切換可用模型，或稍後重試。");
    expect(message).not.toContain("空腹血糖");
    expect(message).not.toContain("188");
    expect(message).not.toContain("evidence");
  });

  it("strips confirmation-only text before record create", () => {
    const sanitized = sanitizePendingRecordForCreate({
      profile_id: "profile-1",
      record_type: "meal",
      occurred_at: "2026-04-30T08:00:00Z",
      payload_json: {
        description: "早餐吃蛋餅",
        food_items: [{ name: "蛋餅", note: "少醬" }],
        meal_type: "breakfast",
      },
      metadata_json: {
        source_text: "早餐吃蛋餅",
        transcript: "今天早上早餐吃蛋餅",
        parser_model_id: "local-llm-schema-stub",
        time_hint: "morning",
      },
      source: "ai_parse_preview",
    });

    expect(sanitized.payload_json).toEqual({
      food_items: [{ name: "蛋餅" }],
      meal_type: "breakfast",
    });
    expect(sanitized.metadata_json).toEqual({
      parser_model_id: "local-llm-schema-stub",
      time_hint: "morning",
    });
    expect(JSON.stringify(sanitized)).not.toContain("早餐吃蛋餅");
    expect(JSON.stringify(sanitized)).not.toContain("今天早上");
  });

  it("formats parse preview debug output as non-PHI summary", () => {
    const summary = formatParsePreviewDebugSummary({
      transcript: "今天早上空腹血糖 138",
      normalized_text: "今天早上空腹血糖 138",
      stt_model_id: "browser-web-speech",
      llm_model_id: "local-llm-schema-stub",
      segments: [
        {
          segment_id: "seg_001",
          segment_type: "measurement",
          source_text: "今天早上空腹血糖 138",
          normalized_text: "今天早上空腹血糖 138",
          certainty: "certain",
          is_negative_event: false,
          confidence: 0.9,
        },
      ],
      records: [
        {
          profile_id: "profile-1",
          record_type: "glucose",
          occurred_at: "2026-04-30T08:00:00Z",
          payload_json: { value: 138, unit: "mg/dL" },
          metadata_json: { source_text: "今天早上空腹血糖 138" },
          source: "ai_parse_preview",
          confidence: 0.9,
          decision_trace: "偵測到血糖情境與數值。",
        },
      ],
      rejected_events: [],
    });

    expect(summary).toContain('"record_count": 1');
    expect(summary).toContain('"glucose"');
    expect(summary).not.toContain("空腹血糖");
    expect(summary).not.toContain("138");
    expect(summary).not.toContain("source_text");
  });

  it("formats command proposal debug output as non-PHI summary", () => {
    const summary = formatCommandProposalDebugSummary({
      transcript: "今天早餐後血糖 138，早餐吃蛋餅",
      stt_model_id: "browser-web-speech",
      llm_model_id: "local-llm-schema-stub",
      proposal: {
        intent: "CREATE_RECORD",
        action: "create_record_candidates",
        actions: [
          {
            action_type: "create_record",
            record_type: "glucose",
            payload: { value: 138, unit: "mg/dL" },
            metadata_json: { source_text: "早餐後血糖 138" },
          },
        ],
        payload: {
          records: [
            {
              metadata_json: {
                source_text: "早餐後血糖 138",
              },
            },
          ],
        },
        requires_confirmation: true,
        confidence: 0.9,
        decision_trace: "偵測到健康紀錄語意。",
        ui_response: {
          type: "confirmation",
          message: "我整理出 1 筆候選紀錄。",
        },
      },
    });

    expect(summary).toContain('"intent": "CREATE_RECORD"');
    expect(summary).toContain('"record_types"');
    expect(summary).not.toContain("早餐後血糖");
    expect(summary).not.toContain("蛋餅");
    expect(summary).not.toContain("138");
    expect(summary).not.toContain("source_text");
  });
});
