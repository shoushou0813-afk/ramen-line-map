// 路線図は実際の地理じゃなく「スマホで見やすい形」に並べたいので、
// 駅の x, y は手打ちで決めている。
//
// - SVG の座標は左上が原点で、y は下に行くほど増える（数学のグラフと上下が逆）
// - 駅名を丸のどっち側に置くかは、線の向きから自動で決める（lib/lineMap.js の labelSide）
// - color は路線の色。路線図の線に使う
// - corner は次の駅へ行く途中で曲がる点。斜めの線を出したくない所だけ指定する
//   （曲がる必要が無い＝x か y が揃っている区間は指定しなくていい）
//  欠点として追加の駅は作成が困難である
// station の id は路線をまたいで共通。渋谷や新宿は複数路線に出てくるけど、
// 同じ id にしておくと投稿件数がそのまま共有されるので都合がいい。

export const LINES = {
  chuo: {
    id: "chuo",
    name: "中央線",
    color: "#f15a22",
    viewBox: "0 0 600 290",
    loop: false,
    stations: [
      { id: "mitaka", name: "三鷹", x: 90, y: 70 },
      { id: "kichijoji", name: "吉祥寺", x: 190, y: 70 },
      { id: "ogikubo", name: "荻窪", x: 290, y: 70 },
      { id: "asagaya", name: "阿佐ヶ谷", x: 390, y: 70 },
      { id: "nakano", name: "中野", x: 490, y: 70 },
      { id: "shinjuku", name: "新宿", x: 490, y: 200 },
      { id: "yotsuya", name: "四ツ谷", x: 390, y: 200 },
      { id: "ochanomizu", name: "御茶ノ水", x: 290, y: 200 },
      { id: "kanda", name: "神田", x: 190, y: 200 },
      { id: "tokyo", name: "東京", x: 90, y: 200 },
    ],
  },

  yamanote: {
    id: "yamanote",
    name: "山手線",
    color: "#9acd32",
    viewBox: "0 0 600 400",
    // 環状線なので最後の駅（原宿）と最初の駅（新宿）も結ぶ必要がある
    loop: true,
    stations: [
      { id: "shinjuku", name: "新宿", x: 300, y: 55, corner: [470, 55] },
      { id: "shinokubo", name: "新大久保", x: 400, y: 55, corner: [470, 55] },
      { id: "takadanobaba", name: "高田馬場", x: 470, y: 130 },
      { id: "ikebukuro", name: "池袋", x: 470, y: 200 },
      { id: "ueno", name: "上野", x: 470, y: 270, corner: [470, 345] },
      { id: "akihabara", name: "秋葉原", x: 370, y: 345 },
      { id: "tokyo", name: "東京", x: 290, y: 345 },
      { id: "shimbashi", name: "新橋", x: 210, y: 345 },
      { id: "shinagawa", name: "品川", x: 130, y: 345 },
      { id: "meguro", name: "目黒", x: 130, y: 270 },
      { id: "ebisu", name: "恵比寿", x: 130, y: 200 },
      { id: "shibuya", name: "渋谷", x: 130, y: 130, corner: [130, 55] },
      { id: "harajuku", name: "原宿", x: 215, y: 55 },
    ],
  },

  denentoshi: {
    id: "denentoshi",
    name: "田園都市線・半蔵門線",
    color: "#20a288",
    viewBox: "0 0 600 420",
    loop: false,
    // 3段の蛇行。段ごとに進む向きが逆になる
    stations: [
      { id: "nagatsuta", name: "長津田", x: 90, y: 70 },
      { id: "azamino", name: "あざみ野", x: 217, y: 70 },
      { id: "tamaplaza", name: "たまプラーザ", x: 343, y: 70 },
      { id: "mizonokuchi", name: "溝の口", x: 470, y: 70 },
      { id: "futakotamagawa", name: "二子玉川", x: 470, y: 200 },
      { id: "sangenjaya", name: "三軒茶屋", x: 343, y: 200 },
      { id: "ikejiriohashi", name: "池尻大橋", x: 217, y: 200 },
      { id: "shibuya", name: "渋谷", x: 90, y: 200 },
      { id: "omotesando", name: "表参道", x: 90, y: 330 },
      { id: "nagatacho", name: "永田町", x: 217, y: 330 },
      { id: "jimbocho", name: "神保町", x: 343, y: 330 },
      { id: "otemachi", name: "大手町", x: 470, y: 330 },
    ],
  },

  toyoko: {
    id: "toyoko",
    name: "東横線",
    color: "#da0442",
    viewBox: "0 0 600 290",
    loop: false,
    stations: [
      { id: "shibuya", name: "渋谷", x: 90, y: 70 },
      { id: "daikanyama", name: "代官山", x: 190, y: 70 },
      { id: "nakameguro", name: "中目黒", x: 290, y: 70 },
      { id: "yutenji", name: "祐天寺", x: 390, y: 70 },
      { id: "gakugeidaigaku", name: "学芸大学", x: 490, y: 70 },
      { id: "jiyugaoka", name: "自由が丘", x: 490, y: 200 },
      { id: "denenchofu", name: "田園調布", x: 390, y: 200 },
      { id: "tamagawa", name: "多摩川", x: 290, y: 200 },
      { id: "shinmaruko", name: "新丸子", x: 190, y: 200 },
      { id: "musashikosugi", name: "武蔵小杉", x: 90, y: 200 },
    ],
  },
  sobu: {
    id: "sobu",
    name: "総武線",
    color: "#ffd400",
    viewBox: "0 0 680 540",
    loop: false,
    // 6駅ごとに折り返す蛇行レイアウト。段の境目は必ず同じxで繋いで縦線にし、斜め線を避けている
    stations: [
      { id: "mitaka", name: "三鷹", x: 90, y: 70 },
      { id: "kichijoji", name: "吉祥寺", x: 190, y: 70 },
      { id: "nishiogikubo", name: "西荻窪", x: 290, y: 70 },
      { id: "ogikubo", name: "荻窪", x: 390, y: 70 },
      { id: "asagaya", name: "阿佐ヶ谷", x: 490, y: 70 },
      { id: "koenji", name: "高円寺", x: 590, y: 70 },
      { id: "nakano", name: "中野", x: 590, y: 200 },
      { id: "higashinakano", name: "東中野", x: 490, y: 200 },
      { id: "okubo", name: "大久保", x: 390, y: 200 },
      { id: "shinjuku", name: "新宿", x: 290, y: 200 },
      { id: "yoyogi", name: "代々木", x: 190, y: 200 },
      { id: "sendagaya", name: "千駄ケ谷", x: 90, y: 200 },
      { id: "shinanomachi", name: "信濃町", x: 90, y: 330 },
      { id: "yotsuya", name: "四ツ谷", x: 190, y: 330 },
      { id: "ichigaya", name: "市ケ谷", x: 290, y: 330 },
      { id: "iidabashi", name: "飯田橋", x: 390, y: 330 },
      { id: "suidobashi", name: "水道橋", x: 490, y: 330 },
      { id: "ochanomizu", name: "御茶ノ水", x: 590, y: 330 },
      { id: "akihabara", name: "秋葉原", x: 590, y: 460 },
      { id: "asakusabashi", name: "浅草橋", x: 490, y: 460 },
      { id: "ryogoku", name: "両国", x: 390, y: 460 },
      { id: "kinshicho", name: "錦糸町", x: 290, y: 460 },
      { id: "shinkoiwa", name: "新小岩", x: 190, y: 460 },
      { id: "chiba", name: "千葉", x: 90, y: 460 },
    ],
  },
};

// タブに出す順番。オブジェクトのキー順に頼ると環境で変わる可能性があるので明示する
export const LINE_ORDER = ["chuo", "yamanote", "denentoshi", "toyoko", "sobu"];

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

/** 駅名にその文字を含む駅の id を返す。「新宿駅」のように最後に「駅」を付けて入力されても探せるようにする */
export function stationIdsMatching(query) {
  const keyword = query.trim().replace(/駅$/, "");
  if (!keyword) return [];
  return Object.keys(STATION_NAMES).filter((id) => STATION_NAMES[id].includes(keyword));
}

export const GENRES = ["家系", "二郎系", "醤油", "味噌", "塩", "つけ麺", "その他"];

/**
 * 検索語に当てはまるラーメンの種類を返す。
 * 「二郎」のように種類名の一部でも、「家系ラーメン」のように種類名を含む言い方でも探せるようにする。
 */
export function genresMatching(query) {
  const keyword = query.trim();
  if (!keyword) return [];
  return GENRES.filter((genre) => genre.includes(keyword) || keyword.includes(genre));
}
