import { describe, it, expect, vi } from "vitest";

// テストでは Supabase に接続しないので、クライアントを空のものに差し替える
vi.mock("../supabase", () => ({ supabase: {} }));

import { countByStation, shopNamePattern, storagePathFromUrl } from "./posts.js";

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
