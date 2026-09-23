"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveAnnotation } from "@/lib/actions/feedback";
import { AnnotationDrawer } from "./AnnotationDrawer";

export function AnnotatedPhotos({
  submissionId,
  images,
  annotations,
}: {
  submissionId: string;
  images: string[];
  annotations: (string | null)[];
}) {
  const router = useRouter();
  const [annotating, setAnnotating] = useState<number | null>(null);
  const [viewing, setViewing] = useState<number | null>(null);

  async function onSaveAnnotation(dataUrl: string) {
    if (annotating === null) return;
    const res = await saveAnnotation({ submissionId, index: annotating, dataUrl });
    if (res.ok) {
      setAnnotating(null);
      router.refresh();
    } else {
      window.alert(res.error ?? "保存涂鸦失败。");
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-4">
        {images.map((src, i) => {
          const ann = annotations[i] ?? null;
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`提交照片 ${i + 1}`}
                  className="max-w-xs rounded-2xl border-2 border-[#00897b]/20"
                />
                {ann ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ann}
                    alt="批改涂鸦"
                    className="absolute inset-0 w-full h-full rounded-2xl"
                  />
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAnnotating(i)}
                  className="rounded-full font-bold text-xs px-3 py-1.5 bg-[#00897b] text-white hover:bg-[#00796b] transition-all"
                >
                  涂鸦批改
                </button>
                <button
                  type="button"
                  onClick={() => setViewing(i)}
                  className="rounded-full font-bold text-xs px-3 py-1.5 bg-white text-[#00897b] border-2 border-[#00897b]/20 hover:bg-[#fffde7] transition-all"
                >
                  放大
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {annotating !== null ? (
        <AnnotationDrawer
          photo={images[annotating]}
          initialAnnotation={annotations[annotating] ?? null}
          onSave={onSaveAnnotation}
          onClose={() => setAnnotating(null)}
        />
      ) : null}

      {viewing !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#00897b]/90 p-4"
          onClick={() => setViewing(null)}
        >
          <button
            type="button"
            onClick={() => setViewing(null)}
            aria-label="关闭"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white text-[#00897b] text-2xl font-bold flex items-center justify-center hover:bg-[#ff6f61] hover:text-white transition-colors"
          >
            ×
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[viewing]}
              alt={`照片 ${viewing + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl border-4 border-white"
            />
            {annotations[viewing] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={annotations[viewing]!}
                alt="批改涂鸦"
                className="absolute inset-0 w-full h-full rounded-2xl"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
