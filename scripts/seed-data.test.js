import { describe, it, expect } from "vitest";
import { GENRES } from "../src/data/lines.js";
import { allStationIds, buildSeedPosts } from "./seed-data.js";

// 時刻を固定しないと created_at が毎回変わって比較できない
const FIXED_NOW = Date.parse("2026-09-17T00:00:00Z");

describe("buildSeedPosts", () => {
  it("station_id が路線データに実在する駅だけになっている", () => {
    const known = new Set(allStationIds());
    for (const post of buildSeedPosts(FIXED_NOW)) {
      expect(known.has(post.station_id)).toBe(true);
    }
  });

  it("全ての駅に最低1件は投稿がある", () => {
    const posts = buildSeedPosts(FIXED_NOW);
    const covered = new Set(posts.map((p) => p.station_id));
    expect(covered.size).toBe(allStationIds().length);
  });

  it("genre が GENRES の値に収まっている", () => {
    for (const post of buildSeedPosts(FIXED_NOW)) {
      expect(GENRES).toContain(post.genre);
    }
  });

  it("rating が 1〜5 の整数になっている（DBの check 制約と同じ範囲）", () => {
    for (const post of buildSeedPosts(FIXED_NOW)) {
      expect(Number.isInteger(post.rating)).toBe(true);
      expect(post.rating).toBeGreaterThanOrEqual(1);
      expect(post.rating).toBeLessThanOrEqual(5);
    }
  });

  it("shop_name と memo が空でない（どちらも not null の列）", () => {
    for (const post of buildSeedPosts(FIXED_NOW)) {
      expect(post.shop_name.trim()).not.toBe("");
      expect(post.memo.trim()).not.toBe("");
    }
  });

  it("同じ駅に同じ店名が重複しない（再実行時のスキップ判定が効くように）", () => {
    const seen = new Set();
    for (const post of buildSeedPosts(FIXED_NOW)) {
      const key = JSON.stringify([post.station_id, post.shop_name]);
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("何度呼んでも同じ結果になる（再実行しても増えない前提）", () => {
    expect(buildSeedPosts(FIXED_NOW)).toEqual(buildSeedPosts(FIXED_NOW));
  });
});
