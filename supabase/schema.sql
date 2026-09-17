

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

-- 投稿者（user_id / user_name）はサーバー側で決める。
-- RLS は user_id しか検証しないので、user_name をブラウザから送らせると
-- 本人のまま好きな表示名を名乗れてしまう。BEFORE INSERT で必ず上書きする。
-- security definer なのは auth.users を読むため（通常の権限では参照できない）。
--
-- auth.uid() が null になるのは次の2通りで、どちらも上書きしない：
--   1. 未ログインのブラウザ … RLS の with check (auth.uid() = user_id) が弾く
--   2. service_role キーや SQL Editor … もともと全権を持つ管理経路。
--      シードスクリプトや手動メンテのために、指定した値をそのまま通す
create or replace function public.set_post_author()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta  jsonb;
  mail  text;
begin
  if auth.uid() is null then
    return new;
  end if;

  new.user_id := auth.uid();

  select u.raw_user_meta_data, u.email
    into meta, mail
    from auth.users u
   where u.id = auth.uid();

  new.user_name := coalesce(
    nullif(meta ->> 'name', ''),
    nullif(meta ->> 'full_name', ''),
    nullif(split_part(coalesce(mail, ''), '@', 1), ''),
    '名無し'
  );

  return new;
end;
$$;

drop trigger if exists set_post_author on public.posts;
create trigger set_post_author
  before insert on public.posts
  for each row execute function public.set_post_author();

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
