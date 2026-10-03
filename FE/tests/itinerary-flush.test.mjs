import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// 실제 저장 코드를 실행하되 서버 응답과 편집 문서만 제어한다.
function setup(initial, serverIds) {
  let live = structuredClone(initial);
  const calls = [];
  const api = {
    getItinerary: async () => ({ days: [{ id: "day", items: serverIds.map((id) => ({ id })) }] }),
    updateItem: async (...args) => calls.push(["update", args[2]]),
    deleteItem: async (...args) => calls.push(["delete", args[2]]),
    reorderItems: async (...args) => calls.push(["reorder", args[2]]),
    addItem: async () => {
      calls.push(["add"]);
      return { id: "new" };
    },
  };
  const source = fs.readFileSync("src/features/itinerary/collab/flushItineraryToRest.ts", "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) =>
      name === "axios"
        ? { isAxiosError: (error) => error?.isAxiosError === true }
        : { itineraryApi: api },
  });
  const snapshot = exports.snapshotFromStops(initial.map((stop) => ({ ...stop, time: "08:00" })));
  return {
    api,
    calls,
    snapshot,
    get live() {
      return live;
    },
    set live(value) {
      live = value;
    },
    flush: () =>
      exports.flushDayToRest(
        "trip",
        "day",
        structuredClone(live),
        snapshot,
        (tempId, id) => {
          live = live.map((stop) => (stop.id === tempId ? { ...stop, id } : stop));
        },
        undefined,
        {
          readStops: () => live,
          removeMissingStop: (id) => {
            live = live.filter((stop) => stop.id !== id);
          },
        },
      ),
  };
}
const stop = (id, time = "09:00") => ({ id, time, spotId: `spot-${id}`, placeName: id });
const failure = (status) => ({ isAxiosError: true, response: { status } });

test("서버에서 삭제된 항목은 문서에서 정리하고 저장을 반복하지 않는다", async () => {
  const state = setup([stop("gone"), stop("kept")], ["kept"]);
  assert.equal((await state.flush()).length, 0);
  assert.equal(state.live.length, 1);
  assert.equal(state.snapshot.has("gone"), false);
  await state.flush();
  assert.equal(
    state.calls.some((call) => call[1] === "gone"),
    false,
  );
});

test("서버 조회 실패는 삭제로 오인하지 않고 저장 실패로 알린다", async () => {
  const state = setup([stop("kept")], ["kept"]);
  state.api.getItinerary = async () => {
    throw failure(503);
  };
  assert.equal((await state.flush()).length, 1);
  assert.equal(state.live.length, 1);
  assert.equal(state.calls.length, 0);
});

test("저장 중 다른 참여자가 삭제한 다음 항목에는 요청하지 않는다", async () => {
  const state = setup([stop("first"), stop("gone")], ["first", "gone"]);
  state.api.updateItem = async (_trip, _day, id) => {
    state.calls.push(["update", id]);
    state.live = state.live.filter((item) => item.id !== "gone");
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(
    state.calls.some((call) => call[1] === "gone"),
    false,
  );
});

test("조회 직후 삭제되어 404가 발생하면 재조회 후 재시도 대상에서 제외한다", async () => {
  const ids = ["gone"];
  const state = setup([stop("gone")], ids);
  let attempts = 0;
  state.api.updateItem = async () => {
    attempts++;
    ids.length = 0;
    throw failure(404);
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(attempts, 1);
  assert.equal(state.live.length, 0);
});

test("실제 서버에 남은 항목의 404는 조용히 지우지 않는다", async () => {
  const state = setup([stop("kept")], ["kept"]);
  state.api.updateItem = async () => {
    throw failure(404);
  };
  assert.equal((await state.flush()).length, 1);
  assert.equal(state.live.length, 1);
});

test("아직 저장되지 않은 임시 항목은 유지하고 실제 ID로 바꾼다", async () => {
  const state = setup([stop("temp-local")], []);
  assert.equal((await state.flush()).length, 0);
  assert.equal(state.live[0].id, "new");
  assert.equal(state.calls.filter((call) => call[0] === "add").length, 1);
});

test("순서 저장 중 삭제된 항목으로 발생한 400은 문서를 정리한다", async () => {
  const ids = ["a", "b"];
  const state = setup([stop("a"), stop("b")], ids);
  state.snapshot.get("a").orderIndex = 1;
  state.snapshot.get("b").orderIndex = 0;
  state.api.reorderItems = async () => {
    ids.pop();
    throw failure(400);
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(
    state.live.some((item) => item.id === "b"),
    false,
  );
});

test("시각 중복은 다른 항목 저장 뒤 재시도해 정상 반영한다", async () => {
  const state = setup([stop("a"), stop("b", "10:00")], ["a", "b"]);
  let attempts = 0;
  state.api.updateItem = async (_trip, _day, id) => {
    if (id === "a" && attempts++ === 0) throw failure(400);
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(state.snapshot.get("a").time, "09:00");
});

test("저장 도중 장소가 교체되면 이전 ID나 이전 순서를 다시 저장하지 않는다", async () => {
  const state = setup([stop("a"), stop("old")], ["a", "old"]);
  state.api.updateItem = async (_trip, _day, id) => {
    state.calls.push(["update", id]);
    state.live = [stop("a"), stop("temp-replacement")];
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(
    state.calls.some((call) => call[1] === "old" || call[0] === "reorder"),
    false,
  );
  assert.equal(state.live[1].id, "temp-replacement");
});

test("첫 저장을 기다리는 동안 바뀐 다음 항목의 시각을 옛값으로 덮지 않는다", async () => {
  const state = setup([stop("a"), stop("b")], ["a", "b"]);
  state.api.updateItem = async (_trip, _day, id) => {
    state.calls.push(["update", id]);
    state.live = [stop("a"), stop("b", "11:00")];
  };
  assert.equal((await state.flush()).length, 0);
  assert.equal(
    state.calls.some((call) => call[1] === "b"),
    false,
  );
});
