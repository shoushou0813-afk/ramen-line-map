import { describe, it, expect, vi } from "vitest";

// テストでは Supabase に接続しないので、クライアントを空のものに差し替える
vi.mock("../supabase", () => ({ supabase: {} }));

import { countByStation, fetchAllPages, mergeNewest, shopNamePattern, storagePathFromUrl } from "./posts.js";

describe("countByStation", () => {
  it("駅IDごとに件数を数える", () => {
    const rows = [{ station_id: "shinjuku" }, { station_id: "shibuya" }, { station_id: "shinjuku" }];
    expect(countByStation(rows)).toEqual({ shinjuku: 2, shibuya: 1 });
  });

  it("投稿がなければ空の対応表を返す", () => {
    expect(countByStation([])).toEqual({});
  });
});

describe("storagePathFromUrl", () => {
  it("バケット名より後ろのパスを取り出す", () => {
    const url = "https://example.supabase.co/storage/v1/object/public/post-images/user-1/abc.jpg";
    expect(storagePathFromUrl(url)).toBe("user-1/abc.jpg");
  });

  it("バケット名を含まないURLなら null を返す", () => {
    expect(storagePathFromUrl("https://example.com/other/abc.jpg")).toBeNull();
  });
});

describe("shopNamePattern", () => {
  it("前後の空白を除いて、部分一致のパターンにする", () => {
    expect(shopNamePattern("  一蘭 ")).toBe("%一蘭%");
  });

  it("% と _ と \\ は文字そのものとして検索されるよう打ち消す", () => {
    expect(shopNamePattern("100%_ラーメン\\")).toBe("%100\\%\\_ラーメン\\\\%");
  });
});

describe("mergeNewest", () => {
  const a = { id: "a", created_at: "2026-10-01T00:00:00Z" };
  const b = { id: "b", created_at: "2026-10-03T00:00:00Z" };
  const c = { id: "c", created_at: "2026-10-02T00:00:00Z" };

  it("店名と駅の両方で見つかった投稿は1つにまとめ、新しい順に並べる", () => {
    expect(mergeNewest([[a, b], [b, c]], 50).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("limit 件までに切り詰める", () => {
    expect(mergeNewest([[a, b, c]], 2).map((p) => p.id)).toEqual(["b", "c"]);
  });
});

describe("fetchAllPages", () => {
  // 0〜(total-1) の番号を行に見立て、from〜to の範囲を返す偽の問い合わせ
  const fakeTable = (total) => {
    const calls = [];
    const fetchPage = async (from, to) => {
      calls.push([from, to]);
      return Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
    };
    return { fetchPage, calls };
  };

  it("1ページに収まらない行も、分けて取って全部集める", async () => {
    const { fetchPage, calls } = fakeTable(2500);
    const rows = await fetchAllPages(fetchPage, 1000);
    expect(rows).toHaveLength(2500);
    expect(rows.at(-1)).toBe(2499);
    expect(calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("ちょうど1ページ分なら、空のページを確かめてから終える", async () => {
    const { fetchPage, calls } = fakeTable(1000);
    expect(await fetchAllPages(fetchPage, 1000)).toHaveLength(1000);
    expect(calls).toHaveLength(2);
  });

  it("行がなければ空の配列を返す", async () => {
    expect(await fetchAllPages(fakeTable(0).fetchPage, 1000)).toEqual([]);
  });
});
