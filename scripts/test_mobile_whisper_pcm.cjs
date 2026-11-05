const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../mobile/node_modules/typescript");

function loadTypeScriptModule(sourcePath, mockRequire) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled, { module: loadedModule, exports: loadedModule.exports, require: mockRequire });
  return loadedModule.exports;
}

const captureSourcePath = path.resolve(__dirname, "../mobile/whisperPcmCapture.ts");
let dataListener;
let recorderConfig;
let stopCalls = 0;
let listenerRemoveCalls = 0;
let startCalls = 0;
let initError = null;
let stopGate = null;
const pcmRecorder = {
  on: (event, listener) => {
    if (event === "data") dataListener = listener;
    return { remove: () => { listenerRemoveCalls++; } };
  },
  init: async (config) => {
    recorderConfig = config;
    if (initError) throw initError;
  },
  start: () => { startCalls++; },
  stop: async () => {
    stopCalls++;
    if (stopGate) await stopGate;
  }
};
const captureModule = loadTypeScriptModule(captureSourcePath, (moduleName) => {
  if (moduleName === "@fugood/react-native-audio-pcm-stream") {
    return { __esModule: true, default: pcmRecorder };
  }
  return require(moduleName);
});

const { combinePcmChunks, startWhisperPcmCapture } = captureModule;
const combined = combinePcmChunks([new Uint8Array([0, 1]), new Uint8Array([2, 3, 4])]);
assert.deepEqual(Array.from(combined), [0, 1, 2, 3, 4]);

let whisperContext;
let whisperInitOptions;
let transcribeInput;
let transcribeOptions;
let releaseCalls = 0;
let transcribeError = null;
const whisperModule = {
  initWhisper: async (options) => {
    whisperInitOptions = options;
    whisperContext = {
      transcribeData: (audioData, options) => {
        transcribeInput = audioData;
        transcribeOptions = options;
        return {
          promise: transcribeError
            ? Promise.reject(transcribeError)
            : Promise.resolve({ result: "  今天早餐後血糖一百二十  " })
        };
      },
      release: async () => { releaseCalls++; }
    };
    return whisperContext;
  }
};
const nativeModelsPath = path.resolve(__dirname, "../mobile/nativeLocalModels.ts");
const nativeModels = loadTypeScriptModule(nativeModelsPath, (moduleName) => {
  if (moduleName === "whisper.rn") return { __esModule: true, ...whisperModule };
  return require(moduleName);
});

async function main() {
  const capture = await startWhisperPcmCapture();
  assert.equal(recorderConfig.sampleRate, 16000);
  assert.equal(recorderConfig.channels, 1);
  assert.equal(recorderConfig.bitsPerSample, 16);

  const pcm = new Uint8Array(32000);
  pcm.set([0, 128, 255, 127]); // signed 16-bit little-endian minimum and maximum
  dataListener(Buffer.from(pcm).toString("base64"));

  let finishNativeStop;
  stopGate = new Promise((resolve) => { finishNativeStop = resolve; });
  const stopPromise = capture.stop();
  assert.equal(listenerRemoveCalls, 0, "keep collecting while native capture thread is draining");
  dataListener(Buffer.from(new Uint8Array([9, 10])).toString("base64"));
  finishNativeStop();
  const audioData = await stopPromise;
  stopGate = null;
  assert.equal(audioData.byteLength, 32002);
  assert.deepEqual(Array.from(new Uint8Array(audioData).slice(0, 4)), [0, 128, 255, 127]);
  assert.deepEqual(Array.from(new Uint8Array(audioData).slice(-2)), [9, 10]);
  await capture.release();
  assert.equal(stopCalls, 1);
  assert.equal(listenerRemoveCalls, 1);

  const transcript = await nativeModels.transcribePcmWithNativeWhisper({ modelPath: "/private/models/whisper.bin", audioData });
  assert.equal(transcript, "今天早餐後血糖一百二十");
  assert.equal(whisperInitOptions.useGpu, false);
  assert.equal(transcribeInput, audioData);
  assert.equal(transcribeOptions.language, "zh");
  assert.equal(transcribeOptions.translate, false);
  assert.equal(releaseCalls, 1);
  assert.equal(startCalls, 1);

  transcribeError = new Error("synthetic transcription failure");
  await assert.rejects(
    nativeModels.transcribePcmWithNativeWhisper({ modelPath: "/private/models/whisper.bin", audioData }),
    /synthetic transcription failure/
  );
  assert.equal(releaseCalls, 2);

  initError = new Error("synthetic AudioRecord initialization failure");
  await assert.rejects(startWhisperPcmCapture(), /synthetic AudioRecord initialization failure/);
  assert.equal(startCalls, 1, "recording must not start if native initialization fails");
  assert.equal(listenerRemoveCalls, 2, "failed initialization must remove the data listener");
  console.log("Whisper PCM path verified: awaited recorder init, int16 capture -> exact ArrayBuffer -> whisper.rn JSI API, and cleanup on failures.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
