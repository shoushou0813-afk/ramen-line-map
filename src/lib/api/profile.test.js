import { describe, it, expect, vi } from "vitest";

// テストでは Supabase に接続しないので、クライアントを空のものに差し替える
vi.mock("../supabase", () => ({ supabase: {} }));

import { displayName, validateDisplayName, MAX_DISPLAY_NAME_LENGTH } from "./profile.js";

describe("displayName", () => {
  it("自分で決めた名前があれば Google の名前より優先する", () => {
    const user = { user_metadata: { name: "Shotaro Ichikawa", display_name: "ラーメン太郎" } };
    expect(displayName(user)).toBe("ラーメン太郎");
  });

  it("自分で決めた名前がなければ Google の名前を使う", () => {
    expect(displayName({ user_metadata: { name: "Shotaro Ichikawa" } })).toBe("Shotaro Ichikawa");
  });

  it("どちらもなければ「名無し」を返す", () => {
    expect(displayName({ user_metadata: {} })).toBe("名無し");
    expect(displayName(null)).toBe("名無し");
  });
});

describe("validateDisplayName", () => {
  it("空白だけの名前は受け付けない", () => {
    expect(validateDisplayName("   ")).not.toBe("");
  });

  it(`${MAX_DISPLAY_NAME_LENGTH}文字までは受け付け、それを超えると受け付けない`, () => {
    expect(validateDisplayName("あ".repeat(MAX_DISPLAY_NAME_LENGTH))).toBe("");
    expect(validateDisplayName("あ".repeat(MAX_DISPLAY_NAME_LENGTH + 1))).not.toBe("");
  });

  it("前後の空白は字数に数えない", () => {
    expect(validateDisplayName(` ${"あ".repeat(MAX_DISPLAY_NAME_LENGTH)} `)).toBe("");
  });
});
