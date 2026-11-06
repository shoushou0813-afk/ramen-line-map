import { describe, it, expect } from "vitest";
import { likeLabel, likeTopping, summarizeLikes, toggleLikeRows } from "./likes.js";

const rows = [
  { post_id: "p1", user_id: "me" },
  { post_id: "p1", user_id: "u2" },
  { post_id: "p2", user_id: "u2" },
];

describe("summarizeLikes", () => {
  it("投稿ごとに数え、自分が押した投稿を集める", () => {
    const { counts, mine } = summarizeLikes(rows, "me");
    expect(counts).toEqual({ p1: 2, p2: 1 });
    expect([...mine]).toEqual(["p1"]);
  });

  it("ログインしていなければ自分の分はない", () => {
    expect(summarizeLikes(rows, undefined).mine.size).toBe(0);
  });
});

describe("toggleLikeRows", () => {
  it("押すと1行増え、取り消すとその行だけ消える", () => {
    expect(toggleLikeRows(rows, "p2", "me", true)).toHaveLength(4);
    expect(toggleLikeRows(rows, "p1", "me", false)).toEqual(rows.slice(1));
  });

  it("元の配列は変えない", () => {
    toggleLikeRows(rows, "p2", "me", true);
    expect(rows).toHaveLength(3);
  });
});

describe("likeTopping / likeLabel", () => {
  it("種類に合わせたトッピングになる", () => {
    expect(likeTopping("家系")).toBe("海苔");
    expect(likeTopping("担々麺")).toBe("トッピング");
  });

  it("二郎系だけ、押す前は「ニンニク入れますか？」", () => {
    expect(likeLabel("二郎系", false)).toBe("ニンニク入れますか？");
    expect(likeLabel("二郎系", true)).toBe("ニンニク");
    expect(likeLabel("醤油", false)).toBe("なると");
  });
});
