import { SORT_OPTIONS } from "../lib/sortPosts";

// 投稿一覧の並び順を選ぶプルダウン
export default function SortSelect({ value, onChange }) {
  return (
    <label className="sort-select">
      並び順
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
