const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../mobile/node_modules/typescript");

const sourcePath = path.resolve(__dirname, "../mobile/phoneSpeechCapture.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;
const listeners = new Map();
let startOptions;
let stopCalls = 0;
let abortCalls = 0;
const platform = { OS: "android", Version: 36 };
// On-device recognition state the mock reports; each case below changes it.
const onDevice = { supported: true, locales: ["en-US", "zh-TW"], installed: ["cmn-Hant-TW"], throws: false };
let downloadRequests = [];
const moduleMock = {
  supportsOnDeviceRecognition: () => onDevice.supported,
  getSupportedLocales: async () => {
    if (onDevice.throws) throw new Error("error_5");
    return { locales: onDevice.locales, installedLocales: onDevice.installed };
  },
  androidTriggerOfflineModelDownload: async (options) => {
    downloadRequests.push(options.locale);
    return { status: "download_scheduled", message: "" };
  },
  addListener: (name, listener) => {
    const list = listeners.get(name) ?? [];
    list.push(listener);
    listeners.set(name, list);
    return { remove: () => listeners.set(name, list.filter((item) => item !== listener)) };
  },
  start: (options) => { startOptions = options; },
  stop: () => {
    stopCalls++;
    for (const listener of listeners.get("end") ?? []) listener();
  },
  abort: () => { abortCalls++; }
};
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  require: (name) => {
    if (name === "expo-speech-recognition") return { ExpoSpeechRecognitionModule: moduleMock };
    if (name === "expo-file-system/legacy") return { deleteAsync: async () => {} };
    if (name === "react-native") return { Platform: platform };
    return require(name);
  }
});

async function main() {
  const capture = await loadedModule.exports.startPhoneSpeechCapture();
  assert.equal(startOptions.lang, "zh-TW");
  assert.equal(startOptions.recordingOptions.persist, true);
  assert.equal(startOptions.continuous, true);
  assert.equal(startOptions.requiresOnDeviceRecognition, true, "installed Taiwan Mandarin pack keeps audio on the phone");
  for (const listener of listeners.get("result") ?? []) {
    listener({ results: [{ transcript: "今天早餐" }], isFinal: false });
    listener({ results: [{ transcript: "今天早餐後血糖一百二十" }], isFinal: true });
  }
  for (const listener of listeners.get("audioend") ?? []) listener({ uri: "file:///capture.wav" });
  const result = await capture.stop();
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    transcript: "今天早餐後血糖一百二十",
    audioUri: "file:///capture.wav",
    error: null
  });
  assert.equal(stopCalls, 1);
  assert.ok([...listeners.values()].every((items) => items.length === 0), "all event subscriptions should be removed");

  const cancelled = await loadedModule.exports.startPhoneSpeechCapture();
  await cancelled.release();
  assert.equal(abortCalls, 1);

  // Tap-to-talk: live text reaches the UI, and a recognizer that ends by itself notifies once.
  const liveTexts = [];
  let endNotices = 0;
  const live = await loadedModule.exports.startPhoneSpeechCapture({
    onTranscript: (text) => liveTexts.push(text),
    onEnd: () => { endNotices++; }
  });
  for (const listener of listeners.get("result") ?? []) {
    listener({ results: [{ transcript: "早上空腹" }], isFinal: true });
    listener({ results: [{ transcript: "一百一十二" }], isFinal: false });
  }
  assert.deepEqual(liveTexts, ["早上空腹", "早上空腹 一百一十二"]);
  for (const listener of listeners.get("end") ?? []) listener();
  assert.equal(endNotices, 1);
  const liveResult = await live.stop();
  assert.equal(liveResult.transcript, "早上空腹 一百一十二");
  assert.equal(endNotices, 1, "stopping after the recognizer ended must not notify again");

  // Locale names differ between recognizers.
  const { isTaiwanChineseLocale, canRecognizeOnDevice } = loadedModule.exports;
  for (const locale of ["zh-TW", "zh_TW", "zh-Hant-TW", "cmn-Hant-TW", " ZH-tw "]) {
    assert.equal(isTaiwanChineseLocale(locale), true, locale);
  }
  for (const locale of ["zh-CN", "cmn-Hans-CN", "en-US", "yue-Hant-HK", ""]) {
    assert.equal(isTaiwanChineseLocale(locale), false, locale);
  }

  // Pack not installed on Android 14+: use the normal recognizer now, download the pack once in the background.
  onDevice.installed = [];
  const noPack = await loadedModule.exports.startPhoneSpeechCapture();
  assert.equal(startOptions.requiresOnDeviceRecognition, false);
  await noPack.release();
  assert.equal(await canRecognizeOnDevice(moduleMock), false);
  assert.deepEqual(downloadRequests, ["zh-TW"], "the offline pack download is requested only once");

  // Android 13 would open a dialog mid-recording, so no download there.
  downloadRequests = [];
  platform.Version = 33;
  // Module state already requested once, so reload a fresh copy to test Android 13 on its own.
  const fresh = { exports: {} };
  vm.runInNewContext(compiled, {
    module: fresh,
    exports: fresh.exports,
    require: (name) => {
      if (name === "expo-file-system/legacy") return { deleteAsync: async () => {} };
      if (name === "react-native") return { Platform: platform };
      return require(name);
    }
  });
  assert.equal(await fresh.exports.canRecognizeOnDevice(moduleMock), false);
  assert.deepEqual(downloadRequests, []);

  // No on-device support at all, or the locale lookup fails: fall back to the normal recognizer.
  platform.Version = 36;
  onDevice.installed = ["zh-TW"];
  onDevice.supported = false;
  assert.equal(await canRecognizeOnDevice(moduleMock), false);
  onDevice.supported = true;
  onDevice.throws = true;
  assert.equal(await canRecognizeOnDevice(moduleMock), false);
  onDevice.throws = false;
  assert.equal(await canRecognizeOnDevice(moduleMock), true);

  // iOS only enables on-device mode when the recognizer supports it, so no locale lookup is needed.
  platform.OS = "ios";
  onDevice.throws = true;
  assert.equal(await canRecognizeOnDevice(moduleMock), true);
  onDevice.throws = false;
  platform.OS = "android";

  platform.Version = 32;
  const olderAndroid = await loadedModule.exports.startPhoneSpeechCapture();
  assert.equal(startOptions.continuous, false);
  assert.equal(startOptions.recordingOptions, undefined);
  assert.equal(startOptions.requiresOnDeviceRecognition, false, "Android 12 and older have no strict on-device recognizer");
  await olderAndroid.release();
  console.log("Phone speech fallback verified: on-device recognition when the Taiwan Mandarin pack is installed (normal recognizer otherwise), native capture, final transcript/audio URI, live transcript and self-end callbacks, stop, and listener cleanup.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
