const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const ts = require("../mobile/node_modules/typescript");

const mobileDir = path.resolve(__dirname, "../mobile");
const cache = new Map();

// Load a mobile TS module (and its local imports) in a sandbox, no bundler needed.
function loadMobileModule(name) {
  const sourcePath = path.join(mobileDir, `${name}.ts`);
  if (cache.has(sourcePath)) return cache.get(sourcePath).exports;
  const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const loaded = { exports: {} };
  cache.set(sourcePath, loaded);
  vm.runInNewContext(compiled, {
    module: loaded,
    exports: loaded.exports,
    require: (request) => (request.startsWith("./") ? loadMobileModule(request.slice(2)) : require(request)),
    Intl,
    Date
  });
  return loaded.exports;
}

const { todayTimelineDisplayItems, todayTimelineSummary } = loadMobileModule("todayTimelineTransforms");

function record(id, recordType, occurredAt, payload) {
  return {
    id,
    profile_id: "profile-demo",
    record_type: recordType,
    occurred_at: occurredAt,
    payload_json: payload,
    metadata_json: {},
    source: "voice"
  };
}

const demoRecords = [
  record("r3", "glucose", "2026-11-05T14:20:00+08:00", { value: 146, unit: "mg/dL" }),
  record("r1", "glucose", "2026-11-05T07:30:00+08:00", { value: 112, unit: "mg/dL" }),
  record("r2", "exercise", "2026-11-05T08:10:00+08:00", { activity: "散步", minutes: 20 }),
  record("r4", "exercise", "2026-11-05T18:00:00+08:00", { activity: "快走", minutes: "15" })
];

test("timeline lists today's records oldest first", () => {
  const ids = todayTimelineDisplayItems(demoRecords).map((item) => item.record.id);
  // Arrays from the sandbox have a different prototype, so compare by value.
  assert.equal(JSON.stringify(ids), JSON.stringify(["r1", "r2", "r3", "r4"]));
});

test("summary shows the latest glucose, record count, and total exercise minutes", () => {
  const summary = todayTimelineSummary(demoRecords);
  assert.equal(summary.latestGlucoseValue, "146");
  assert.match(summary.latestGlucoseMeta, /^mg\/dL · /);
  assert.equal(summary.recordCountText, "4");
  assert.equal(summary.exerciseMinutesText, "35");
});

test("summary falls back cleanly with no records or bad values", () => {
  const empty = todayTimelineSummary([]);
  assert.equal(empty.latestGlucoseValue, "—");
  assert.equal(empty.latestGlucoseMeta, "還沒量");
  assert.equal(empty.recordCountText, "0");
  assert.equal(empty.exerciseMinutesText, "0");
  const bad = todayTimelineSummary([
    record("b1", "glucose", "2026-11-05T09:00:00+08:00", { value: "not a number" }),
    record("b2", "exercise", "2026-11-05T09:30:00+08:00", { minutes: -10 })
  ]);
  assert.equal(bad.latestGlucoseValue, "—");
  assert.equal(bad.exerciseMinutesText, "0");
});

test("timeline clock is 24-hour and padded", () => {
  const { todayTimelineClock } = loadMobileModule("todayTimelineTransforms");
  const morning = new Date(2026, 10, 5, 7, 5).toISOString();
  const evening = new Date(2026, 10, 5, 18, 40).toISOString();
  assert.equal(todayTimelineClock(morning), "07:05");
  assert.equal(todayTimelineClock(evening), "18:40");
  assert.equal(todayTimelineClock("not a date"), "--:--");
});

test("meal without food items shows the meal type, not raw JSON", () => {
  const { displayPayload } = loadMobileModule("recordDisplay");
  assert.equal(displayPayload("meal", { meal_type: "breakfast" }), "飲食：早餐");
});
