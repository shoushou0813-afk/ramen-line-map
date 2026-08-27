

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  station_id text not null,                 -- src/data/lines.js の駅 id と揃える
  shop_name  text not null,
  genre      text not null,
  memo       text,
  rating     smallint not null default 5 check (rating between 1 and 5),
  image_url  text,                          -- post-images バケットの公開URL
  user_id    uuid not null references auth.users (id) on delete cascade,
  user_name  text not null,                 -- 表示用。投稿時点の名前を持たせている
  created_at timestamptz not null default now()
);

-- 既存の posts テーブルに後から足す場合用（新規作成時は上の create table で既に入っている）
alter table public.posts add column if not exists rating smallint not null default 5 check (rating between 1 and 5);
alter table public.posts add column if not exists image_url text;

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

-- 投稿写真用の Storage バケット。
-- ファイルは "{user_id}/xxxx.jpg" のパスで保存する（本人判定に使うため）
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "誰でも読める（画像）" on storage.objects;
create policy "誰でも読める（画像）"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "ログイン中の本人だけアップロードできる（画像）" on storage.objects;
create policy "ログイン中の本人だけアップロードできる（画像）"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "本人だけ削除できる（画像）" on storage.objects;
create policy "本人だけ削除できる（画像）"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
