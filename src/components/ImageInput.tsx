"use client";

import { useRef } from "react";
import { fileToDataUrl } from "@/lib/client-file";
import { PaperButton } from "@/components/ui";

const MAX_MB = 5;
const MAX_COUNT = 10;

export function ImageInput({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next = [...images];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_COUNT) break;
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_MB * 1024 * 1024) continue;
      next.push(await fileToDataUrl(file));
    }
    onChange(next);
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
                alt={`配图 ${i + 1}`}
                className="h-24 w-24 object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`移除配图 ${i + 1}`}
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
          disabled={images.length >= MAX_COUNT}
        >
          添加图片
        </PaperButton>
        <span className="font-sans text-sm text-gray-500">
          单张 ≤ {MAX_MB}MB，最多 {MAX_COUNT} 张
        </span>
      </div>
    </div>
  );
}
