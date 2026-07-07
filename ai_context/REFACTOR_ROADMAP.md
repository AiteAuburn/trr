# 糖錄錄 Refactor Roadmap

最後更新：2026-07-07

文件定位：本文件只規劃 mobile/backend 架構整理，不新增產品功能、不改 UI/UX 規格。使用者可見行為仍以 `ai_context/UI_UX_SPEC.md` 為準；任務狀態以 `ai_context/TASK_QUEUE.md` 與 `ai_context/IMPLEMENTATION_LOG.md` 追蹤。

## Refactor 原則

- 第一版主流程只聚焦：今日錄音、歷史紀錄、基本分析、設定。
- 成就榜、年度回顧、商城、食物社群、社群排行與未來擴充入口維持 hidden / debug-only，直到正式排入 public release scope。
- 每個 slice 必須保留現有 copy、navigation、資料流程與 verifier 邊界。
- 先抽純 helper、static config、資料轉換，再抽 UI component，再整理 backend contract。
- 不改 secrets，不提交 `.env`，不提交 `mobile/.expo/devices.json`。
- 每個完成 slice 都要更新 task/log，跑 typecheck / quality / 相關 verifier，然後 commit + push。

## Current Architecture Snapshot

### Mobile

- `mobile/App.tsx` 目前仍是主要聚合點，包含：
  - `AppScreen` route union 與 `screenChrome`。
  - menu / visual-smoke / future-module static config。
  - record payload display、daily-record section builder、history summary builder。
  - auth、profile、model、record、daily-record、analysis、subscription、future-module state。
  - backend request wrappers、parser/save/update/delete handlers。
  - 所有主要 screen JSX。
- 已存在少量獨立 module：
  - `authTokenStorage.ts`：SecureStore token boundary。
  - `authTransforms.ts`：Auth token/OIDC request and response sanitizing transforms plus protected request header construction.
  - `authSessionDisplay.ts`：Account Security auth session display item shaping.
  - `authProviderChallenge.ts`：OIDC challenge helper。
  - `modelStorage.ts`：本機模型清單與下載狀態。
  - `modelTransforms.ts`：Downloaded native model state bounding transforms.
  - `nativeLocalModels.ts`：native Whisper / Llama bridge。
  - `navigationConfig.ts`：`AppScreen` route union、primary screens、MVP flow、screen chrome、first-version menu、visual-smoke route jump config 與 debug-only route normalization helpers。
  - `futureModuleDisplay.ts`：future-module bounded display card and selected-module display shaping.
  - `visualSmokeFixtures.ts`：debug-only visual-smoke demo record / preview / report fixtures and route seed predicates.
  - `recordDisplay.ts`：daily section definitions, daily-record section display shaping, AI candidate and rejected-event display shaping, record payload labels, record time/date labels, shared Today/History record-list display item shaping, record detail display item shaping, and manual-record confirmation display shaping.
  - `recordEditTransforms.ts`：record edit field type, max-length bounds, empty edit fields, validation, record payload-to-edit-field transforms, and edit-field-to-payload transforms.
  - `recordSaveTransforms.ts`：pending-record save metadata sanitizing and client save batch-id generation.
  - `recordingCopy.ts`：recording / transcript-review bounded status messages, transcript validation, and display copy.
  - `recordWorkflowCopy.ts`：parser model readiness, parser / AI review / AI save-confirm / AI remove-confirm / manual-record confirmation / record-detail return / daily-record leave guard / AI save / AI candidate bounded copy and status messages.
  - `recordStatusCopy.ts`：record sync / edit / update / delete-confirm / delete / record-result destination / manual-create bounded copy and status messages.
  - `authStatusCopy.ts`：backend reconnect / dev reset / auth session bounded status messages.
  - `nativeStatusCopy.ts`：native model debug / local Whisper / local Llama / benchmark bounded status messages, button labels, and accessibility copy.
  - `reportStatusCopy.ts`：voice quota / analysis report / detailed report bounded status messages and report-source display copy.
  - `firstVersionFlowCopy.ts`：Today / Record quick-entry display items and summary copy, core first-version flow labels/accessibility copy, destination-aware return labels, shared header/recording/primary-tab accessibility copy, shared busy/clear action status, save-success / AI-save-failure navigation status, and first-version flow status messages.
  - `historyCopy.ts`：History navigation status, empty-state, and no-real-record bounded copy.
  - `analysisCopy.ts`：Analysis no-data / boundary / detailed-report bounded copy and custom-range status messages.
  - `settingsCopy.ts`：Settings navigation, active-profile display copy, voice quota minute formatting/warning/usage/helper copy, model/quota/reminder/privacy bounded copy.
  - `subscriptionCopy.ts`：Subscription plan/status labels, plan/status summary display copy, membership trial-days display copy, account security, profile boundary, and settings subscription section labels / bounded copy.
  - `subscriptionTransforms.ts`：Subscription trial-days date calculation, voice quota response bounding, and recording effective-limit calculation.
  - `accountTransforms.ts`：Account and profile response bounding transforms.
  - `aiModelTransforms.ts`：AI model option response bounding transforms.
  - `accountCopy.ts`：Account identity display, login display, public-name fallback, and doctor-share account boundary copy.
  - `sharedDisplayItems.ts`：Shared bounded tuple, metric, option, manual-record type, comparison, tutorial, reminder, session-management preview, destination-card, menu, visual-smoke route, and checklist display item builders.
  - `dateTimeTransforms.ts`：local date/time input formatting, local date keys, analysis date bounds, and local datetime ISO transforms.
  - `recordBounds.ts`：parse-preview, pending-record, record-cache, payload, and metadata bounded transforms.
  - `dailyTranscriptTransforms.ts`：daily-record key / summary, AI review and daily-record date labels, same-day preview merge transforms, retained transcript entries, transcript display items, daily-record reorganization copy/status helpers, and daily-record save request transforms.
  - `analysisDataTransforms.ts`：Analysis basic report response bounding, glucose extraction, meal-timing classification, chart points/range, and numeric aggregation helpers.
  - `analysisMetricTransforms.ts`：Analysis and detailed-report metric row shaping, nullable glucose bounds, and count bounds.
  - `analysisScreenData.ts`：Analysis range option config, backend report request-key, and bounded range display item shaping.
  - `historyScreenData.ts`：History detail mode config, calendar day display shaping, daily summary / sync display shaping, selected-date section display shaping, raw transcript display shaping, and bounded display item shaping.
  - `settingsScreenData.ts`：Settings row config and bounded Settings row display item shaping.
  - `settingsChoiceDisplay.ts`：Settings profile/model choice and downloaded model display shaping.

### Backend

- FastAPI backend 已比 mobile 更分層：
  - `app/api/*`：API routers。
  - `app/schemas/*`：request / response schemas。
  - `app/models/*`：SQLAlchemy models。
  - `app/core/*`：config、auth、logging、metrics、redaction。
  - `app/db/*`：database session/base。
  - `alembic/versions/*`：schema migrations。
- 第一版核心 backend surface：
  - `/ai/*`：model options、parse preview。
  - `/daily-records/*`：每日紀錄 persistence。
  - `/records/*`：record CRUD。
  - `/reports/*`：基本分析。
  - `/auth/*`、`/profiles/*`：account/profile boundary。
- Future surfaces such as achievements, community, store, year reviews may remain implemented, but mobile normal menu must not route regular users into them for first-version release.

## Pain Points

- `mobile/App.tsx` is too large for safe product iteration; unrelated areas are easy to touch while fixing one flow.
- Static config, display shaping, async handlers, and JSX are mixed together.
- Future-module code remains in the same file as first-version flows, increasing review noise even when hidden.
- Display helper behavior is verifier-sensitive; moving it requires small slices and unchanged call sites.
- Backend is mostly modular, so near-term refactor risk is mobile-heavy. Backend work should focus on contract clarity and daily-record persistence gaps, not broad rewrites.

## Safe Slice Plan

### Slice 1: Record Display Helpers

Status: done.

Scope:

- Extract record type labels/icons.
- Extract payload summary and detail row builders.
- Extract daily-record section definitions.
- Keep all call sites and UI copy unchanged.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run quality`
- `rtk git diff --check`

### Slice 2: Static Screen/Menu Config

Status: done; visual-smoke route normalization helpers are also extracted.

Scope:

- Extract `screenChrome`, `menuScreens`, `visualSmokeRouteJumps`, and future-module display config.
- Extract debug-only visual-smoke initial route normalization and deep-link route parsing.
- Keep normal menu limited to 今日錄音、歷史紀錄、基本分析、設定.
- Keep future functions debug / visual-smoke only.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run verify:navigation`
- `cd mobile && rtk npm run quality`

### Slice 3: Status/Copy Helpers

Status: started; recording / transcript-review copy/status, transcript validation, parser model readiness, parser / AI review / AI save-confirm / AI remove-confirm / manual-record confirmation / record-detail return / daily-record leave guard / AI save / AI candidate, record sync / edit / CRUD / delete-confirm / result destination, auth / backend session, native model debug labels/accessibility, report / voice quota / source display, first-version Today summary copy, first-version core labels/accessibility copy, destination-aware return labels, shared header/recording/primary-tab accessibility copy, shared busy/clear action status, first-version flow and save-success / AI-save-failure navigation status, history, analysis no-data/boundary, settings active-profile display, settings voice quota minute formatting/warning/usage/helper copy, settings model/quota/reminder/privacy, subscription plan/status labels, plan/status summary display copy, membership trial-days display copy, account identity display, subscription/account-security, and settings subscription section labels extracted.

Scope:

- Extract recording status copy, parser status copy, save/update/delete status copy.
- Keep bounded display behavior and PHI-safe status rules unchanged.
- Do not move async network handlers in this slice.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run quality`

### Slice 4: Data Transform Helpers

Status: started; date/time, record bounds, record save transforms, daily transcript, auth token/OIDC request transforms, protected auth request header transforms, account/profile response bounding, AI model option response bounding, downloaded native model state bounding, analysis basic report response bounding, analysis data/chart, analysis metric, subscription trial-days, subscription voice quota response bounding, and recording effective-limit transform helpers extracted.

Scope:

- Extract parse-preview bounding, record cache bounding, daily transcript retention, and analysis metric transforms.
- Keep backend request/response contracts unchanged.
- Add focused unit-style checks only if existing script structure supports it without adding a new framework.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run quality`

### Slice 5: First-Version Screen Components

Status: started; Settings row, Settings profile/model choice display, Settings downloaded model display, Settings active-profile display copy, Settings voice quota minute formatting/warning/usage/helper copy, Settings model/quota copy, Account Security auth session display items, Subscription plan/status labels, plan/status summary display copy, membership trial-days display copy, account identity display, shared bounded display item builders including menu/visual-smoke route/checklist/manual-record type items, native model debug labels/accessibility, Analysis range/request-key, Analysis no-data/boundary copy, Analysis report-source display, History detail-mode, History calendar day display, History daily summary/selected-date section display, History raw transcript display, AI candidate/rejected-event display, first-version Today summary copy, first-version core labels/accessibility copy, destination-aware return labels, shared header/recording/primary-tab accessibility copy, shared busy/clear action status, transcript-review copy, AI review/save-confirm copy, AI remove-confirm copy, manual-record confirmation copy/status, record-detail return status, delete-confirm copy/status, record-edit copy/status, record-result destination status, daily-record leave guard copy/status, save-success / AI-save-failure navigation status, shared record-list display, record detail display, manual-record confirmation display, record edit-field transform, edit validation, edit payload transform, daily-record date label, same-day preview merge, daily-record reorganization copy/status, daily-record section display boundaries, and future-module display card boundaries extracted.

Scope:

- Split Today/Home recording, History, Analysis, and Settings view renderers after helpers/config are stable.
- Components receive display items and callbacks; they should not own backend calls.
- Do not move hidden future modules into the first-version component tree.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run quality`
- Visual-smoke verifier for touched routes.

### Slice 6: Future Module Isolation

Scope:

- Move achievements, store, community, ranking, year review, and future-module preview render/config into isolated debug/future modules.
- Continue moving future-module display/config helpers and visual-smoke fixtures out of `App.tsx` while keeping normal menu unchanged.
- Normal user navigation remains unchanged.

Verification:

- `cd mobile && rtk npm run typecheck`
- `cd mobile && rtk npm run verify:navigation`
- `cd mobile && rtk npm run verify:visual-smoke-routes`

### Slice 7: Backend Contract Cleanup

Scope:

- Document first-version API contracts for parse preview, daily records, record CRUD, and basic reports.
- Avoid broad backend rewrites unless tests expose drift.
- Keep future routers available but outside first-version mobile navigation.

Verification:

- Backend test suite or focused pytest targets for touched API contracts.
- `cd mobile && rtk npm run quality` if mobile contract types or calls are touched.

## Non-Goals

- No UI redesign.
- No new release feature.
- No secret/env change.
- No database migration unless a later product task explicitly requires one.
- No removal of future routes needed by debug / visual-smoke coverage.
