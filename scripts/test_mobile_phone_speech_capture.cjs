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
const moduleMock = {
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

  platform.Version = 32;
  const olderAndroid = await loadedModule.exports.startPhoneSpeechCapture();
  assert.equal(startOptions.continuous, false);
  assert.equal(startOptions.recordingOptions, undefined);
  await olderAndroid.release();
  console.log("Phone speech fallback verified: native capture, final transcript/audio URI, stop, and listener cleanup.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
