import { describe, it, expect } from "vitest";
import { genreCountsByUser, hideRanks, postsToNextRank, rankFromCount, topGenre, userRank } from "./rank.js";

describe("rankFromCount", () => {
  it("投稿0件はランク5から始まる", () => {
    expect(rankFromCount(0)).toBe(5);
  });

  it("1件投稿するごとに1上がる", () => {
    expect(rankFromCount(1)).toBe(6);
    expect(rankFromCount(10)).toBe(15);
  });

  it("20で頭打ちになる", () => {
    expect(rankFromCount(15)).toBe(20);
    expect(rankFromCount(100)).toBe(20);
  });
});

describe("postsToNextRank", () => {
  it("最高ランクなら0、そうでなければ1", () => {
    expect(postsToNextRank(3)).toBe(1);
    expect(postsToNextRank(15)).toBe(0);
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

  it("件数・ランク・マークの種類をまとめて返す", () => {
    const { u1 } = genreCountsByUser(rows);
    expect(userRank(u1)).toMatchObject({ count: 3, rank: 8, genre: "醤油" });
  });

  it("まだ投稿していない人はランク5・マークなし", () => {
    expect(userRank(undefined)).toMatchObject({ count: 0, rank: 5, genre: null });
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
