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

const Y = require("yjs");
const schema = load("src/features/itinerary/collab/itineraryYjsSchema.ts");

// 두 참여자의 문서를 양방향으로 즉시 동기화한다(실제로는 y-websocket이 하는 일).
function connectedPair() {
  const a = new Y.Doc();
  const b = new Y.Doc();
  a.on("update", (update, origin) => origin !== "remote" && Y.applyUpdate(b, update, "remote"));
  b.on("update", (update, origin) => origin !== "remote" && Y.applyUpdate(a, update, "remote"));
  return { a, b };
}

const hotel = {
  name: "해운대 테스트호텔",
  address: "부산 해운대구 해운대해변로 1",
  lat: 35.16,
  lng: 129.16,
};

test("다른 참여자가 저장한 숙소를 받아서 알려주고, 내가 바꾼 숙소는 나에게 다시 알리지 않는다", () => {
  const { a, b } = connectedPair();
  const seenByA = [];
  const seenByB = [];
  schema.observeSharedAccommodation(a, (place) => seenByA.push(place));
  schema.observeSharedAccommodation(b, (place) => seenByB.push(place));

  schema.setSharedAccommodation(a, hotel);
  assert.deepEqual(seenByB, [hotel]);
  assert.deepEqual(seenByA, []);

  schema.setSharedAccommodation(b, null);
  assert.deepEqual(seenByA, [null]);
  assert.equal(seenByB.length, 1);
});

test("숙소가 아닌 공유 값이 바뀌면 숙소 변경으로 알리지 않는다", () => {
  const { a, b } = connectedPair();
  const seenByB = [];
  schema.observeSharedAccommodation(b, (place) => seenByB.push(place));
  a.getMap("meta").set("seeded", true);
  assert.deepEqual(seenByB, []);
});

test("숙소 변경은 활동 로그에 남아 다른 참여자 안내로 이어진다", () => {
  const { a, b } = connectedPair();
  schema.logActivity(a, "루피", "accommodation", hotel.name);
  const [entry] = schema.readActivityLog(b);
  assert.equal(entry.action, "accommodation");
  assert.equal(entry.placeName, hotel.name);
});
