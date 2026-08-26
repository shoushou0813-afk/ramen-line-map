import PostForm from "./PostForm";
import PostList from "./PostList";
import { stationName } from "../data/lines";

export default function StationPanel({ stationId, posts, session, onChanged }) {
  return (
    <section className="card">
      <h2 className="card-title">{stationName(stationId)}駅周辺</h2>
      <PostForm session={session} stationId={stationId} onPosted={onChanged} />
      <PostList posts={posts} session={session} onChanged={onChanged} />
    </section>
  );
}
