"use client";

import { supabase } from "./client";

export type Bucket =
  | "assignment-images"
  | "submission-images"
  | "feedback-images"
  | "annotations";

/** 上传文件到公开存储桶，返回公开 URL（失败返回 null）。 */
export async function uploadFile(
  bucket: Bucket,
  file: File,
  folder = ""
): Promise<string | null> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = folder ? `${folder}/${filename}` : filename;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** 上传 base64（data URL）到公开桶，返回公开 URL（用于涂鸦 PNG 等）。 */
export async function uploadDataUrl(
  bucket: Bucket,
  dataUrl: string,
  folder = ""
): Promise<string | null> {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/data:(.*?);base64/)?.[1] ?? "image/png";
  const ext = mime.split("/")[1] || "png";
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const file = new File([arr], `annotation.${ext}`, { type: mime });
  return uploadFile(bucket, file, folder);
}
