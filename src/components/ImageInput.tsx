import { useRef, useState } from "react";
import { uploadFile, type Bucket } from "@/lib/supabase/storage";
import { PaperButton } from "@/components/ui";

const MAX_MB = 5;

export function ImageInput({
  bucket,
  images,
  onChange,
  maxCount = 10,
}: {
  bucket: Bucket;
  images: string[];
  onChange: (urls: string[]) => void;
  maxCount?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    setUploading(true);
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= maxCount) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_MB * 1024 * 1024) continue;
      const url = await uploadFile(bucket, file);
      if (url) next.push(url);
    }
    onChange(next);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(i: number) {
    onChange(images.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative rounded-2xl border border-[#00897b]/20 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`图片 ${i + 1}`}
                className="h-24 w-24 object-cover rounded-2xl"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`移除图片 ${i + 1}`}
                className="absolute top-1 right-1 bg-[#00897b] text-white text-xs leading-none px-2 py-1 rounded-full font-bold hover:bg-[#ff6f61] transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
        <PaperButton
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={images.length >= maxCount || uploading}
        >
          {uploading ? "上传中…" : "添加图片"}
        </PaperButton>
        <span className="font-sans text-sm text-gray-500">
          单张 ≤ {MAX_MB}MB，最多 {maxCount} 张
        </span>
      </div>
    </div>
  );
}
