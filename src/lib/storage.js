import { supabase } from "./supabase";

// 投稿写真を置く Storage バケット。RLS のポリシーが
// 「パスの1階層目 = 自分の user_id」を前提にしているので、
// 保存パスの組み立てはこのファイルに閉じ込めている。
export const BUCKET = "post-images";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// アップロード前のチェック。問題があればユーザーに出すメッセージを返す。
// バケット側にも同じ制限をかけてある（schema.sql）ので、ここはあくまで
// 通信する前に気づかせるためのもの。
export function validateImage(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "画像は JPEG / PNG / WebP のみ添付できます。";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (MAX_IMAGE_BYTES / 1024 / 1024).toFixed(0);
    return `画像は ${mb}MB までです。`;
  }
  return null;
}

// 公開URLから storage 上のパスを取り出す（削除に必要）。
// URL は .../object/public/post-images/<user_id>/<file> の形になる。
export function storagePathFromUrl(url) {
  let pathname;
  try {
    ({ pathname } = new URL(url));
  } catch {
    return null;
  }

  const marker = `/${BUCKET}/`;
  const at = pathname.indexOf(marker);
  if (at === -1) return null;

  const path = pathname.slice(at + marker.length);
  return path ? decodeURIComponent(path) : null;
}

// 拡張子は Content-Type から決める。ファイル名由来だと
// 拡張子なしのファイルでパスが壊れるため。
function extensionFor(type) {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

export async function uploadImage(file, userId) {
  const path = `${userId}/${crypto.randomUUID()}.${extensionFor(file.type)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function removeImage(url) {
  const path = storagePathFromUrl(url);
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
