// デモ用のサンプル投稿を組み立てる。
//
// 実在の店を勝手にレビューすると誤解を招くので、店名は架空の語を組み合わせて作る。
// 乱数は駅IDから決まる疑似乱数にしてあるので、何度実行しても同じ結果になる。
// シードスクリプトは (station_id, shop_name) が既にあれば飛ばすため、これで
// 重複投入を気にせず再実行できる。

import { LINES, LINE_ORDER, GENRES } from "../src/data/lines.js";

const SHOP_PREFIXES = ["麺屋", "らーめん", "中華そば", "自家製麺", "麺処", "拉麺"];

const SHOP_NAMES = [
  "こもれび", "かなで", "ひなた", "みなも", "そらまめ", "あかつき",
  "ゆらぎ", "いしづみ", "まほろば", "くれない", "しののめ", "なぎさ",
  "ことのは", "つむぎ", "はるかぜ", "みちしるべ",
];

// ジャンルごとの所感。どの店にも当てはまる一般的な書き方にしてある
const MEMOS = {
  家系: ["スープは濃いめ、麺は硬めで注文した", "ライスが進む味。ほうれん草を追加した"],
  二郎系: ["野菜マシで頼んだら想像の倍来た", "量が正義。次は少なめと言う"],
  醤油: ["澄んだスープで飲み干せる", "王道の味。チャーシューが柔らかい"],
  味噌: ["寒い日に来たい濃度", "コーンとバターを足して正解だった"],
  塩: ["あっさりだが出汁がしっかり効いている", "スープが綺麗で朝でも入りそう"],
  つけ麺: ["麺が太くて食べ応えがある", "スープ割りまで含めて満足"],
  その他: ["変わり種だが完成度が高い", "他では食べられない一杯"],
};

// FNV-1a。文字列から安定した整数を作る
function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// splitmix32。seed が同じなら毎回同じ並びを返す。
// xorshift32 だと seed が近い駅同士で最初の数個が似た値になり、
// ジャンルが「その他」ばかりに寄ったので、撹拌の強いこちらにした
function createRandom(seed) {
  let state = hashString(seed);
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

// 路線をまたいで同じ駅が出てくるので、id で重複を取り除く
export function allStationIds() {
  const ids = [];
  const seen = new Set();
  for (const lineId of LINE_ORDER) {
    for (const station of LINES[lineId].stations) {
      if (seen.has(station.id)) continue;
      seen.add(station.id);
      ids.push(station.id);
    }
  }
  return ids;
}

/**
 * 全駅分のサンプル投稿を組み立てる。
 *
 * @param {number} now created_at の基準時刻。既定は現在時刻。
 *   テストから固定値を渡せるように引数にしてある。
 * @returns {Array<{station_id: string, shop_name: string, genre: string,
 *   memo: string, rating: number, created_at: string}>}
 */
export function buildSeedPosts(now = Date.now()) {
  const posts = [];
  const day = 24 * 60 * 60 * 1000;

  for (const stationId of allStationIds()) {
    const random = createRandom(stationId);
    const count = 1 + Math.floor(random() * 3); // 1〜3件

    // 同じ駅に同じ店名が並ばないよう、使った名前を控えておく
    const usedNames = new Set();

    for (let i = 0; i < count; i += 1) {
      // 組み合わせは 6 x 16 = 96 通りなので普通は数回で空きが見つかるが、
      // 乱数次第で回り続けないよう上限を切っておく
      let shopName = "";
      for (let attempt = 0; attempt < 50; attempt += 1) {
        shopName = `${pick(SHOP_PREFIXES, random)} ${pick(SHOP_NAMES, random)}`;
        if (!usedNames.has(shopName)) break;
      }
      if (usedNames.has(shopName)) shopName = `${shopName} ${i + 1}号店`;
      usedNames.add(shopName);

      const genre = pick(GENRES, random);

      posts.push({
        station_id: stationId,
        shop_name: shopName,
        genre,
        memo: pick(MEMOS[genre], random),
        rating: 3 + Math.floor(random() * 3), // 3〜5
        // 全部同時刻だと新着順が固まるので、過去120日にばらす
        created_at: new Date(now - Math.floor(random() * 120) * day).toISOString(),
      });
    }
  }

  return posts;
}
