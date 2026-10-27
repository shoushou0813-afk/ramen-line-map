// 路線図は実際の地理じゃなく「スマホで見やすい形」に並べたいので、
// 駅の x, y は手打ちで決めている。
//
// - SVG の座標は左上が原点で、y は下に行くほど増える（数学のグラフと上下が逆）
// - label は駅名を丸のどっち側に置くか。自動配置だと重なるので手で振り分けた
// - viewBox の幅が狭いほど、スマホの横幅に引き伸ばされたときに文字が大きく見える。
//   駅の間隔は隣の駅名が重ならないぎりぎり（5駅の段は 85、4駅の段は 100）まで詰めている
// - corner は次の駅へ行く途中で曲がる点。斜めの線を出したくない所だけ指定する
//   （曲がる必要が無い＝x か y が揃っている区間は指定しなくていい）
//  欠点として追加の駅は作成が困難である
// station の id は路線をまたいで共通。渋谷や新宿は複数路線に出てくるけど、
// 同じ id にしておくと投稿件数がそのまま共有されるので都合がいい。

export const LINES = {
  chuo: {
    id: "chuo",
    name: "中央線",
    viewBox: "0 0 460 390",
    loop: false,
    // 3段の蛇行。小金井の方まで入れると1段に収まらないので、田園都市線と同じ形にした
    stations: [
      { id: "musashikoganei", name: "武蔵小金井", x: 50, y: 70, label: "top" },
      { id: "higashikoganei", name: "東小金井", x: 135, y: 70, label: "top" },
      { id: "musashisakai", name: "武蔵境", x: 220, y: 70, label: "top" },
      { id: "mitaka", name: "三鷹", x: 305, y: 70, label: "top" },
      { id: "kichijoji", name: "吉祥寺", x: 390, y: 70, label: "top" },
      { id: "ogikubo", name: "荻窪", x: 390, y: 200, label: "right" },
      { id: "asagaya", name: "阿佐ヶ谷", x: 305, y: 200, label: "top" },
      { id: "nakano", name: "中野", x: 220, y: 200, label: "top" },
      { id: "shinjuku", name: "新宿", x: 135, y: 200, label: "top" },
      { id: "yotsuya", name: "四ツ谷", x: 50, y: 200, label: "top" },
      { id: "ochanomizu", name: "御茶ノ水", x: 50, y: 330, label: "bottom" },
      { id: "kanda", name: "神田", x: 135, y: 330, label: "bottom" },
      { id: "tokyo", name: "東京", x: 220, y: 330, label: "bottom" },
    ],
  },

  yamanote: {
    id: "yamanote",
    name: "山手線",
    // 横長だと viewBox が広くなって文字が小さくなるので、縦長の四角にした
    viewBox: "0 0 440 540",
    // 環状線なので最後の駅（原宿）と最初の駅（新宿）も結ぶ必要がある
    loop: true,
    stations: [
      { id: "shinjuku", name: "新宿", x: 165, y: 60, label: "top" },
      { id: "shinokubo", name: "新大久保", x: 270, y: 60, label: "top", corner: [340, 60] },
      { id: "takadanobaba", name: "高田馬場", x: 340, y: 144, label: "right" },
      { id: "ikebukuro", name: "池袋", x: 340, y: 228, label: "right" },
      { id: "ueno", name: "上野", x: 340, y: 312, label: "right" },
      { id: "akihabara", name: "秋葉原", x: 340, y: 396, label: "right", corner: [340, 480] },
      { id: "tokyo", name: "東京", x: 270, y: 480, label: "bottom" },
      { id: "shimbashi", name: "新橋", x: 165, y: 480, label: "bottom" },
      { id: "shinagawa", name: "品川", x: 60, y: 480, label: "bottom" },
      { id: "meguro", name: "目黒", x: 60, y: 375, label: "right" },
      { id: "ebisu", name: "恵比寿", x: 60, y: 270, label: "right" },
      { id: "shibuya", name: "渋谷", x: 60, y: 165, label: "right" },
      { id: "harajuku", name: "原宿", x: 60, y: 60, label: "top" },
    ],
  },

  denentoshi: {
    id: "denentoshi",
    name: "田園都市線・半蔵門線",
    viewBox: "0 0 460 390",
    loop: false,
    // 3段の蛇行。段ごとに進む向きが逆になる
    stations: [
      { id: "nagatsuta", name: "長津田", x: 60, y: 70, label: "top" },
      { id: "azamino", name: "あざみ野", x: 160, y: 70, label: "top" },
      { id: "tamaplaza", name: "たまプラーザ", x: 260, y: 70, label: "top" },
      { id: "mizonokuchi", name: "溝の口", x: 360, y: 70, label: "top" },
      { id: "futakotamagawa", name: "二子玉川", x: 360, y: 200, label: "right" },
      { id: "sangenjaya", name: "三軒茶屋", x: 260, y: 200, label: "top" },
      { id: "ikejiriohashi", name: "池尻大橋", x: 160, y: 200, label: "top" },
      { id: "shibuya", name: "渋谷", x: 60, y: 200, label: "top" },
      { id: "omotesando", name: "表参道", x: 60, y: 330, label: "bottom" },
      { id: "nagatacho", name: "永田町", x: 160, y: 330, label: "bottom" },
      { id: "jimbocho", name: "神保町", x: 260, y: 330, label: "bottom" },
      { id: "otemachi", name: "大手町", x: 360, y: 330, label: "bottom" },
    ],
  },

  toyoko: {
    id: "toyoko",
    name: "東横線",
    viewBox: "0 0 490 290",
    loop: false,
    stations: [
      { id: "shibuya", name: "渋谷", x: 50, y: 70, label: "top" },
      { id: "daikanyama", name: "代官山", x: 135, y: 70, label: "top" },
      { id: "nakameguro", name: "中目黒", x: 220, y: 70, label: "top" },
      { id: "yutenji", name: "祐天寺", x: 305, y: 70, label: "top" },
      { id: "gakugeidaigaku", name: "学芸大学", x: 390, y: 70, label: "top" },
      { id: "jiyugaoka", name: "自由が丘", x: 390, y: 200, label: "right" },
      { id: "denenchofu", name: "田園調布", x: 305, y: 200, label: "bottom" },
      { id: "tamagawa", name: "多摩川", x: 220, y: 200, label: "bottom" },
      { id: "shinmaruko", name: "新丸子", x: 135, y: 200, label: "bottom" },
      { id: "musashikosugi", name: "武蔵小杉", x: 50, y: 200, label: "bottom" },
    ],
  },
  sobu: {
    id: "sobu",
    name: "総武線",
    viewBox: "0 0 480 540",
    loop: false,
    // 中央線と重なる駅（三鷹・吉祥寺・荻窪・阿佐ヶ谷・中野・新宿・四ツ谷・御茶ノ水）は中央線のタブに任せて外した。
    // 1段に並ぶ駅を減らすと viewBox が狭くなり、そのぶん文字が大きく表示される。
    // 4駅ごとに折り返す蛇行レイアウト。段の境目は必ず同じxで繋いで縦線にし、斜め線を避けている
    stations: [
      { id: "nishiogikubo", name: "西荻窪", x: 90, y: 70, label: "top" },
      { id: "koenji", name: "高円寺", x: 190, y: 70, label: "top" },
      { id: "higashinakano", name: "東中野", x: 290, y: 70, label: "top" },
      { id: "okubo", name: "大久保", x: 390, y: 70, label: "top" },
      { id: "yoyogi", name: "代々木", x: 390, y: 200, label: "right" },
      { id: "sendagaya", name: "千駄ケ谷", x: 290, y: 200, label: "bottom" },
      { id: "shinanomachi", name: "信濃町", x: 190, y: 200, label: "bottom" },
      { id: "ichigaya", name: "市ケ谷", x: 90, y: 200, label: "top" },
      { id: "iidabashi", name: "飯田橋", x: 90, y: 330, label: "left" },
      { id: "suidobashi", name: "水道橋", x: 190, y: 330, label: "top" },
      { id: "akihabara", name: "秋葉原", x: 290, y: 330, label: "top" },
      { id: "asakusabashi", name: "浅草橋", x: 390, y: 330, label: "top" },
      { id: "ryogoku", name: "両国", x: 390, y: 460, label: "right" },
      { id: "kinshicho", name: "錦糸町", x: 290, y: 460, label: "bottom" },
      { id: "shinkoiwa", name: "新小岩", x: 190, y: 460, label: "bottom" },
      { id: "chiba", name: "千葉", x: 90, y: 460, label: "bottom" },
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
