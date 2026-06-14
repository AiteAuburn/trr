# Mobile Visual Smoke Evidence Workflow

Purpose: use this lightweight workflow after major mobile UI layout changes to catch visual regressions that source-level checks cannot prove. This workflow is developer-triggered and is not a default CI gate.

## Scope

Use this workflow for mobile changes that affect:

- page structure, spacing, card nesting, or open-section layout
- navigation, menu destinations, or return paths
- shared card, row, timeline, metric, chart, form, or CTA styles
- accessibility-related labels, touch targets, or dense text wrapping

This workflow must not require production credentials, payment providers, real user data, backend writes, AI, LLM, Vision, STT, native model downloads, or database mutations.

## Before Capturing

Run the source-level gate first:

```bash
cd mobile
npm run quality
```

When native Android screenshot capture is in question, record the local SDK/AVD
prerequisites before spending time on Expo:

```bash
cd mobile
npm run visual-smoke:android-prereqs -- --evidence /tmp/bloodsugar-mobile-visual-smoke/<date>/android-prereqs.json
```

This prereq check is read-only and PHI-safe. It inspects the local SDK tools,
installed system images, configured AVDs, and whether a non-16 KB screenshot
target exists. It does not launch Expo, clear app data, call backend services,
write data, or trigger AI / LLM / STT / Vision / payment.

Then run the Expo preview with local or offline-safe state:

```bash
cd mobile
EXPO_PUBLIC_ALLOW_DEV_AUTH=false \
EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=false \
npm run start
```

If a backend is needed for route loading, use a local disposable backend with seeded/sample data only. Do not use real transcripts, real glucose records, real meal photos, request bodies, raw prompts, raw model output, secrets, tokens, or production accounts in screenshots.

Store temporary visual evidence outside the committed repo, for example:

```bash
mkdir -p /tmp/bloodsugar-mobile-visual-smoke/$(date +%F)
```

Only record a PHI-safe summary in `ai_context/IMPLEMENTATION_LOG.md`.

## Required Screens

Capture or manually inspect these routes after a major UI layout change:

- Today / Home
- Record quick entry
- Transcript Review
- AI Review
- AI Save Confirm
- Save Success
- History
- Analysis
- Detailed Report
- Record Detail
- Edit Record
- Delete Confirm
- Menu
- Subscription
- Subscription Management
- Membership Status
- Settings
- Account Security
- Profile
- Recording Quota
- Tutorial
- Future Modules
- Future Module Detail
- Doctor Share
- Health Integration
- Community
- Ranking
- Achievements
- Year Review
- Store
- Store Cart
- Food Photo Analysis

For narrow-screen checks, include at least one small mobile viewport or device class. For Android Studio checks, use a common Pixel emulator size and one smaller viewport if available.

## Android Studio / WSL Notes

When Expo is started from WSL but the emulator is managed by Windows Android Studio:

- Use Windows `adb.exe` to launch the already installed development build.
- Prefer direct Windows SDK commands from WSL before PowerShell. A direct emulator / adb check can use:

```bash
/mnt/c/Users/robin/AppData/Local/Android/Sdk/emulator/emulator.exe -avd Pixel_9 -no-snapshot-load
/mnt/c/Users/robin/AppData/Local/Android/Sdk/platform-tools/adb.exe devices -l
/mnt/c/Users/robin/AppData/Local/Android/Sdk/platform-tools/adb.exe -s emulator-5554 shell getprop sys.boot_completed
```

- If Expo chooses a non-default Metro port, open the dev-client URL explicitly:

```bash
/mnt/c/Users/robin/AppData/Local/Android/Sdk/platform-tools/adb.exe -s emulator-5554 reverse tcp:8082 tcp:8082
/mnt/c/Users/robin/AppData/Local/Android/Sdk/platform-tools/adb.exe -s emulator-5554 shell am start -a android.intent.action.VIEW -d "exp+bloodsugar-mobile://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8082"
```

- If the app is stuck on an older `Loading from ...:8081` screen, force-stop the package and relaunch the explicit dev-client URL instead of relying on the WSL Expo CLI `a` shortcut.
- If `adb exec-out screencap -p` or `adb pull` to a WSL `/tmp` path fails, use the more reliable Windows-path capture flow: run `adb shell screencap -p /sdcard/<route>.png`, then `cmd.exe /c "adb.exe pull /sdcard/<route>.png D:\bloodsugar\tmp_visual_smoke_pull\<route>.png"`, then copy the file from `/mnt/d/bloodsugar/tmp_visual_smoke_pull/` into the `/tmp/bloodsugar-mobile-visual-smoke/...` evidence directory.
- For MVP/account-critical and future/commerce preview routes that are hard to tap reliably after scrolling, temporarily start Expo with both `EXPO_PUBLIC_ALLOW_DEV_AUTH=true` and `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`, then use the Menu page's `DEV ONLY` visual smoke route jumps. These shortcuts must only navigate local UI routes or seed bounded local demo state for screenshot setup; they must not call backend, write data, trigger AI / LLM / Vision / STT, start payments, or use production credentials.
- For deterministic startup screenshots, set `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` to one of the debug route ids while both dev auth and debug tools are enabled. Supported values include the MVP/account-critical group (`today`, `record`, `transcriptReview`, `aiReview`, `aiSaveConfirm`, `saveSuccess`, `history`, `recordDetail`, `editRecord`, `manualRecord`, `analysis`, `subscription`, `subscriptionManagement`, `membershipStatus`, `settings`, account settings, and `menu`) plus future/commerce routes (`futureModules`, `futureModuleDetail`, `achievements`, `yearReview`, `store`, `storeCart`, and `foodPhoto`).
- `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` must be ignored unless both `EXPO_PUBLIC_ALLOW_DEV_AUTH=true` and `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true`.
- When `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` is active, mobile must skip backend boot / dev-login / model refresh and rely only on bounded local demo state. This keeps visual-smoke screenshots free of API calls, token use, AI / LLM / STT / Vision calls, payment calls, and database writes.
- After the app is loaded with dev auth and debug tools enabled, native visual-smoke runs may switch routes without rebuilding the bundle by opening `bloodsugar://visual-smoke?route=<routeId>`. The deep-link handler must reuse the same bounded local route-jump setup as the Menu debug chips and must not call backend, AI / LLM / STT / Vision, payment, or write APIs.

```bash
/mnt/c/Users/robin/AppData/Local/Android/Sdk/platform-tools/adb.exe -s emulator-5554 shell am start -a android.intent.action.VIEW -d "bloodsugar://visual-smoke?route=editRecord"
```
- If the Android development build cannot produce stable route screenshots because of native runtime issues, run `npm run verify:visual-smoke-routes` in `mobile/` and optionally generate PHI-safe source evidence with `python3 scripts/verify_mobile_visual_smoke_routes.py --evidence /tmp/bloodsugar-mobile-visual-smoke/<date>/visual-smoke-route-evidence.json`. This source-level evidence does not replace screenshots for layout inspection, but it proves the covered route branches, necessary return CTAs, dev-only gates, and side-effect-free route jumps remain present while the native runtime blocker is handled.
- As a temporary non-production fallback for MVP/account-critical and future preview route visual review, run `npm run visual-smoke:harness` in `mobile/`. This generates static PNG previews and a manifest under `/tmp/bloodsugar-mobile-visual-smoke/2026-06-02-t698-harness/` by default, or a supplied `--output-dir`. The harness uses seeded demo text only and must not call Expo, backend, database, AI / LLM / STT / Vision, payment, or production credentials. Harness PNGs can support manual layout review while Android screenshots are blocked, but they do not prove native runtime rendering.
- `npm run quality` includes `npm run verify:visual-smoke-harness`, which checks the fallback harness route list, static-renderer marker, and PHI-safe/no-side-effect manifest contract. This source-level gate protects the fallback evidence path; it still does not replace native Android screenshots for final visual-smoke completion.
- After generating harness evidence, run `npm run visual-smoke:harness:verify-artifact -- --output-dir <evidence-dir>` to check the actual manifest and PNG files exist, use the expected dimensions, are nonblank, include the expected route checks, and keep the PHI-safe safety flags.
- If the only available emulator is a 16 KB page-size image and the current development build shows Android compatibility dialogs or ANRs, do not accept those screenshots as visual evidence. Use a non-16 KB emulator/system image, rebuild the development client with 16 KB-compatible native libraries, or record the runtime blocker and keep the visual smoke task open.
- Prefer the in-app header back/close controls for route-return checks. Android hardware back may close the current dev-client activity and should be recorded separately if native back handling becomes a product requirement.

## Visual Pass Criteria

Each inspected screen should satisfy:

- The page itself uses an open background; it does not wrap all content in one large white panel.
- There is no accidental panel-inside-panel layout except for genuinely framed objects such as a chart canvas, form field, repeated record item, product row, or modal-like confirmation.
- Inline boundary, preview-only, privacy, cost, entitlement, and integration-status explanations stay as inline blocks/status text, not banner cards.
- Cards and dense rows wrap on narrow screens; labels, values, CTAs, and icons do not overlap or clip.
- Primary CTAs remain reachable, readable, and visually distinct.
- Header actions, icon-only buttons, dev-only controls, and destructive controls have clear placement and labels.
- The dev reset control appears only in the intended development/debug context and is clearly removable before production.
- Screenshot evidence contains only seeded/sample/demo content.

## Evidence Note Format

When this workflow is run, add a short PHI-safe note to the implementation log:

```text
驗證:

- `npm run quality` in `mobile/` passed.
- Mobile visual smoke inspected: Today, Record, Transcript Review, AI Review, History, Analysis, Menu, Settings, Subscription, Future, Store, Food Photo.
- Evidence stored locally outside the repo at `/tmp/bloodsugar-mobile-visual-smoke/YYYY-MM-DD/`; no PHI, secrets, prompts, raw model output, payment data, or production credentials were used.
```

If the workflow could not be run, state why and keep the related visual smoke task open.
