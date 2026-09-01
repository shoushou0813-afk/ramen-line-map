// 路線図は実際の地理じゃなく「スマホで見やすい形」に並べたいので、
// 駅の x, y は手打ちで決めている。
//
// - SVG の座標は左上が原点で、y は下に行くほど増える（数学のグラフと上下が逆）
// - label は駅名を丸のどっち側に置くか。自動配置だと重なるので手で振り分けた
// - corner は次の駅へ行く途中で曲がる点。斜めの線を出したくない所だけ指定する
//   （曲がる必要が無い＝x か y が揃っている区間は指定しなくていい）
//  欠点として追加の駅は作成が困難である
// station の id は路線をまたいで共通。渋谷や新宿は複数路線に出てくるけど、
// 同じ id にしておくと投稿件数がそのまま共有されるので都合がいい。

export const LINES = {
  chuo: {
    id: "chuo",
    name: "中央線",
    viewBox: "0 0 600 290",
    loop: false,
    stations: [
      { id: "mitaka", name: "三鷹", x: 90, y: 70, label: "top" },
      { id: "kichijoji", name: "吉祥寺", x: 190, y: 70, label: "top" },
      { id: "ogikubo", name: "荻窪", x: 290, y: 70, label: "top" },
      { id: "asagaya", name: "阿佐ヶ谷", x: 390, y: 70, label: "top" },
      { id: "nakano", name: "中野", x: 490, y: 70, label: "top" },
      { id: "shinjuku", name: "新宿", x: 490, y: 200, label: "right" },
      { id: "yotsuya", name: "四ツ谷", x: 390, y: 200, label: "bottom" },
      { id: "ochanomizu", name: "御茶ノ水", x: 290, y: 200, label: "bottom" },
      { id: "kanda", name: "神田", x: 190, y: 200, label: "bottom" },
      { id: "tokyo", name: "東京", x: 90, y: 200, label: "bottom" },
    ],
  },

  yamanote: {
    id: "yamanote",
    name: "山手線",
    viewBox: "0 0 600 400",
    // 環状線なので最後の駅（原宿）と最初の駅（新宿）も結ぶ必要がある
    loop: true,
    stations: [
      { id: "shinjuku", name: "新宿", x: 300, y: 55, label: "top", corner: [470, 55] },
      { id: "shinokubo", name: "新大久保", x: 400, y: 55, label: "top", corner: [470, 55] },
      { id: "takadanobaba", name: "高田馬場", x: 470, y: 130, label: "right" },
      { id: "ikebukuro", name: "池袋", x: 470, y: 200, label: "right" },
      { id: "ueno", name: "上野", x: 470, y: 270, label: "right", corner: [470, 345] },
      { id: "akihabara", name: "秋葉原", x: 370, y: 345, label: "bottom" },
      { id: "tokyo", name: "東京", x: 290, y: 345, label: "bottom" },
      { id: "shimbashi", name: "新橋", x: 210, y: 345, label: "bottom" },
      { id: "shinagawa", name: "品川", x: 130, y: 345, label: "bottom" },
      { id: "meguro", name: "目黒", x: 130, y: 270, label: "right" },
      { id: "ebisu", name: "恵比寿", x: 130, y: 200, label: "right" },
      { id: "shibuya", name: "渋谷", x: 130, y: 130, label: "right", corner: [130, 55] },
      { id: "harajuku", name: "原宿", x: 215, y: 55, label: "top" },
    ],
  },

  denentoshi: {
    id: "denentoshi",
    name: "田園都市線・半蔵門線",
    viewBox: "0 0 600 420",
    loop: false,
    // 3段の蛇行。段ごとに進む向きが逆になる
    stations: [
      { id: "nagatsuta", name: "長津田", x: 110, y: 70, label: "top" },
      { id: "azamino", name: "あざみ野", x: 230, y: 70, label: "top" },
      { id: "tamaplaza", name: "たまプラーザ", x: 350, y: 70, label: "top" },
      { id: "mizonokuchi", name: "溝の口", x: 470, y: 70, label: "top" },
      { id: "futakotamagawa", name: "二子玉川", x: 470, y: 200, label: "right" },
      { id: "sangenjaya", name: "三軒茶屋", x: 350, y: 200, label: "top" },
      { id: "ikejiriohashi", name: "池尻大橋", x: 230, y: 200, label: "top" },
      { id: "shibuya", name: "渋谷", x: 110, y: 200, label: "top" },
      { id: "omotesando", name: "表参道", x: 110, y: 330, label: "bottom" },
      { id: "nagatacho", name: "永田町", x: 230, y: 330, label: "bottom" },
      { id: "jimbocho", name: "神保町", x: 350, y: 330, label: "bottom" },
      { id: "otemachi", name: "大手町", x: 470, y: 330, label: "bottom" },
    ],
  },

  toyoko: {
    id: "toyoko",
    name: "東横線",
    viewBox: "0 0 600 290",
    loop: false,
    stations: [
      { id: "shibuya", name: "渋谷", x: 90, y: 70, label: "top" },
      { id: "daikanyama", name: "代官山", x: 190, y: 70, label: "top" },
      { id: "nakameguro", name: "中目黒", x: 290, y: 70, label: "top" },
      { id: "yutenji", name: "祐天寺", x: 390, y: 70, label: "top" },
      { id: "gakugeidaigaku", name: "学芸大学", x: 490, y: 70, label: "top" },
      { id: "jiyugaoka", name: "自由が丘", x: 490, y: 200, label: "right" },
      { id: "denenchofu", name: "田園調布", x: 390, y: 200, label: "bottom" },
      { id: "tamagawa", name: "多摩川", x: 290, y: 200, label: "bottom" },
      { id: "shinmaruko", name: "新丸子", x: 190, y: 200, label: "bottom" },
      { id: "musashikosugi", name: "武蔵小杉", x: 90, y: 200, label: "bottom" },
    ],
  },
};

// タブに出す順番。オブジェクトのキー順に頼ると環境で変わる可能性があるので明示する
export const LINE_ORDER = ["chuo", "yamanote", "denentoshi", "toyoko"];

// 駅 id から駅名を引く用。路線をまたいで重複する駅は最初に見つかった方でいい
const STATION_NAMES = {};
for (const key of LINE_ORDER) {
  for (const st of LINES[key].stations) {
    if (!STATION_NAMES[st.id]) STATION_NAMES[st.id] = st.name;
  }
}

export function stationName(id) {
  return STATION_NAMES[id] ?? id;
}

export const GENRES = ["家系", "二郎系", "醤油", "味噌", "塩", "つけ麺", "その他"];
