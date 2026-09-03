import { supabase } from "./supabase";
import { BUCKET, extensionFor, storagePathFromUrl } from "./image";

// Storage との通信部分。検証やパスの組み立ては image.js 側にある。

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
