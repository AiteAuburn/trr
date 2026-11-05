const fs = require("node:fs");
const path = require("node:path");

const moduleRoot = path.resolve(
  process.argv[2] || path.join(__dirname, "../mobile/node_modules/@fugood/react-native-audio-pcm-stream")
);
const packageJsonPath = path.join(moduleRoot, "package.json");
const sourcePath = path.join(
  moduleRoot,
  "android/src/main/java/com/imxiqi/rnliveaudiostream/RNLiveAudioStreamModule.java"
);

if (!fs.existsSync(packageJsonPath) || !fs.existsSync(sourcePath)) {
  throw new Error(`PCM recorder Android source was not found under ${moduleRoot}`);
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (packageJson.version !== "1.1.4") {
  throw new Error(`Expected @fugood/react-native-audio-pcm-stream 1.1.4, found ${packageJson.version}`);
}

let source = fs.readFileSync(sourcePath, "utf8");
function replaceOnce(before, after, description) {
  if (source.includes(after)) return;
  if (!source.includes(before)) {
    throw new Error(`Could not patch PCM recorder: expected source for ${description} was not found`);
  }
  source = source.replace(before, after);
}

replaceOnce(
  "    private boolean isRecording;",
  "    private volatile boolean isRecording;\n    private volatile Thread recordingThread;",
  "cross-thread recording state"
);
replaceOnce("        Thread recordingThread = new Thread(new Runnable() {", "        recordingThread = new Thread(new Runnable() {", "recording thread handle");
replaceOnce(
  `    @ReactMethod
    public void stop() {
        isRecording = false;
    }`,
  `    @ReactMethod
    public void stop(Promise promise) {
        isRecording = false;
        Thread thread = recordingThread;
        if (thread == null) {
            promise.resolve(null);
            return;
        }
        new Thread(() -> {
            try {
                thread.join();
                if (recordingThread == thread) recordingThread = null;
                promise.resolve(null);
            } catch (InterruptedException error) {
                Thread.currentThread().interrupt();
                promise.reject("E_AUDIO_STOP_INTERRUPTED", "Audio recording stop was interrupted", error);
            }
        }).start();
    }`,
  "awaitable stop after final PCM event"
);

if (!source.includes("public void stop(Promise promise)")) {
  throw new Error("PCM recorder stop patch was not applied");
}
fs.writeFileSync(sourcePath, source);
console.log("Patched PCM recorder stop to resolve only after its native capture thread has drained.");
