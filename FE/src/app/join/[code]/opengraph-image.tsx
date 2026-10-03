import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "부지런 여행 초대";
export const size = { width: 800, height: 800 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [character, background] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/character/primary.png")),
    readFile(join(process.cwd(), "src/assets/background/background.png")),
  ]);

  // 도입 화면의 배경과 캐릭터만 사용한다.
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#dceaff",
      }}
    >
      <img
        src={`data:image/png;base64,${background.toString("base64")}`}
        alt=""
        width={800}
        height={800}
        style={{ position: "absolute", inset: 0, objectFit: "cover" }}
      />
      <img
        src={`data:image/png;base64,${character.toString("base64")}`}
        alt="부지런 캐릭터"
        width={620}
        height={620}
        style={{ position: "absolute", left: 90, top: 110, objectFit: "contain" }}
      />
    </div>,
    size,
  );
}
