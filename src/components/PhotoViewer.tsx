"use client";

import { useEffect, useState } from "react";

/** In-place photo lightbox: click a thumbnail to enlarge, Esc / arrows / backdrop to close. */
export function PhotoViewer({ images }: { images: string[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      else if (e.key === "ArrowLeft")
        setIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      else if (e.key === "ArrowRight")
        setIndex((i) => (i === null ? null : (i + 1) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length]);

  function prev() {
    setIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }
  function next() {
    setIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`放大照片 ${i + 1}`}
            className="block cursor-zoom-in"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`提交照片 ${i + 1}`}
              className="max-w-xs rounded-2xl border-2 border-[#00897b]/20 hover:opacity-90 transition-opacity"
            />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#00897b]/85 p-4"
          onClick={() => setIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(null);
            }}
            aria-label="关闭"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#00897b] text-2xl font-bold flex items-center justify-center hover:bg-[#ff6f61] hover:text-white transition-colors"
          >
            ×
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="上一张"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#00897b] text-2xl font-bold flex items-center justify-center hover:bg-[#ff6f61] hover:text-white transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="下一张"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-[#00897b] text-2xl font-bold flex items-center justify-center hover:bg-[#ff6f61] hover:text-white transition-colors"
              >
                ›
              </button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index!]}
            alt={`照片 ${index! + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl border-4 border-white shadow-[0_8px_30px_rgba(0,137,123,0.3)]"
          />
        </div>
      )}
    </>
  );
}
