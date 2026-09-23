/**
 * Server-side validation for base64 uploads stored as text columns.
 * Keeps images/attachments self-contained (no object-storage service) while
 * guarding against oversized or malformed payloads.
 */

const MB = 1024 * 1024;

/** images (homework 配图 / submission 照片): data:image/* only, up to 10, ~5MB each */
export function validateImages(images: unknown): string | null {
  if (!Array.isArray(images)) return "图片数据格式错误。";
  if (images.length > 10) return "图片最多 10 张。";
  for (const img of images) {
    if (typeof img !== "string" || !img.startsWith("data:image/")) {
      return "仅支持图片文件。";
    }
    if (img.length > 5 * MB) return "单张图片不能超过 5MB。";
  }
  return null;
}
