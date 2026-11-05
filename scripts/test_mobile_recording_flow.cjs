// Run the real App handlers with isolated audio/React state doubles, without a device or API.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../mobile/node_modules/typescript");

const root = path.resolve(__dirname, "..");
const appText = fs.readFileSync(path.join(root, "mobile/App.tsx"), "utf8");
const appAst = ts.createSourceFile("App.tsx", appText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const names = new Set([
  "startRecordingPreview", "showRecordingFeedback", "clearRecordingPreviewRuntime",
  "resetRecordingPreview", "transcribeRecordingToReview", "handleRecordingResultPrimaryAction",
  "finishRecordingPreview", "releaseRecordingPreview", "openWhisperModelDownloadPrompt",
  "downloadWhisperModelFromSettings", "fillDevelopmentTranscript",
  "updateTranscriptDraft", "clearParserPreviewState", "isParserSampleTranscriptBlocked",
]);
const handlers = [];
function collect(node) {
  if (ts.isFunctionDeclaration(node) && node.name && names.has(node.name.text)) handlers.push(node.getText(appAst));
  ts.forEachChild(node, collect);
}
collect(appAst);
assert.equal(handlers.length, names.size, "Every tested handler must come from the current App source");
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const copy = { exports: {} };
vm.runInNewContext(compile(fs.readFileSync(path.join(root, "mobile/recordingCopy.ts"), "utf8")), copy);

function harness(overrides = {}) {
  const calls = { record: 0, stop: 0, release: 0, transcribe: 0, alerts: 0, audioModes: [], scroll: 0 };
  const forbidden = () => { throw new Error("Recording/input must not call parser or save automatically"); };
  const ctx = {
    ...copy.exports,
    isAnyRequestInFlight: false, isRecordingPreview: false, isBusy: false,
    recordingStartInFlight: { current: false }, recordingStopInFlight: { current: false },
    recordingPressReleased: { current: false }, recordingStartedAtRef: { current: null },
    audioRecordingRef: { current: null }, recordingAudioUriRef: { current: null },
    recordingNativeTranscriptRef: { current: "" }, recordingWhisperModelPathRef: { current: "" },
    recordingElapsedSeconds: 0,
    recordingFeedback: "", transcript: "", isTranscriptSample: false, transcriptVoiceSeconds: 0,
    enableDevTranscriptSample: true, currentScreen: "today", voiceQuota: null,
    whisperModelPath: "/synthetic/model.bin", downloadedModels: [],
    defaultWhisperModel: { fileName: "ggml-base-q5_1.bin", sizeLabel: "約 57 MiB" },
    audioPath: "", now: 1000, sampleText: "測試文字：今天早餐後散步。",
    maxTranscriptTextLength: 1200, maxMobileCountValue: 1_000_000,
    nativeDebugInputValue: (value) => value,
    clampNumber: (value, min, max) => Math.min(Math.max(value, min), max),
    recordingEffectiveLimitSeconds: () => 60,
    busyActionStatusMessage: () => "busy",
    mainScrollRef: { current: { scrollTo: () => { calls.scroll++; } } },
    requestRecordingPermissionsAsync: async () => ({ granted: true }),
    setAudioModeAsync: async (mode) => { calls.audioModes.push(mode.allowsRecording); },
    transcribeWithNativeWhisper: async () => { calls.transcribe++; return ""; },
    discardPhoneSpeechAudio: async () => {},
    startPhoneSpeechCapture: async () => ({
      stop: async () => { calls.stop++; return { audioUri: "file:///capture.wav", transcript: "" }; },
      release: async () => { calls.release++; }
    }),
    Alert: { alert: () => { calls.alerts++; } },
    setPreview: () => {}, setParserRecoveryMessage: () => {},
    requestJson: forbidden, parseTranscript: forbidden, savePreviewRecords: forbidden,
    ...overrides,
  };
  ctx.Date = { now: () => ctx.now };
  const startCapture = ctx.startPhoneSpeechCapture;
  ctx.startPhoneSpeechCapture = async (...args) => { calls.record++; return startCapture(...args); };
  for (const [setter, field] of Object.entries({
    setIsRecordingPreview: "isRecordingPreview", setRecordingStartedAt: "recordingStartedAt",
    setRecordingElapsedSeconds: "recordingElapsedSeconds", setRecordingFeedback: "recordingFeedback",
    setStatus: "status", setAudioPath: "audioPath", setIsBusy: "isBusy",
    setTranscript: "transcript", setIsTranscriptSample: "isTranscriptSample",
    setTranscriptVoiceSeconds: "transcriptVoiceSeconds", setTranscriptReviewReturnScreen: "returnScreen",
  })) ctx[setter] = (value) => { ctx[field] = value; };
  ctx.openScreen = (screen) => { ctx.currentScreen = screen; };
  ctx.openScreenWithStatus = (screen, status) => { ctx.currentScreen = screen; ctx.status = status; };
  vm.createContext(ctx);
  vm.runInContext(compile(handlers.join("\n")), ctx);
  return { ctx, calls };
}

test("quick release while permission is pending cancels capture and shows feedback", async () => {
  let grant;
  const { ctx, calls } = harness({ requestRecordingPermissionsAsync: () => new Promise((resolve) => { grant = resolve; }) });
  const start = ctx.startRecordingPreview();
  ctx.releaseRecordingPreview();
  grant({ granted: true });
  await start;
  assert.equal(calls.record, 0);
  assert.match(ctx.recordingFeedback, /沒有收到可用的語音/);
  assert.equal(ctx.recordingStartInFlight.current, false);
  assert.equal(ctx.currentScreen, "today");
});

test("quick release during preparation stops the recorder even before React re-renders", async () => {
  const { ctx, calls } = harness();
  let prepared, preparing;
  const entered = new Promise((resolve) => { preparing = resolve; });
  ctx.startPhoneSpeechCapture = () => {
    calls.record++;
    preparing();
    return new Promise((resolve) => {
      prepared = () => resolve({
        stop: async () => { calls.stop++; return { audioUri: null, transcript: "" }; },
        release: async () => { calls.release++; }
      });
    });
  };
  const start = ctx.startRecordingPreview();
  await entered;
  ctx.releaseRecordingPreview();
  prepared();
  await start;
  assert.equal(calls.record, 1);
  assert.equal(calls.stop, 1);
  assert.equal(ctx.audioRecordingRef.current, null);
  assert.equal(ctx.isRecordingPreview, false);
  assert.equal(ctx.recordingStopInFlight.current, false);
  assert.deepEqual(calls.audioModes, [true, false]);
  assert.match(ctx.recordingFeedback, /沒有收到可用的語音/);
});

test("short recording is not sent to Whisper or an empty review screen", async () => {
  const { ctx, calls } = harness({ whisperModelPath: "/synthetic/model.bin" });
  await ctx.startRecordingPreview();
  ctx.now += 200;
  await ctx.finishRecordingPreview();
  assert.equal(calls.transcribe, 0);
  assert.equal(ctx.currentScreen, "today");
  assert.match(ctx.recordingFeedback, /沒有收到可用的語音/);
});

test("missing Whisper model uses the phone recognizer and preserves the previous draft", async () => {
  const { ctx, calls } = harness({ transcript: "existing draft", whisperModelPath: "" });
  await ctx.startRecordingPreview();
  assert.equal(ctx.transcript, "existing draft");
  assert.equal(ctx.currentScreen, "today");
  assert.equal(calls.record, 1);
  assert.equal(calls.alerts, 0);
  assert.match(ctx.status, /手機語音服務/);
});

test("blank recognition is visible without debug tools and keeps the old draft", async () => {
  const { ctx } = harness({ whisperModelPath: "/synthetic/model.bin", transcript: "existing draft",
    transcribeWithNativeWhisper: async () => " \n\t " });
  assert.equal(await ctx.transcribeRecordingToReview("today", "file:///capture.wav", "", "/synthetic/model.bin", 3), false);
  assert.equal(ctx.transcript, "existing draft");
  assert.equal(ctx.currentScreen, "today");
  assert.equal(ctx.isBusy, false);
  assert.match(ctx.recordingFeedback, /沒有辨識到文字/);
  assert.ok(callsVisibleWithoutDebug());
});

function callsVisibleWithoutDebug() {
  return appText.includes('{recordingFeedback ? (') &&
    appText.includes('accessibilityRole="alert" accessibilityLiveRegion="polite"');
}

test("successful speech opens confirmation but never parses or saves automatically", async () => {
  const { ctx } = harness({ whisperModelPath: "/synthetic/model.bin",
    transcribeWithNativeWhisper: async () => "今天散步三十分鐘。" });
  assert.equal(await ctx.transcribeRecordingToReview("today", "file:///capture.wav", "", "/synthetic/model.bin", 3), true);
  assert.equal(ctx.currentScreen, "transcriptReview");
  assert.equal(ctx.transcriptVoiceSeconds, 3);
  assert.equal(ctx.isTranscriptSample, false);
  assert.equal(ctx.recordingFeedback, "");
});

test("Whisper failure falls back to the phone transcript from the same recording", async () => {
  const { ctx } = harness({
    whisperModelPath: "/synthetic/model.bin",
    transcribeWithNativeWhisper: async () => { throw new Error("synthetic Whisper failure"); }
  });
  assert.equal(await ctx.transcribeRecordingToReview(
    "today", "file:///capture.wav", "手機辨識結果", "/synthetic/model.bin", 4
  ), true);
  assert.equal(ctx.transcript, "手機辨識結果");
  assert.equal(ctx.currentScreen, "transcriptReview");
  assert.match(ctx.status, /手機語音辨識/);
});

test("permission denial remains visible and never starts recording", async () => {
  const { ctx, calls } = harness({ requestRecordingPermissionsAsync: async () => ({ granted: false }) });
  await ctx.startRecordingPreview();
  assert.equal(calls.record, 0);
  assert.match(ctx.recordingFeedback, /麥克風權限/);
});

test("preparation failure restores playback mode and clears the start guard", async () => {
  const { ctx, calls } = harness();
  ctx.startPhoneSpeechCapture = async () => { calls.record++; throw new Error("synthetic failure"); };
  await ctx.startRecordingPreview();
  assert.deepEqual(calls.audioModes, [true, false]);
  assert.equal(ctx.recordingStartInFlight.current, false);
  assert.equal(ctx.isRecordingPreview, false);
  assert.match(ctx.recordingFeedback, /錄音無法開始/);
});

test("stop failure restores audio mode, clears guards, and does not open review", async () => {
  const { ctx, calls } = harness();
  ctx.startPhoneSpeechCapture = async () => ({
    stop: async () => { calls.stop++; throw new Error("synthetic failure"); },
    release: async () => { calls.release++; }
  });
  await ctx.startRecordingPreview();
  ctx.now += 3000;
  await ctx.finishRecordingPreview();
  assert.deepEqual(calls.audioModes, [true, false]);
  assert.equal(ctx.recordingStopInFlight.current, false);
  assert.equal(ctx.currentScreen, "today");
  assert.match(ctx.recordingFeedback, /錄音停止失敗/);
});

test("duplicate stop calls only stop the native recorder once", async () => {
  const { ctx, calls } = harness();
  await ctx.startRecordingPreview();
  ctx.now += 3000;
  await Promise.all([ctx.finishRecordingPreview(), ctx.finishRecordingPreview()]);
  assert.equal(calls.stop, 1);
});

test("development text opens editable confirmation and is eligible for explicit parsing", () => {
  const { ctx } = harness();
  ctx.fillDevelopmentTranscript();
  assert.equal(ctx.transcript, ctx.sampleText);
  assert.equal(ctx.currentScreen, "transcriptReview");
  assert.equal(ctx.transcriptVoiceSeconds, 0);
  assert.equal(ctx.isParserSampleTranscriptBlocked(), false);
  assert.match(ctx.recordingFeedback, /確認儲存後才會新增紀錄/);
});

test("development shortcut cannot overwrite an existing draft", () => {
  const { ctx } = harness({ transcript: "keep this draft" });
  ctx.fillDevelopmentTranscript();
  assert.equal(ctx.transcript, "keep this draft");
  assert.match(ctx.recordingFeedback, /沒有覆蓋草稿/);
});

test("production and busy states reject development text; static UI samples stay blocked", () => {
  for (const overrides of [{ enableDevTranscriptSample: false }, { isAnyRequestInFlight: true }, { isRecordingPreview: true }]) {
    const { ctx } = harness(overrides);
    ctx.fillDevelopmentTranscript();
    assert.equal(ctx.transcript, "");
    assert.equal(ctx.currentScreen, "today");
  }
  const { ctx } = harness();
  ctx.updateTranscriptDraft(ctx.sampleText, "sample");
  assert.equal(ctx.isParserSampleTranscriptBlocked(), true);
  assert.ok(appText.includes('const enableDevTranscriptSample = allowMobileDevAuth && (enableDevServerSwitcher || enableDebugTools);'));
  assert.ok(appText.includes('{enableDevTranscriptSample ? ('));
});
