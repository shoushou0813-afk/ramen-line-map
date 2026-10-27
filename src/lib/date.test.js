import { describe, it, expect } from "vitest";
import { toDateInputValue, postDate, postDateInputValue, validateVisitedOn } from "./date.js";

describe("toDateInputValue", () => {
  it("月と日を2桁にそろえる", () => {
    expect(toDateInputValue(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("postDate", () => {
  it("食べた日があればそれを表示する", () => {
    const post = { visited_on: "2026-01-05", created_at: "2026-10-18T03:00:00Z" };
    expect(postDate(post)).toBe("2026/1/5");
  });

  it("食べた日がない古い投稿は投稿日時を表示する", () => {
    const createdAt = new Date(2026, 9, 18, 12, 0).toISOString();
    expect(postDate({ visited_on: null, created_at: createdAt })).toBe("2026/10/18");
  });
});

describe("validateVisitedOn", () => {
  const today = "2026-10-18";

  it("今日と過去の日付は受け付ける", () => {
    expect(validateVisitedOn("2026-10-18", today)).toBe("");
    expect(validateVisitedOn("2025-12-31", today)).toBe("");
  });

  it("未来の日付と空欄は受け付けない", () => {
    expect(validateVisitedOn("2026-10-19", today)).not.toBe("");
    expect(validateVisitedOn("", today)).not.toBe("");
  });
});

describe("postDateInputValue", () => {
  it("食べた日があればそのまま使う", () => {
    expect(postDateInputValue({ visited_on: "2026-10-18", created_at: "2026-10-20T03:00:00Z" })).toBe("2026-10-18");
  });

  it("食べた日がない古い投稿は、投稿した日にする", () => {
    const createdAt = new Date(2026, 8, 5, 12, 0);
    expect(postDateInputValue({ visited_on: null, created_at: createdAt.toISOString() })).toBe("2026-09-05");
  });
});
