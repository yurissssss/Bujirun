import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

// 실행 중인 서버/계정 없이 실제 TS 함수와 훅의 API·Yjs 경계를 검증한다.
function load(relativePath, mocks = {}) {
  const filename = path.resolve(root, relativePath);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  const resolve = (name) => {
    if (name in mocks) return mocks[name];
    if (/\.(png|jpe?g|webp|gif|svg)$/.test(name)) return { default: { src: name } };
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const file = [target, `${target}.ts`, `${target}.tsx`].find(existsSync);
      assert.ok(file, name);
      return load(file, mocks);
    }
    return require(name);
  };
  new Function("require", "exports", code)(resolve, exports);
  return exports;
}

const rules = load("src/features/itinerary/utils/itineraryTimeRules.ts");

test("새 장소 시간과 여행 경계 검증을 유지한다", () => {
  assert.equal(rules.getDefaultStopTime([], 0, 2), "09:00");
  assert.equal(rules.getDefaultStopTime([{ time: "10:13" }], 0, 2), "11:10");
  const bounds = { startTime: "10:00", endTime: "18:00" };
  assert.equal(rules.getDefaultStopTime([], 0, 2, bounds), "10:00");
  assert.match(rules.validateStopTime(0, "09:00", 2, bounds), /시작 시간/);
  assert.match(rules.validateStopTime(1, "19:00", 2, bounds), /종료 시간/);
  assert.equal(rules.validateStopTime(1, "10:00", 3, bounds), null);
  assert.equal(
    rules.validateStopTime(0, "09:00", 1, { startTime: "00:00", endTime: "00:00" }),
    null,
  );
  assert.equal(
    rules.validateStopTime(0, "09:00", 1, { startTime: "19:00", endTime: "10:00" }),
    null,
  );
});

test("최적화 시각을 종료 시간 안에서 중복 없이 배치한다", () => {
  assert.deepEqual(rules.spreadStopMinutes([], 600, 1080), []);
  assert.deepEqual(rules.spreadStopMinutes([1200, 1300, 1300], 600, 1080), [1060, 1070, 1080]);
  for (let count = 1; count <= 10; count++) {
    const times = rules.spreadStopMinutes(Array(count).fill(900), 600, 1080);
    assert.equal(new Set(times).size, count);
    assert.ok(times.every((time) => time >= 600 && time <= 1080));
  }
});

function transportFixture({
  fail = false,
  capped = false,
  empty = false,
  optionsError = false,
} = {}) {
  const calls = [];
  const invalidated = [];
  const first = { id: "first", placeName: "출발", time: "10:00", transport: { toStopId: "next" } };
  const next = { id: "next", placeName: "도착", time: "10:30" };
  const { useItineraryTransport: createTransportActions } = load(
    "src/features/itinerary/hooks/useItineraryTransport.ts",
    {
      react: { useEffect: (effect) => effect() },
      "@tanstack/react-query": {
        useQuery: () => (optionsError ? { data: undefined, isError: true } : { data: [] }),
        useQueryClient: () => ({ invalidateQueries: (arg) => invalidated.push(arg) }),
      },
      "@/shared/api/domains": {
        itineraryApi: {
          keys: { travelModeOptions: (...args) => args, detail: (id) => ["detail", id] },
          updateTravelMode: async (...args) => {
            calls.push(["api", ...args]);
            if (fail) throw Error("network");
            return { travelMode: "walk", travelTimeMin: 60 };
          },
        },
      },
    },
  );
  return {
    calls,
    invalidated,
    ...createTransportActions({
      itineraryId: "trip",
      dayIdsSliced: ["day"],
      activeDayIdx: 0,
      activeStopId: first.id,
      activeStop: first,
      stopsPerDay: [empty ? [first] : [first, next]],
      tripTimeBounds: { startTime: "09:00", endTime: "18:00" },
      modal: "transport",
      closeModal: () => calls.push(["close"]),
      updateYjsStopTransport: (...args) => calls.push(["transport", ...args]),
      shiftYjsFollowingStopTimes: (...args) => {
        calls.push(["shift", ...args]);
        return { cappedAtBoundary: capped, shiftedCount: capped ? 0 : 1 };
      },
      showToast: (...args) => calls.push(["toast", ...args]),
    }),
  };
}

test("교통 옵션 조회가 실패하면 안내 후 모달을 닫는다", () => {
  const { calls } = transportFixture({ optionsError: true });
  assert.equal(calls[0][0], "toast");
  assert.equal(calls[0][2], "error");
  assert.deepEqual(calls[1], ["close"]);
});

test("교통 API는 도착 항목을 갱신하고 Yjs 변경 후 다음 시간을 조정한다", async () => {
  const { confirmTransport, calls, invalidated } = transportFixture();
  assert.equal(await confirmTransport({ id: "walk", durationMin: 60, cost: 0 }), true);
  assert.deepEqual(invalidated, [{ queryKey: ["detail", "trip"] }]);
  assert.deepEqual(calls[0], ["api", "trip", "day", "next", { travelMode: "walk" }]);
  assert.equal(calls[1][0], "transport");
  assert.deepEqual(calls[2], ["shift", 0, "first", 30, 1080]);
});

test("교통 변경 실패와 마지막 장소는 Yjs에 반영하지 않는다", async () => {
  for (const config of [{ fail: true }, { empty: true }]) {
    const { confirmTransport, calls } = transportFixture(config);
    assert.equal(await confirmTransport({ id: "walk" }), false);
    assert.ok(calls.every(([kind]) => kind !== "transport" && kind !== "shift"));
  }
});

test("종료 시간에 걸린 교통 변경은 성공을 반환하고 경고를 표시한다", async () => {
  const { confirmTransport, calls } = transportFixture({ capped: true });
  assert.equal(await confirmTransport({ id: "walk", durationMin: 60 }), true);
  assert.match(calls.at(-1)[1], /종료 시간/);
});

test("최적화가 같은 이름의 장소를 중복 사용하지 않고 저장 후 완료된다", async () => {
  const calls = [];
  const { useItineraryOptimization } = load(
    "src/features/itinerary/hooks/useItineraryOptimization.ts",
    {
      react: { useState: () => [undefined, (value) => calls.push(["done", value])] },
      "@/shared/api/domains": {
        itineraryApi: {
          optimizeDay: async () => ({
            data: {
              spots: [
                { name: "같은 이름", order: 1, arrivalTime: "20:00" },
                {
                  name: "같은 이름",
                  order: 2,
                  arrivalTime: "21:00",
                  travelMode: "walk",
                  travelTimeMin: 30,
                },
              ],
            },
          }),
        },
      },
    },
  );
  const { startOptimize } = useItineraryOptimization({
    currentDay: 0,
    dayIdsSliced: ["day"],
    stopsPerDay: [
      [
        { id: "a", placeName: "같은 이름", time: "10:00" },
        { id: "b", placeName: "같은 이름", time: "14:00" },
      ],
    ],
    tripTimeBounds: { startTime: "10:00", endTime: "18:00" },
    setModal: (value) => calls.push(["modal", value]),
    pushYjsOptimizedOrder: (day, stops) => calls.push(["push", day, stops]),
    logActivity: (...args) => calls.push(["activity", ...args]),
    showToast: (...args) => calls.push(["toast", ...args]),
  });
  await startOptimize();
  const stops = calls.find(([kind]) => kind === "push")[2];
  assert.deepEqual(
    stops.map((stop) => stop.id),
    ["a", "b"],
  );
  assert.ok(stops.every((stop) => stop.time <= "18:00"));
  assert.equal(stops[0].transport.toStopId, "b");
  assert.equal(stops[1].transport, undefined);
  assert.deepEqual(calls.at(-1), ["done", true]);
});

test("로그 담기는 데이터와 Yjs가 준비된 뒤 현재 여행 일수만 반영한다", async (t) => {
  const calls = [];
  let apply;
  const previousWindow = globalThis.window;
  globalThis.window = {
    setTimeout: () => 1,
    clearTimeout: () => {},
  };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  });
  const { useApplyImportedTravelLog } = load(
    "src/features/itinerary/hooks/useImportedTravelLog.ts",
    {
      react: {
        useEffect: (effect) => {
          apply = effect;
        },
      },
      "@tanstack/react-query": {},
      "@/shared/api/domains": {
        travelLogApi: {
          recordLogImport: async () => {
            calls.push("record");
          },
        },
      },
      "../utils/scheduleUtils": {
        buildDaysFromTravelLogDetail: () => ({ days: [["a"], ["b"], ["c"]] }),
      },
    },
  );
  const params = {
    importedLogId: "log",
    importedLog: {},
    importedSpotThumbnails: new Map(),
    yjsSeeded: false,
    dayIdsSliced: ["day-1", "day-2"],
    replaceYjsStopsWithImportedLog: (day, stops) => calls.push(["replace", day, stops]),
    logActivity: () => calls.push("activity"),
    flushNow: () => calls.push("flush"),
    setCurrentDay: (day) => calls.push(["day", day]),
    showToast: () => {},
  };
  useApplyImportedTravelLog(params);
  apply();
  assert.deepEqual(calls, []);
  useApplyImportedTravelLog({ ...params, yjsSeeded: true, importedSpotThumbnails: undefined });
  apply();
  assert.deepEqual(calls, []);
  useApplyImportedTravelLog({ ...params, yjsSeeded: true });
  const cleanup = apply();
  assert.deepEqual(calls, [
    ["replace", 0, ["a"]],
    ["replace", 1, ["b"]],
    "activity",
    "flush",
    "record",
    ["day", 0],
  ]);
  cleanup();
});
