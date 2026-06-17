# 糖錄錄 App 介面與流程規格

最後更新：2026-06-02

文件定位：本文件是糖錄錄目前 UI / UX 的 canonical 規格，提供給 AI coding agent、設計工具與前後端實作使用。MVP / future 範圍仍以 `ai_context/ENGINEERING_BLUEPRINT_V1.md` 與 `ai_context/TASK_QUEUE.md` 為準；成就榜、年度回顧、商城、食物拍照分析屬於 future module，除非 task 明確要求，不應混入 MVP 首頁。

## 1. App 定位

「糖錄錄」是一款血糖、飲食、運動紀錄 App。核心特色是讓使用者用語音快速記錄每日血糖、飲食與運動，系統再用 AI 自動整理成結構化紀錄，並提供趨勢分析、歷史查詢、會員方案、成就與年度回顧。

整體設計風格是乾淨、溫和、健康感。主色為深綠與薄荷綠，背景為白色或極淡綠色，搭配圓角卡片、柔和陰影與大型留白。

使用者應該感覺：

- 被照顧。
- 很簡單。
- 不用思考太多。
- 很柔和。
- 很安心。

產品不應該像：

- 醫院系統。
- 專業儀器。
- 冷冰冰 dashboard。
- 複雜數據工具。

## 2. 視覺設計系統

### 2.1 色彩

```text
主色 / 深墨綠: #0F3F37
品牌綠 / 按鈕綠: #3FA67F 或 #46B58B
淡綠背景: #EAF6F1
灰色文字: #5F666A
淺灰邊框: #E3E8E5
錯誤紅 / 刪除紅: #C85D5D
卡片背景: #FFFFFF
頁面背景: #FAFAF8 或 #FFFFFF
```

使用規則：

- 深墨綠用於頁面標題、重要文字、主要 icon。
- 品牌綠用於主要按鈕、選中狀態、數字強調。
- 淡綠背景用於 icon 圓形背景、提示卡、選中區塊背景。
- 錯誤紅只用於刪除、危險操作或錯誤狀態。
- 避免高飽和大面積色塊，整體要保留柔和健康感。

### 2.2 字體

使用繁體中文無襯線字體，例如 Noto Sans TC、PingFang TC 或系統字體。

```text
頁面標題: 36-44px, bold, 深綠色
頁面副標: 16-18px, medium, 灰色
卡片標題: 20-24px, bold, 深綠色或接近黑色
數值: 32-56px, bold, 品牌綠
按鈕文字: 20-24px, bold, 白色或品牌綠
小字 / 單位: 14-16px, 灰色
```

### 2.3 共同版面

- 所有主要頁面使用 iPhone 風格直式畫面。
- 左右內距約 28-32px。
- 卡片圓角約 20-28px。
- 按鈕圓角約 18-28px。
- 卡片使用白底、淺灰邊框、輕微陰影。
- Icon 多放在淡綠圓形背景中。
- 右上角常見圓角方形 menu 按鈕，內含三條橫線。
- Mobile 需遵守 safe area inset。
- 記錄、文字確認、AI 整理確認、AI 儲存確認、AI 候選移除確認、候選紀錄編輯、手動新增、手動新增確認、儲存完成、更新完成、刪除完成、記錄詳情、編輯記錄、刪除確認、歷史、分析、詳細報告、功能選單、會員方案、訂閱管理、會員狀態、設定、帳號安全、個人資料、錄音額度、提醒設定、使用教學、未來擴充、未來模組詳情、醫師合作、健康串接、社群、排行榜、成就榜、年度回顧、商城、購物車狀態、食物拍照分析等內容/目的地頁面不可再用整頁白色 panel 包住內容；頁面本身保持開放背景，只讓真正的列表項目、圖表、提示與操作區塊使用卡片。
- 避免「panel 裡再放 panel」造成雙層白框與過度縮排；如果需要分組，使用留白、標題、分隔或單層卡片。
- 歷史、分析、功能選單這類高密度頁面尤其不可把整組 controls / 說明文字再包成大白卡；資料邊界、同步邊界、成本邊界等說明應優先用開放式 inline 區塊，只有日期 input、紀錄 row、圖表、統計格、menu item 等真正互動或可掃描物件使用卡片。
- 未來擴充、設定、訂閱與教學等 dense preview 頁面也遵守同一規則：啟用前條件、正式整合前置項、成本/權限/隱私邊界用 inline checklist，不再放進另一張白卡；真正需要掃描或點擊的狀態卡、統計格、商品卡、紀錄卡才使用白色卡片。
- 確認、編輯、詳情、成功狀態等流程型頁面也維持開放式頁面外層；只有資料摘要、表單欄位群、提示、列表項目與操作區塊使用單層卡片。
- Native visual-smoke 專用 route selector 只能在 dev auth 與 debug tools 同時啟用時使用；`bloodsugar://visual-smoke?route=<routeId>` 必須只切換本機 route 或 seed bounded demo state，不可呼叫 backend、AI / LLM / STT / Vision、payment，也不可寫入資料。

### 2.4 元件規格

Primary button：

- 高度約 56-64px。
- 綠色或柔和綠色漸層。
- 白字，bold。
- 大圓角。
- 可搭配 icon。

Secondary button：

- 白底。
- 綠色邊框。
- 綠色文字。

Card：

- `padding: 20-24px`。
- `border-radius: 20-28px`。
- 白底。
- 淺灰邊框或極淡陰影。

Segmented tabs：

- Pill style。
- Active 狀態使用綠色背景與白字。
- Inactive 狀態使用白底或淡灰底與深綠/灰字。
- Primary tab navigation 必須走 dedicated handler；不可在 tab Pressable JSX 中直接呼叫 `setCurrentScreen(screen.id)`、`openPrimaryTab(screen.id)` 或直接寫 menu 特例分支。
- Primary tab navigation 必須有 bounded accessibility label、`accessibilityRole="button"` 與 selected/disabled accessibility state；label 只可描述 App 內頁面切換，不可暗示會同步 backend、呼叫 AI 或寫入資料。

Icon：

- Outline icon。
- iOS SF Symbols 風格。
- Web / React Native 可使用 lucide icons 近似。
- Icon container 通常為淡綠圓形背景。

## 3. 主要使用流程

### 3.1 今日快速記錄

```text
使用者進入首頁
-> 首頁只顯示大型麥克風按鈕與「按住開始說話記錄」「放開即結束」提示
-> 使用者按住首頁麥克風開始錄音 preview
-> 放開麥克風結束錄音 preview，進入文字確認 / 記錄流程
-> 歷史紀錄、基本分析與成就榜等功能從右上角漢堡選單進入
-> 使用者說出紀錄內容
-> 系統顯示語音文字稿，使用者可修正
-> 點擊下一步整理
-> AI 整理成日期時間、血糖、飲食、運動等項目
-> 使用者確認後點擊確認儲存
-> 紀錄加入今日紀錄與歷史紀錄
```

所有寫入動作都必須經過使用者確認，不可由 AI 直接寫入資料庫。

Protected backend / account / model 尚未 ready 時，handler 必須 fail-closed 並只更新 inline status；若 status 文字由 backend unavailable、account unavailable 或 model unavailable message 組成，寫入 UI state 或直接渲染到 JSX 前必須套固定長度上限，只顯示必要摘要，不保留 raw backend / account / token 細節。

所有 JSX inline `onPress={() => ...}` callback 必須呼叫 `press*` wrapper，且 wrapper 參數只可使用 render 前產生的 display item 變數（例如 `item`、`option`、`row`、`profile`、`model`、`category`、`product`、`type`、`index`）或 primary tab 的 `screen.id`；不可在 JSX 中直接把 raw item key、record、target、status、profile id 或 model id 傳入底層 state / navigation / async handler。命名 handler binding（例如 `onPress={submit...}` 或 `onPress={return...}`）可維持既有 dedicated handler，但新增 inline closure 必須先包成 `press*` wrapper。

所有 TextInput `onChangeText` 必須綁定命名 `update*` wrapper；不可在 JSX 中使用 inline setter、inline field updater 或直接呼叫 bounded helper 後 set state。TextInput 必須是 controlled input，`value` 只可綁定已 bounded 的 state 或 state-field reference，不可在 JSX `value` 內呼叫 helper、做 fallback/ternary/template 計算或直接 render raw backend/config value。TextInput `placeholder` 只可使用短靜態字串或省略，不可使用 JSX expression、backend/config-driven copy、raw payload、raw transcript、raw prompt 或 raw model output。新增輸入欄位時，長度上限、格式限制、PHI-safe status 與 backend/model readiness 邊界必須在 `update*` handler 或其下游 helper 內處理。

所有本機 preview / future-module / settings action status 即使不來自 backend，也必須在寫入 UI state 前套固定長度上限；若文案包含商品名稱、provider 名稱、session title 或其他動態 label，動態 label 也必須先 bounded。

Future module card/detail 的 title、description、readiness、safety、icon 與 requirements 必須在渲染前 bounded；requirements 需限制筆數與單項長度，避免未來改由 backend/config 載入時把過長 roadmap 文案直接撐進 UI。

Achievement / badge preview 的 id、title、description、icon、progress 與 target 在渲染前必須 bounded / clamped；progress bar 不可使用 NaN、Infinity、負數或超過 target 的數值，避免未來接 backend badge definitions 時造成 UI state 或 layout 異常。Mobile navigation verifier 必須守住 target 至少為 1、progress 不超過 target、progress ratio 不超過 1。
- Achievement preview 的整合狀態按鈕必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setAchievementActionStatus`。

Store preview 商品資料即使目前是本機常數，id、category、badge、title、description、price 與 icon 也必須先轉成 bounded display item 再用於搜尋、渲染或 action status，避免未來接 backend 商品目錄時保留過長商品文案、價格字串或 icon。
- Store product action status 必須由 bounded product display item 產生；商品按鈕不可在 JSX handler 內用 raw title 即時組狀態訊息。
- Store category selection 與 product action status 必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setStoreCategory` 或 `setStoreActionStatus`。Store category tab 與 product action button JSX `onPress` 必須呼叫 press wrapper，不直接呼叫底層 category selection 或 product status handler。

Store category tabs 必須在 render 前轉成 bounded display options；raw category id 只可用於篩選與選取狀態，label 不可直接從 `storeCategories` raw config render。
Store search input 必須走 dedicated bounded handler；不可在 JSX TextInput callback 內直接呼叫 `setStoreSearchText(boundStoreSearchText(value))`，避免未來接 backend 商品目錄時搜尋字串繞過長度界線。

Record 頁的 quick-entry mode 卡必須是可操作 Pressable，不可只是展示文字。每個 quick-entry item 的 key、label、copy、icon 與 accessibility label 都必須在 render 前 bounded；handler 必須共用 bounded mode action，語音只提示按住大型錄音按鈕、文字切到 record 流程、手動新增進入 manual record，不可在 quick-entry handler 內呼叫 AI / STT / Vision、建立紀錄、寫入資料或假造錄音結果。Home 頁不得顯示 quick-entry mode 卡。
Record quick-entry card 的來源頁選擇必須走 dedicated wrapper；不可在 JSX callback 內直接呼叫 `handleQuickEntryMode(item.key, "today")` 或 `handleQuickEntryMode(item.key, "record")`。Quick-entry card JSX `onPress` 必須呼叫 item press wrapper，不直接呼叫底層來源頁 quick-entry handler 並傳入 `item.key`。

Settings row 與 tutorial step 這類本機導覽資料在渲染前也必須轉成 bounded display item；id、label/title、helper/description 與 icon 都有固定長度上限，避免未來改由 config 載入時造成 UI 文字過長。

Success / result page 的 destination card tuple 在渲染前必須轉成 bounded display item；icon、label 與 helper 都有固定長度上限，target 只保留既有 AppScreen 導覽，不可讓長導覽文案直接進 UI。

Success / result page 的 checklist 動態文案必須在渲染前 bounded；候選筆數、同步上限等動態數字需先 clamp 到 UI 合理範圍，避免異常數字或長字串撐開結果頁。

History / Analysis 的資料邊界與同步上限文案也必須使用 bounded checklist item；`mobileRecordSyncLimit` 這類限制值需先轉成 clamped display value 再渲染。

History 使用月曆選取日期，不顯示也不保留 range tabs 或自訂日期範圍 dead code；月曆日期與 AI 整理 / 原始紀錄 tab 都必須先轉成 bounded display options，再用 dedicated wrapper 處理選取。
Analysis 的時間範圍 tabs 必須先轉成 bounded display options；raw range id 只可用於選取狀態、篩選與圖表查詢，不可直接從 raw range config render label。
Analysis range selection 與 chart point tooltip selection 必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setAnalysisRange` 或 `setSelectedAnalysisPointIndex`。Analysis range tab 與 chart point JSX `onPress` 必須呼叫 option/point press wrapper，不直接呼叫底層 range selection 或 point toggle handler。

所有 `reportBoundaryGrid` / 邊界卡 / 狀態摘要卡的 label/value 必須先轉成 bounded status metric display item 再 render；AI Save Confirm、Detailed Report、錄音額度、隱私設定、醫師合作、健康串接、社群與排行榜都不可直接 render raw tuple value。
上述 boundary grid 必須使用 render 前命名的 bounded rows，例如 `aiSaveConfirmBoundaryRows`、`detailedReportBoundaryRows`、future-module boundary rows、`recordingQuotaBoundaryRows` 與 `privacyBoundaryRows`；JSX 內不可直接宣告 raw `[label, value]` tuple 再 map。

非邊界的 metric/detail tuple 也必須在 render 前轉成 bounded display item；Detailed Report 指標、會員專屬功能列、年度回顧統計列不可直接 render raw tuple label/value。

設定/教學相關 checklist 與 reminder preview tuple 必須在 render 前轉成 bounded display item；Account Security、Profile Settings、Recording Quota、Reminder Settings、Privacy Settings 與 Tutorial 不可直接 render 固定陣列原文。

Account Security、Profile Settings、Recording Quota、Reminder Settings 與 Privacy Settings 的 preview action status 不可在 JSX handler 內即時呼叫 `boundUiMessage` 組字；應使用 render 前 derived 的 bounded status message。
Profile Settings、Recording Quota、Reminder Settings 與 Privacy Settings 的返回、編輯整合、額度同步、通知整合與隱私整合 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 不可暗示已寫入個資、上傳錄音/逐字稿、建立通知排程、匯出刪除或公開資料。
Settings advanced 區塊的照護對象、LLM 與 STT 選項 chip 必須在 render 前轉成 bounded display item，並提供 bounded accessibility label、`accessibilityRole="button"` 與 selected/disabled accessibility state；profile/model 名稱可來自 backend，但不可直接把 raw display name、model id 或未 bounded model label 串進 JSX 或輔助工具文字。
Settings 的本機 Whisper 模型選擇區必須可在非 debug 模式顯示已下載 Whisper 模型短檔名與 checksum 前綴，供 Home / Record 錄音轉文字使用；不可顯示完整本機 URI，不可下載遠端模型，不可上傳音檔，也不可呼叫雲端 AI。Settings native debug 的下載類型 chip、native module check、model download、Whisper、Llama 與 Benchmark Pressable 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 disabled/selected accessibility state；label 必須說明只操作本機模型或本機檔案狀態，不可暗示會送出健康資料、呼叫雲端 AI、保留完整 raw model output 或寫入正式紀錄。

Account Security 的 auth provider 與 session management preview rows 必須先轉成 bounded display item。session management Pressable handler 只可設定 `item.actionStatus`；auth provider Pressable handler 只可呼叫 bounded provider challenge helper，不可用 row title 在 JSX handler 內即時組登入或 session status 文案。JSX `onPress` 必須呼叫 row press wrapper，不直接呼叫底層 provider challenge 或 session status handler。
Account Security 的 provider preview row、session management preview row、refresh/load/logout/logout-all CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 不可顯示 raw token、raw device fingerprint、raw claims 或 provider token。

Backend reconnect / boot failure 類 UI status 必須透過 bounded display helper 一次產生主狀態與 auth 狀態；不可在 catch block 內分別用 raw error message 即時組多個 UI status。

主連線狀態 initial copy 也必須透過 bounded display helper 產生；不可在 `useState` 內直接寫入固定狀態字串，避免後續 backend/config-driven copy 進入 state 時繞過長度界線。

Backend URL change、dev-login disabled、reconnect progress、reconnect success 與 reconnect failure UI status 必須透過 bounded display helper 產生；任何會清除本機 session/model/record state 的狀態都必須同時產生主狀態與 auth/action 狀態，避免跨 backend 沿用 stale session 或 parser model。

AI Save 的 backend unavailable 與 partial save failure UI status 必須透過 bounded display helper 產生；不可在 guard/catch block 內用 raw backend/message 即時組儲存狀態。

AI Save 的進行中、成功、失敗、records status、成功摘要與部分成功摘要 UI status 必須透過 bounded display helper 產生；所有顯示筆數必須先 clamp，再組成顯示文字。

Record update/delete 的 backend unavailable UI status 必須透過 bounded display helper 產生；不可在 update/delete guard block 內直接用 raw backend message 組 UI status。

Record update/delete 的進行中、成功、失敗與結果摘要 UI status 也必須透過 bounded display helper 產生；包含顯示筆數的摘要必須先 clamp，再組成顯示文字。

Manual record create 的 backend unavailable、進行中、成功、失敗與結果摘要 UI status 必須透過 bounded display helper 產生；包含顯示筆數的摘要必須先 clamp，再組成顯示文字。

Parser submit 的 backend unavailable、model unavailable、範例文字阻擋、進行中、成功、失敗與 recovery UI status 必須透過 bounded display helper 產生；成功候選筆數必須先 clamp，再組成顯示文字。
Record 流程的「填入範例」必須走 dedicated bounded handler；不可在 JSX Pressable callback 內直接呼叫 `updateTranscriptDraft(sampleText, "sample")`。範例文字只能用於查看確認 UI，仍不可送 parser 或寫入資料。
Record 流程的重錄、使用錄音文字、填入範例、手動新增、文字記錄、下一步整理與查看分析 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 需說明本機 Whisper、AI/LLM、parser、寫入資料或只使用已載入紀錄的邊界，下一步整理 disabled 時也必須提供 accessibility disabled state。Home 頁只保留 mic Pressable，不顯示上述 CTA。

AI candidate edit/remove 的開啟編輯、移除確認、移除結果、編輯成功與編輯失敗 UI status 必須透過 bounded display helper 產生；移除後剩餘候選筆數必須先 clamp，再組成顯示文字。
AI Review 候選卡的修改與移除按鈕必須走 dedicated action handler；不可在 JSX Pressable callback 內直接呼叫 `openPreviewRecordEdit(item.index)` 或 `openPreviewRecordRemoveConfirm(item.index)`。候選卡 JSX `onPress` 必須呼叫 action press wrapper，不直接呼叫底層 edit/remove action handler 並傳入 `item.index`。
AI Review 候選卡的修改與移除按鈕必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 需包含 bounded record type 與摘要，不可在 JSX 內直接串 raw candidate payload。
AI 候選編輯頁的 header 返回、底部取消與套用修改 CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 validation disabled accessibility state；label 必須說明候選修改仍未寫入正式紀錄、不送 backend save request、不呼叫 delete API。

Recording 與 header busy guard 的 quota exhausted、permission denied、recording started、reset、finished、too-short、start/stop failure、Whisper progress/success/empty/failure 與 busy UI status 必須透過 bounded display helper 產生；錄音秒數只可用於狀態判斷，若進入顯示文案前必須先 clamp。Mobile hold-to-record 必須使用 `expo-av` / `Audio.Recording` 擷取本機音檔，URI 只可 bounded 後寫入 native debug audio path；Whisper 轉錄結果只可進入 bounded transcript draft 和文字確認頁，不得保存 raw prompt 或 raw model output。
Mobile 單次錄音上限為 60 秒，且若 backend voice quota remaining 更低，單次上限必須使用較低值。錄音 timer 顯示、auto-stop、`voice_seconds` pending value 都必須 clamp 到 effective limit；到上限時自動停止錄音，不等使用者放開按鈕。
Record 錄音結果主按鈕必須走 dedicated handler；不可在 JSX Pressable callback 內直接呼叫 `handleRecordingResultPrimaryAction("today")` 或 `handleRecordingResultPrimaryAction("record")`。handler 可在已設定 Whisper model path 且有 bounded audio URI 時轉文字並進入文字確認；仍不可跳過文字確認、不可直接呼叫 AI/parser 或寫入紀錄。Home 頁 mic 放開不顯示錄音結果主按鈕；若已有 Whisper model path，可直接轉文字後進文字確認，否則只保留本機 audio URI。
Whisper 產生的 transcript 必須保留 bounded `transcriptVoiceSeconds`，送 `/ai/parse-preview` 時以 `voice_seconds` 傳給 backend；手動輸入、範例文字、重輸入、清除 session 與儲存成功都必須清為 0。Parser 成功後立即清掉 pending voice seconds 並刷新 backend voice quota；parser 失敗時保留 pending seconds，讓重試成功時才扣 backend quota。

核心記錄流程、AI 確認/儲存、手動新增/確認、儲存/更新/刪除結果、歷史、詳情、編輯、分析與詳細報告的 section/action labels 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 repeated core-flow labels。

Tutorial、Menu、debug/native controls、achievement/year-review/store/food-photo status labels 與 auxiliary preview badges/action labels 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 remaining auxiliary labels。
Settings native debug 的模型下載 URL、Whisper model path、audio path 與 Llama model path input 必須走 dedicated bounded handler；不可在 JSX TextInput callback 內直接呼叫 `setModelUrl`、`setWhisperModelPath`、`setAudioPath` 或 `setLlamaModelPath` 搭配 `boundNativeDebugInput`。

Future-module 與 commerce / Vision preview checklist 也必須在 render 前轉成 bounded display item；Doctor Share、Health Integration、Community、Ranking、Store Cart 與 Food Photo Analysis 不可直接 render 固定陣列原文。

Future Modules 清單卡必須在 render 前轉成 bounded display card；raw module object 只可用於詳情頁導覽與 target 行為，title / description / readiness / safety / requirements / icon 不可在 JSX 內即時計算後 render。
Future Modules 清單卡必須有 bounded accessibility label；label 由 render 前 display item 產生，不可在 JSX 內直接串 raw module title。

Future Module Detail 的 selected module 顯示也必須先轉成 bounded display item；raw selected module 只可用於狀態與導覽，不可直接在 JSX 內呼叫 futureModuleText / futureModuleIcon / futureModuleRequirements。

Doctor Share、Health Integration、Community 與 Ranking 的 preview action status 不可在 JSX handler 內即時呼叫 `boundUiMessage` 組字；應使用 render 前 derived 的 bounded status message。
Doctor Share、Health Integration、Community 與 Ranking 的 preview CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 需說明只顯示授權/權限/公開資料/排名邊界，不可暗示已建立 share token、讀取健康資料、公開貼文或上傳排名。

Food Photo Analysis 的 upload / integration / retake preview action status 不可在 JSX handler 內即時呼叫 `boundUiMessage` 組字；應使用 render 前 derived 的 bounded status message。
Food Photo Analysis 的 upload / integration / retake preview action status 必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setFoodPhotoActionStatus`。
Achievement、Year Review、Store 與 Food Photo 的 integration / share / cart / upload / retake CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 不可暗示已寫入成就、產生分享圖、建立訂單付款、讀取照片或呼叫 Vision。
Achievement、Year Review、Store、Store Cart 與 Food Photo 的底部返回 / disabled checkout CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 disabled checkout accessibility state；label 不可暗示已寫入成就、產生分享圖、建立訂單付款、讀取照片或呼叫 Vision。

表單 option chips 與 subscription comparison rows 必須在 render 前轉成 bounded display item；血糖單位、血糖情境、餐別與會員功能比較不可直接 render raw option/comparison tuple。
血糖單位、血糖情境、餐別與商城分類 chips 必須由 render 前 bounded display item 提供 accessibility label，並在 Pressable 上標示 `accessibilityRole="button"` 與 selected accessibility state；label 不可直接串 raw option tuple，也不可暗示會送 parser、建立訂單或付款。
History / Analysis range chips 必須由 render 前 bounded display item 提供 accessibility label，並在 Pressable 上標示 `accessibilityRole="button"` 與 selected accessibility state；label 必須說明只篩選或分析已載入紀錄，不可暗示會查詢 backend、呼叫 AI 或寫入資料。
Analysis chart point Pressable 必須提供 bounded accessibility label、`accessibilityRole="button"` 與 selected accessibility state；label 只可顯示 bounded 日期/點位與圖表值，不可使用 raw record id 或 raw payload。

Manual Record 的紀錄類型 chips 也必須在 render 前轉成 bounded display options；raw type id 只可用於選取狀態與表單行為，label 不可直接從 raw option tuple render。
Manual Record 的紀錄類型 chips 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 selected accessibility state；label 必須說明只切換手動表單類型，不呼叫 AI / parser。
Manual Record 的紀錄類型 chip selection 必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setManualRecordType`。紀錄類型 chip JSX `onPress` 必須呼叫 option press wrapper，不直接呼叫底層 type selection handler。

功能選單 grid item 必須在 render 前轉成 bounded display item；raw `AppScreen` target 只可用於導覽行為，label / icon 不可直接從 `menuScreens` raw config render。Menu card JSX `onPress` 必須呼叫 row press wrapper，不直接呼叫底層 menu destination handler。

Protected operation checklist 必須在 render 前轉成 bounded display item；AI Save Confirm、Save Success、Delete Success、Update Success、Manual Record Confirm 與 Record Detail 不可直接在 JSX 內組 raw checklist 文案。

Record flow / history / analysis operation checklist 也必須在 render 前轉成 bounded display item；快速記錄設定、AI 候選移除、AI Save Failure、History boundary、Delete Confirm、Edit Record update checklist 與 Analysis boundary 不可直接在 JSX 內組 raw checklist 文案。

Result-page destination cards 必須在 render 前轉成 bounded display item；Save Success、Delete Success 與 Update Success 的導覽卡不可直接在 JSX 內組 raw icon/label/helper/target tuple。
Result-page destination cards 必須有 bounded accessibility label 與 `accessibilityRole="button"`；label 需由 render 前 display item 產生，不可在 JSX 內直接串 raw label。
Save Success、Delete Success 與 Update Success 的 destination card Pressable 必須走 dedicated card handler；不可在 JSX callback 內直接呼叫 `openSaveSuccessDestination(item.target)`、`openDeleteSuccessDestination(item.target)` 或 `openUpdateSuccessDestination(item.target)`。結果頁 destination card JSX `onPress` 必須呼叫 card press wrapper，不直接呼叫底層 destination card handler 並傳入 `item.target`。Delete Success 的固定查看歷史 CTA 也必須走 dedicated handler，不可在 JSX callback 內直接傳入 `"history"`。
Delete Success 與 Update Success 的底部 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須說明只切換頁面或查看已更新詳情，不可暗示會重送 delete/update request、呼叫 parser / AI / LLM，或重新同步完整歷史。
Save Success 的繼續手動新增、繼續記錄、語音 / 文字、查看詳情、處理未儲存候選與回今日紀錄 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須說明只導覽或處理尚未儲存候選，不可暗示會自動呼叫 STT / AI / parser、重送 save request 或重新同步完整歷史。

Today / History 的真實紀錄列表也必須在 render 前轉成 bounded display item；record id 僅作 key/action，icon、type label、payload 摘要與時間顯示不可直接在 JSX 內呼叫 raw record helper。
Today / History 的紀錄卡進入詳情必須走 dedicated card handler；不可在 JSX Pressable callback 內直接呼叫 `openTodayRecordDetail(item.record)` 或 `openHistoryRecordDetail(item.record)`。紀錄卡 JSX `onPress` 必須呼叫 card press wrapper，不直接呼叫底層 detail card handler 並傳入 `item.record`。
Today / History 的紀錄卡必須由 `recordListDisplayItem` 產生 bounded accessibility label，並在 Pressable 上標示 `accessibilityRole="button"`，避免輔助工具只讀到卡片內容卻不知道可開啟詳情。

Record Detail / Delete Confirm / Edit Record 的 selected record 顯示也必須先轉成 bounded display item；raw selected record 只可用於表單型別判斷、update/delete API 與導覽行為，不可直接在 JSX 內組日期、來源、payload 摘要或類型標籤。
Record Detail / Delete Confirm / Edit Record 的返回、編輯、開啟刪除、取消刪除、確認刪除、取消編輯與儲存修改 CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 disabled accessibility state；label 必須區分只導覽、不送 update/delete request、或正式送 backend update/delete 與 audit。

Manual Record Confirm 的 icon、類型、payload 摘要與日期/source 行也必須先轉成 bounded display item；raw manual form state 只可用於驗證與建立 payload，不可直接在確認卡 JSX 內組顯示文字。
Manual Record / Manual Record Confirm 的返回、進入確認、取消返回與建立紀錄 CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與 disabled accessibility state；label 必須說明手動新增不呼叫 AI / LLM / STT，只有最終建立才送 backend create request。
History 的月曆日期格、AI 整理 / 原始紀錄 tab、空狀態回今日與空狀態手動新增 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須說明月曆選取只篩選已載入紀錄，回今日不查詢 backend，手動新增不呼叫 AI / LLM / STT。

AI 候選編輯、手動新增與正式紀錄編輯的日期、時間、欄位文字輸入與 chip option selection 必須走 dedicated bounded handler；不可在 JSX callback 內直接呼叫 `setPreviewEditDate`、`setManualRecordDate`、`setRecordEditDate`、`updatePreviewEditField`、`updateManualRecordField` 或 `updateRecordEditField`。這三種表單的血糖單位、血糖情境與餐別 chip JSX `onPress` 必須呼叫 option press wrapper，不直接呼叫底層 field selection handler。

## 4. 介面逐頁規格

### 4.1 首頁 / 今日紀錄

頁面內容：

- 標題：「糖錄錄」。
- 右上角：圓角方形 menu 按鈕，內含三條橫線 icon。
- 首頁只保留大型麥克風按鈕，不顯示今日摘要、同步狀態、文字輸入、手動新增、紀錄列表、分析 CTA、primary tabs 或 MVP flow stepper。
- 麥克風按鈕置中，為第一視覺重心；下方只顯示淺色提示字：「按住開始說話記錄」與「放開即結束」。按住錄音時，第二行提示可在同一個 `homeHintSecondary` 位置改顯示「已錄音 X 秒，放開即結束」，不可新增第三行、卡片或文字框。
- Mobile navigation verifier 必須從 Today/Home render block 內確認這兩行提示字使用 `homeHint` / `homeHintSecondary` 顯示，不能只用全檔文字 marker 間接判斷；也必須守住按住時的秒數提示由 bounded helper 產生。Verifier 也必須確認首頁 render block 只有一個 Pressable 麥克風控制，不含 primary/secondary button、section title、status/evidence copy、inline info block 或 card/timeline surface，且 `homeMicButton` 維持大型圓形尺寸，不可縮成一般 CTA。Today/Home chrome 必須保留空 subtitle 且不可設定 `backTo` 或 `actionLabel` 覆蓋 header fallback；右上角 header button 必須使用 `☰` fallback 開啟功能選單。
- 首頁按住麥克風使用 `expo-av` 啟動本機錄音；放開停止錄音並保留 bounded audio URI。若已設定 Whisper model path，可轉文字後進入文字確認；不可直接呼叫 AI / LLM parser、不中途建立紀錄、不寫入 backend。
- 其他 MVP 功能入口（歷史紀錄、分析、成就榜）必須從右上角漢堡選單進入；首頁不可再放快捷卡或次要 CTA。
- Primary tabs 只可保留今日、記錄與選單；歷史紀錄與基本分析不可出現在 primary tabs，必須透過右上角漢堡選單進入。History / Analysis screen chrome 必須維持 hamburger fallback，不可改成 back arrow 或 close action 取代 menu 入口。
- Mobile navigation verifier 必須檢查功能選單 top-level destination id 與使用者可見 label parity，至少守住「歷史紀錄」、「基本分析」、「成就榜」等 MVP 入口文字不可漂移。
- 不顯示 `MVP`、`預留` 或其他 stage badge；首頁是一般使用者的主要錄音入口。
- 紀錄同步 handler 必須先檢查 protected backend readiness；backend account、active profile 或 protected auth 未 ready 時只更新 inline status，不送 `/records` 查詢。
- 紀錄同步的 initial / unavailable / loading / success / failure UI status 必須透過 bounded display helper 產生；不可在 state 初始化、session reset 或 sync handler 內直接用 raw backend message、raw response count 或固定同步字串組 UI status。
- 紀錄同步與本機新增後的 records list 必須維持固定筆數上限，不因連續新增或同步而在 mobile state 累積無上限資料。
- 記錄頁 / 快速記錄頁的「本次整理設定」使用 inline checklist，不使用 banner card：
  - 記錄頁保留三入口 affordance：語音預覽、文字整理、手動新增；首頁不顯示這三入口。
  - 三入口 affordance 是使用者導引，不新增 backend/STT/AI 呼叫，也不包在白色大 panel 裡。
  - 顯示目前 STT / LLM runtime 標籤。
  - 手動新增可完全避開 AI parser。
  - 文字整理每次只送出目前文字一次，不批次載入歷史紀錄。
  - 確認儲存前不會寫入資料庫；候選紀錄可先逐筆修改或移除。
  - mobile 不保存 raw prompt、raw model output 或模型 debug trace。
  - backend 尚未 ready 時不可送 parser，避免無效重試與額外成本。
  - 記錄頁手動新增 CTA 必須使用 dedicated handler；handler 只進入手動新增並更新 bounded status，不呼叫 AI / LLM / STT、不送 backend write request。

今日紀錄卡片列表：

- 首頁不顯示今日紀錄列表；今日/歷史資料瀏覽從漢堡選單進入歷史紀錄或其他資料頁。
- 有真實紀錄時不可在首頁顯示 timeline card，避免首頁偏離單一錄音入口。
- 無真實紀錄時也不可在首頁顯示空狀態、手動新增或文字記錄 CTA。
- Mobile navigation verifier 必須檢查 Today/Home JSX render block 不含 quick-entry rail、quick-entry press wrapper、TextInput、分析 CTA、手動新增 CTA、record entry CTA 或今日紀錄卡；Record 頁可保留 quick-entry。
- 若保留內部 Today 相關 handler 給非首頁路徑或既有返回流程使用，首頁 render block 仍不可呈現手動新增、文字記錄、紀錄詳情卡或查看分析 CTA；任何資料瀏覽或分析入口都必須從漢堡選單或對應內容頁進入。
- 今日紀錄摘要與無真實紀錄 fallback copy 必須透過 bounded display helper 產生；顯示筆數必須先 clamp，不可在 JSX 內直接組 `records.length` 或固定 no-data 文案。
- 紀錄卡片顯示時間、類型、摘要與 icon。
- 紀錄卡片的時間顯示必須使用 bounded date/time display helper；不可直接 render raw `occurred_at` 或未處理的 Date 字串。
- 由 `payload_json` 產生的紀錄摘要必須使用固定顯示長度上限，未知 payload 只顯示 bounded JSON preview，不把完整 backend payload 直接塞進 UI。
- record response 寫入 mobile state 前必須 bounded：id/profile_id/record_type/source/occurred_at/metadata/payload_json 欄位都有固定長度、key 數、陣列長度、巢狀深度或數值範圍上限。正式紀錄 metadata 可保存唯一 bounded `source_text` 作為歷史「原始紀錄」來源；`transcript`、`raw_text`、`raw_transcript`、raw prompt、raw model output 等 metadata 或 payload key 不保留在正式紀錄 state。

- 底部不顯示主按鈕；分析入口由漢堡選單提供。

互動：

- 點擊右上 menu 開啟功能選單。
- 按住大型麥克風開始本機錄音，放開即結束。
- 首頁錄音區平時不顯示精確剩餘分鐘；首頁也不顯示文字輸入或手動新增 fallback。

### 4.2 歷史紀錄頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「查詢過去的血糖、飲食與運動紀錄。」。
- 右上角：menu 按鈕。
- 紀錄同步狀態使用 labeled inline status，不使用 banner card 或額外白色 panel。
- 歷史紀錄同步狀態、月曆選取日期狀態與選取日期筆數顯示必須先經 bounded/clamped display value；點擊月曆日期或切換 AI 整理 / 原始紀錄不得因此額外查詢 backend。
- 歷史同步上限提示必須先轉成 bounded display text；不可在 JSX 內直接插入同步上限組句子。
- 紀錄同步 handler 必須 fail-closed：protected backend 尚未 ready 時不送 `/records` 查詢，只顯示目前已載入資料或空狀態。

月曆模式：

- 歷史紀錄從漢堡選單進入後，優先顯示當月月曆，而不是 range tab 或清單。
- History screen state 必須以月曆選取日期與 AI 整理 / 原始紀錄 mode 為主；不可保留舊的 `HistoryRange`、range tab、custom start/end date state、custom apply handler 或相關 display helper。
- 有紀錄的日期亮燈，使用淡綠底與綠色提示點；沒有紀錄的日期使用暗色 / 淡灰狀態。
- 點擊日期後只切換本機已載入紀錄的選取日期，不查詢 backend、不呼叫 AI、不寫入資料。
- 月曆日期格必須由 render 前 bounded display item 產生；date key 只可用於選取與查詢本機 map，不可在 JSX 中直接組 raw 日期文案。
- 日期格 Pressable 必須提供 bounded accessibility label、`accessibilityRole="button"` 與 selected accessibility state。
- 月曆下方顯示選取日期詳情，優先顯示「AI 整理」tab，也就是 AI / 手動流程整理後的結構化紀錄卡。
- 另提供「原始紀錄」tab 查看語音轉文字內容；AI preview save 必須保留 bounded `metadata_json.source_text`，後端 record sanitizer 也必須允許 bounded `source_text`，但仍移除 `transcript` / `raw_text` / `raw_transcript` / raw prompt / raw model output。Raw display item 只可讀取 `metadata_json?.source_text`，有值時必須先經 `boundDisplayText(..., maxDisplayDetailTextLength)`，若該筆紀錄沒有 bounded `source_text`，顯示「尚無原始逐字稿；此筆紀錄只保留結構化資料。」不可嘗試還原未保存的 raw transcript。
- 「AI 整理」與「原始紀錄」tab 必須使用 dedicated handler 與 selected accessibility state，不可在 JSX 中直接 set state。
- Mobile navigation verifier 必須抽取 History render block，確認月曆 grid 在選取日期詳情 panel 前，且 structured / AI 整理 render branch 在 raw transcript branch 前；點選日期時也必須 reset 到 structured mode。Verifier 也必須抽取 calendar day display helper，確認 `hasRecords` 由該日期 record count 產生、無紀錄日期走 muted style、有紀錄日期顯示 dot/has-records style、selected state 由 selected date key 決定，並守住「亮燈日期有紀錄」legend。Verifier 也必須抽取 raw display helper，守住 `source_text` type guard、bounded display、status label 與 fallback copy。
- 歷史資料邊界說明使用 inline 區塊，不使用白色卡片，避免在紀錄卡外再形成第二層 panel。

紀錄分日顯示：

- 有真實紀錄時，月曆亮燈日期可點擊並在下方顯示選取日期紀錄。
- 無真實紀錄時顯示空狀態，不顯示固定範例血糖、飲食或運動數值。
- 無真實紀錄說明顯示為「歷史資料狀態」inline block，不使用 banner card 或額外白色 panel。
- 達到 mobile 同步上限時顯示「歷史同步邊界」inline block，不使用 banner card 或額外白色 panel。
- 無資料空狀態提供「回今日記錄」與「手動新增」CTA。
- 歷史頁的回今日、手動新增與紀錄詳情卡 CTA 必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 AI / LLM / STT、不送 backend write request，且詳情返回目標固定為歷史頁。
- 歷史頁無真實紀錄 inline 狀態與 boundary checklist copy 必須透過 bounded display helper 產生；不可在 JSX 或 checklist array 內直接寫固定健康數值 no-data 文案。
- 歷史頁無真實紀錄與目前範圍無紀錄的空狀態標題/說明必須透過 bounded display helper 產生；不可在 JSX 中直接寫固定 no-data 文案。

互動：

- 點擊月曆日期切換選取日期。
- 有紀錄日期亮燈，沒紀錄日期暗色。
- 預設顯示 AI 整理後的結構化紀錄。
- 可切換到原始紀錄查看 bounded 語音轉文字內容或安全 fallback。
- 紀錄卡可點擊進入詳情。
- 從歷史頁真實紀錄進入詳情時，返回應回到歷史頁，不跳回今日頁。

### 4.3 基本分析頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「查看最近血糖趨勢與簡單摘要。」。
- 右上角：menu 按鈕。
- 紀錄同步狀態使用 labeled inline status，不使用 banner card 或額外白色 panel。
- 分析頁的紀錄同步狀態文字必須先經 bounded display helper 再 render。
- 詳細報告 handler 必須先檢查 protected backend readiness；未 ready 時只使用本機已載入紀錄摘要，不送 `/reports/basic` 查詢。

時間篩選 tab：

- 「本週」。
- 「本月」。
- 「自訂日期區間」。
- 預設選中：「本月」。
- Mobile navigation verifier 必須守住 Analysis range 初始 state 為 `month`，避免預設頁面漂移成週或自訂日期區間。
- 選中「自訂日期區間」時顯示開始日期與結束日期輸入；兩個輸入都必須使用 dedicated bounded handler，不可 inline setter。
- Mobile navigation verifier 必須守住開始日期與結束日期輸入只在 `analysisRange === "custom"` 時 render，避免本週 / 本月模式露出自訂日期欄位。

主要圖表卡：

- 標題：「血糖趨勢（目前選取範圍）」。
- 副文字：「單位：mg/dL」。
- 圖表區外層保持開放式 layout；只有實際 chart canvas 使用單層卡片/邊框，避免白色圖表卡再包一個白色或淡色 chart panel。
- Y 軸 0 到 250。
- 有真實血糖紀錄時才顯示 X 軸日期、綠色折線、白底綠框資料點與 tooltip。
- 沒有真實血糖紀錄時顯示空狀態，不顯示固定 mock 血糖值或假折線。
- 分析頁 no-data badge/copy 與 boundary checklist 的 no-real-record copy 必須透過 bounded display helper 產生；不可在 JSX 或 checklist array 內直接寫固定 no-data 文案。
- 分析頁的安全 intro、圖表空狀態、範圍摘要與詳細報告按鈕 loading label 必須透過 bounded display helper 產生；不可在 JSX 中直接組紀錄筆數或 busy label。
- 分析資料邊界說明使用 inline 區塊，不使用白色卡片；圖表與統計格保留單層卡片即可。
- 達到 mobile 同步上限時顯示「分析同步邊界」inline block，不使用 banner card 或額外白色 panel。

統計卡片六格：

- 最高血糖：有資料時顯示最高值，無資料顯示「尚無」。
- 最低血糖：有資料時顯示最低值，無資料顯示「尚無」。
- 平均血糖：有資料時顯示平均值，無資料顯示「尚無」。
- 血糖測量總次數：顯示目前已載入範圍內的真實血糖紀錄數，無資料顯示 `0`。
- 飯前血糖次數：顯示目前已載入範圍內飯前與空腹血糖紀錄數，無資料顯示 `0`。
- 飯後血糖次數：顯示目前已載入範圍內飯後血糖紀錄數，無資料顯示 `0`。
- 不使用固定範例數字，避免健康數值 mock 被誤認為使用者分析結果。

底部按鈕：

- 「查看詳細報告」。

互動：

- 切換本週 / 本月 / 自訂日期區間更新圖表與統計。
- 點擊圖表資料點顯示 tooltip。
- 點擊詳細報告進入更完整分析頁。
- 不提供診斷或治療建議。
- 沒有血糖資料時提供「手動新增」與「回今日記錄」CTA，不顯示固定 mock 健康數值，也不呼叫 AI。
- 分析頁的手動新增、回今日與查看詳細報告 CTA 必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 AI / LLM / STT、不送 backend write request，查看詳細報告仍必須沿用 protected backend readiness guard 與 `mobileReportQueryLimit`。
- 分析頁的手動新增、回今日與查看詳細報告 CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"` 與報告查詢 loading disabled state；label 不可暗示會寫入資料、呼叫 AI / LLM / STT，或無限制查詢 backend。
- 分析頁所有動態 count 與 glucose metric 顯示前必須 clamp 到 mobile display bounds；不可直接 render raw array length 或未 bounded numeric metric。
- 分析頁圖表標題的 range label 必須先轉成 bounded display text；不可在 JSX 內直接查找 range 設定後插入標題。
- 分析同步上限提示必須先轉成 bounded display text；不可在 JSX 內直接插入同步上限組句子。

詳細報告邊界：

- 詳細報告可優先使用 backend `/reports/basic`，但必須有查詢筆數上限。
- Backend `/reports/basic` 的 glucose summary 必須和 mobile 基本分析維持同一口徑：最高、最低、平均、血糖測量總次數、飯前血糖次數與飯後血糖次數都要可由 report contract 取得或 fallback 到同一套 mobile 計算。Backend date-window integration test 必須在 `start_at` / `end_at` 自訂區間內驗證完整六個 glucose summary 指標，確認 `end_at` 為 exclusive boundary，並確認 `fasting` 會計入飯前血糖次數。Mobile navigation verifier 必須同時 source-check backend report API/service/test：`start_at` inclusive、`end_at` exclusive、window validation before permission lookup、fasting/before_meal/after_meal timing helper，以及 date-window regression 的六項 glucose summary expected values。Mobile navigation verifier 也必須守住本機 `analysisRecords` 使用同一組 `analysisSelectedDateBounds` 過濾，且 `analysisGlucoseRecords` 必須由 `analysisRecords` 衍生，避免自訂日期只套用在 backend 報表或基本分析改回另一套資料來源。
- Mobile 目前使用 `mobileReportQueryLimit` 上限，避免一次載入過多資料。
- UI 顯示 report query limit 時必須使用 clamped display value；實際 `/reports/basic` query limit 維持固定上限，不使用未 bounded 的動態值。
- backend report response 寫入 mobile state 前必須 bounded：profile/generated time 字串有固定長度，count 與 glucose numeric metrics 必須 clamp 到合理非負範圍，NaN / Infinity 不可進入 UI state。
- Mobile navigation verifier 必須同時守住 Detailed Report 從 backend `before_meal_count` / `after_meal_count` 讀取飯前 / 飯後血糖次數，並在 detailed report metric rows 顯示這兩個指標。
- backend 報表載入失敗時，必須 fallback 到 mobile 已載入紀錄摘要。
- 詳細報告的 status、source label、source copy 必須先經 bounded display helper 再 render，避免未來接入 backend/config copy 時出現過長文字。
- 詳細報告 source label/copy 的 backend、本機摘要與無資料 fallback 必須由同一個 bounded display helper 產生；不可在 component body 內用多層 ternary 直接組 report source 文案。
- 詳細報告的未載入、backend unavailable、重複載入、載入中、成功與失敗 fallback status 必須透過 bounded display helper 產生；不可在 handler 內直接組 backend unavailable 或報表載入結果文字。
- 詳細報告的 generated time 顯示也必須先轉成 bounded display text；不可在 JSX 內直接呼叫 `new Date(...).toLocaleString()` 組出動態文案。
- 詳細報告查詢限制提示必須先轉成 bounded display text；不可在 JSX 內直接插入 report query limit 組句子。
- 詳細報告 hero count 與 metric grid 的 count/glucose values 必須使用 display-only clamped values；實際 report eligibility、fallback 與 CTA 邏輯不可依顯示字串判斷。
- 詳細報告不可呼叫 AI、不可產生診斷或治療建議。
- UI 需以 inline 說明顯示資料來源、AI 成本、資料上限與醫療建議邊界，不使用 banner card。
- 詳細報告的報告備註列必須在 render 前轉成 bounded checklist item；不可在 JSX 中直接寫固定資料來源或醫療建議邊界文案。
- 報告備註使用 inline boundary block，不使用白色卡片或額外 panel。
- 沒有可報告紀錄時提供「手動新增」與「回今日記錄」CTA，不顯示固定 mock 健康數值。
- 詳細報告頁的返回分析、手動新增與回今日 CTA 必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 AI / LLM / STT、不重新查詢 backend，也不送 backend write request。
- 詳細報告頁的返回分析、手動新增與回今日 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須說明只切換 App 內頁面，不重新查詢報告、不呼叫 AI / LLM / STT、不送 backend write request。

### 4.4 會員方案選擇頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「選擇適合你的方案，持續輕鬆記錄。」。
- 右上角：menu 按鈕。

提示：

- 試用付款說明顯示為「試用付款邊界」inline block，不使用 banner card 或額外白色 panel。
- 文字：「7天免費試用，正式付款串接前不會啟動試用或自動轉年費。」。

目前狀態：

- 付款 / 商店訂閱尚未串接時，此頁只顯示方案、額度與整合狀態。
- 「付款未串接」說明使用 inline 區塊，不使用 banner 卡片；此頁只讓方案、額度與功能比較使用可掃描卡片。
- 會員方案的 quota status 與試用整合狀態文字必須先經 bounded display helper 再 render，避免 future entitlement backend copy 過長。
- 會員方案的試用付款邊界、付款未串接說明、CTA 不建立訂閱/不收款警告與 quota sync button label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 payment / entitlement boundary copy 或 busy label。
- 會員方案、訂閱管理與會員狀態頁的方案名稱、訂閱狀態、試用天數與 plan/status 組合文案必須先轉成 bounded display text；不可在 JSX 內直接呼叫 `planDisplayName`、`subscriptionStatusLabel` 或直接組試用倒數文案。
- 會員方案的正式啟用前 checklist 必須在 render 前轉成 bounded display item；不可在 JSX 內直接 map raw checklist 文案。
- 會員方案、會員狀態與訂閱管理的 CTA / sync action status 不可在 JSX handler 內即時呼叫 `boundUiMessage` 組字；應使用 render 前 derived 的 bounded status message。
- 會員方案、會員狀態與訂閱管理的主要 CTA / sync Pressable 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 需說明只顯示狀態或導覽，不可暗示已建立試用、付款或 entitlement。
- CTA 不可建立訂閱、不可收款、不可改變 entitlement。
- 正式啟用前需完成 App Store / Play Store 或正式付款後台、receipt validation、訂閱 webhook、trial start/end、取消/續訂與優惠價保留規則。

方案卡：

- 試用版：葉子 icon，`NT$0 / 7 天`，每日錄音上限 5 分鐘。
- 年費會員：綠色邊框、淡綠背景、星星 icon、推薦標籤，`NT$1,490 / 年`，每日錄音上限 10 分鐘，持續訂閱保有優惠價。

功能比較卡：

- 功能比較區使用 open section；不使用淡綠大 panel 包住比較 rows。
- 每個功能比較 row 自己是單層白色 row，可 wrap，避免比較表在小螢幕被外層 panel 壓窄。

| 功能 | 試用版 | 年費會員 |
|---|---|---|
| 語音記錄 | 每日 5 分鐘 | 勾選 |
| AI 整理 | 每日 5 次 | 勾選 |
| 基本分析 | 部分功能 | 勾選 |
| 歷史紀錄 | 最近 7 天 | 勾選 |

主按鈕：

- MVP 預覽狀態：「查看試用整合狀態」。
- 點擊後顯示「試用整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 正式付款串接完成後才可改為「開始 7 天試用」。

底部文字按鈕：

- 「已訂閱？管理方案」。
- 點擊後進入「訂閱管理」頁，不在方案頁直接開啟付款或改變 entitlement。
- 會員方案頁的同步、試用整合狀態、管理方案與會員狀態 CTA 必須使用 dedicated handler；handler 只更新 bounded status 或 App 內導覽，不開啟付款、不建立訂閱、不改 entitlement、不呼叫 AI / LLM。
- 以上 CTA 的 accessibility label 必須由 subscription display labels 產生，不可在 JSX 內直接串 raw plan/status/payment copy。

### 4.4.1 訂閱管理頁

功能：

- 顯示目前會員狀態、付款來源、receipt validation、優惠資格、取消 / 到期與 entitlement 同步邊界。
- 與會員方案選擇頁分離：方案頁偏 paywall / 試用說明，訂閱管理頁偏已訂閱使用者的管理狀態。
- 目前只做 UI 預覽；不開啟付款、不建立試用、不改變會員權益、不寫入 entitlement。

頁面內容：

- 標題：「訂閱管理」。
- 會員狀態卡：
  - 目前方案：試用版 / 年費會員 / 尚未同步。
  - 會員狀態：試用中 / 有效 / 尚未同步。
  - 試用剩餘天數：有資料時顯示。
  - 同步狀態：使用 backend quota / entitlement 狀態。
- 管理項目：
  - 付款來源：未串接。
  - Receipt validation：必做。
  - 優惠資格：保留欄位。
  - 取消 / 到期：待串接。
- 正式啟用前需要完成：
  - App Store / Play Store 或正式會員後台深連結。
  - receipt validation、訂閱 webhook、idempotent entitlement update。
  - trial start/end、grace period、退款與取消狀態回寫 backend。
  - voice quota、AI 額度與歷史存取權限只依 server-side entitlement 判斷。
- 目前不做的事：
  - 不開啟付款。
  - 不建立試用。
  - 不改變會員權益。
  - 不寫入 entitlement。
  - 不呼叫 AI 或 LLM。
- 「正式啟用前需要完成」與「目前不做的事」都使用 inline 區塊，不使用 warning card，避免訂閱管理頁在狀態卡與管理項目下方再疊一層 panel。
- 訂閱管理頁的 header intro、目前不做的事 copy 與同步狀態按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 payment / entitlement boundary copy 或 busy label。
- 會員方案、訂閱管理與會員狀態頁的 section labels、readiness/status/no-action labels、整合狀態按鈕 label 與返回/管理方案 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 subscription preview labels。
- 訂閱管理的付款整合狀態文字必須先經 bounded display helper 再 render。
- 訂閱管理的管理項目 tuple 與正式啟用前 checklist 必須在 render 前轉成 bounded display item；不可在 JSX 內直接解構 raw tuple 或 map raw checklist 文案。

底部按鈕：

- 「返回設定」。
- 「查看付款整合狀態」。
- 「同步狀態」只在 account-level protected auth ready 時讀取 backend quota / entitlement。
- 若 account id、access token / dev auth 或 token size 不符合 protected account request 邊界，只更新 inline status，不送 quota / entitlement request。
- Voice quota sync 的 initial、unavailable、success 與 failure UI status 必須透過 bounded display helper 產生；不得在 state 初始化、session reset、quota handler 或同步按鈕 handler 內直接組 backend unavailable 或同步結果文字。
- 點擊「查看付款整合狀態」或「同步狀態」後顯示「付款整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 訂閱管理頁的同步、返回設定與付款整合狀態 CTA 必須使用 dedicated handler；handler 只更新 bounded status 或 App 內導覽，不開啟付款、不建立試用、不改 entitlement、不呼叫 AI / LLM。
- 訂閱管理與會員狀態頁的返回、付款整合、續訂整合與管理方案 CTA 也必須綁定 bounded accessibility label 與 button role。

### 4.5 功能選單頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「快速前往你需要的功能。」。
- 右上角：關閉 X 按鈕。
- 功能以 2 欄 grid 顯示，每個功能為白色大卡片。
- 每張功能卡中間放大型 icon，icon 與文字都置中。
- 不顯示 `MVP`、`預留` 或其他 stage badge。
- 功能選單頁本身不使用外層白色 panel，避免卡片被包在另一個卡片內。
- Menu grid 下方不再加大面積白色容器；「查看更多功能」維持置中 icon + 文字 pill。
- Dev reset 只在開發模式顯示，外層使用 inline warning 區塊與上分隔線，不使用另一張警示卡片，避免功能選單底部出現 nested panel。
- Visual smoke route jump 只可在 `EXPO_PUBLIC_ALLOW_DEV_AUTH=true` 且 `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS=true` 的本機開發環境顯示；用途是穩定進入 MVP、account-critical 與 future preview routes 做截圖，不可呼叫 backend、寫入資料、觸發 AI / LLM / Vision / payment，也不可在 production / staging 顯示。
- Production auth token persistence must use native secure storage only. Mobile may load bounded access / refresh token state through `SecureStore` / Keychain / Keystore, must fail closed when unavailable, and must not fallback to AsyncStorage, ordinary file storage, logs, alerts, or visual-smoke manifests.
- `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` 只可在本機 dev auth 與 debug tools 同時開啟時生效；支援 route 至少包含所有 `AppScreen`：Today、Record、Transcript Review、AI Review、AI candidate edit/remove confirm、AI Save Confirm / Failure、Save Success、Manual Record / Confirm、History、Record Detail、Edit Record、Delete Confirm / Success、Update Success、Analysis、Detailed Report、Subscription、Settings、Tutorial、Menu、account settings，以及 future / doctor / health / community / ranking / commerce / food photo preview routes。其他環境或未知 route 必須忽略並回到一般 Today 首頁。
- Visual-smoke initial route 啟動時必須跳過 backend boot / dev-login / model refresh，避免 local demo state 被 backend unavailable cleanup 清掉，也避免截圖流程產生 API、token、AI、STT、Vision、payment 或 database side effect。
- Visual-smoke route jump chip JSX `onPress` 必須呼叫 route press wrapper，不直接呼叫底層 route jump handler；route jump handler 仍必須保留 dev-auth/debug-tools 雙 gate。
- `npm run verify:ui-spec-coverage` 必須同時檢查 canonical 4.x sections 與全部 41 個 `AppScreen` route：每個 AppScreen 都要有 `screenChrome`、render branch、visual-smoke route jump 與 static harness route，避免 mobile 回退成單頁 placeholder 或只有部分分頁有 evidence。
- `npm run verify:visual-smoke-routes` 必須檢查上述 visual-smoke route 的 render branch、可見 route identity marker、關鍵 UI marker、必要 return CTA、dev-only gate、initial route selector，以及 route jump handler 不含 backend / AI / payment / write side effect。這是 source-level safety evidence，不取代真機/模擬器截圖的視覺檢查。
- Production-like mobile APK / AAB build 前必須跑 release env verifier；`EXPO_PUBLIC_ALLOW_DEV_AUTH`、`EXPO_PUBLIC_ENABLE_DEBUG_TOOLS` 與 `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` 必須為 false/空值，正式 API URL 必須使用 HTTPS 且不可指向 localhost、emulator、LAN 或 private network。內部 release APK smoke test 若需要 local backend，只能用明確 `--allow-local-api` 例外，但仍不可開 dev auth 或 debug tools。
- Production-like Android APK / AAB 不可使用 debug keystore 簽名；正式發佈前必須跑 `npm run verify:android-release-signing`。內部 install smoke APK 若暫時沿用 debug signing，只能用明確 `--allow-debug-signing` 例外，且不可把該 APK 當 production distribution。
- Android APK / AAB 前置檢查必須保留 `npm run preflight:android-apk:production` 與 `npm run preflight:android-apk:internal`：production preflight 不可允許 local API 或 debug signing；internal preflight 只可用於本機安裝 smoke，且仍必須跑 release env、signing 與 SDK/Gradle prereq 檢查。`npm run quality` 必須包含 APK script verifier，避免 preflight guard 被移除。
- `npm run visual-smoke:harness` 是 Android runtime 截圖被本機 native/dev-client 問題阻擋時的非 production fallback，只能產生 seeded demo PNG 與 manifest 供人工檢查 MVP/account-critical 與 future / commerce / food photo preview route 的版面；不可接 Expo runtime、backend、database、AI / LLM / Vision / STT、payment 或 production credentials，也不可把 harness evidence 誤記為真機/模擬器截圖。
- `npm run verify:visual-smoke-harness` 必須納入 `npm run quality`，檢查 fallback harness route list、route title / CTA alignment、每個 route 的固定內容 section count 與非空 section heading/copy、static renderer marker、PHI-safe manifest flags，以及不得 import 或執行 subprocess / network / payment / OpenAI 類呼叫。這是 fallback evidence path 的 source-level contract，不取代 native visual smoke。Harness route list 需涵蓋全部 `AppScreen`，包含 Today、Record、History、Analysis、Detailed Report、Settings、Tutorial、Menu、Subscription、Transcript Review、AI Review、AI candidate edit/remove confirm、AI Save Confirm / Failure、Save Success、Delete/Update result pages、Record Detail、Edit Record、Delete Confirm、Manual Record / Confirm、Subscription Management、Membership Status、account settings，以及 future / doctor / health / community / ranking / commerce / food photo preview routes。
- `npm run visual-smoke:harness:verify-artifact -- --output-dir <evidence-dir>` 用於檢查實際產出的 harness manifest / PNG evidence：需確認 41 個 route、canonical manifest titles / CTAs / section counts / section headings、390x844 PNG、非空白圖像、manifest checks 與 PHI-safe safety flags。這是本機 evidence verifier，不應放進 CI quality，因為它依賴 `/tmp` evidence 目錄。
- `npm run visual-smoke:android-prereqs` 用於 native screenshot 前的本機 SDK / AVD readiness 檢查；它只讀取 SDK tools、system image、AVD config，確認是否有非 16 KB screenshot target，不可清除 app data、啟動 Expo、呼叫 backend、寫資料或觸發 AI / LLM / Vision / STT / payment。

功能項目：

- 今日紀錄：calendar icon。
- 歷史紀錄：文件加時鐘 icon。
- 基本分析：長條圖 icon。
- 會員方案：人物加星星 icon。
- 成就榜：獎盃 icon。
- 年度回顧：循環 calendar icon。
- 商城：購物袋 icon。
- 設定：齒輪 icon。

底部小按鈕：

- 「查看更多功能」。
- 左側小型置中 `＋` icon。
- 按鈕本身置中，不放在另一張白色或警示 panel 內。

Dev-only 測試按鈕：

- 只在本機 dev auth 開啟時顯示。
- 文字：「(dev) 重置所有資料」。
- 用途：方便測試時呼叫 backend `/dev/reset-data` 清空本機開發資料。
- 外層使用 inline warning copy，不使用卡片容器；正式版必須刪除這個入口。
- 必須標示 `DEV ONLY`，並註明正式版必須刪除這個入口。
- 不可在 production / staging 顯示。

Dev-only visual smoke route jump：

- 只在本機 dev auth 與 debug tools 同時開啟時顯示。
- 入口標示 `DEV ONLY` 與 `Visual smoke routes`。
- 只做本機 route navigation，方便截圖檢查 MVP/account-critical pages 與 Future Modules、Future Module Detail、成就榜、年度回顧、商城、購物車、食物拍照等 preview pages。
- 不可呼叫 backend、不寫資料、不觸發 AI / LLM / Vision / payment。
- 若需要 deterministic startup 截圖，可用 `EXPO_PUBLIC_VISUAL_SMOKE_INITIAL_ROUTE` 直接開啟指定 preview route；此變數不得在 production / staging 生效。

互動：

- 點擊任一卡片進入對應頁面。
- 點擊 X 關閉選單回上一頁。
- Menu 可從任一主要分頁開啟；關閉時應回到開啟選單前的頁面，不固定回今日頁。
- Menu X 與 menu grid destination 必須走 dedicated handler；不可在 JSX 中直接呼叫 `setCurrentScreen(menuReturnScreen)` 或在卡片 Pressable 內寫多分支 route transition。
- 從 Menu 進入會員方案時，會員方案返回 Menu；從設定頁的訂閱管理進入時，訂閱管理頁返回設定頁。
- 點擊 dev reset 後，mobile 必須清除本機已載入帳號、照護對象、模型清單、語音額度、紀錄、報表與候選狀態，並提示使用者重新連線。
- Dev reset response 寫入或使用前必須 bounded：status 字串、deleted_counts key 數、key 長度與 count 數值都必須有固定上限；UI 只顯示必要摘要，不保留完整 raw map。
- Dev reset request 若失敗或結果不確定，也必須保守清除本機狀態並要求重新連線確認 backend 資料，避免保留可能已過期的測試資料。
- Dev reset failure 類 UI status 必須透過 bounded display helper 一次產生 dev reset 狀態與主狀態；不可在 catch block 內分別用 raw error message 即時組多個 UI status。
- Dev reset disabled、busy、progress、success 與 failure 類 UI status 必須透過 bounded display helper 產生；success 顯示的 deleted records count 必須先 clamp。

### 4.6 設定頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「管理帳號、提醒與使用偏好。」。
- 右上角：menu 按鈕。

帳號卡：

- 左側大頭貼 icon。
- 姓名：「王小華」。
- 登入方式：「手機登入・09xx xxx xxx」。
- 點擊帳號卡進入帳號與登入安全頁。

設定列表：

- 設定列表使用 open stack；不使用一個白色大 panel 包住所有 rows。
- 每個設定入口 row 自己是單層可點擊卡片，可 wrap，避免整頁縮排變窄。
- 登入狀態，鑰匙 icon，右箭頭。
- 個人資料，人物 icon，右箭頭。
- 提醒設定，鈴鐺 icon，右箭頭。
- 錄音額度，麥克風 icon，右箭頭，下方提示：「今日錄音剩餘 7 分鐘」。
- 通知與隱私，盾牌 icon，右箭頭。
- 使用教學，書本 icon，右箭頭。
- 訂閱管理，信用卡 icon，右箭頭。

底部帳號狀態按鈕：

- 白底綠框。
- MVP / dev auth 預覽狀態文字：「清除本機狀態」。
- 點擊後只清除本機帳號、照護對象、模型清單、語音額度、紀錄、報表與候選狀態，不代表 production logout。
- 點擊後顯示「本機狀態結果」inline status，不使用 banner card 或額外白色 panel。
- 清除本機狀態必須透過 bounded display helper 一次產生主狀態與 auth/action 狀態；不可在 Pressable handler 內直接組清除結果文字。
- 正式登入完成後才可改為「登出」，並需執行 refresh token revoke、session list 更新與安全儲存清除。

進階設定：

- Backend URL、模型選擇、Dev Client、本機 Whisper / Llama 工具預設必須收合。
- 模型選項 chip label 必須透過 bounded display helper 產生；backend model label 與「未啟用」狀態不可在 JSX 內直接拼接。
- 模型選擇邊界說明必須透過 bounded display helper 產生；不可在 JSX 內直接寫 fallback / disabled model copy。
- Backend URL input 必須有長度上限，寫入 mobile state 前先截斷，避免過長 URL 進入 request base URL 或長期留在 state。
- Backend URL 變更、dev-login disabled、重新連線中、重新連線成功與重新連線失敗狀態文字必須透過 bounded display helper 產生；Backend URL 變更與失敗清理必須同時更新主狀態與 auth/action 狀態。
- 一般使用者不應在預設設定頁直接看到成本、模型或環境設定。
- 進階設定入口使用 inline 區塊，不使用提示卡或白色 panel；只有展開後的實際開發設定表單可使用單層容器。
- Debug / Dev Client 工具只能在 debug build 或明確啟用 `EXPO_PUBLIC_ENABLE_DEBUG_TOOLS` 時顯示。
- 設定、帳號安全、個人資料、錄音額度、提醒、隱私與 Dev Client 的所有 action/status 文字必須先經 bounded display helper 再 render。
- 設定與帳號安全頁的 local clear、provider challenge、session refresh/load/logout、session preview status、profile edit preview、quota sync、notification preview 與 privacy preview 必須走 dedicated handler；不可在 JSX Pressable 內直接 set action status、直接清除本機 session 或直接啟動 auth/quota async call。
- 設定進階區的展開/收合、backend reconnect、照護對象切換、STT/LLM model selection、native download kind、native module check、model download、Whisper/Llama/benchmark actions 必須走 dedicated handler；不可在 JSX Pressable 內直接 set profile/model/download state 或直接啟動 backend/native async call。照護對象與模型 chip、native download kind chip 的 JSX `onPress` 必須呼叫 option press wrapper，不直接呼叫底層 profile/model/download state boundary handler，也不可直接把 `profile.sourceId` 或 `model.id` 傳入底層 option handler。
- 設定頁的清除本機狀態、進階設定展開/收合與 backend reconnect CTA 必須有 render 前 bounded accessibility label、`accessibilityRole="button"`，並在展開或 reconnect disabled 狀態提供 accessibility state；label 必須說明是否只清本機狀態、只展開 UI、或會清除 stale session/model/record state，不可暗示刪除 backend 紀錄或啟動模型。
- Dev reset action 必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `resetDevelopmentData`。
- 模型下載、native module 檢查、benchmark 與本機 parser 測試不可自動執行；都必須由使用者主動點擊。
- Debug / native local model 工具的 UI 錯誤必須使用安全錯誤摘要，不直接顯示 raw native error、完整本機檔案路徑、下載 URI 或底層 stack trace。
- Debug / native local model 工具與 parser / backend recovery 的動態 UI status 必須使用固定長度上限，避免 raw backend/native message 或過長錯誤摘要保留在 mobile state。
- Debug / native local model 的預設狀態、downloaded model list 讀取失敗、模型下載 disabled/progress/success/failure status 必須透過 bounded display helper 產生；不可在 handler 內直接組下載或本機模型狀態文字。
- Debug / native local model 的 native module check、Whisper 與 Llama status 必須透過 bounded display helper 產生；Llama output summary 顯示長度必須先 clamp，不可保留或顯示完整 raw model output。
- Debug / native local model benchmark progress、missing-input 與 result status 必須透過 bounded display helper 產生；benchmark result 顯示筆數、task label、duration 與 output chars 必須先 bounded/clamped。
- Debug / native local model 工具不可在 UI state 保留或顯示完整 raw model output；本機 Llama 測試只顯示長度與完成狀態摘要。
- Debug / native local model 工具的下載 URL、本機模型路徑與音檔路徑 input 必須有長度上限，避免過長路徑或 URL 長期留在 mobile state。
- App boot 必須掃描本機 downloaded model directory；若存在 Whisper 模型且尚未選定 model path，可自動選用第一個 bounded URI，讓錄音轉文字不依賴 debug advanced panel。
- Debug / native local model downloaded model list 只能顯示 bounded 短摘要：kind、短檔名與可選 checksum 前綴；不可直接渲染完整下載 URI 或本機檔案路徑。
- backend 模型清單同步後，預設 STT / LLM selection 必須優先選 available model；不可把 unavailable model 當成預設 parser model。
- backend 模型清單、profile list 與 downloaded model list 寫入 mobile state 前必須有固定筆數上限；UI 不保留無上限清單。
- backend 模型 id/label/description、profile id/display name/relationship、account id/email/display name 與 downloaded model file name/uri/md5 寫入 mobile state 前也必須有固定欄位長度上限。
- 帳號 display name、email/login label、active profile display name 與 relationship 在渲染前也必須使用 bounded display value；不可直接 render backend identity copy。
- 設定頁帳號卡的「目前對象」整句文案必須先轉成 bounded display text；不可在 JSX 內把 label 與 active profile 值直接組合。
- 設定頁帳號卡進入帳號安全、以及帳號安全 / 個人資料 / 錄音額度 / 提醒設定 / 隱私子頁返回設定，都必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 AI / LLM、不寫入健康紀錄或 backend。
- 設定列表 row 導覽必須走 dedicated row handler；不可在 fallback 中直接用 raw `row.target` 呼叫 `setCurrentScreen(row.target)`，且從設定進入教學或會員方案時必須保留設定作為 return source。Settings row JSX `onPress` 必須呼叫 row press wrapper，不直接呼叫底層 settings row destination handler。
- 設定頁帳號卡與設定列表 row 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 不可在 JSX 內直接串 raw account/profile/backend copy。
- Backend URL 變更或清除本機狀態時，必須清除舊 backend 的模型清單並重置 parser model id，避免跨環境沿用 stale model selection。
- Backend URL 變更或清除本機狀態時，也必須清除 native debug input/state：下載 URL、本機模型路徑、音檔路徑、downloaded model list、進度與 Llama debug output，避免本機路徑殘留。
- 重新連線流程若在 dev login、quota、model list、profile 載入任一階段失敗，必須清除未完成的 account / quota / model / record state，避免保留半套 protected session。
- 處理中必須暫停切換照護對象與模型，避免 parser、同步或儲存使用到不一致設定。

### 4.6.1 帳號與登入安全頁

功能：

- 顯示目前帳號連線狀態、照護對象狀態、dev auth 是否啟用，以及保護 API 是否可操作。
- 把本機 dev auth 與正式 production auth 邊界分清楚。
- 在正式 auth 未完成前，避免讓使用者誤以為已完成正式登入或正式登出。

頁面內容：

- 標題：「帳號與登入安全」。
- 帳號卡：
  - 顯示 display name 或尚未連線帳號。
  - 顯示 email 或尚未取得登入識別。
  - 顯示目前 auth mode：`Dev Auth` 或 `Production Auth Required`。
  - display name、email 與登入方式 fallback copy 必須透過 bounded display helper 產生；不可在 render-time 直接串接 account/provider 字串。
- 狀態摘要：
  - 帳號：已載入 / 未連線。
  - 照護對象：已選擇 / 未選擇。
  - dev auth：允許 / 停用。
  - API header：`Bearer token` / `Dev X-Account-Id` / 未可用。
  - Token storage：未保存 / 記憶體暫存。
  - Token guard：通過 / 過長拒用。
  - Secure token storage：SecureStore 已載入 / 不可用 fail closed / 未保存。
  - Session list：未載入 / 已載入 bounded session metadata 筆數。
  - 保護 API：可操作 / 需登入。
  - 所有 label/value 在 render 前必須轉成 bounded status metric display item，不可直接 render raw auth/header/token/profile 狀態字串。
- 正式登入方式預覽：
  - Apple 登入：狀態 `系統登入`，只顯示入口位置。
  - Google 登入：狀態 `OAuth/OIDC`，只顯示入口位置。
  - Email 登入：狀態 `密碼或 magic link`，只顯示入口位置。
  - 點擊任一 provider 只建立 bounded nonce/state challenge 並等待原生 provider SDK callback；不假造登入、不開啟未完成 provider SDK、不建立假 session、不保存假 token、不呼叫 AI。
  - nonce/state challenge 必須由 crypto-secure random 產生，若安全亂數不可用則 fail closed；pending challenge 只可存在 `useRef` 類型的記憶體邊界，不可寫入 React state、AsyncStorage、普通檔案、log、alert 或 visual-smoke artifact。
  - 原生 provider callback 若取得 ID token，mobile 必須先驗證 bounded state 與 challenge TTL，再連同 bounded nonce 透過 bounded in-memory helper 呼叫 `/auth/oidc-login`，成功後只用 SecureStore 保存 backend-issued access / refresh token；ID token、state 與 nonce 不可寫入 React state、AsyncStorage、普通檔案、log、alert 或 visual-smoke artifact。
- 正式登入方式預覽、Session 管理預覽、正式 auth readiness 與「目前不做的事」boundary copy 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 provider/session/token fallback 文案。
- 裝置與 Session 管理預覽：
  - Provider login / token issuance 尚未完成前，頁面可操作的是「已取得 token 後」的 session 維護邊界。
  - 刷新 session：呼叫 `/auth/refresh`，refresh token rotation 成功後只透過 SecureStore 寫入 rotated access / refresh token；若 SecureStore 寫入失敗，mobile 必須 fail closed 並清除本機 token。
  - 載入 sessions：呼叫 `/auth/sessions?limit=20`，只顯示 bounded session metadata，例如建立時間、到期時間、最後使用時間與是否有 device fingerprint；不可顯示 raw refresh token、token hash、raw device fingerprint、raw claims 或完整 token。
  - 登出本機：呼叫 `/auth/logout` revoke refresh session 並嘗試 revoke Bearer access token，成功或失敗後都需保守清除本機 token。
  - 登出全部：呼叫 `/auth/logout-all`，完成後清除本機 token 與 session metadata。
  - 這些 session 操作不可呼叫 AI / LLM / STT / Vision，不可寫入 health record，不可記錄 request body、raw token 或 raw claims。
- 正式 auth readiness：
  - Provider：狀態 `待接原生 SDK`，Apple / Google / Email 原生登入 SDK 尚未接入；mobile 已有 nonce/state challenge 建立與 callback state 驗證邊界。
  - Backend verify：後端已有 HS256 / JWKS Bearer JWT 驗證與 `/auth/oidc-login` exchange；mobile 已有 provider ID token + nonce/state 驗證 -> backend exchange -> SecureStore 寫入 helper。
  - Secure storage：mobile 已有 SecureStore token storage boundary；access token 只短暫用於 request header，refresh token 只走 SecureStore / Keychain / Keystore。
  - Session revoke：mobile 已接 `/auth/logout`、`/auth/logout-all` 與 `/auth/sessions` 的操作邊界，但正式 provider SDK 與 device/session 命名仍待完成。
  - Audit：狀態 `待串接`，正式 auth 事件需 PHI-safe audit，不記錄 raw token、健康內容或 request body。
  - 此區塊不呼叫 provider、不建立新 session、不呼叫 AI；只有使用者主動按 session 操作按鈕時才呼叫對應 auth endpoint。
- 正式登入 provider、session 管理與 readiness tuple 在 render 前必須轉成 bounded display item；provider/title/status/copy/icon 不可直接 render raw config 或 backend copy。
- 正式登入 provider、session 管理 preview row 與 session 操作 CTA 的 accessibility label 必須由 bounded display helper 產生，且只能描述安全邊界，不可輸出 token、claims、raw device fingerprint 或 request body。
- 正式 auth 必備邊界：
  - Apple / Google / Email 登入需由正式 auth provider 控制。
  - access token 只能短效，refresh token 需要 rotation 與 revoke。
  - mobile protected request header helper 必須優先使用 `Authorization: Bearer <access_token>`；只有本機 dev auth 開啟且沒有 access token 時才 fallback 到 `X-Account-Id`。
  - `npm run verify:secure-auth-storage` 必須檢查 protected request header helper：過長 token 不可產生 Authorization header、Bearer token 必須優先於 dev `X-Account-Id` fallback，dev account id 必須先 bounded 且不可為空，且 App 不可在 request callsite 直接 inline `Authorization` 或 `X-Account-Id` headers。
  - mobile token persistence 只可走 SecureStore / Keychain / Keystore；不可 fallback 到 AsyncStorage、ordinary file storage、logs、alerts 或 visual-smoke manifest。
  - 空白或超過 4096 字元的 access token 不會組成 Authorization header。
  - mobile token 必須放 Keychain / Keystore，不放一般 storage。
  - 所有受保護 API 都要由後端驗證帳號、profile 與權限 scope。
- 目前不做的事：
  - 不建立 session。
  - 不呼叫登入 provider。
  - 不保存 token。
  - 不呼叫 AI。
  - 不輸出 PHI。
- 「正式 auth 必備邊界」與「目前不做的事」使用 inline 區塊，不使用 warning card；此頁只讓帳號卡、狀態摘要與 provider/session row 使用卡片。
- 設定與帳號安全相關頁面的 section labels、readiness/status/no-action labels、返回設定 label、本機狀態結果 label 與本機清除 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 settings/auth preview labels。

底部按鈕：

- 「返回設定」。
- 「清除本機狀態」。

互動：

- 清除本機狀態只清除 mobile 目前載入的帳號、照護對象、模型清單、語音額度、紀錄、報表與候選狀態，不代表正式 production logout。
- 點擊「清除本機狀態」後顯示「本機狀態結果」inline status，不使用 banner card 或額外白色 panel。
- 正式登出必須等待 refresh token revoke、session list 更新與安全儲存清除完成後才能啟用。

### 4.6.2 個人資料頁

功能：

- 顯示目前已同步的帳號與照護對象資料。
- 目前只做 read-only 預覽，不在本機假造姓名、生日、聯絡方式或登入方式。
- 避免 dev account 被使用者誤認為正式個資。

頁面內容：

- 標題：「個人資料」。
- 帳號卡：
  - 顯示 display name 或尚未連線帳號。
  - 顯示 email 或登入識別尚未載入。
  - 顯示登入模式：`Dev Auth` 或 `Production Auth Required`。
  - display name、email 與登入方式 fallback copy 必須共用帳號 bounded display helper，避免 production auth provider copy 過長。
- 狀態摘要：
  - 帳號資料：已同步 / 未連線。
  - 照護對象：目前 active profile display name 或未選擇。
  - relationship：目前 active profile relationship 或未載入。
  - active profile display name、未選擇/未建立 fallback、relationship fallback 與「目前對象」inline copy 必須透過 bounded display helper 產生；不可在 component render 區直接組 profile fallback 字串。
  - 本機編輯：停用。
- 正式編輯前需要完成：
  - production auth / OIDC 或 JWT 邊界。
  - profile update API、欄位驗證、錯誤狀態與 optimistic update rollback。
  - 帳號與照護對象權限檢查。
  - 敏感欄位最小化策略；目前不收集生日、身分證或醫療診斷資料。
- 目前不做的事：
  - 不寫入個人資料。
  - 不建立本機草稿。
  - 不呼叫 profile update API。
  - 不呼叫 AI。
  - 不保存測試姓名或聯絡方式。
- 帳號與照護對象 display name、email、relationship 進入 UI/state 前必須做固定長度上限，避免 backend profile label 過長造成版面與 state retention 問題。
- 個人資料頁與設定頁的身份欄位必須使用 bounded display value；relationship、email 與 login label 不可直接 render raw account/profile 欄位。
- 進階設定中的照護對象切換 chip 必須使用 render 前的 bounded display item；互動仍使用原始 profile id，不可用截斷後的 display id 改變選取行為。
- 個人資料頁狀態摘要的 label/value 也必須轉成 bounded status metric display item；active profile label 與 relationship 不可直接塞進狀態卡。
- 「正式編輯前需要完成」與「目前不做的事」使用 inline 區塊，不使用 warning card；此頁只讓帳號卡與狀態摘要使用卡片。
- 個人資料頁「目前不做的事」copy 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 profile update / 本機草稿 fallback 文案。
- 個人資料、錄音額度、提醒設定與通知隱私頁的 readiness/status/action labels 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 settings preview labels。

底部按鈕：

- 「返回設定」。
- 「查看編輯整合狀態」。

互動：

- 查看編輯整合狀態只顯示本機狀態文字，不寫入資料、不呼叫 API、不呼叫 AI。
- 點擊「查看編輯整合狀態」後顯示「編輯整合狀態」inline status，不使用 banner card 或額外白色 panel。

### 4.6.3 錄音額度頁

功能：

- 顯示今日語音用量、剩餘時間、方案狀態與低干擾提醒規則。
- 目前只做 quota 狀態預覽；不呼叫 parser、不呼叫 AI、不上傳音檔、不保存逐字稿。
- 額度資料只能來自 backend entitlement / quota API，mobile 不自行信任本機計數。
- 「額度控制」與「資料與成本邊界」說明使用 inline 區塊，不使用 banner 或 warning card；此頁只讓 quota bar 與狀態摘要使用卡片。

頁面內容：

- 標題：「錄音額度」。
- Inline 說明：「額度控制」。
- 今日語音使用狀態：
  - 已用：backend quota 已同步時顯示已用分鐘。
  - 剩餘：backend quota 已同步時顯示剩餘分鐘。
  - 每日上限：試用版 5 分鐘、付費版 10 分鐘，由 entitlement 決定。
  - 進度條：以 `used_seconds_today / daily_limit_seconds` 顯示。
- 狀態摘要：
  - 目前方案：試用版 / 年費會員 / 尚未載入。
  - 會員狀態：試用中 / 有效 / 尚未同步。
  - 提醒規則：低干擾；剩餘 2 分鐘內才提醒。
  - AI 成本：0 次呼叫。
  - 方案、會員狀態、試用剩餘天數、已用/剩餘分鐘、設定列錄音額度與 boundary row fallback copy 必須透過 quota bounded display helper 產生；不可在 component render 區直接組 entitlement/quota fallback 字串。
- 正式啟用前需要完成：
  - quota API 必須由 production auth 驗證 account / profile。
  - 錄音開始前先檢查剩餘額度。
  - parser 成功或失敗都要有一致的 usage commit / rollback 規則。
  - 價格、優惠資格、試用與付費上限由 entitlement 決定。
- 資料與成本邊界：
  - 不呼叫 parser。
  - 不呼叫 AI。
  - 不上傳音檔。
  - 不保存逐字稿。
  - 只有使用者手動同步時才讀取 backend quota 狀態。
- 資料與成本邊界 copy 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 parser/audio/quota fallback 文案。
- 錄音額度頁的 intro、額度控制說明與同步額度按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 quota / entitlement boundary copy 或 busy label。

底部按鈕：

- 「返回設定」。
- 「同步額度」。

互動：

- 同步額度只有在 account-level protected auth ready 時呼叫 backend quota API；未登入、token 過長或正式登入/dev auth 都不可用時只顯示本機狀態文字。
- `loadVoiceQuota` handler 本身也必須 fail-closed：若 account id 或 protected auth 不可用，即使被間接呼叫也只更新安全狀態文字，不送 `/subscriptions/voice-quota`。
- `loadVoiceQuota` unavailable、success 與 failure 狀態文字必須透過 bounded display helper 產生；同步按鈕在 protected account backend 未 ready 時也必須使用同一類 helper。
- voice quota response 寫入 mobile state 前必須 bounded：plan/status/referral/date 字串有固定長度，秒數必須 clamp 到非負且不超過每日合理上限，NaN / Infinity 不可進入 UI state。
- 錄音額度頁與會員方案頁顯示的已用、剩餘、每日上限、quota bar 百分比與設定頁 quota helper 必須先轉成 bounded/clamped display value；不可在 JSX 內直接呼叫 `formatVoiceMinutes` 或直接用 raw ratio 組寬度。
- 點擊「同步額度」後顯示「額度同步狀態」inline status，不使用 banner card 或額外白色 panel。

### 4.6.4 提醒設定頁

功能：

- 顯示未來記錄提醒與回診提醒的設定結構。
- 目前只做 UI 預覽，不請求系統通知權限、不建立背景工作、不寫入 reminder table。
- 提醒文案不得包含敏感健康數值或完整紀錄內容。

頁面內容：

- 標題：「提醒設定」。
- Inline 說明：「通知預覽」，不使用提示卡或白色 panel。
- 通知預覽 badge/copy 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 notification permission / reminder table fallback 文案。
- 提醒設定頁的 header intro 與查看通知整合狀態按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 notification preview boundary copy。
- 提醒項目：
  - 晨間空腹血糖：每天 07:30，狀態「建議」。
  - 晚餐後兩小時：每天 20:30，狀態「可選」。
  - 回診前整理：回診前 3 天，狀態「未啟用」。
- 正式啟用前需要完成：
  - 系統通知權限請求與拒絕後的替代說明。
  - 安靜時段、時區與語言設定。
  - 後端 reminder schema、idempotent 排程與取消流程。
  - 通知內容不得包含敏感健康數值或完整紀錄。

底部按鈕：

- 「返回設定」。
- 「查看通知整合狀態」。

互動：

- 查看通知整合狀態只顯示本機狀態文字，不建立提醒、不呼叫 API、不呼叫 AI。
- 點擊「查看通知整合狀態」後顯示「通知整合狀態」inline status，不使用 banner card 或額外白色 panel。

### 4.6.5 通知與隱私頁

功能：

- 顯示通知內容、健康資料分享、醫師授權、社群公開、資料匯出與刪除的安全邊界。
- 目前只做 UI 預覽，不寫入偏好、不建立分享、不匯出資料、不呼叫 API。
- 所有健康紀錄預設私密，任何分享或公開都必須明確 opt-in。

頁面內容：

- 標題：「通知與隱私」。
- Inline 說明：「隱私控制預覽」，不使用提示卡或白色 panel。
- 隱私控制預覽 badge/copy 必須透過 bounded display helper 產生；不可在 JSX 內直接寫偏好、分享、匯出或 API fallback 文案。
- 通知與隱私頁的 header intro 與查看隱私整合狀態按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 privacy/export/share boundary copy。
- 狀態摘要：
  - 健康紀錄：預設私密。
  - 通知內容：不含數值。
  - 外部分享：需明確授權。
  - AI 成本：0 次呼叫。
- 正式啟用前需要完成：
  - 通知內容最小化：推播不可包含血糖數值、完整餐點或用藥內容。
  - 資料分享 opt-in / opt-out：醫師、照護者、社群與排行榜都必須分開授權。
  - 資料匯出與刪除請求：需有狀態追蹤、身份驗證與 audit trail。
  - 撤銷與到期：任何 share token、grant、公開顯示都必須可撤回。
- 預留控制項目：
  - 醫師 / 照護者分享：尚未啟用。
  - 社群公開資料：預設關閉。
  - 資料匯出 / 刪除：待後端流程。
- 預留控制項目的 title/status/copy tuple 必須在 render 前轉成 bounded display item；不可在 JSX 內直接解構 raw tuple。

底部按鈕：

- 「返回設定」。
- 「查看隱私整合狀態」。

互動：

- 查看隱私整合狀態只顯示本機狀態文字，不寫入偏好、不建立 grant、不匯出資料、不呼叫 AI。
- 點擊「查看隱私整合狀態」後顯示「隱私整合狀態」inline status，不使用 banner card 或額外白色 panel。

### 4.7 記錄詳情頁

頁面內容：

- 標題：「記錄詳情」。
- 左上角：返回箭頭。

主要資訊卡欄位：

- 日期：`2026/04/29`。
- 時間：`上午 8:10`。
- 類型：血糖紀錄。
- 狀態：早餐前 / 空腹。
- 數值：`138 mg/dL`。
- 備註：早餐：水煮蛋 2 顆、熱狗 1 根。

補充資訊卡：

- 運動：無。
- 用藥：已服用。

詳情頁邊界 inline checklist：

- 只顯示目前已載入的單筆紀錄，不額外查詢完整歷史。
- 詳情欄位由 backend/local payload 派生時必須做顯示長度上限；食物、標籤等列表最多顯示固定筆數，不顯示完整無上限 payload。
- 詳情頁與刪除確認頁的日期、時間、日期時間與 source 顯示必須使用 bounded display helper；不可直接 render raw `occurred_at` 或 `source`。
- 不會呼叫 parser、AI 或 LLM，成本為 `0`。
- 不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。
- 編輯與刪除必須進入各自確認流程，詳情頁本身不直接寫入資料。
- 檢查清單使用 inline checklist，不使用白色卡片，避免記錄詳情頁出現 nested panel。
- 詳情欄位列使用淡綠單層資訊列，可 wrap，不使用白色卡片列疊在內容區下造成二層 panel 感。

底部按鈕：

- 左側綠色按鈕：「編輯」。
- 右側淡紅色按鈕：「刪除」。

互動：

- 返回回上一頁。
- 編輯進入編輯記錄頁。
- 刪除進入 App 內刪除確認頁，不使用系統 Alert 作為主要確認流程。
- 從儲存完成或更新完成頁進入詳情時，詳情頁返回應回到該成功頁，不沿用舊的今日/歷史來源。
- 記錄詳情頁 Header 返回必須使用 dedicated handler；handler 只回到既有 return target 並更新 bounded status，不呼叫 AI / LLM、不送 backend write request。

### 4.7.1 刪除確認頁

目前狀態：

- MVP / 真實紀錄刪除前確認。
- 僅在選取真實 backend 紀錄時可進入；範例紀錄不可刪除。

頁面內容：

- 標題：「刪除確認」。
- 危險操作 inline 說明：說明刪除後會從目前清單移除，目前不保留本機復原副本，不使用 banner card。
- 刪除確認頁的危險操作說明、紀錄日期/來源 meta 與危險按鈕狀態 label 必須透過 bounded display helper 產生；不可在 JSX 中直接組日期/來源或 busy label。
- 紀錄摘要卡：顯示紀錄類型、摘要、日期時間與來源。
- 刪除前確認清單：
  - 只會刪除目前選取的這一筆紀錄。
  - 只送出單筆 delete request，不批次載入完整歷史。
  - 不會自動刪除其他日期、分析統計或未儲存候選紀錄。
  - 不會呼叫 parser、AI 或 LLM，成本為 `0`。
  - 不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。
  - 目前沒有本機 undo；刪除成功後會進入刪除完成頁。
  - 刪除中按鈕會停用；失敗時不自動重試，刪除請求仍走後端權限與 audit 路徑。
  - 檢查清單使用 inline checklist，不使用白色卡片，避免刪除確認頁出現 nested panel。

底部按鈕：

- 次按鈕：「取消」，返回記錄詳情。
- 危險按鈕：「確認刪除」，送出後端 delete request。

互動：

- Header 返回與取消都回到記錄詳情。
- 從記錄詳情開啟刪除確認、Header 返回與取消都必須使用 dedicated handler；開啟只進入 App 內確認頁並更新 bounded status，不送 delete request、不呼叫 parser / AI / LLM，返回則保留 selected record 並回到記錄詳情。
- 確認刪除成功後進入刪除完成頁。
- 刪除中按鈕 disabled，避免重複刪除請求。
- 刪除 handler 本身也必須 fail-closed：若 protected backend 尚未 ready，即使被間接呼叫也只透過 bounded display helper 更新安全狀態文字並留在刪除確認頁，不送 delete request。

刪除完成頁需顯示刪除後邊界：

- 刪除結果說明使用 inline status，不使用 banner card 或額外白色 panel。
- 刪除進行中、成功、失敗與刪除摘要文字必須透過 bounded display helper 產生；摘要筆數必須先 clamp。
- 成功頁不保留被刪除紀錄的本機復原副本。
- 不會呼叫 parser、AI 或 LLM，成本為 `0`。
- 不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。
- 失敗不自動重試；若需要確認 backend 狀態，使用者需稍後重新同步。
- 回到今日 / 歷史只使用已同步紀錄，mobile 單次同步仍需受 `mobileRecordSyncLimit` 限制。
- 刪除完成頁的目的地卡片與底部返回 CTA 必須使用 dedicated handler；只切換 App 內頁面並更新 bounded status，不重送 delete request、不呼叫 parser / AI / LLM。

更新完成頁需顯示更新後邊界：

- 更新結果說明使用 inline status，不使用 banner card 或額外白色 panel。
- 更新進行中、成功、失敗與更新摘要文字必須透過 bounded display helper 產生；摘要筆數必須先 clamp。
- 成功頁只反映目前已更新的選取紀錄與本機清單。
- 不會呼叫 parser、AI 或 LLM，成本為 `0`。
- 不會保留 raw transcript、raw prompt、raw model output 或模型 debug trace。
- 失敗不自動重試；若需要確認其他裝置狀態，使用者需稍後重新同步。
- 回到今日 / 歷史 / 分析只使用已同步紀錄，mobile 單次同步仍需受 `mobileRecordSyncLimit` 限制。
- 更新完成頁的目的地卡片、查看詳情與底部返回 CTA 必須使用 dedicated handler；只切換 App 內頁面並更新 bounded status，不重送 update request、不呼叫 parser / AI / LLM。

### 4.8 編輯記錄頁

頁面內容：

- 標題：「編輯記錄」。
- 副標：「修改以下內容，然後儲存。」。
- 左上角：返回箭頭。

表單欄位：

- 日期：calendar icon，`2026/04/29`，右側下拉箭頭。
- 時間：clock icon，`上午 8:10`，右側下拉箭頭。
- 類型：水滴 icon，`血糖記錄`，右側下拉箭頭。
- 血糖數值：水滴 icon，label「血糖數值」，單位 `mg/dL`，值 `138`。
- 情境：冥想人物 icon，`空腹`，右側下拉箭頭。
- 飲食內容：餐具 icon，`水煮蛋 2 顆、熱狗 1 根`。
- 運動：跑步 icon，`無`，右側下拉箭頭。
- 用藥：藥丸 icon，`無`，右側下拉箭頭。
- 備註：文件 icon，placeholder「例如：身體狀況、心情等」。
- 所有文字欄位必須同時使用 input-level `maxLength` 與 setter-level 截斷；長文字欄位與 fallback JSON 使用固定上限，避免 validation 前先把過長表單資料放進 mobile state。
- 日期與時間欄位也必須使用固定長度上限與 setter-level 截斷：日期為 `YYYY-MM-DD`，時間為 `HH:mm`。
- 手動新增、候選編輯與正式紀錄編輯的 validation error 顯示文字必須先經 bounded display helper 再 render；表單 disabled 判斷仍依原始 validation 結果。
- 手動新增與手動新增確認頁的 backend unavailable 警告必須先轉成 bounded display text；不可在 JSX 內直接組 protected backend unavailable message。
- 正式紀錄更新的 backend unavailable 狀態必須透過 bounded display helper 產生；不可在 update guard block 內直接組 protected backend unavailable message。
- 正式紀錄編輯頁的 intro / structured payload guidance 必須透過 bounded display helper 產生；不可在 JSX 中直接寫固定 update guidance。

底部按鈕：

- 主按鈕：「儲存修改」。
- 次按鈕：「取消」。
- 從記錄詳情進入編輯記錄頁、以及編輯頁取消返回記錄詳情都必須使用 dedicated handler；進入時重新從 selected record 建立 bounded edit draft，取消時丟棄 draft 並保留正式紀錄，不送 update request、不呼叫 parser / AI / LLM。

更新前檢查 inline checklist：

- 只會更新目前選取的這一筆紀錄。
- 只送出確認後的結構化 payload，不批次載入完整歷史。
- 不會呼叫 parser、AI 或 LLM，成本為 `0`。
- 不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。
- 儲存中按鈕會停用；失敗時不自動重試。
- 更新 handler 本身必須 fail-closed：若 protected backend 尚未 ready，即使被間接呼叫也只更新安全狀態文字並留在編輯頁，不送 update request。
- 檢查清單使用 inline checklist，不使用白色卡片，避免編輯頁出現 nested panel。
- 編輯頁的日期 / 時間 / 類型摘要列使用淡綠單層資訊列與開放式表單欄位，不再把表單列視覺化成白卡堆疊。

### 4.8.1 手動新增確認頁

目前狀態：

- MVP / 手動紀錄寫入前確認。
- 從手動新增頁點擊「建立紀錄」後進入，不使用系統 Alert 作為主要確認流程。
- 手動新增頁的血糖、飲食、運動、用藥與備註文字欄位必須同時使用 input-level `maxLength` 與 setter-level 截斷，避免過長資料在確認前先進入 mobile state。
- 手動新增頁的日期與時間欄位必須使用固定長度上限與 setter-level 截斷，確認頁只讀取已 bounded 的日期時間 state。
- 手動新增頁 Header 返回必須使用 dedicated handler；handler 只回到原本來源頁並更新 bounded status，不送 create request、不呼叫 AI / LLM / STT。

頁面內容：

- 標題：「確認手動紀錄」。
- 儲存前確認 inline 說明：這筆紀錄不經 AI parser，送出後會透過後端驗證、權限與 audit 路徑建立，不使用 banner card。
- 手動確認頁的儲存前確認說明與主按鈕狀態 label 必須透過 bounded display helper 產生；busy 狀態只改顯示 label，不改送出條件。
- 紀錄摘要卡：顯示紀錄類型、摘要、日期時間與 `source: manual`。
- 送出前檢查清單：
  - 不會呼叫 AI 或 LLM，成本為 `0`。
  - 只會送出 1 筆手動紀錄 payload，不批次載入完整歷史。
  - 不會附帶 raw transcript、raw prompt、raw model output 或模型 debug trace。
  - 日期、時間、類型與欄位會送到後端再次驗證。
  - 建立中按鈕會停用；失敗時不自動重試。
  - 檢查清單使用 inline checklist，不使用白色卡片，避免手動確認頁出現 nested panel。

底部按鈕：

- 次按鈕：「返回修改」，回到手動新增頁。
- 主按鈕：「確認建立」，送出後端 create request。

互動：

- Header 返回與返回修改都回到手動新增頁。
- 進入確認頁、Header 返回與返回修改都必須使用 dedicated handler；進入確認頁必須先做本機驗證與 protected backend readiness guard，失敗時只更新 bounded status 並留在手動新增頁，不送 backend request、不呼叫 AI / LLM。
- 返回手動新增頁時必須保留目前手動表單輸入，避免使用者重新輸入。
- 建立中按鈕 disabled，避免重複建立請求。
- 建立 handler 本身也必須 fail-closed：若 protected backend 尚未 ready，即使被間接呼叫也只透過 bounded display helper 更新安全狀態文字並留在手動新增確認頁，不送 create request。
- 建立進行中、成功、失敗與儲存完成摘要文字必須透過 bounded display helper 產生；摘要筆數必須先 clamp。
- 建立成功後進入儲存完成頁。

### 4.9 使用教學頁

頁面內容：

- 標題：「使用教學」。
- 副標：「簡單 4 步驟，輕鬆記錄每一天」。
- 左上角：返回按鈕。

教學卡片：

- 按住說話：麥克風 icon，說明「按住首頁或記錄頁的大按鈕開始錄音預覽。」。
- 放開結束：手掌 icon，說明「若已選擇本機 Whisper 模型，會先轉成文字並進入確認。」。
- 確認內容：清單 icon，說明「檢查文字與 AI 候選紀錄，確認前不會儲存。」。
- 儲存完成：勾勾 icon，說明「確認後送出，即可加入今日紀錄。」。

提示條：

- 「小提醒：也可以直接用文字輸入。」。

底部主按鈕：

- 「開始使用」。
- 從 Menu 進入使用教學時，返回 Menu；從設定頁進入使用教學時，返回設定頁。
- 使用教學的開始使用與手動新增 CTA 必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 AI / LLM / STT、不送 backend write request。
- 使用教學的開始使用與手動新增 CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須說明只進入記錄或手動新增流程，不呼叫 AI / LLM / STT，也不寫入資料。

### 4.10 會員方案狀態頁

頁面內容：

- 標題：「會員方案」。
- 左上角：返回箭頭。
- 上方文字：依目前已同步會員資料顯示試用與續訂狀態；付款未串接時不可承諾已啟動試用或可立即續訂。

倒數大卡：

- 綠色漸層背景。
- 「7 天免費試用即將結束」。
- 「還剩 2 天」。
- 左側 calendar icon。

會員專屬功能卡：

- 會員功能清單使用 open section；每列功能自己是單層資訊列，不放進另一張綠色或白色大卡。
- 語音記錄：輕鬆說，隨時記。
- AI 整理：自動歸納重點。
- 基本分析：趨勢摘要一目了然。
- 歷史回顧：完整保存你的記錄。

價格卡：

- 「創始會員年費」。
- 「NT$1,490」。
- 「持續訂閱可保有優惠價」。

主按鈕：

- MVP 預覽狀態：「查看續訂整合狀態」或同等狀態提示。
- 正式付款、receipt validation 與 entitlement webhook 完成後才可改為「立即續訂」。
- 「續訂未串接」說明使用 inline 區塊，不使用 banner card；會員狀態頁只讓倒數大卡、會員功能與價格資訊使用卡片。
- Header 關閉回會員方案。
- 「查看續訂整合狀態」顯示續訂 preview status 並前往訂閱管理。
- 「管理方案」前往訂閱管理。
- 會員狀態頁的返回會員方案、續訂整合與管理方案 CTA 必須使用 dedicated handler；handler 只更新 bounded status 或 App 內導覽，不開啟付款、不建立訂閱、不改 entitlement、不呼叫 AI / LLM。

底部文字按鈕：「管理方案」。

### 4.11 成就榜頁

目前狀態：

- MVP 第一階段徽章頁已可同步 backend 成就摘要、同步成就解鎖紀錄，並顯示本次新解鎖與已保存徽章。
- Backend `/achievements/summary` 只讀取既有 records 進行聚合，回傳三大分類的累積型與連續型徽章進度；`/achievements/sync` 會保存 newly unlocked achievement records，`/achievements/unlocks` 會回傳已保存徽章紀錄；上述路徑不更新排行榜、不呼叫 AI。
- Mobile 在 backend ready 時同步 summary；backend 不可用或 visual-smoke route 時保留 mobile 已載入紀錄的本機推算 fallback。
- 正式公開排名或跨使用者展示前仍需完成 public opt-in、隱私邊界與撤回流程。

頁面內容：

- 標題：「成就榜」。
- 副標：「完成挑戰，養成穩定記錄習慣」。
- 左上角：返回箭頭。
- Inline 說明：「本機預覽」，不使用 banner card；文案需說明 backend summary 可同步且 visual smoke / backend unavailable 時維持本機 fallback。
- 成就 hero 的 unlocked count、next badge progress 與進度數字必須使用 bounded/clamped display values；不可直接 render 未 bounded backend aggregate。
- 成就整合狀態文字必須先經 bounded display helper 再 render，避免未來 backend/config-driven copy 過長。
- 成就同步按鈕必須走 dedicated handler 並呼叫 bounded backend loader；不可在 JSX handler 內直接組 status message 或呼叫 raw request。
- 成就榜的 backend/fallback 說明、本機計算/不寫入邊界、下一徽章提示與徽章同步按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接組進度或 preview boundary copy。

徽章資料模型：

- 分類固定為「血糖記錄」、「飲食記錄」、「運動記錄」。
- 每個分類都要有「累積型成就」與「連續型成就」。
- 級距先提供 `10`、`50`、`100`、`150`、`200`、`250`；達到最高基礎級距後，backend summary、mobile fallback 與年度回顧需以每 `50` 進度延伸下一級距，例如 `300`。
- 同一分類的累積型徽章共用同款徽章圖樣，只更換顏色與等級數字。
- 連續型徽章採獨立款式，仍只用顏色與等級數字區分級距。
- MVP 階段 backend summary 使用 profile 既有 records 計算累積筆數與分類連續天數；mobile fallback 使用已載入紀錄計算同一套徽章，不做公開排名或跨使用者展示承諾。
- Backend 成就 taxonomy 必須以共用 achievement catalog 作為唯一來源；`/achievements/summary` 與 Year Review snapshot service 都必須引用同一套基礎級距與動態延伸 helper，年度回顧不可私有定義徽章級距。
- Mobile navigation verifier 必須同時檢查 mobile fallback、backend achievement catalog、backend `/achievements/summary` 與 Year Review snapshot service 的成就 taxonomy parity：三大分類、基礎六個級距、250 後動態延伸、累積/連續型、累積型共用分類圖樣、連續型獨立圖樣與 badge level number 都不可漂移。Backend integration test 也必須驗證每個分類各有基礎 6 張累積型與 6 張連續型徽章、250 後可延伸到下一級距、累積型同分類共用 icon、累積型基礎六個級距共用同一套顏色序列、連續型共用獨立 icon/color，且級距順序完整。

上方總覽卡：

- 大獎盃 icon。
- 「已解鎖」。
- 大數字：目前已解鎖徽章數。
- 「項成就」。
- 「下一個徽章還差 N 點進度」。

徽章列表：

- 依分類 section 呈現：血糖記錄、飲食記錄、運動記錄。
- 每個分類下列出累積型與連續型的各級距徽章。
- 成就卡必須是單層卡片且可 wrap；徽章、標題、狀態與進度在小螢幕不可互相擠壓。
- 徽章本體必須顯示分類/類型圖樣與級距數字。
- 未完成徽章顯示 bounded `progress/target`，完成徽章顯示「完成」。
- 每張卡都有進度條；連續型進度條與徽章外觀使用獨立樣式。

底部按鈕：

- MVP 操作：「同步徽章解鎖」。
- 點擊後 POST `/achievements/sync` 同步 backend 成就解鎖，讀取 `/achievements/unlocks` 顯示已保存徽章，並顯示「徽章整合狀態」inline status，不使用 banner card 或額外白色 panel。Mobile navigation verifier 必須守住 sync button label、POST `/achievements/sync`、讀取 unlock history，以及本次新解鎖區塊。
- 返回功能必須走 dedicated handler 並設定 bounded preview return status；不可在 JSX 中直接呼叫 `setCurrentScreen(achievementsReturnScreen)`。
- 正式 achievement records、公開排名 opt-in 與撤回流程完成後才可改為「查看全部徽章」或公開展示。

### 4.12 年度回顧頁

目前狀態：

- 年度回顧一般操作路徑已接 backend snapshot、privacy-masked share package 與原生分享面板；離線 fallback 仍可用已載入紀錄即時計算前一年度回顧。
- Mobile fallback 不呼叫 AI、不寫入 snapshot；backend-ready 一般操作路徑可同步保存 snapshot、準備 privacy-masked share package，並開啟原生分享面板分享隱私遮罩文字。年度回顧文案不可再宣稱年度回顧仍是預留、分享圖片、年度素材或隱私遮罩都尚未產生。
- Backend 已有 `/year-reviews/{year}` snapshot contract，可從正式 profile records 產生並保存年度統計、年度血糖成果與 bounded AI-style 年度觀察；同一 profile/year 會回傳已保存 snapshot，不因後續紀錄變動自動改寫。Mobile 一般操作路徑會嘗試同步此 API，visual-smoke route 必須維持本機 demo 且不呼叫 backend。
- Backend 已有 `/year-reviews/{year}/share-card` contract，可從 snapshot 產生 privacy-masked public summary card payload；預設只含記錄天數、最長連續、達成徽章與最高級距等低敏摘要，不包含平均/最高/最低血糖數值，且 `external_share_enabled=false`。
- Backend 已有 `/year-reviews/{year}/share-card/asset` contract，可產生 privacy-masked SVG share-card asset、mime type、filename、alt text 與 checksum；mobile 只可顯示 bounded asset metadata，不可把 raw SVG 直接放入狀態訊息或外部分享。
- Backend 已有 `/year-reviews/{year}/share-card/confirm` contract，必須收到 `privacy_acknowledged=true` 才回傳 share package；未確認隱私遮罩必須 fail-closed。Share package 可標示 `external_share_enabled=true`，mobile 可用 React Native `Share.share` 開啟原生分享面板，但分享內容只可使用 privacy-masked `share_text`，不可分享 raw SVG、血糖數值或 snapshot payload。
- Backend regression 必須確認 Year Review share-card、SVG asset 與 confirmed share package 不含 health outcome keys、中文血糖結果標籤、實際血糖數值或 `mg/dL` 片段；公開分享只保留低敏年度摘要。
- Year Review share package revoke 必須 idempotent；重複撤回不可刷新 `revoked_at`，且 revoked package 不可再接收 opened/dismissed share result update。
- Backend 已有可排程 command：`python -m app.jobs.generate_year_review_snapshots --year YYYY`；Kubernetes deployment foundation 已有 `infra/k8s/year-review-cronjob.yaml` 在每年 1 月 1 日呼叫，預設 year 為前一年度，且只產生缺漏 snapshots。Backend regression 必須確認 batch 重跑不會刷新既有 snapshot id、`generated_at` 或 summary，即使 snapshot 產生後又新增同年度紀錄；summary baseline 必須用獨立副本比對，避免 mutable JSON 參照掩蓋重算。
- Backend test 必須直接驗證 scheduler default target year：在 1 月 1 日執行 `generate_year_review_snapshots` 不帶 `--year` 時，目標年度為前一個 calendar year，避免年度回顧排程誤產生當年度空報告。
- Kubernetes manifest verifier 必須同時檢查 Year Review CronJob 的 January 1 schedule、command target，並 fail-closed 禁止 manifest 帶入 `--year`，讓部署排程使用 backend default-year contract。
- 正式啟用前仍需完成平台分享權限細節與外部社群平台的深度整合。
- 正式年度回顧應在每年 1 月 1 日自動產生前一年度回顧；mobile 必須明確顯示此排程規則。Mobile navigation verifier 必須守住年度回顧的 1 月 1 日自動產生文案與 hero/live-calculation render path。

頁面內容：

- 標題：「年度回顧」。
- 副標：「看看前一年度的控糖成果」。
- 左上角：返回箭頭。
- Inline 說明：「年度回顧」，不使用 banner card。
- 年度回顧邊界使用 inline status，不使用 banner card 或額外白色 panel。
- 年度回顧 hero、統計列表、健康成果、亮點摘要、AI 觀察與 AI 鼓勵都必須使用 display-only clamped/bounded values；實際 aggregate job / sharing logic 不可依顯示字串判斷。
- Backend 同步狀態可 bounded 顯示 snapshot 已保存與短識別；不可 render raw snapshot payload 或未 bounded id。
- 年度回顧亮點清單與分享整合狀態文字必須先經 bounded display helper 再 render，避免未來 backend/config-driven copy 過長。
- 年度回顧分享整合狀態按鈕會在 backend ready 時請求 privacy-masked SVG share-card asset、確認 share package，並用原生 Share 面板分享 privacy-masked text；visual-smoke 或 backend unavailable 時只能顯示 bounded fallback status，不可啟動外部分享。Mobile navigation verifier 必須守住此 handler 只把 bounded `sharePackage.share_text` 傳給 `Share.share`，不可分享 `svg_text`、snapshot payload 或 raw JSON。
- 年度回顧 share package id 必須先經 `boundIdentifier` 後才能寫入 mobile state、送 result/revoke endpoint 或出現在狀態文字；invalid id 必須 fail closed 並清除本機撤回狀態，不可保存 raw backend id。
- 年度回顧分享整合狀態按鈕必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setYearReviewActionStatus`。
- 年度回顧邊界說明與分享未啟用狀態也必須透過 bounded display helper 產生；不可在 JSX 或 component body 內直接寫年度素材/分享權限 fallback 文案。
- 年度血糖平均/最高/最低提示必須先轉成 bounded display text 或 metric row；不可在 JSX 內直接把 numeric metric 插入長句。
- 年度回顧的來源說明、hero 總記錄句、hero 資料來源提示、徽章素材 fallback 與分享整合按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 中直接組紀錄次數或年度素材 fallback copy。

年度總覽卡：

- 綠色漸層背景。
- 「前一年度 YYYY 年回顧」。
- 「前一年度共記錄 N 次」。
- 顯示「每年 1 月 1 日自動產生前一年度回顧」規則。
- 右側慶祝紙花 icon。

統計列表：

- 本年度總記錄天數。
- 本年度血糖記錄次數。
- 本年度飲食記錄次數。
- 本年度運動記錄次數。
- 最長連續記錄天數。
- 達成徽章數量。
- 解鎖最高等級徽章。
- 達成徽章數量與解鎖最高等級徽章必須沿用成就榜 taxonomy：三類累積型進度與三類連續型進度都要納入，不可只用年度累積筆數計算。
- Mobile fallback 與 backend `annual_stats` label 必須維持上述七個統計列；mobile navigation verifier 必須守住年度統計 rows render 與七個 label，UI spec coverage 也必須把年度統計 rows 視為年度回顧 canonical marker，避免只留下健康成果或分享卡。

年度健康成果：

- 年平均血糖。
- 年度最高血糖。
- 年度最低血糖。
- Backend integration test 必須守住三個 health outcome key/value/label，避免年度健康成果只剩 key 或數值而失去使用者可讀 label。Mobile navigation verifier 必須守住年度健康成果 rows render 與「年平均血糖」「年度最高血糖」「年度最低血糖」三個 label。

年度亮點：

- 「前一年度已有 N 筆紀錄」。
- 「最常記錄的是某類紀錄」。
- 「最長連續記錄 N 天」。

AI 年度觀察與鼓勵：

- 顯示「AI 年度重要觀察」preview copy，但 preview 不呼叫 AI、不保留 prompt、不寫 raw model output。
- 顯示「AI 年度總結與鼓勵」preview copy，用於增加成就感與持續使用意願。
- 正式版才可由年度報表服務產生 AI 整理年度重要觀察與 AI 年度總結。
- Backend integration test 必須守住 `important_observation` 與 `encouragement` 兩個 kind，且文字不可為空；重要觀察需包含年度、記錄天數、血糖次數與年平均血糖摘要。

徽章卡：

- 年度徽章 row 必須可 wrap；icon、標題與說明在小螢幕不可被固定橫排壓窄。
- 標題：「年度鼓勵徽章」。
- 說明：「恭喜你持續記錄、照顧自己！」與「你的努力值得這枚徽章！」。

底部按鈕：

- MVP 預覽狀態：「查看分享整合狀態」。
- 點擊後準備 privacy-masked SVG share-card asset、確認 share package、開啟原生 Share 面板分享 privacy-masked text，並顯示「分享整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 正式啟用後可產生卡片或報告，並在使用者確認隱私遮罩後分享至社群媒體。
- 返回功能必須走 dedicated handler 並設定 bounded preview return status；不可在 JSX 中直接呼叫 `setCurrentScreen(yearReviewReturnScreen)`。
- SVG/圖片附件分享、分享後狀態追蹤與撤回/刪除流程完成後才可改為完整「分享我的年度回顧」。

### 4.13 商城頁

頁面內容：

- 標題：「商城」。
- 左上角：返回箭頭。
- Inline 說明：「商城預覽」，不使用 banner card。
- 搜尋框 placeholder：「搜尋商品」，左側放大鏡 icon。
- 搜尋框必須使用 input-level `maxLength` 與 setter-level 截斷；一般操作路徑會先同步 backend reward catalog / points / redemption wallet，再對已同步目錄做本機搜尋篩選；backend unavailable 或 visual-smoke route 時才使用本機 fallback catalog。搜尋不可呼叫 AI，也不可查詢付款、出貨或外部商品 API。
- 商城必須明確呈現點數兌換預留架構：點數來源、可兌換項目、正式啟用前條件、目前 preview 狀態。
- Backend 已有 `/store/rewards`、`/store/points`、`/store/redemptions` 與 `/store/redemptions/{id}/use` contract；redeemable rewards 會寫入 redemption 與點數 ledger，preview-only rewards 必須回 `reward_not_redeemable`，不存在的 reward code 必須回結構化 `reward_not_found` 且不可建立 redemption 或改變點數，點數不足必須回 `insufficient_points` 且不可建立 redemption 或扣成負餘額。不存在或不屬於目前 account 的 redemption use request 必須回結構化 `redemption_not_found`，不可改變任一帳號的 redemption wallet 或點數，也不可洩漏其他帳號 wallet 狀態。Reserved 特殊徽章或其他非 issued coupon/discount redemption use request 必須回 `redemption_not_usable`，不可標記 used、不可改變點數。已使用的 coupon/discount 二次 use 必須回 `redemption_not_usable`，不可刷新 `used_at` 或改變點數。優惠券與保健食品折扣可 immediate issue bounded fulfillment code；合作商品、會員福利與出貨/付款仍需後續 fulfillment。Mobile 一般操作路徑會同步 reward catalog/points/redemption wallet，按可兌換項目才送 redemption；visual-smoke route 必須維持本機 demo 且不扣點。
- Backend store regression test 必須守住五個 reward categories：優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利；也必須鎖住各 reward 的 code、中文 title、category、points cost 與 redeemable/preview status。五個分類皆為可兌換項目；優惠券與保健食品折扣可 immediate issue bounded fulfillment code，合作商品、特殊徽章與特殊會員福利只建立 reservation，後續 fulfillment 完成前不可被 `/use` 當成 issued coupon/discount code 使用。
- 點數來源：食物分享、完整前後血糖、審核通過。
- 可兌換項目：優惠券、保健食品折扣、合作商品、特殊徽章、特殊會員福利。
- 目前一般操作路徑可扣點、發出優惠券/折扣碼、顯示「我的兌換券」，並可將 unused issued coupon/discount code 標記為已使用；仍不建立出貨訂單、不處理付款。商城文案必須清楚區分優惠券 / 保健食品折扣的 immediate code issue，以及合作商品 / 會員福利仍需 reservation + 後續 fulfillment，不可再宣稱所有可兌換項目都「仍不發券」。

分類 tab：

- 「優惠券」。
- 「保健食品折扣」。
- 「合作商品」。
- 「特殊徽章」。
- 「特殊會員福利」。
- 預設示例選中：「優惠券」。

商品卡：

- 商品卡必須是單層可掃描卡片，可 wrap；圖片、商品內容與箭頭按鈕在小螢幕不可互相擠壓或被外層 panel 再縮排。
- 合作通路 50 元優惠券：backend reward code `coupon_50`，點數成本 `100 點`，redeemable，可 immediate issue bounded coupon code。
- 保健食品 9 折折扣：backend reward code `supplement_discount_10`，點數成本 `150 點`，redeemable，可 immediate issue bounded discount code，說明不可宣稱醫療療效。
- 合作商品體驗兌換：backend reward code `partner_product_trial`，點數成本 `300 點`，redeemable，只建立 reservation，需完成商品目錄、庫存、出貨與客服稽核。
- 特殊會員徽章：backend reward code `annual_member_badge`，點數成本 `80 點`，redeemable，只建立 reservation，需完成 badge inventory、持有紀錄與撤回規則。
- 特殊會員福利包：backend reward code `member_benefit_pack`，點數成本 `500 點`，redeemable，只建立 reservation，需完成 entitlement、到期與 rollback 規則。
- Mobile fallback catalog 必須使用與 backend reward catalog 相同的 code、title、category、points cost 與 redeemable/preview badge，避免 backend unavailable 或 visual-smoke 時展示不同兌換成本。
- 點擊商品箭頭後顯示「商品整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 商品整合狀態文字必須先經 bounded display helper 再 render，避免未來 commerce backend/config copy 過長。
- 商品卡的點數成本必須由 bounded display item 提供，不可直接 render raw product config。
- 商城預覽說明、搜尋無結果 title/copy/evidence、兌換整合 CTA、商城本機導覽邊界、兌換 intro、結帳 readiness 標題與返回商城 label 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 commerce preview/cart fallback 文案。
- 「我的兌換券」列表必須由 bounded redemption display item 提供 title、subtitle、status label、accessibility label 與 action label；不可直接 render raw fulfillment code、reward code 或 backend status。只有 `issued` 且未使用的 coupon/discount code 可顯示可操作使用按鈕，已使用或 reserved 狀態必須 disabled。
- Store reward code 與 redemption id 必須先經 bounded display item / `boundIdentifier` 後才能送 `/store/redemptions` 或 `/store/redemptions/{id}/use`；bounded id 為空時 mobile 必須 fail closed，只顯示 bounded status，不建立兌換、不更新兌換券狀態。
- Mobile navigation verifier 必須守住 Store 一般操作路徑會同步 `/store/rewards`、`/store/points`、`/store/redemptions`，redeemable 商品會 POST `/store/redemptions`，兌換成功與兌換券使用成功後都必須刷新 catalog / points / wallet，我的兌換券會 render bounded redemption display item，且 usable 判斷必須同時符合 `issued`、有 fulfillment code、fulfillment type 為 coupon/discount code、尚未 used，只有 usable coupon/discount 才能 POST `/store/redemptions/{id}/use`。

底部固定按鈕：

- MVP 預覽狀態：「查看兌換整合狀態」。
- 進入購物車整合狀態、返回商城與返回來源頁都必須走 dedicated handler 並設定 bounded commerce / preview status；不可在 JSX 中直接呼叫 `setCurrentScreen("storeCart")`、`setCurrentScreen("store")` 或 `setCurrentScreen(storeReturnScreen)`。
- 點數帳本、商品目錄、coupon/discount-code issue 與 coupon use status 已有 backend contract；購物車整合頁不得再宣稱點數帳本尚未接上。庫存、購物車、結帳、出貨訂單與付款完成後才可改為完整「查看購物車」或商品兌換流程。
- 購物車預覽頁若顯示結帳按鈕，必須是 disabled 狀態且文字為「結帳整合尚未啟用」，不可顯示可操作的「前往結帳」。
- 購物車 preview 的 unavailable title/copy/evidence、法務提示與 disabled checkout label 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 commerce fallback 文案。

### 4.14 食物拍照分析頁

目前狀態：

- Future module / UI 預留。
- MVP 不啟用相機、圖片上傳、影像模型或營養估算。
- 沒有真實分析結果時不可顯示固定範例數字，也不可加入紀錄。
- 正式啟用時必須先完成圖片權限、圖片壓縮與儲存、Vision 成本上限、rate limit、使用者確認流程。

頁面內容：

- 標題：「食物拍照分析」。
- 副標：「拍下餐點，AI 幫你估算」；在 MVP 預覽狀態需同時標示「Vision 未串接」。
- 左上角：返回箭頭。
- Inline 說明：「Vision 未串接」，不使用 banner card。

拍照區：

- 大面積淡綠背景。
- 虛線邊框。
- 中心 camera icon。
- 文字：「拍攝或上傳照片」。

AI 分析結果：

- Vision 未串接時使用 inline result boundary，不使用白色卡片再包空狀態卡。
- 狀態顯示「尚未產生」與「尚未產生分析結果」。
- 說明拍攝或上傳流程尚未接上，因此不顯示任何營養估算。
- 不使用固定範例數字，避免 mock 結果被誤認為實際 AI 分析。
- 沒有真實分析結果時不可加入紀錄；正式啟用時必須先讓使用者確認食物與數值。
- Vision 未串接 badge/copy、upload unavailable copy、result pending label、future boundary copy 與 empty-result checklist 必須透過 bounded display helper 產生；不可在 JSX 或 checklist array 內直接寫固定 no-data 文案。
- Food Photo 頁面 intro、upload box label、AI 結果標題、readiness 標題、拍照整合按鈕 label 與重新拍攝整合按鈕 label 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 Vision preview/action fallback 文案。
- Vision 接上且有真實結果後，才可改為單層 AI Result Card 顯示辨識食物、估計熱量、碳水化合物、糖分與「以上為估算值，可再手動修正」。

底部按鈕：

- MVP / Vision 未串接狀態：
  - 不顯示可操作的「加入紀錄」。
  - 不顯示可操作的「重新拍攝」。
  - 可顯示「查看拍照整合狀態」與「查看重新拍攝整合狀態」這類狀態按鈕。
  - 點擊狀態按鈕或拍照區後顯示「拍照整合狀態」inline status，不使用 banner card 或額外白色 panel。
  - 拍照整合狀態文字必須先經 bounded display helper 再 render，避免未來 Vision backend/config copy 過長。
- 正式 Vision、圖片權限、分析結果與使用者確認流程完成後，才可顯示「加入紀錄」與「重新拍攝」。

互動：

- MVP 預覽狀態：點擊拍照區只顯示未啟用狀態，不開相機、不讀取照片、不呼叫 AI、不寫入飲食紀錄。
- 從未來擴充清單進入食物拍照分析時，返回應回到未來擴充清單；從 Menu 直接進入時，返回 Menu。
- 返回功能必須走 dedicated handler 並設定 bounded preview return status；不可在 JSX 中直接呼叫 `setCurrentScreen(foodPhotoReturnScreen)`。
- 正式啟用後：點擊拍照區可開相機或照片上傳。
- 正式啟用後：分析結果需先允許使用者修改食物與數值。
- 正式啟用後：使用者確認後才可加入今日紀錄。

### 4.14.1 未來模組詳情頁

目前狀態：

- Future module / 本機預留詳情。
- 從未來擴充清單點擊尚未有完整預覽頁的模組時開啟，例如醫師 / 醫院合作、社群、排行榜、HealthKit / Health Connect / 血糖機。
- 目前只顯示工程前置條件、資料安全邊界與正式啟用順序，不呼叫 API、不寫入資料、不啟動背景工作、不呼叫 AI。

頁面內容：

- 標題：選取的未來模組名稱。
- 說明：選取模組的用途摘要。
- Inline 說明：「預留架構」，說明目前只整理 UI 入口、工程條件與資料安全邊界，不使用 banner card。
- Future module detail 的預留架構 copy 與建議實作順序 copy 必須透過 bounded display helper 產生；不可在 JSX 中直接寫 no-API/no-write/no-AI 或 implementation-order 文案。
- Future preview 族群共用的 readiness/status/return/action labels，例如啟用前條件、正式啟用前需要完成、整合狀態、MVP 範圍邊界、目前狀態、建議實作順序、返回未來擴充與各狀態按鈕 label，必須透過 bounded display helper 產生；不可在 JSX 中直接寫 repeated future-preview section labels。
- 狀態卡：顯示 readiness 與 safety。
- 啟用前條件清單：顯示該模組 required backend / permission / privacy / cost 控制項；清單使用開放式 inline checklist，不放進白色卡片，避免未來模組卡片內再包一張 panel。
- 建議實作順序：production auth -> 權限模型 -> schema/source 欄位 -> audit trail -> 外部分享/排行/匯入/圖片分析；使用「建議實作順序」inline block，不使用 banner card 或額外白色 panel。
- 返回按鈕：「返回未來擴充」。

互動：

- 從未來擴充清單進入時，返回應回到未來擴充清單。
- 不可把未完成模組導向空白頁或只顯示 toast；需要保留可檢視的本機預覽內容，方便後續分支實作。
- 未來擴充清單若連到已存在的預覽頁，例如成就榜、年度回顧、商城或食物拍照分析，該預覽頁返回應回到未來擴充清單；從 Menu 進入時則返回 Menu。
- 未來擴充清單內的整合狀態回饋顯示為「未來模組整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 未來擴充清單與 future module preview 的整合狀態文字必須先經 bounded display helper 再 render。
- 未來擴充清單、preview detail 與 preview target 切換時的 action status clear 也必須透過 shared reset helper；不可在入口 handler 或卡片 Pressable 內直接設定空字串。
- Menu 進入未來擴充、未來擴充返回 Menu、以及未來模組詳情返回未來擴充都必須使用 dedicated handler；handler 只更新 App 內導覽與 bounded status，不呼叫 backend / AI / Vision / payment。
- 未來擴充清單卡片進入 preview target 或 detail 時必須走 dedicated handler；不可在卡片 Pressable JSX 中直接寫多分支 `setCurrentScreen(...)` route transition。Future module card JSX `onPress` 必須呼叫 card press wrapper，不直接呼叫底層 future module destination handler。
- 醫師合作、健康串接、社群與排行榜 preview 的狀態按鈕也必須走 dedicated handler；不可在 JSX Pressable 內直接呼叫 `setDoctorShareActionStatus`、`setHealthIntegrationActionStatus`、`setCommunityActionStatus` 或 `setRankingActionStatus`。
- 未來擴充清單底部的 MVP 範圍說明顯示為「MVP 範圍邊界」inline block，不使用 banner card 或額外白色 panel。

### 4.14.2 醫師 / 醫院合作預覽頁

目前狀態：

- Future module / 本機預覽。
- 目前只顯示授權、報表、醫療端唯讀查看與 audit 邊界，不產生授權碼、不建立 share token、不新增 grants、不呼叫醫師端 API。
- 後端已有 profile grant / shared profile / basic report 的基礎能力；mobile 正式啟用前仍需 production auth、使用者確認 UI、撤銷入口與醫師端唯讀頁。

頁面內容：

- 標題：「醫師 / 醫院合作」。
- Inline 說明：「授權未啟用」，不使用 banner card。
- 目前紀錄對象：顯示目前 active profile label；未連線時不得建立外部分享。
- Future preview hero / 狀態摘要卡必須是單層淡綠卡，可 wrap；不可在卡內再包另一層白色 panel。
- 邊界卡：授權碼未產生、醫師權限唯讀預留、報表來源 `/reports/basic` 預留、AI 成本 `0 次呼叫`。
- 啟用前條件：share token / authorization grant 產生與撤銷、doctor grant 授權範圍、bounded report query、audit log。
- 後端基礎說明：顯示為「後端基礎邊界」inline block，不使用 banner card 或額外白色 panel。
- 授權未啟用 badge/copy 與後端基礎邊界說明必須透過 bounded display helper 產生；不可在 JSX 內直接寫 future preview boundary 文案。
- 狀態按鈕：「查看授權碼狀態」、「查看報表邊界」。

互動：

- 從未來擴充清單進入時，返回應回到未來擴充清單。
- 點擊授權或報表狀態按鈕只顯示 integration status，不建立 profile grant、不產生 QR code、不產生 PDF、不呼叫 AI。
- 授權或報表狀態按鈕的回饋顯示為「醫師合作整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 醫師合作整合狀態文字必須先經 bounded display helper 再 render。
- 進入醫師合作 preview 時的整合狀態清除必須使用 shared reset helper，不可在 handler 內直接設定空字串。
- 醫師合作 preview 的 Header 返回與底部返回 CTA 必須使用 dedicated handler；handler 只回到既有 return target 並更新 bounded status，不建立 grant、不產生報表、不呼叫 backend / AI。
- 醫師合作 preview 內的帳號連線/不可分享說明必須透過 bounded display helper 產生；不可在 JSX 內直接依 account 條件組 user-facing copy。

### 4.14.3 HealthKit / Health Connect / 血糖機預覽頁

目前狀態：

- Future module / 本機預覽。
- 目前只顯示外部健康平台與血糖機匯入資料邊界，不請求 HealthKit / Health Connect 權限、不掃描 BLE、不讀取血糖機、不寫入 records。

頁面內容：

- 標題：「HealthKit / Health Connect / 血糖機」。
- Inline 說明：「串接未啟用」，不使用 banner card。
- 邊界卡：來源欄位 `meter / healthkit / health_connect`、同步批次 `import_batch_id` 預留、同步狀態 `pending / synced / failed`、AI 成本 `0 次呼叫`。
- 啟用前條件：使用者授權 / 撤權 / 資料刪除、external integration layer、import batch id、sync status、duplicate detection。
- 外部資料邊界：顯示為「外部資料邊界」inline block，不使用 banner card 或額外白色 panel。
- 串接未啟用 badge/copy 與外部資料邊界說明必須透過 bounded display helper 產生；不可在 JSX 內直接寫 future preview boundary 文案。
- 狀態按鈕：「查看平台權限狀態」、「查看血糖機同步狀態」。

互動：

- 從未來擴充清單進入時，返回應回到未來擴充清單。
- 點擊平台或血糖機同步狀態按鈕只顯示 integration status，不請求權限、不讀取外部健康資料、不掃描 BLE、不建立 import batch、不寫入 meter source 紀錄。
- 平台或血糖機同步狀態按鈕的回饋顯示為「健康串接整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 健康串接整合狀態文字必須先經 bounded display helper 再 render。
- 進入健康串接 preview 時的整合狀態清除必須使用 shared reset helper，不可在 handler 內直接設定空字串。
- 健康串接 preview 的 Header 返回與底部返回 CTA 必須使用 dedicated handler；handler 只回到既有 return target 並更新 bounded status，不請求權限、不讀取外部資料、不呼叫 backend / AI。
- 外部資料不可覆蓋手動紀錄；正式匯入後仍需保留來源、同步批次、同步狀態與去重證據。

### 4.14.4 社群預覽頁

目前狀態：

- Future module / 本機預覽。
- 目前顯示第二階段食物社群資料庫、公開資料邊界、使用者 opt-in、留言治理與內容安全需求，不建立貼文、不送出留言、不公開任何紀錄。
- Mobile 食物資料庫一般操作路徑會同步 backend food database；visual-smoke route 與 backend unavailable 時仍顯示本機 preview，不寫入 food database、不建立積分、不更新排行榜、不串接商城。Community / Food Community copy 必須區分 backend-ready 一般操作與 visual-smoke/backend-unavailable fallback，不可再宣稱食物資料庫「目前不查詢 backend」或食物分享「尚未啟用」。
- Backend 已有 `/community/foods/categories`、`/community/foods`、`/community/foods/{id}`、`/community/foods/shares` 與 `/community/leaderboards` contract；食物分享會 upsert food item、計算升糖幅度、寫入 share、給點數並更新排行榜聚合。
- Backend 已有 `/community/settings` 公開顯示名稱與 leaderboard opt-in contract；leaderboard 只顯示 opted-in accounts，且顯示公開社群名稱，不直接顯示 raw account display name。公開顯示名稱 trim 後不可為空白；空白更新必須回結構化 `community_display_name_blank`，且不可改變既有公開名稱或 opt-in 狀態。

頁面內容：

- 標題：「社群」。
- Inline 說明：「社群未啟用」，不使用 banner card。
- 食物血糖資料庫 preview 必須顯示大分類：蔬菜、肉類、海鮮、蛋類、豆類、澱粉類、飲料、水果、零食、保健食品；一般操作路徑會先同步 `/community/foods/categories` 的 backend label、該分類個別食物數與最多 3 個代表食物，backend unavailable 或 visual-smoke 時才使用本機 fallback。Backend integration test 必須直接驗證 `/community/foods/categories` 回傳這十個 code/label 且順序穩定，空分類回 `food_count: 0` 與空 `sample_foods`，有資料分類可回個別食物摘要。
- Mobile navigation verifier 必須同時檢查 mobile fallback、mobile API category mapper 與 backend `FOOD_CATEGORY_LABELS` 的十個食物大分類 parity；特別要守住 backend plural code（例如 `snacks`）與 mobile singular display id（例如 `snack`）的雙向 mapping。Verifier 也必須確認 mobile fallback `foodCommunityItems` 每個大分類至少有一個可點擊的個別食物項目，避免只剩分類 tab 而沒有資料庫內容。
- 食物搜尋可直接搜尋食物名稱，不必從分類進入；有搜尋文字且未指定 category 時 mobile 與 backend query 都必須跨分類搜尋，有指定 category 時只回該分類，沒有搜尋文字時才套用目前分類 tab。Backend query trim 後不可為空白，空白 query 必須回結構化 `food_query_blank`，不可被當成 wildcard 全資料查詢。Backend integration test 必須證明同分類同 normalized food name 會 upsert/聚合到同一 food item，不同分類同名食物會建立獨立 food item，避免大型升糖資料庫跨分類污染。一般操作路徑會同步 backend food database，visual-smoke route 與 backend unavailable 時才只篩選本機 preview。
- 食物列表項目可點擊選中，顯示食物資料頁；一般操作路徑點擊 backend food item 時會讀取 `/community/foods/{id}` 取得個別分享紀錄，visual-smoke 或本機 preview item 不呼叫 detail API。不存在的 backend food item 必須回結構化 `food_not_found`，不可讓 mobile 依賴 raw error string 判斷。
- 食物資料頁顯示：分享總人數、平均上升血糖、最高上升血糖、最低上升血糖、個別分享紀錄；平均 / 最高 / 最低上升血糖數值必須顯示 `mg/dL` 單位，列表摘要也必須顯示分享人數與平均上升血糖。食物血糖變化必須保留 signed delta，若食用後血糖低於食用前，backend 與 mobile 都不可把負值改顯示為 0；個別分享紀錄也必須優先使用 backend `glucose_delta` 並以 signed `mg/dL` 顯示「血糖變化」。個別分享紀錄必須依食用時間由新到舊呈現，避免最新實測資料被舊紀錄壓在後面。Backend integration test 必須直接覆蓋 `/community/foods/{id}` detail response、同食物多筆 share 聚合、個別分享欄位、個別分享排序、負向 `glucose_delta` 聚合，以及不帶 category 的 direct food-name search。Mobile navigation verifier 必須守住四個食物資料頁統計欄位、列表平均升糖摘要、mobile signed delta clamp、個別分享 signed delta 顯示，以及 backend detail shares 的 `eaten_at desc` 排序契約。
- 食物分享紀錄欄位：食物名稱、食用時間、食用前血糖、食用後血糖、血糖上升值、備註心得；食物名稱可由使用者直接輸入，空白時才 fallback 到目前選取食物；上升值由系統自動計算，且表單預覽必須用 signed clamp 顯示 `after_glucose - before_glucose`，不可把血糖下降改成 `0`。Mobile navigation verifier 必須守住 share form 顯示 `血糖上升值` 自動計算 row，且送出 `/community/foods/shares` payload 只能傳 `before_glucose` / `after_glucose`，不可傳 client-side `glucose_delta`。Backend API preflight 必須拒絕 client-supplied `glucose_delta`，回結構化 `food_glucose_delta_client_supplied`，且 response 不可 echo 食物名稱、心得或完整 input；mobile navigation verifier 也必須守住 backend preflight dependency、structured error code/message、schema 不可用 raw validation error 寫法，以及 server-calculated `glucose_delta=after-before`。Backend integration test 必須證明送入 `glucose_delta` 時回 422，且不可建立 food item、food share 或點數 ledger。正常 share success path 必須由 server 使用 `after_glucose - before_glucose` 自算並回寫 share/stats，不信任 client-provided rise value。Backend schema 必須 trim food name，拒絕全空白或非字串名稱；全空白食物名稱必須回結構化 `food_name_blank`，避免 mobile 依賴 raw validation message，且不可建立 food item、food share 或點數 ledger；optional 份量/心得全空白時正規化為 `null`，避免大型食物升糖資料庫保存空白公開欄位。食用時間不可在未來且必須包含 timezone；未來 `eaten_at` 必須回結構化 `invalid_record_time` 且 message 指向 `eaten_at`，缺 timezone 必須回結構化 `invalid_datetime` 且 `field=eaten_at`；上述 invalid `eaten_at` path 不可建立 food item、food share 或點數 ledger。
- 社群積分預留：分享資料得點數，完整前後血糖可加權，通過審核後可進排行榜。
- 社群排行榜：backend `/community/leaderboards` 必須支援分享次數排行、貢獻度排行、食物測試達人排行，且 integration test 必須驗證 opt-in 後三種榜單都會包含公開名稱與正確分數；未 opt-in 或後續 opt-out 時不得出現在公開榜單。食物測試達人分數必須以 distinct food item 計算，同食物重複分享只增加分享次數與貢獻度，不增加 food_tester 分數。同分榜單必須用公開顯示名稱與 account id 作穩定排序，避免公開排名在同分時漂移。
- Food Community 頁內排行榜小節標題必須是「社群排行榜」，不可再顯示「預留」或 `opt-in 尚未啟用`，因為一般操作路徑已可透過 backend 同步公開設定與三種榜單；未完成的仍是貼文治理、退出後歷史資料撤回與審核流程。
- 點數與商城串接預留：優惠券、商品折扣、特殊徽章、會員福利。
- 公開顯示名稱：一般操作路徑顯示 `/community/settings` 的 public display name，未同步時 fallback 到 bounded account display name；可由使用者更新。
- Future preview hero / 狀態摘要卡必須是單層淡綠卡，可 wrap；不可在卡內再包另一層白色 panel。
- 公開顯示名稱預覽的 account display name / fallback 必須透過 bounded display helper 產生；不可在 JSX 內直接依 account 條件組 fallback copy。
- 社群未啟用 badge/copy 與公開顯示名稱 boundary 說明必須透過 bounded display helper 產生；不可在 JSX 內直接寫 future preview boundary 文案。
- 食物分類、食物列表、食物資料頁、分享欄位、積分 rows 與排行榜 rows 必須在 render 前轉成 bounded display item；不可直接 render raw preview config。
- 邊界卡：健康紀錄預設私密、公開內容需 opt-in、留言治理需封鎖 / 檢舉 / 審核、AI 成本 `0 次呼叫`。
- 啟用前條件：公開 / 私密可見範圍、貼文留言治理、刪除撤回與 audit-friendly event stream；display name 與 leaderboard opt-in 已有 backend/mobile contract。
- 狀態按鈕：「查看食物分享狀態」、「查看發文狀態」、「查看隱私邊界」。

互動：

- 從未來擴充清單進入時，返回應回到未來擴充清單。
- 點擊食物分類或更新搜尋會重新同步 backend food database；visual-smoke route 不查詢 backend、不寫入資料庫。
- 點擊送出食物分享會在 protected backend ready 時寫入 food share、建立點數，並刷新商城點數 / 兌換券與社群排行榜資料；visual-smoke route 或 backend unavailable 時不得寫入 food database、點數或排行榜。Mobile navigation verifier 必須守住分享成功路徑同時觸發 store points refresh 與 leaderboard refresh。
- 食物分享送出 CTA 的 button label 與 accessibility label 必須先轉成 bounded display text；不可在 JSX 內直接寫送出分享 accessibility copy。
- 點擊排行榜 opt-in 會更新 `/community/settings`，更新成功後必須刷新 `/community/leaderboards`，讓公開榜單立即反映加入或退出；關閉後仍可分享食物與獲得點數，但不進公開 leaderboard。Mobile navigation verifier 必須守住公開設定 save path 會觸發 leaderboard refresh。
- 點擊發文或隱私狀態按鈕只顯示 integration status，不建立貼文、不送出留言、不公開健康紀錄。
- 發文或隱私狀態按鈕的回饋顯示為「社群整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 社群整合狀態文字必須先經 bounded display helper 再 render。
- 進入社群 preview 時的整合狀態清除必須使用 shared reset helper，不可在 handler 內直接設定空字串。
- 社群 preview 的 Header 返回與底部返回 CTA 必須使用 dedicated handler；handler 只回到既有 return target 並更新 bounded status，不建立貼文、不公開紀錄、不呼叫 backend / AI。

### 4.14.5 排行榜預覽頁

目前狀態：

- Future module / 公開榜單只讀。
- 一般操作路徑會同步 backend `/community/leaderboards` 的分享次數、貢獻度與食物測試達人榜單，只顯示 opt-in 使用者的公開名稱與非敏感分數；public leaderboard response 不可暴露 raw account id。
- Visual-smoke route 與 backend unavailable 時只用 mobile 已載入紀錄計算非敏感連續記錄天數，不公開排名、不寫 ranking stats、不呼叫 API。

頁面內容：

- 標題：「排行榜」。
- Inline 說明：「公開榜單」，不使用 banner card。
- 本機連續記錄預覽：顯示目前已載入紀錄推算出的連續天數。
- 公開榜單區塊：分享次數排行、貢獻度排行、食物測試達人排行；每筆只顯示排名、公開顯示名稱與對應非敏感分數，不顯示或傳遞 raw account id。
- Future preview hero / 狀態摘要卡必須是單層淡綠卡，可 wrap；不可在卡內再包另一層白色 panel。
- 本機連續記錄預覽天數必須使用 display-only clamped value；不可直接 render 未 bounded streak 計算結果。
- 公開榜單 badge/copy、本機連續記錄 preview boundary 說明與公開榜單 entries 必須透過 bounded display helper 產生；不可在 JSX 內直接寫 future preview boundary 文案或直接 render raw leaderboard payload。
- 邊界卡：公開排名預設關閉、排名資料只允許非敏感統計、健康數值不可公開、AI 成本 `0 次呼叫`。
- 啟用前條件：public ranking opt-in / opt-out、ranking stats structure、公開顯示名稱、封鎖 / 檢舉、退出後歷史資料撤回與 audit event。
- 狀態按鈕：「查看排名狀態」、「查看 Opt-in 邊界」。

互動：

- 從未來擴充清單進入時，返回應回到未來擴充清單。
- 點擊排名狀態按鈕會同步 `/community/leaderboards`；點擊排行榜 opt-in 按鈕必須走 `/community/settings` 更新公開排名 opt-in，並沿用 community settings 成功後刷新 leaderboard 的 path，不建立 ranking stats、不上傳 streak、不公開健康數值。
- 排名或 opt-in 狀態按鈕的回饋顯示為「排行榜整合狀態」inline status，不使用 banner card 或額外白色 panel。
- 排行榜整合狀態文字必須先經 bounded display helper 再 render。
- 進入排行榜 preview 時的整合狀態清除必須使用 shared reset helper，不可在 handler 內直接設定空字串。
- 排行榜 preview 的 Header 返回與底部返回 CTA 必須使用 dedicated handler；handler 只回到既有 return target 並更新 bounded status，不建立排名資料、不呼叫 backend / AI。

### 4.15 文字確認頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「確認目前輸入或本機 Whisper 轉出的紀錄文字，若有錯誤可直接修改。」。
- 右上角：menu 按鈕。

主要輸入框：

- 大型白色文字框。
- 圓角邊框。
- 內容範例：「昨天晚餐後兩小時血糖 168，晚餐吃火鍋，飯後走路 20 分鐘。」。

底部按鈕：

- 左側白底綠框：「重新輸入」。
- 右側綠色主按鈕：「下一步整理」。

底部提示：

- 固定整理前提示使用 inline guidance，不使用 banner card 或額外白色 panel。
- 「確認後，AI 會幫你整理成血糖、飲食與運動紀錄。」。
- 本次成本邊界 inline checklist：
  - 空文字、過長文字或範例文字不送 parser。
  - 下一步整理只送目前這段文字一次，不批次載入歷史紀錄。
  - 手動新增可完全避開 AI parser，適合補登明確紀錄。
  - backend 未 ready 時不可送 parser，避免無效重試與額外成本。
- 文字輸入與文字確認欄位必須同時使用 input-level `maxLength` 與 setter-level 截斷，避免超長 transcript 先進入 mobile state 再由 validation 擋下。
- 文字輸入、文字確認與 parser recovery 的 validation/status 顯示文字必須先經 bounded display helper 再 render；disabled 判斷仍依原始 validation 結果。
- 進入文字確認、返回修改與重新輸入清空文字的狀態文字必須透過 bounded display helper 產生；不可在 handler 或 Pressable 內直接組文字確認流程 status。
- 文字確認頁返回與重新輸入必須使用 dedicated handler：返回保留目前文字但清掉 parser preview / 編輯 / 移除候選狀態；重新輸入清空文字、範例旗標、錄音預覽與候選狀態後回到來源頁。兩者都不可呼叫 AI / STT / Vision、不可寫入紀錄、不可在 JSX handler 內直接堆疊多個 state 操作。
- 文字確認頁 parser recovery 的手動新增 CTA 必須使用 dedicated handler；handler 清掉候選編輯 / 移除暫存後進入手動新增，不重送 parser、不呼叫 AI / LLM / STT、不送 backend write request。
- 文字確認頁的 backend unavailable 與 parser model unavailable 警告必須先轉成 bounded display text；不可在 JSX 內直接組 protected backend 或 model unavailable message。
- 文字確認頁的成本邊界 checklist 必須在 render 前轉成 bounded display item；不可在 JSX 內直接 map raw checklist 文案。
- 文字確認頁的 intro、整理前提示、範例文字 warning 與本機 preflight passed 狀態必須透過 bounded display helper 產生；不可在 JSX 內直接寫固定 parser/STT/cost guidance。
- `parseTranscript` handler 本身必須 fail-closed：若 protected backend 尚未 ready，即使被間接呼叫也只更新安全狀態文字並停留在文字確認頁，不送 `/ai/parse-preview`。
- `parseTranscript` handler 本身也必須檢查目前 STT / LLM model option 是否存在且 available；模型尚未載入或未啟用時只更新安全狀態文字，不送 `/ai/parse-preview`。
- 文字確認送出整理、AI 儲存確認、手動建立、正式紀錄更新與正式紀錄刪除都必須走 dedicated submit handler；不可在 JSX Pressable 內直接呼叫 `parseTranscript`、`savePreviewRecords`、`createManualRecord`、`updateSelectedRecord` 或 `deleteSelectedRecord`。
- Parser model readiness copy 必須透過 bounded display helper 產生；LLM/STT label 來自 backend model list 時必須先 bounded，再組成「尚未載入 / 尚未啟用」狀態文字。
- parser submit 的阻擋、進行中、成功、失敗與 recovery 狀態文字必須透過 bounded display helper 產生；成功候選筆數必須先 clamp，不可在 handler 內直接把 raw count 組進 UI status。

互動：

- 使用者可直接編輯文字。
- 重新輸入會清空目前文字並回到輸入來源頁。
- 下一步整理進入 AI 結構化確認頁。
- 下一步整理按鈕在 backend protected API 未 ready、目前文字不合法、範例文字、或目前 STT / LLM model unavailable 時都必須 disabled。

### 4.16 AI 整理確認頁

頁面內容：

- 標題：「糖錄錄」。
- 副標：「AI 已幫你整理完成，請確認資料是否正確。」。
- 右上角：menu 按鈕。

資料卡片列表：

- 成本邊界 inline checklist，不使用 banner card：
  - 此頁只顯示 parser 已回傳的候選紀錄。
  - 逐筆編輯、移除或進入儲存確認都不會重新呼叫 AI。
  - 未建立片段不會自動儲存，也不會自動重跑 parser。
  - 返回修改後，只有再次按下一步整理才會產生新的 parser / AI 成本。
  - mobile 不保留 raw prompt、raw model output 或模型 debug trace。
- parser preview response 寫入 mobile state 前必須 bounded：不保留 transcript / normalized_text raw echo，segments / candidate records / rejected events 有固定筆數上限，id/type/source/reason/decision trace/source text 都有固定欄位長度上限。
- AI 整理確認頁的成本邊界 checklist 必須在 render 前轉成 bounded display item；不可在 JSX 內直接 map raw checklist 文案。
- AI 候選卡的日期標籤、payload 摘要、source_text、decision trace、rejected event text/reason 與 confidence percent 必須在 render 前 bounded/clamped；不可直接 render raw metadata 或未 clamp 的信心分數。
- AI 整理確認頁的 rejected event 顯示列必須先轉成 bounded display item；source text 與 reason label 不可在 JSX 內直接呼叫 helper 後 render。
- Rejected event 外層使用開放式 inline stack；只有單筆 rejected event 使用淡色警示列，避免 warning panel 裡再包白色卡片。
- AI 整理確認、AI 儲存確認、AI 候選移除確認與候選編輯標題必須共用候選 display item；raw candidate record / index 只可用於編輯、移除與儲存行為，不可直接作為 UI 顯示文字來源。
- AI 整理確認頁的 0 候選空狀態與尚未產生 preview 空狀態文案必須透過 bounded display helper 產生；不可在 JSX 中直接寫固定空狀態 copy。
- AI 整理確認頁的 0 候選手動新增 CTA 與尚未產生 preview 的返回文字確認 CTA 必須使用 dedicated handler；handler 清掉候選編輯 / 移除暫存並只更新 App 內導覽與 bounded status，不重新呼叫 AI / LLM / STT、不送 backend request。
- AI 整理確認頁的 intro、低信心提醒、未建立片段說明、未建立原因顯示與 backend 未連線提醒必須透過 bounded display helper 產生；rejected reason label 需先 bounded 再組成顯示文字。
- AI 整理確認、AI 儲存確認、候選移除確認、AI 儲存失敗與文字確認頁的導覽 / 送出 / fallback CTA 必須有 render 前 bounded accessibility label 與 `accessibilityRole="button"`；label 必須區分只導覽、不重新呼叫 AI、不送 backend、送 parser、送 backend save、或只移除未儲存候選的邊界。disabled 的儲存確認、返回儲存確認與 parser 送出 CTA 必須提供 accessibility disabled state。
- 日期時間：昨天 晚上 8:30，右側編輯 icon。
- 血糖：飯後兩小時 `168 mg/dL`，右側編輯 icon。
- 飲食：火鍋，右側編輯 icon。
- 運動：走路 20 分鐘，右側編輯 icon。
- 若候選紀錄已被移除到 0 筆，不顯示日期時間確認卡，只顯示空狀態、返回修改與手動新增入口。

底部主按鈕：「進入儲存確認」。

- 此按鈕只導向 AI 儲存確認頁，不直接建立紀錄、不送出 backend 儲存請求。
- AI 整理確認頁的候選筆數顯示必須使用 display-only clamped value；是否可進入儲存確認仍依目前 preview records 實際長度判斷。

底部文字按鈕：「返回修改」。

互動：

- 點擊單一卡片的編輯 icon 可修改該項目。
- 修改候選紀錄頁的血糖、飲食、運動、用藥、備註與 fallback JSON 欄位必須同時使用 input-level `maxLength` 與 setter-level 截斷，避免未儲存候選在確認流程中累積過長文字。
- 修改候選紀錄頁的日期與時間欄位也必須使用固定長度上限與 setter-level 截斷。
- 修改或移除候選紀錄後，更新後的 preview state 仍必須重新套用 parser preview bounds，避免編輯流程繞過 response boundary。
- 修改或移除候選紀錄時的開啟編輯、移除確認、移除結果、編輯成功與編輯失敗狀態文字必須透過 bounded display helper 產生；移除後剩餘候選筆數必須先 clamp，不可在 handler 內直接把 raw count 組進 UI status。
- 修改候選紀錄頁的未儲存候選 boundary copy 必須透過 bounded display helper 產生；不可在 JSX 中直接寫固定資料庫/確認儲存提示。
- 修改候選紀錄頁的 Header 返回與取消都必須使用 dedicated handler；handler 清除 candidate edit / pending remove 暫存 state，保留候選紀錄並回到 AI 整理確認頁，不呼叫 AI / LLM / STT / Vision、不送 backend request。
- 點擊移除進入 AI 候選移除確認頁，不直接刪除候選紀錄。
- 修改候選紀錄頁的返回按鈕應回到 AI 整理確認頁，不回到原始輸入頁，避免中斷確認流程。
- 點擊確認儲存後，先進入 AI 儲存確認頁，不直接寫入紀錄。
- 點擊返回修改回到文字確認頁。

### 4.16.0 AI 候選移除確認頁

功能：

- 在移除單筆 AI 候選紀錄前，提供 App 內確認。
- 讓使用者理解這是移除尚未儲存的候選，不是刪除正式紀錄。
- 避免使用系統 Alert 作為主要確認 UI。

頁面內容：

- 標題：「移除候選紀錄」。
- Inline 說明：「只會移除待確認候選」，不使用 warning card。
- 候選紀錄卡：
  - 顯示紀錄類型、摘要內容、信心分數、`source: AI candidate`。
  - 信心分數必須使用 clamped display percent，summary 仍使用 bounded payload summary。
- Inline 說明 label/copy 與候選卡的信心/source 顯示必須透過 bounded display helper 產生；不可在 JSX 內直接組 confidence percent 或 source label。
- 移除範圍說明使用 inline boundary block，不使用白色卡片或額外 panel：
  - 只影響目前 AI 整理確認清單。
  - 已經儲存的正式紀錄不受影響。
  - 若移除錯誤，可返回文字確認頁重新整理；這會重新產生 parser / AI 成本。

底部按鈕：

- 次按鈕：「取消」，回到 AI 整理確認頁。
- 危險按鈕：「確認移除」，從目前候選清單移除該筆資料。

互動：

- 確認移除後回到 AI 整理確認頁。
- 返回與取消都必須走專用 handler，清除 pending remove / candidate edit state，保留候選紀錄並回到 AI 整理確認頁。
- 此頁不呼叫刪除 API、不寫入資料庫、不呼叫 parser、不產生 AI / LLM 呼叫。

### 4.16.1 AI 儲存確認頁

功能：

- 在多筆 AI 候選紀錄寫入前，提供最後一次 App 內確認。
- 明確顯示本次只會儲存目前候選紀錄，不會重新呼叫 AI 或 LLM。
- 保留使用者返回 AI 整理確認頁逐筆編輯的路徑。

頁面內容：

- 標題：「確認儲存」。
- Inline 說明：「儲存前確認」，不使用 banner card。
- 摘要指標：
  - 候選紀錄筆數。
  - 低信心候選紀錄筆數。
  - 未建立片段筆數。
  - 額外 AI 成本：0 次呼叫。
- 候選紀錄、低信心候選、未建立片段與送出前檢查中的動態筆數必須先 clamp，再經 bounded checklist/display helper render；儲存條件仍依 preview records 實際長度判斷。
- 若低信心候選紀錄筆數大於 0，顯示「低信心候選提醒」inline block，建議返回確認逐筆檢查；返回確認不可重新呼叫 AI。
- 若未建立片段筆數大於 0，顯示「未建立片段提醒」inline block，說明確認儲存只會送出目前候選，不會儲存未建立片段，也不會自動重新呼叫 AI。
- 若 backend account / profile / protected auth 尚未 ready，顯示「儲存連線狀態」inline block；此狀態不會送出儲存請求，避免無效重試與重複寫入。
- AI 儲存確認頁的低信心提醒、未建立片段提醒與儲存連線狀態必須先轉成 bounded display text；不可在 JSX 內直接插入筆數或 backend unavailable message 組長句。
- AI 儲存確認頁的 intro copy 與主按鈕狀態 label 必須透過 bounded display helper 產生；busy、backend blocked、warning 與正常狀態只改顯示 label，不改送出條件。
- 從 AI 整理確認進入 AI 儲存確認、以及從 AI 儲存確認返回 AI 整理確認，都必須使用 dedicated handler；進入時清掉舊 save error、候選編輯與移除狀態，返回時保留候選但清掉 save error / 候選編輯 / 移除狀態。這些導覽不可直接在 JSX 裡 `setCurrentScreen`，不可呼叫 AI / LLM / STT / Vision，也不可送出 backend 儲存。
- AI 儲存送出後的進行中、成功、失敗、records status、成功摘要與部分成功摘要文字必須透過 bounded display helper 產生；所有顯示筆數必須先 clamp，不可在 save handler 內直接把 raw count 組進 UI status。
- 送出前檢查：
  - 只會儲存目前畫面上的候選紀錄。
  - 顯示本次候選 payload 筆數，不批次載入完整歷史。
  - 送往 backend 的內容以確認後資料為主，不附帶整段紀錄歷史或模型 debug trace。
  - 不會儲存未建立片段，也不會自動重新呼叫 AI。
  - 每筆紀錄仍會經過後端驗證、權限與 audit 路徑。
  - 若部分儲存失敗，已成功紀錄會保留，未儲存候選會回到確認流程。
  - 使用 inline checklist，不使用白色卡片，避免在儲存候選列表外再形成 nested panel。
- AI 儲存失敗頁顯示保留候選筆數時也必須使用 display-only clamped value，並用 bounded checklist render。
- 候選紀錄列表：
  - 顯示紀錄類型、摘要內容、信心分數。
  - 低信心候選紀錄以警示文字標示。

底部按鈕：

- 次按鈕：「返回確認」，回到 AI 整理確認頁。
- 主按鈕：「確認儲存」，送出目前候選紀錄。
- 若有低信心候選或未建立片段提醒，主按鈕文案改為「了解提醒並儲存候選」，但仍只送出目前候選，不重新呼叫 AI。
- 若 backend protected API 尚未 ready，主按鈕 disabled 並顯示「等待 backend 連線」。

互動：

- 沒有 backend account、沒有 active profile、protected auth 不可用或正在儲存時，主按鈕 disabled。
- 儲存 handler 本身也必須 fail-closed：若 protected backend 尚未 ready，即使被間接呼叫也只更新安全狀態文字，不送 `/records`。
- 沒有候選紀錄時，主按鈕 disabled。
- 儲存成功後進入儲存完成頁。
- 若沒有任何候選紀錄儲存成功，進入 AI 儲存失敗頁，不停留在只有 status 文字的狀態。
- 此頁不新增後端 endpoint、不新增資料結構、不重新執行 parser、不產生 AI / LLM 呼叫。

### 4.16.2 AI 儲存失敗頁

功能：

- 在 AI 候選紀錄全數儲存失敗時提供明確狀態與下一步。
- 保留候選紀錄在確認流程，不自動重試、不重新呼叫 parser / AI。

頁面內容：

- 標題：「儲存未完成」。
- 錯誤摘要：顯示安全處理後的 UI 錯誤訊息，不顯示 request body、payload、raw transcript、raw prompt 或 raw model output。
- 失敗後邊界 inline checklist：
  - 顯示目前保留的候選紀錄筆數。
  - 系統不會自動重試，也不會重新呼叫 parser / AI。
  - 可返回儲存確認後再送出，或回 AI 整理確認逐筆編輯。
  - backend 持續不可用時可改用手動新增單筆明確紀錄。

底部按鈕：

- 次按鈕：「回 AI 確認」。
- 次按鈕：「手動新增」；完成或返回後應回到 AI 整理確認頁，不回到儲存失敗頁，避免使用者卡在錯誤狀態。
- 主按鈕：「返回儲存確認」。

互動：

- 「回 AI 確認」、「返回儲存確認」與「手動新增」都必須使用 dedicated handler。回 AI 確認與返回儲存確認必須清掉 stale save error / 候選編輯 / 移除狀態並保留候選紀錄；手動 fallback 必須清掉候選編輯 / 移除狀態，保留 AI 候選在確認流程，進入手動表單，且不可呼叫 AI / LLM / STT / Vision、不可自動重試 backend save。
- 此頁不新增 backend request、不自動 retry、不呼叫 parser、不產生 AI / LLM 呼叫。
- 此頁的頂部返回與 MVP flow stepper 都保留在「儲存確認」階段，避免把失敗頁當成新的資料處理階段。
- 沒有候選紀錄時，「返回儲存確認」disabled。

## 5. 建議資料模型

```json
{
  "user": {
    "name": "王小華",
    "loginMethod": "phone",
    "phoneMasked": "09xx xxx xxx",
    "subscriptionStatus": "trial",
    "trialDaysLeft": 2,
    "dailyRecordingMinutesLeft": 7
  },
  "record": {
    "id": "record_001",
    "date": "2026-04-29",
    "time": "08:10",
    "type": "blood_glucose",
    "glucoseValue": 138,
    "unit": "mg/dL",
    "context": "fasting",
    "meal": "水煮蛋 2 顆、熱狗 1 根",
    "exercise": "無",
    "medication": "已服用",
    "note": ""
  }
}
```

## 6. Navigation Map

```text
首頁
├── 今日紀錄卡片 -> 記錄詳情
│   ├── 編輯 -> 編輯記錄
│   └── 刪除 -> 刪除確認 -> 刪除完成
├── 查看分析 -> 基本分析
├── menu -> 功能選單
├── 手動新增 -> 手動新增確認 -> 儲存完成
└── 語音記錄 -> 語音文字確認 -> AI 整理確認 -> AI 儲存確認 -> 儲存完成
    └── AI 整理確認 -> AI 候選移除確認 -> AI 整理確認

儲存完成
├── AI 確認全數儲存成功 -> 返回目標預設為今日紀錄
├── AI 確認部分儲存成功但仍有候選紀錄 -> 返回目標保留在 AI 整理確認
└── 手動新增儲存成功 -> 返回目標保留手動新增的來源頁；繼續手動新增時也沿用同一來源

儲存完成頁需顯示儲存後邊界：
- 儲存結果說明使用 inline 狀態文字，不使用 banner card 或額外白色 panel。
- 儲存完成與儲存失敗摘要文字必須先經 bounded display helper 再 render，避免 backend/save failure copy 過長。
- 若 AI 確認只有部分候選紀錄儲存成功，標題需顯示「部分儲存完成」，不可只顯示「儲存完成」。
- 若仍有未儲存 AI 候選，成功頁底部主按鈕需顯示「處理未儲存候選」並回到 AI 整理確認頁；不可讓「回今日紀錄」成為此狀態的主要 CTA。
- 「處理未儲存候選」與成功頁快捷卡必須使用 dedicated handler；處理未儲存候選時保留候選紀錄但清掉 stale save error / 候選編輯 / 移除狀態，快捷卡導覽也必須先清理 stale save/edit/remove 狀態。這些 handler 不可呼叫 AI / LLM / STT / Vision、不可送出 backend 儲存，也不可在 JSX 內直接 `setCurrentScreen`。
- 成功頁底部的繼續手動新增、繼續記錄、語音 / 文字、查看詳情與回今日紀錄 CTA 也必須使用 dedicated handler；handler 需清理 stale save/edit/remove 狀態、只更新 App 內導覽與 bounded status，不呼叫 AI / LLM / STT / Vision，也不送出 backend 儲存。
- 若仍有未儲存 AI 候選，成功頁快捷卡中的「返回確認」需排在今日 / 歷史 / 分析之前，避免使用者先被導向資料瀏覽頁。
- 若仍有未儲存 AI 候選，成功頁底部不可顯示「繼續手動新增」、「繼續記錄」或「語音 / 文字」新增入口；改顯示 inline 提示「請先處理未儲存 AI 候選」。此候選優先處理行為必須由 navigation verifier 固定檢查，避免結果頁重構後讓新增入口越過未儲存候選。
- 手動新增沒有 parser / LLM 成本，也沒有 AI 候選紀錄需要保留。
- 若手動新增是從 AI 儲存失敗頁進入，成功頁標題需顯示「手動儲存完成」，並說明原本 AI 候選仍保留在確認流程，不可寫成沒有 AI 候選需要保留。
- 若手動 fallback 成功後仍有 AI 候選，成功頁需保留 MVP flow stepper，讓使用者理解目前仍在 AI 確認/儲存流程中；一般手動新增成功則不顯示 stepper。
- AI 儲存成功後清空目前輸入與 AI 原始文字，不保留 raw prompt、raw model output 或 debug trace。
- 若仍有未儲存候選紀錄，只保留在確認流程，系統不自動重試、不重新呼叫 AI。
- 回到今日 / 歷史 / 分析只使用已同步紀錄，mobile 單次同步仍需受 `mobileRecordSyncLimit` 限制。
- 成功頁本身不新增 backend request，除非使用者主動進入其他頁面觸發既有同步。

功能選單
├── 今日紀錄 -> 首頁
├── 歷史紀錄 -> 歷史紀錄頁
├── 基本分析 -> 基本分析頁
├── 會員方案 -> 會員方案頁
├── 成就榜 -> 成就榜頁
├── 年度回顧 -> 年度回顧頁
├── 商城 -> 商城頁
└── 設定 -> 設定頁

Header 行為規則：
- 主頁右上角漢堡按鈕開啟功能選單時，功能選單的 X 返回原本主頁。
- 子頁 header 若顯示返回箭頭且目標是功能選單，必須直接回到既有功能選單，不可重新把功能選單當成 modal 開啟，避免按 X 又回到剛離開的子頁。
- Header 的漢堡 / 返回 / 關閉符號與各頁 X close button 必須提供 concise Traditional Chinese `accessibilityLabel`；不可只讓輔助工具讀到符號。
- 所有 mobile `Pressable` opening tag 都必須有明確 `accessibilityLabel` 與 `accessibilityRole="button"`；label 必須靜態或 bounded，不可包含 PHI、raw record payload、backend/raw model 內容、secret 或 token。這包含 header/close、錄音按鈕、tabs/chips、功能選單卡、查看更多功能、開發測試重置、商城商品箭頭、食物拍照 upload 區與所有底部返回 CTA。`Pressable` 的 `accessibilityLabel` 來源只可使用短靜態字串、bounded display label object、render 前產生的 `*.accessibilityLabel` display item 欄位，或命名的 bounded accessibility label 變數；不可在 JSX label 內使用 inline template、helper call、raw state、backend/config/model value 或 record payload。任何帶有 `disabled=` 的 `Pressable` 也必須提供對應且條件一致的 `accessibilityState` disabled state，讓視覺 disabled、實際 disabled prop 與輔助工具狀態一致。
- 主要導覽卡與多頁入口 Pressable 必須標示 `accessibilityRole="button"`，至少包含 primary tabs、Record quick-entry、功能選單卡、查看更多功能、Future Modules 清單卡、result-page destination cards、設定帳號卡與設定列表 rows。Home 頁只保留大型 mic Pressable。
- Primary tabs、segmented pills 與 selection chips 若使用 selected/active 視覺樣式，也必須提供條件一致的 `accessibilityState.selected`；錄音中的 active 狀態不當作 selected option。
- 所有 mobile `TextInput` 必須有 concise Traditional Chinese `accessibilityLabel` 與 `maxLength`；不可只依靠 placeholder、相鄰 label 或 handler 內 bounding。輸入欄位 label 必須是短靜態文字或 render 前 bounded 的 `auxiliaryDisplayLabels.*` reference，不可包含 PHI、raw transcript、raw model output、secret、token、raw backend/config value 或 inline template。`maxLength` 必須對應既有 bounded update wrapper 的長度上限，避免未來新增欄位時讓 raw transcript、backend/config string、本機模型路徑或搜尋字串繞過元件層硬限制。任何帶有 `editable=` 的 `TextInput` 也必須提供對應且條件一致的 `accessibilityState` disabled state，讓 busy/disabled 視覺狀態、實際 editable prop 與輔助工具狀態一致。所有 `TextInput` 必須明確設定 `autoCapitalize="none"` 與 `autoCorrect={false}`，避免行動鍵盤自動改寫日期、JSON、藥名、模型路徑、搜尋字串或待整理 transcript。血糖值與運動分鐘數等 structured numeric inputs 必須使用 `keyboardType="numeric"`，搭配既有 bounded update wrapper 與提交前範圍驗證。任何 `multiline` TextInput 必須設定 `textAlignVertical="top"`，並使用已命名的高度邊界 style（`homeTranscriptInput`、`transcriptInput`、`transcriptReviewInput`、`jsonInput` 或 `multilineField`）；這些 style 必須維持明確 `minHeight` 與 `lineHeight`，讓 transcript、飲食內容、tags 與 fallback JSON 在 Android/iOS 上維持可預期的長文字輸入佈局。
- Compact controls 的 touch target 不可過小；header menu button、close button、tab pill、chip、segmented pill、primary/secondary/danger button、more button、分析圖表點位與商品圓形箭頭至少應有 44px 等級的可點擊高度或尺寸。純 icon control 例如 header menu、close 與商品圓形箭頭必須同時檢查 width 與 height；分析圖表點位需保留至少 44px 點擊寬度，並讓 selected accessibility state 與 selected visual stem/point 同步。
- 互動卡片與 row Pressable，例如 account card、settings row、timeline/history row、AI review row、post-save destination card、future/detail record card、menu card 與 food photo upload box，也必須有明確 `minHeight` 或固定高度，不可只靠當前文字內容撐出可點擊區。
- 所有 mobile `ScrollView` 必須設定 `keyboardShouldPersistTaps="handled"`，讓使用者在鍵盤開啟時仍可點按 CTA、tabs、chips、模型選項或返回控制，不因鍵盤 dismissal 吞掉操作。
- 主表單 `ScrollView` 必須包在 `KeyboardAvoidingView` 中，使用 iOS `padding` / Android `height` behavior 與 `flex: 1` root style，避免鍵盤遮住 transcript、手動新增、編輯、設定與 native debug form 的輸入欄位或底部 CTA。
- 小螢幕上卡片 row 與 header row 必須允許長文字換行或 shrink；section header、record header、comparison row、quota stats、achievement/product/year badge row 不可用固定單行擠壓主要內容。
- 共用的 empty state、timeline card、account card、flow stepper、subscription status card 與 plan card header 都必須支援 wrap；這些是單層可掃描物件，不可因固定橫排讓文字被擠壓或造成二層 panel 感。
- 修改 `AppScreen`、`screenChrome`、功能選單、未來模組 target 或 shared preview return CTA 時，必須跑 `npm run verify:navigation` in `mobile/`，確認 screen coverage、menu destinations、menu return behavior 與 preview return CTA 沒有回歸。
- 成就榜、年度回顧、商城、食物拍照分析等可從 Menu 或未來擴充進入的 preview 頁，底部也必須有明確返回 CTA；從 Menu 進入顯示回功能選單，從未來擴充進入顯示回未來擴充。

未來擴充
├── 醫師 / 醫院合作 -> 醫師 / 醫院合作預覽頁
├── 社群 -> 社群預覽頁
├── 成就榜 / 徽章 -> 成就榜頁
├── 排行榜 -> 排行榜預覽頁
├── 年度回顧 -> 年度回顧頁
├── 商城 -> 商城頁
├── 食物拍照辨識 -> 食物拍照分析頁
├── 血糖機 / HealthKit / Health Connect -> HealthKit / Health Connect / 血糖機預覽頁
└── 其他預留模組 -> 未來模組詳情頁

設定
├── 登入狀態 / 帳號卡 -> 帳號與登入安全
├── 個人資料 -> 個人資料頁
├── 提醒設定 -> 提醒設定頁
├── 錄音額度 -> 錄音額度頁
├── 通知與隱私 -> 通知與隱私頁
├── 使用教學
└── 訂閱管理 -> 訂閱管理頁
```

## 7. AI 實作 Prompt 範本

```text
Create a mobile health tracking app UI in Traditional Chinese named「糖錄錄」.
The app helps users record blood glucose, meals, exercise, medication, and notes through text input, manual entry, and a hold-to-record preview. AI organization must produce editable candidate records only; nothing is saved until the user confirms.

Visual style:
Clean modern iOS design, white background, soft mint green accents, dark forest green headings, rounded cards, gentle shadows, large spacing, friendly health focused style. Use Traditional Chinese text. Use pill tabs, circular icon backgrounds, soft green gradient buttons, and rounded white cards only for real scannable objects such as records, metrics, product rows, forms, charts, and action surfaces. Use open inline boundary text for disabled, preview-only, privacy, cost, entitlement, and integration-status explanations; do not wrap those explanations in banner cards or nested panels.

Main screens:
1. Today home showing only the app title/header menu, an icon-only large hold-to-record microphone button, and light hint text「按住開始說話記錄」「放開即結束」.
2. History screen with month calendar mode, lit dates for days with records, dim dates for empty days, selected-date AI-organized records first, and an original speech-to-text view.
3. Analytics screen with 本週／本月／自訂日期區間 tabs, bounded custom start/end date inputs, blood glucose trend line chart, summary cards for highest glucose, lowest glucose, average glucose, total glucose measurements, before-meal count, after-meal count, and bounded detailed-report view that shows data source, AI cost 0, query limit, and no-medical-advice boundary.
4. Subscription screen with trial and yearly membership plan, feature comparison table, inline payment-disconnected boundary text, and「查看試用整合狀態」button until store payment is wired.
5. Menu screen with grid shortcuts: 今日錄音, 歷史紀錄, 基本分析, 成就榜, 年度回顧, 商城, 食物社群（預留）, 社群排行（預留）, 設定.
6. Settings screen with user profile, personal info, reminders, recording quota, privacy, tutorial, subscription management, and「清除本機狀態」button until production logout/token revoke is wired; keep Backend URL, model selection, and Dev Client tools collapsed under advanced settings.
7. Record detail screen showing date, time, type, status, value, note, exercise, medication, with edit and delete buttons.
8. Edit record form with date, time, type, glucose value, context, meal, exercise, medication, note, save and cancel.
9. Tutorial screen explaining four steps: hold-to-record preview, use/edit text input, confirm AI candidate records, save complete.
10. Membership status screen showing trial ending in 2 days and yearly subscription price NT$1,490.
11. Achievement screen showing unlocked achievements, completed badges, locked badges, progress bars.
12. Yearly review preview screen showing annual statistics and「查看分享整合狀態」button until share image/privacy masking are wired.
13. Store preview screen with search, categories, product cards, inline commerce-preview boundary text, and「查看購物車整合狀態」button until cart/checkout/payment are wired.
14. Food photo analysis preview screen with upload area, inline Vision-not-wired boundary text, and empty analysis state until camera/upload/Vision are wired.
15. Text confirmation screen with editable text and buttons「重新輸入」and「下一步整理」; local Whisper transcripts can enter here, but users must confirm before AI organization or save.
16. AI organized confirmation screen showing structured cards for date/time, glucose, meal, exercise, each editable, with「確認儲存」button.

Use consistent spacing, rounded corners, mint green icons, and large readable Chinese typography.
```

## 8. MVP / Future 邊界

MVP 必須優先完成：

- 首頁 / 今日紀錄。
- 文字確認頁。
- AI 整理確認頁。
- 歷史紀錄頁。
- 基本分析頁。
- 記錄詳情與編輯。
- 會員方案與錄音額度提示。
- 設定頁基本入口。

Future 預留但不阻塞 MVP：

- 成就榜。
- 年度回顧。
- 商城。
- 食物拍照分析。
- 醫師 / 醫院合作。
- 社群與排行榜。
- Future module 卡片在尚未有預覽頁時仍可點擊，但只能顯示「查看整合狀態」與啟用前條件，不可呼叫 backend、AI、外部平台或寫入資料。
