-- Supabase の SQL Editor でそのまま実行する。
-- 新規プロジェクトでも、既に posts がある環境でも、何度流しても同じ結果になるように書いてある。

-- ---------------------------------------------------------------
-- テーブル
-- ---------------------------------------------------------------

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

-- 既存の posts に後から足す分（新規作成時は上の create table で入っている）
alter table public.posts add column if not exists rating smallint not null default 5 check (rating between 1 and 5);
alter table public.posts add column if not exists image_url text;

-- ---------------------------------------------------------------
-- 入力の長さ制限
-- クライアント側の maxLength だけだと API を直接叩けば回避できるので、
-- DB 側にも同じ上限を置く（src/components/PostForm.jsx の定数と対応）
-- ---------------------------------------------------------------

alter table public.posts drop constraint if exists posts_shop_name_length;
alter table public.posts add constraint posts_shop_name_length
  check (char_length(shop_name) between 1 and 100);

alter table public.posts drop constraint if exists posts_memo_length;
alter table public.posts add constraint posts_memo_length
  check (memo is null or char_length(memo) <= 500);

alter table public.posts drop constraint if exists posts_user_name_length;
alter table public.posts add constraint posts_user_name_length
  check (char_length(user_name) between 1 and 100);

-- ---------------------------------------------------------------
-- インデックス（駅ごとの絞り込みと新着順の取得を速くする）
-- ---------------------------------------------------------------

create index if not exists posts_station_id_idx on public.posts (station_id);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ---------------------------------------------------------------
-- RLS（行単位のアクセス制御）
-- anon キーはブラウザに露出するので、これを有効にしないと誰でも他人の投稿を消せる
-- ---------------------------------------------------------------

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

-- ---------------------------------------------------------------
-- Storage（投稿写真）
-- ファイルは "{user_id}/xxxx.jpg" のパスで保存する（本人判定に使うため）。
-- サイズと形式はバケット側でも制限する。クライアントのチェックだけだと
-- API を直接叩かれた時に無制限にアップロードできてしまうため。
-- ---------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,                                            -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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
