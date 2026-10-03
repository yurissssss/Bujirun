import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// 사용자 클릭 시 공유 호출이 비동기 작업 뒤로 밀리지 않는지 확인한다.
function loadShare(window) {
  const exports = {};
  const source = fs.readFileSync("src/shared/utils/kakaoShare.ts", "utf8");
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      window,
      require: () => ({
        loadKakaoShareSdk: () => {
          throw new Error("클릭 중 SDK 로딩 금지");
        },
      }),
    },
  );
  return exports.shareInviteLink;
}
const invite = {
  title: "부산 여행",
  description: "같이 여행해요",
  imageUrl: "https://example.com/image.png",
  inviteUrl: "https://example.com/invite?code=test",
};
test("공유 버튼 호출 즉시 SDK를 실행하고 초대 링크를 유지한다", () => {
  let sent;
  const share = loadShare({
    Kakao: {
      isInitialized: () => true,
      Share: {
        sendDefault: (value) => {
          sent = value;
        },
      },
    },
  });
  assert.equal(share(invite), true);
  assert.equal(sent.content.link.webUrl, invite.inviteUrl);
  assert.equal(sent.buttons[0].link.mobileWebUrl, invite.inviteUrl);
});
test("SDK 준비 전에는 공유 성공으로 처리하지 않는다", () => {
  assert.equal(loadShare({})(invite), false);
});
test("SDK 오류를 공유 성공으로 처리하지 않는다", () => {
  const share = loadShare({
    Kakao: {
      isInitialized: () => true,
      Share: {
        sendDefault: () => {
          throw new Error("공유 실패");
        },
      },
    },
  });
  assert.equal(share(invite), false);
});
