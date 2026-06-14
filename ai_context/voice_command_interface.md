# Voice Command Interface

文件定位：定義糖錄錄語音操作層。根目錄 `skills.md` 仍是最高規範。

## Goal

糖錄錄支援 voice-first operation。

使用者可以用語音完成：

- navigation
- record creation
- data query
- report generation
- profile switching
- reminder setup

MVP 先支援：

- `CREATE_RECORD`
- `NAVIGATE`
- `GENERATE_REPORT`

## Flow

```text
voice input
-> STT
-> command parser
-> intent router / scheduler
-> permission check
-> action proposal
-> user confirmation if needed
-> action execution
-> UI response
```

## Critical Rule

The parser must not directly mutate persistent data.

Wrong:

```text
voice -> parser -> write DB
```

Correct:

```text
voice -> parser -> action proposal -> user confirmation -> write DB
```

## Supported Intents

### NAVIGATE

Purpose: switch app view.

Examples:

- 去報告頁
- 打開趨勢圖
- 回首頁

Confirmation:

- Usually not required.

### CREATE_RECORD

Purpose: create health record candidates.

Examples:

- 今天早餐後血糖 138
- 我剛剛吃了一碗飯
- 下午走路 30 分鐘

Confirmation:

- Always required before saving.

### QUERY_DATA

Purpose: ask for existing data summary.

Examples:

- 這週平均血糖多少
- 昨天晚餐後多少

Confirmation:

- Not required for read, but permission check is required.

### GENERATE_REPORT

Purpose: generate or show report.

Examples:

- 幫我產生 30 天報告
- 打開回診摘要

Confirmation:

- Showing in-app report does not require confirmation.
- Exporting or sharing report requires confirmation and audit log.

### SWITCH_PROFILE

Purpose: switch active care profile.

Examples:

- 切換到媽媽
- 幫爸爸記錄

Confirmation:

- May require confirmation if the target profile is ambiguous.

### SET_REMINDER

Purpose: create reminder proposal.

Examples:

- 每天早上八點提醒我測血糖

Confirmation:

- Required before saving reminder.

## Action Proposal Shape

```json
{
  "intent": "CREATE_RECORD",
  "action": "create_record_candidates",
  "payload": {
    "records": []
  },
  "requires_confirmation": true,
  "confidence": 0.82,
  "ui_response": {
    "type": "confirmation",
    "message": "我整理出 2 筆候選紀錄，請確認。"
  }
}
```

## Scheduler / Router Responsibilities

- Decide which feature handles the command.
- Check account/profile permission.
- Decide whether confirmation is required.
- Return action proposal.
- Execute action only after confirmation.

## PHI Rules

- Voice command transcript is sensitive health data.
- Command parser output can contain PHI.
- Do not write command transcript or parser output to general logs.
- Debug output is allowed only in local/dev UI and must not persist.
