export default function Stars({ value }) {
  return (
    <span className="rating" aria-label={`評価 ${value} / 5`}>
      {"★".repeat(value)}
      {"☆".repeat(5 - value)}
    </span>
  );
}
