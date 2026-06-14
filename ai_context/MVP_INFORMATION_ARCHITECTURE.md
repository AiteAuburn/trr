# MVP Information Architecture

Purpose: this document maps the MVP page structure from the product blueprint to the current web simulator implementation. It keeps route names stable before the app moves to a real router.

## Route Map

| View ID | Display Name | Current Surface | MVP Responsibility |
| --- | --- | --- | --- |
| `home` | 首頁 | Web simulator default view | Quick record entry, push-to-talk, text input, AI model selection, parse preview action, recent active-profile records. |
| `today` | 今日紀錄 | Right-top function menu | Today-only active-profile timeline. |
| `history` | 歷史紀錄 | Right-top function menu | Active-profile record history with quick-range counts for today, 7 days, and 30 days. |
| `analysis` | 基本分析 | Right-top function menu | Basic record count and glucose summary. No diagnosis or treatment advice. |
| `subscription` | 訂閱方案 | Right-top function menu | MVP subscription/paywall placeholder for 7-day trial and yearly plan. |
| `settings` | 帳號設定 | Right-top function menu | Backend health, active profile switcher, and profile creation. |

## Navigation Rules

- The top header remains focused on the current view and the app name `糖錄錄`.
- The right-top menu is the single entry point for secondary MVP views.
- The menu is implemented as an expandable grid so it can later grow into the blueprint's larger icon menu.
- `home` remains the default because MVP priority is fast recording.

## Active Profile Rules

- The active profile context is shown outside individual views.
- All MVP views inherit the same active profile.
- Record lists and summaries use only records already loaded for the active profile.
- Settings owns profile switching and profile creation.

## Current Implementation Notes

- File: `web/src/App.tsx`
- The route model is an in-component `AppViewId` union and `appViews` array.
- This is intentionally not a full URL router yet; the simulator still has one screen shell.
- A real router can later map the same view IDs to mobile tabs, native stack screens, or web routes without changing labels.

## Deferred

- Dedicated URL routes.
- Icon grid artwork.
- Advanced History search/filter UI.
- Full Analytics charts.
- Subscription provider integration.
