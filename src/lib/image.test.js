import { describe, it, expect } from "vitest";
import {
  ALLOWED_IMAGE_TYPES,
  BUCKET,
  MAX_IMAGE_BYTES,
  extensionFor,
  storagePathFromUrl,
  validateImage,
} from "./image";

describe("validateImage", () => {
  const file = (type, size) => ({ type, size });

  it("許可された形式でサイズも収まっていれば通る", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(validateImage(file(type, 1024))).toBeNull();
    }
  });

  it("許可していない形式は弾く", () => {
    expect(validateImage(file("image/gif", 1024))).toContain("JPEG");
    expect(validateImage(file("application/pdf", 1024))).toContain("JPEG");
    expect(validateImage(file("", 1024))).toContain("JPEG");
  });

  it("上限を超えるサイズは弾く", () => {
    expect(validateImage(file("image/jpeg", MAX_IMAGE_BYTES + 1))).toContain("MB");
  });

  it("上限ちょうどは通す", () => {
    expect(validateImage(file("image/jpeg", MAX_IMAGE_BYTES))).toBeNull();
  });
});

describe("storagePathFromUrl", () => {
  const base = `https://example.supabase.co/storage/v1/object/public/${BUCKET}/`;

  it("公開URLから user_id 以下のパスを取り出す", () => {
    expect(storagePathFromUrl(`${base}user-1/abc.jpg`)).toBe("user-1/abc.jpg");
  });

  it("URLエンコードされていれば戻す", () => {
    expect(storagePathFromUrl(`${base}user-1/%E5%BA%97.jpg`)).toBe("user-1/店.jpg");
  });

  it("クエリが付いていてもパスだけを見る", () => {
    expect(storagePathFromUrl(`${base}user-1/abc.jpg?token=xxx`)).toBe("user-1/abc.jpg");
  });

  it("別のバケットや URL でない文字列では null を返す", () => {
    expect(storagePathFromUrl("https://example.supabase.co/other-bucket/a.jpg")).toBeNull();
    expect(storagePathFromUrl("not a url")).toBeNull();
    expect(storagePathFromUrl("")).toBeNull();
  });

  it("バケット直下にファイル名が無ければ null を返す", () => {
    expect(storagePathFromUrl(base)).toBeNull();
  });
});

describe("extensionFor", () => {
  it("Content-Type から拡張子を決める", () => {
    expect(extensionFor("image/png")).toBe("png");
    expect(extensionFor("image/webp")).toBe("webp");
    expect(extensionFor("image/jpeg")).toBe("jpg");
  });

  it("許可済みの形式すべてで拡張子が付く（パスが壊れない）", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(extensionFor(type)).toMatch(/^[a-z]+$/);
    }
  });
});
