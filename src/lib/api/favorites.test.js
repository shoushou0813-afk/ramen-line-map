import { describe, it, expect, vi } from "vitest";

// テストでは Supabase に接続しないので、クライアントを空のものに差し替える
vi.mock("../supabase", () => ({ supabase: {} }));

import { favoriteStationIds, toggleFavorite, canAddFavorite, MAX_FAVORITES } from "./favorites.js";

describe("favoriteStationIds", () => {
  it("保存されている駅を、保存した順に返す", () => {
    const user = { user_metadata: { favorite_stations: ["kamata", "shinjuku"] } };
    expect(favoriteStationIds(user)).toEqual(["kamata", "shinjuku"]);
  });

  it("今はどの路線にもない駅は外す", () => {
    const user = { user_metadata: { favorite_stations: ["kamata", "sapporo"] } };
    expect(favoriteStationIds(user)).toEqual(["kamata"]);
  });

  it("まだ何も保存していない・ログインしていないときは空の配列", () => {
    expect(favoriteStationIds({ user_metadata: {} })).toEqual([]);
    expect(favoriteStationIds(null)).toEqual([]);
  });
});

describe("toggleFavorite", () => {
  it("入っていない駅は最後に足す", () => {
    expect(toggleFavorite(["kamata"], "oji")).toEqual(["kamata", "oji"]);
  });

  it("入っている駅は外す", () => {
    expect(toggleFavorite(["kamata", "oji"], "kamata")).toEqual(["oji"]);
  });

  it("元の配列は書き換えない", () => {
    const list = ["kamata"];
    toggleFavorite(list, "oji");
    expect(list).toEqual(["kamata"]);
  });
});

describe("canAddFavorite", () => {
  it(`${MAX_FAVORITES}駅までは足せて、それ以上は足せない`, () => {
    expect(canAddFavorite(Array(MAX_FAVORITES - 1).fill("x"))).toBe(true);
    expect(canAddFavorite(Array(MAX_FAVORITES).fill("x"))).toBe(false);
  });
});
