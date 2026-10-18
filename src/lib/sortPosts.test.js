import { describe, it, expect } from "vitest";
import { sortPosts } from "./sortPosts.js";

const posts = [
  { id: "a", created_at: "2026-10-18T10:00:00Z", visited_on: "2026-10-01", rating: 3 },
  { id: "b", created_at: "2026-10-18T12:00:00Z", visited_on: "2026-09-15", rating: 5 },
  { id: "c", created_at: "2026-10-18T11:00:00Z", visited_on: "2026-10-10", rating: 4 },
];
const ids = (list) => list.map((p) => p.id);

describe("sortPosts", () => {
  it("日付順は食べた日が新しい順", () => {
    expect(ids(sortPosts(posts, "date"))).toEqual(["c", "a", "b"]);
  });

  it("知らない並び順が来たら日付順にする", () => {
    expect(ids(sortPosts(posts, "unknown"))).toEqual(["c", "a", "b"]);
  });

  it("評価が高い順に並べられる", () => {
    expect(ids(sortPosts(posts, "rating"))).toEqual(["b", "c", "a"]);
  });

  it("食べた日がない投稿は、投稿した日で並べる", () => {
    const old = { id: "d", created_at: "2026-10-05T03:00:00Z", rating: 1 };
    expect(ids(sortPosts([...posts, old], "date"))).toEqual(["c", "d", "a", "b"]);
  });

  it("元の配列は並べ替えない", () => {
    const copy = [...posts];
    sortPosts(posts, "rating");
    expect(posts).toEqual(copy);
  });
});
