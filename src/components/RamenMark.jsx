// 名前の横に出すラーメンのマーク。一番多く投稿している種類によって、スープの色と上にのせる絵が変わる。
// 味噌・醤油・塩は具ではなく、その調味料そのもの（味噌のかたまり・醤油さし・塩の瓶）を描いている。
// 丼とスープは共通で、種類ごとに TOPPINGS の中身だけを差し替えている。

const SOUP_COLORS = {
  家系: "#c98a3e",
  二郎系: "#a5672f",
  醤油: "#7a3b12",
  味噌: "#d9923a",
  塩: "#f1dc9a",
  つけ麺: "#5a2e10",
  その他: "#e3b85c", // 油そばの麺の色
};

const TOPPINGS = {
  // 丼のふちに立てた海苔と、ほうれん草
  家系: (
    <>
      <ellipse cx="7.5" cy="10.3" rx="2.2" ry="1.2" fill="#2f6b2a" />
      <ellipse cx="9.8" cy="9.8" rx="1.8" ry="1.1" fill="#3f8a36" />
      <path d="M6.5 10 L10.5 9.6" stroke="#6fb05e" strokeWidth="0.4" />
      <rect x="14" y="2.5" width="3.2" height="8.5" fill="#1f3a24" />
      <rect x="17.6" y="3.5" width="3.2" height="7.5" fill="#2b4d31" />
    </>
  ),
  // 山盛りの野菜に背脂、分厚いチャーシュー、にんにく
  二郎系: (
    <>
      <rect x="2.6" y="5.4" width="4.6" height="5.6" rx="1" fill="#8b4a22" stroke="#c98a5a" strokeWidth="0.6" transform="rotate(-15 4.9 8.2)" />
      <path d="M6.5 11 Q12 -1 17.5 11 Z" fill="#e6efcf" stroke="#9cbb63" strokeWidth="0.8" />
      <circle cx="11" cy="4" r="0.9" fill="#fffdf5" stroke="#d9d2bd" strokeWidth="0.3" />
      <circle cx="12.8" cy="5.2" r="0.8" fill="#fffdf5" stroke="#d9d2bd" strokeWidth="0.3" />
      <circle cx="10.2" cy="6.4" r="0.7" fill="#fffdf5" stroke="#d9d2bd" strokeWidth="0.3" />
      <circle cx="13.6" cy="7.6" r="0.7" fill="#fffdf5" stroke="#d9d2bd" strokeWidth="0.3" />
      <path d="M17 11 Q19 8.4 21 11 Z" fill="#f3e3a4" />
    </>
  ),
  // 醤油さし
  醤油: (
    <>
      <rect x="15" y="4" width="5" height="7.5" rx="1.3" fill="#2e1606" />
      <rect x="15.6" y="6.6" width="3.8" height="2" fill="#fff" />
      <rect x="15.8" y="1.6" width="3.4" height="2.8" rx="0.7" fill="#d7262e" />
      <path d="M15.8 2.4 L14 1.8" stroke="#d7262e" strokeWidth="0.9" strokeLinecap="round" />
    </>
  ),
  // 味噌のかたまり
  味噌: (
    <>
      <path d="M7.5 11 Q7 6 12 5.8 Q17 6 16.5 11 Z" fill="#b8692a" />
      <path d="M9.5 8.5 Q12 7.4 14.5 8.5 M9 10 Q12 9 15 10" fill="none" stroke="#8a4a17" strokeWidth="0.6" />
    </>
  ),
  // 塩の瓶と、ふりかけた塩の粒
  塩: (
    <>
      <rect x="14.5" y="4.2" width="5.5" height="7" rx="1.5" fill="#fff" stroke="#b9b9b9" strokeWidth="0.6" />
      <rect x="14.5" y="1.8" width="5.5" height="2.8" rx="1" fill="#8f99a3" />
      <circle cx="16" cy="3.2" r="0.4" fill="#fff" />
      <circle cx="17.25" cy="3.2" r="0.4" fill="#fff" />
      <circle cx="18.5" cy="3.2" r="0.4" fill="#fff" />
      <rect x="7" y="9.8" width="0.9" height="0.9" fill="#fff" />
      <rect x="9.2" y="10.6" width="0.9" height="0.9" fill="#fff" />
      <rect x="11" y="9.6" width="0.9" height="0.9" fill="#fff" />
    </>
  ),
  // 箸で持ち上げた麺
  つけ麺: (
    <>
      <path d="M8 1.5 L13 10" stroke="#8a5a2b" strokeWidth="0.9" />
      <path d="M10 1 L14.5 10" stroke="#8a5a2b" strokeWidth="0.9" />
      <path d="M10 4 Q9 7 11 10 M11.5 4 Q10.5 7 12.5 10 M13 4.3 Q12 7 14 10" fill="none" stroke="#f0cd78" strokeWidth="0.9" />
    </>
  ),
  // 油そば（スープなしの麺に、卵黄とねぎ）
  その他: (
    <>
      <path d="M4 11 q1.5 -1.6 3 0 t3 0 t3 0 t3 0 t3 0" fill="none" stroke="#b9842a" strokeWidth="0.8" />
      <circle cx="13" cy="9.8" r="1.8" fill="#f4a300" stroke="#fff3c4" strokeWidth="0.5" />
      <rect x="7" y="9.4" width="1.4" height="0.8" fill="#4caf50" />
      <rect x="16.5" y="9.8" width="1.4" height="0.8" fill="#4caf50" />
    </>
  ),
};

export default function RamenMark({ genre, size = 18 }) {
  const soup = SOUP_COLORS[genre] ?? "#eee";
  return (
    <svg className="ramen-mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 11 H22 A10 9 0 0 1 2 11 Z" fill="#c23a2b" />
      <path d="M4 15 H20" stroke="#fff" strokeWidth="0.8" strokeDasharray="1.6 1.2" />
      <ellipse cx="12" cy="11" rx="10" ry="2.2" fill={soup} stroke="#9e2b1f" strokeWidth="0.6" />
      {TOPPINGS[genre]}
      <rect x="8" y="19.5" width="8" height="2" rx="1" fill="#9e2b1f" />
    </svg>
  );
}
