import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

function load(relativePath) {
  const filename = path.resolve(root, relativePath);
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  const resolve = (name) => {
    if (/\.(png|jpe?g|webp|gif|svg)$/.test(name)) return { default: { src: name } };
    if (name.startsWith("@/") || name.startsWith(".")) {
      const target = name.startsWith("@/")
        ? path.join(root, "src", name.slice(2))
        : path.resolve(path.dirname(filename), name);
      const file = [target, `${target}.ts`, `${target}.tsx`].find(existsSync);
      assert.ok(file, name);
      return load(file);
    }
    return require(name);
  };
  new Function("require", "exports", code)(resolve, exports);
  return exports;
}

const schedule = load("src/features/itinerary/utils/scheduleUtils.ts");
const times = (dayIdx, totalDays, count, bounds) =>
  Array.from({ length: count }, (_, idx) =>
    schedule.getDefaultItemTime(dayIdx, totalDays, idx, count, bounds),
  );

test("관광지는 10시부터 3시간 간격으로 배치한다", () => {
  assert.deepEqual(times(1, 3, 3), ["10:00", "13:00", "16:00"]);
  assert.deepEqual(times(1, 3, 1), ["10:00"]);
  assert.deepEqual(times(1, 3, 4), ["10:00", "13:00", "16:00", "19:00"]);
});

test("여행 시작이 이르면 하루 기본 시작(10:00)을 쓰고, 늦으면 그 시각부터 3시간 간격", () => {
  const early = { startTime: "08:00", endTime: "18:00" };
  assert.deepEqual(times(0, 2, 2, early), ["10:00", "13:00"]);

  const late = { startTime: "20:00", endTime: "18:00" };
  assert.deepEqual(times(0, 2, 1, late), ["20:00"]);
  assert.deepEqual(times(0, 2, 2, late), ["20:00", "23:00"]);
});

test("마지막 날은 여행 종료 시각을 넘지 않게 간격만 좁힌다", () => {
  const bounds = { startTime: "10:00", endTime: "14:00" };
  assert.deepEqual(times(1, 2, 3, bounds), ["10:00", "12:00", "14:00"]);
  // 종료 시각이 하루 시작보다 이르면 종료 시각에서 거꾸로 펼친다.
  assert.deepEqual(times(1, 2, 2, { startTime: "10:00", endTime: "09:00" }), ["08:50", "09:00"]);
});

test("어떤 경계에서도 시각은 겹치지 않고 오름차순이며 23:50을 넘지 않는다", () => {
  const stamps = ["00:00", "07:30", "10:00", "13:20", "18:00", "20:00", "23:30"];
  for (const startTime of stamps) {
    for (const endTime of stamps) {
      for (let count = 1; count <= 8; count++) {
        for (const [dayIdx, totalDays] of [
          [0, 1],
          [0, 3],
          [1, 3],
          [2, 3],
        ]) {
          const result = times(dayIdx, totalDays, count, { startTime, endTime });
          assert.equal(new Set(result).size, count, `${startTime}~${endTime} ${count}곳`);
          assert.deepEqual(result, [...result].sort(), `${startTime}~${endTime} ${count}곳`);
          assert.ok(result[result.length - 1] <= "23:50");
          assert.ok(result.every((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time)));
        }
      }
    }
  }
});
