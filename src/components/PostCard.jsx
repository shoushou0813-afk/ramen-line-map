import Stars from "./Stars";

// 投稿カードの共通部分（評価・メモ・写真）。
// 見出しとフッターは駅一覧とリールで出したい情報が違うので、
// 呼び出し側から要素を渡してもらう形にしている。
export default function PostCard({ post, as: Tag = "li", className = "post", head, foot }) {
  return (
    <Tag className={className}>
      {head}
      <Stars value={post.rating ?? 0} />
      {post.memo && <p className="post-memo">{post.memo}</p>}
      {post.image_url && (
        <img className="post-image" src={post.image_url} alt={post.shop_name} loading="lazy" />
      )}
      {foot}
    </Tag>
  );
}
