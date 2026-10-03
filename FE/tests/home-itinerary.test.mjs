import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/features/home/utils/getNearestItineraryDay.ts", import.meta.url),
  "utf8",
);
const exports = {};
new Function(
  "exports",
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
)(exports);
const { getNearestItineraryDay } = exports;

function previousSelection(days, baseDate) {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);
  const value = (date) => new Date(`${date}T00:00:00`).getTime();
  return [...days]
    .filter((day) => value(day.date) >= today.getTime())
    .sort((a, b) => value(a.date) - value(b.date))[0];
}

test("홈 일정 선택은 과거/오늘/미래/빈 날짜/동률에서 기존 결과를 유지한다", () => {
  const dates = ["2026-09-01", "2026-09-16", "2026-09-17", "2026-10-01", "", "invalid"];
  const today = new Date(2026, 8, 16, 13, 0);
  for (let n = 0; n < 1000; n++) {
    let seed = n;
    const days = Array.from({ length: n % 11 }, (_, id) => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return { id, date: dates[seed % dates.length] };
    });
    const original = [...days];
    assert.equal(getNearestItineraryDay(days, today), previousSelection(days, today));
    assert.deepEqual(days, original);
  }
});

test("자정 경계와 잘못된 기준 날짜의 선택도 유지한다", () => {
  const days = [
    { id: 1, date: "2026-09-16" },
    { id: 2, date: "2026-09-17" },
  ];
  for (const now of [new Date(2026, 8, 16, 23, 59), new Date(2026, 8, 17), new Date(NaN)]) {
    assert.equal(getNearestItineraryDay(days, now), previousSelection(days, now));
  }
});
