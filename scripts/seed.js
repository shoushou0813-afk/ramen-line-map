// デモ用のサンプル投稿を Supabase に一括投入する。ローカルからのみ実行する。
//
//   npm run seed -- --dry-run   何も書き込まず、入る予定の件数と中身を表示する
//   npm run seed                実際に投入する
//
// service_role キーは RLS を全て素通りする管理者用の鍵なので、.env に置いたまま
// にして Git にも Vercel のクライアント側にも出さないこと。VITE_ を付けると
// ブラウザのバンドルに埋め込まれてしまうので、絶対に付けない。
//
// 投稿は (station_id, shop_name) が既にあれば飛ばすので、何度実行しても増えない。

import { createClient } from "@supabase/supabase-js";
import { buildSeedPosts } from "./seed-data.js";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dryRun = process.argv.includes("--dry-run");

if (!url || !serviceRoleKey) {
  console.error(
    "SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY が必要です。\n" +
      ".env.example を見て .env に追記してください。\n" +
      "（npm run seed は node --env-file=.env 経由で .env を読み込みます）"
  );
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// posts.user_id は auth.users への外部キーなので、実在するユーザーが要る。
// 一度アプリにログインしていれば、そのアカウントが使える。
async function findSeedUser() {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  const users = data?.users ?? [];
  if (users.length === 0) {
    throw new Error(
      "Supabase にユーザーが1人もいません。先にアプリを開いて一度 Google ログインしてください。"
    );
  }

  const wanted = process.env.SEED_USER_EMAIL;
  const user = wanted ? users.find((u) => u.email === wanted) : users[0];
  if (!user) {
    throw new Error(`SEED_USER_EMAIL=${wanted} に一致するユーザーが見つかりません。`);
  }
  return user;
}

// schema.sql のトリガーと同じ優先順で表示名を決める。
// service_role 経由だと auth.uid() が null でトリガーが上書きしないため、
// ここで値を作って渡す必要がある
function displayName(user) {
  const meta = user.user_metadata ?? {};
  return (
    meta.name ||
    meta.full_name ||
    (user.email ? user.email.split("@")[0] : "") ||
    "名無し"
  );
}

async function main() {
  const user = await findSeedUser();
  const userName = displayName(user);
  console.log(`投稿者: ${userName} <${user.email ?? "メールなし"}>`);

  const { data: existing, error: selectError } = await admin
    .from("posts")
    .select("station_id, shop_name");
  if (selectError) throw selectError;

  // 区切り文字が店名に含まれても崩れないよう、配列をJSON化してキーにする
  const key = (p) => JSON.stringify([p.station_id, p.shop_name]);
  const seen = new Set((existing ?? []).map(key));

  const posts = buildSeedPosts()
    .filter((p) => !seen.has(key(p)))
    .map((p) => ({ ...p, user_id: user.id, user_name: userName }));

  console.log(`既存の投稿: ${existing?.length ?? 0}件 / 今回入れる投稿: ${posts.length}件`);

  if (posts.length === 0) {
    console.log("入れるものがありません。");
    return;
  }

  if (dryRun) {
    console.log("--dry-run のため書き込みません。先頭5件:");
    for (const p of posts.slice(0, 5)) {
      console.log(`  ${p.station_id.padEnd(16)} ${p.shop_name} / ${p.genre} / ★${p.rating}`);
    }
    return;
  }

  // 一度に全部送らず、100件ずつに分けて入れる
  for (let i = 0; i < posts.length; i += 100) {
    const chunk = posts.slice(i, i + 100);
    const { error } = await admin.from("posts").insert(chunk);
    if (error) throw error;
    console.log(`  ${i + chunk.length} / ${posts.length} 件`);
  }

  console.log("完了しました。");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
