const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("../mobile/node_modules/typescript");

const modelFiles = new Map();
const directories = new Set();
let downloadBytes = 59_700_000;
let downloadCalls = 0;
let lastDownloadRequest;
const documentDirectory = "file:///app-private/files/";
const fileSystem = {
  documentDirectory,
  getInfoAsync: async (uri) => {
    if (modelFiles.has(uri)) return { exists: true, size: modelFiles.get(uri).size, md5: "fixture-md5" };
    return { exists: directories.has(uri), isDirectory: directories.has(uri) };
  },
  makeDirectoryAsync: async (uri) => { directories.add(uri); },
  readDirectoryAsync: async () => [...modelFiles.keys()].map((uri) => uri.split("/").pop()),
  createDownloadResumable: (url, uri, _options, onProgress) => {
    lastDownloadRequest = { url, uri };
    return {
      downloadAsync: async () => {
        downloadCalls++;
        modelFiles.set(uri, { size: downloadBytes });
        onProgress?.({ totalBytesExpectedToWrite: downloadBytes, totalBytesWritten: downloadBytes });
        return { uri };
      }
    };
  },
  deleteAsync: async (uri) => { modelFiles.delete(uri); }
};

const sourcePath = path.resolve(__dirname, "../mobile/modelStorage.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(compiled, {
  module: loadedModule,
  exports: loadedModule.exports,
  require: (moduleName) => {
    if (moduleName === "expo-file-system/legacy") return { __esModule: true, ...fileSystem };
    return require(moduleName);
  }
});

async function main() {
  const { defaultWhisperModel, ensureDefaultWhisperModel, listDownloadedModels } = loadedModule.exports;
  const expectedUri = `${documentDirectory}models/${defaultWhisperModel.fileName}`;
  const downloadedUris = [];
  const downloadedUri = await ensureDefaultWhisperModel((progress) => downloadedUris.push(progress));

  assert.equal(downloadedUri, expectedUri);
  assert.equal(downloadCalls, 1);
  assert.equal(lastDownloadRequest.uri, expectedUri);
  assert.match(lastDownloadRequest.url, /\/resolve\/5359861c739e955e79d9a303bcbc70fb988958b1\/ggml-base-q5_1\.bin/);
  assert.deepEqual(downloadedUris, [1]);

  const listedModels = await listDownloadedModels();
  assert.equal(listedModels.length, 1);
  assert.equal(listedModels[0].uri, expectedUri);
  assert.equal(listedModels[0].size, downloadBytes);

  assert.equal(await ensureDefaultWhisperModel(), expectedUri);
  assert.equal(downloadCalls, 1, "valid model should be reused from persistent app storage");

  modelFiles.delete(expectedUri);
  downloadBytes = 40 * 1024 * 1024;
  await assert.rejects(ensureDefaultWhisperModel(), /download was incomplete/);
  assert.equal(modelFiles.has(expectedUri), false, "incomplete model must be removed");
  console.log("Whisper model storage verified: pinned download, private persistent path, cached reuse, progress, and incomplete-file cleanup.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
