import { describe, it, expect } from "vitest";
import {
  genreCountsByUser,
  hideRanks,
  levelFromCount,
  postsToNextLevel,
  titleFor,
  topGenre,
  userRank,
} from "./rank.js";

describe("levelFromCount", () => {
  it("投稿0件はレベル0（レベルなし）", () => {
    expect(levelFromCount(0)).toBe(0);
  });

  it("1件目でレベル1になり、1件ごとに1上がる", () => {
    expect(levelFromCount(1)).toBe(1);
    expect(levelFromCount(12)).toBe(12);
  });

  it("20で頭打ちになる", () => {
    expect(levelFromCount(20)).toBe(20);
    expect(levelFromCount(100)).toBe(20);
  });
});

describe("postsToNextLevel", () => {
  it("最高レベルなら0、そうでなければ1", () => {
    expect(postsToNextLevel(0)).toBe(1);
    expect(postsToNextLevel(20)).toBe(0);
  });
});

describe("titleFor", () => {
  it("レベル帯と種類で称号が決まる", () => {
    expect(titleFor(1, "二郎系")).toBe("見習いジロリアン");
    expect(titleFor(4, "二郎系")).toBe("見習いジロリアン");
    expect(titleFor(5, "醤油")).toBe("一人前醤油党");
    expect(titleFor(10, "家系")).toBe("熟練家系ラバー");
    expect(titleFor(15, "つけ麺")).toBe("達人つけ麺党");
    expect(titleFor(20, "二郎系")).toBe("カリスマジロリアン");
  });

  it("レベル0なら称号なし", () => {
    expect(titleFor(0, null)).toBe(null);
  });
});

describe("topGenre", () => {
  it("一番多い種類を返す", () => {
    expect(topGenre({ 醤油: 1, 味噌: 3, 塩: 2 })).toBe("味噌");
  });

  it("同じ件数なら GENRES の並びで先の種類にする", () => {
    expect(topGenre({ 塩: 2, 家系: 2 })).toBe("家系");
  });

  it("投稿がなければ null", () => {
    expect(topGenre({})).toBe(null);
  });
});

describe("genreCountsByUser / userRank", () => {
  const rows = [
    { user_id: "u1", genre: "醤油" },
    { user_id: "u1", genre: "醤油" },
    { user_id: "u1", genre: "塩" },
    { user_id: "u2", genre: "つけ麺" },
  ];

  it("ユーザーごとに種類の件数を数える", () => {
    expect(genreCountsByUser(rows)).toEqual({ u1: { 醤油: 2, 塩: 1 }, u2: { つけ麺: 1 } });
  });

  it("件数・レベル・称号・マークの種類をまとめて返す", () => {
    const { u1 } = genreCountsByUser(rows);
    expect(userRank(u1)).toMatchObject({ count: 3, level: 3, genre: "醤油", title: "見習い醤油党" });
  });

  it("まだ投稿していない人はレベル0・マークなし・称号なし", () => {
    expect(userRank(undefined)).toMatchObject({ count: 0, level: 0, genre: null, title: null });
  });
});

describe("hideRanks", () => {
  const counts = { u1: { 醤油: 2 }, u2: { 塩: 1 } };

  it("非公開の人だけ null にする", () => {
    expect(hideRanks(counts, new Set(["u1"]))).toEqual({ u1: null, u2: { 塩: 1 } });
  });

  it("まだ投稿していない人が非公開にしても null になる", () => {
    expect(hideRanks(counts, new Set(["u3"])).u3).toBe(null);
  });

  it("元の対応表は変えない", () => {
    hideRanks(counts, new Set(["u1"]));
    expect(counts.u1).toEqual({ 醤油: 2 });
  });
});
