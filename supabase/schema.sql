-- Supabase の SQL Editor にそのまま貼って実行する。

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  station_id text not null,                 -- src/data/lines.js の駅 id と揃える
  shop_name  text not null,
  genre      text not null,
  memo       text,
  user_id    uuid not null references auth.users (id) on delete cascade,
  user_name  text not null,                 -- 表示用。投稿時点の名前を持たせている
  created_at timestamptz not null default now()
);

-- 駅ごとの絞り込みと新着順の取得を速くする
create index if not exists posts_station_id_idx on public.posts (station_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- RLS（行単位のアクセス制御）。
-- anon キーはブラウザに露出するので、これを有効にしないと誰でも他人の投稿を消せる
alter table public.posts enable row level security;

drop policy if exists "誰でも読める" on public.posts;
create policy "誰でも読める"
  on public.posts for select
  using (true);

drop policy if exists "ログイン中の本人だけ投稿できる" on public.posts;
create policy "ログイン中の本人だけ投稿できる"
  on public.posts for insert
  with check (auth.uid() = user_id);

drop policy if exists "本人だけ削除できる" on public.posts;
create policy "本人だけ削除できる"
  on public.posts for delete
  using (auth.uid() = user_id);
