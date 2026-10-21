// 名前の横に出すラーメンのマーク。一番多く投稿している種類によって、スープの色と具が変わる。
// 丼とスープは共通で、種類ごとに TOPPINGS の中身だけを差し替えている。

const SOUP_COLORS = {
  家系: "#c98a3e",
  二郎系: "#a5672f",
  醤油: "#7a3b12",
  味噌: "#d9923a",
  塩: "#f1dc9a",
  つけ麺: "#5a2e10",
  その他: "#d8c3a5",
};

const TOPPINGS = {
  // 丼のふちに立てた海苔
  家系: (
    <>
      <rect x="14" y="2.5" width="3.2" height="8.5" fill="#1f3a24" />
      <rect x="17.6" y="3.5" width="3.2" height="7.5" fill="#2b4d31" />
    </>
  ),
  // 山盛りの野菜
  二郎系: <path d="M5.5 11 Q12 -1 18.5 11 Z" fill="#e6efcf" stroke="#9cbb63" strokeWidth="0.8" />,
  // なると
  醤油: (
    <>
      <circle cx="9" cy="10.4" r="2.2" fill="#fff" stroke="#e05587" strokeWidth="0.8" />
      <path d="M9 10.4 m-1 0 a1 1 0 1 1 1 1" fill="none" stroke="#e05587" strokeWidth="0.6" />
    </>
  ),
  // コーン
  味噌: (
    <>
      <circle cx="8" cy="11" r="1.1" fill="#f6cf2b" />
      <circle cx="10.4" cy="10.4" r="1.1" fill="#f6cf2b" />
      <circle cx="12.8" cy="11" r="1.1" fill="#f6cf2b" />
      <circle cx="15.2" cy="10.4" r="1.1" fill="#f6cf2b" />
    </>
  ),
  // 半分に切った煮卵
  塩: (
    <>
      <ellipse cx="14" cy="10.4" rx="2.8" ry="2" fill="#fff" stroke="#e2d2a8" strokeWidth="0.5" />
      <circle cx="14" cy="10.4" r="1.1" fill="#f2a81d" />
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
  // 湯気
  その他: <path d="M9 9 Q8 6.5 9.5 5 T9 1.5 M14 9 Q13 6.5 14.5 5 T14 1.5" fill="none" stroke="#b5b5b5" strokeWidth="0.9" />,
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
