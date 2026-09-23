"use client";

import { useEffect, useRef, useState } from "react";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

const COLORS = ["#ff6f61", "#e53935", "#00897b", "#1e88e5", "#374151"];
const WIDTHS = [2, 4, 7];
const MAX_DIM = 1600;

export function AnnotationDrawer({
  photo,
  initialAnnotation,
  onSave,
  onClose,
}: {
  photo: string;
  initialAnnotation: string | null;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const drawingRef = useRef(false);

  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);
  const [strokeCount, setStrokeCount] = useState(0);
  const [saving, setSaving] = useState(false);

  function getCtx() {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  }

  function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
    if (s.points.length === 0) return;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (const p of s.points) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, canvas.width, canvas.height);
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (currentRef.current) drawStroke(ctx, currentRef.current);
  }

  // Init canvas size from the photo + draw the existing annotation as background.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      if (initialAnnotation) {
        const bg = new Image();
        bg.onload = () => {
          bgRef.current = bg;
          redraw();
        };
        bg.src = initialAnnotation;
      } else {
        bgRef.current = null;
        redraw();
      }
    };
    img.src = photo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo, initialAnnotation]);

  function toCanvasPoint(e: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    currentRef.current = { points: [toCanvasPoint(e)], color, width };
    redraw();
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current || !currentRef.current) return;
    const p = toCanvasPoint(e);
    const cur = currentRef.current;
    const last = cur.points[cur.points.length - 1];
    cur.points.push(p);
    const ctx = getCtx();
    if (ctx) {
      ctx.strokeStyle = cur.color;
      ctx.lineWidth = cur.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }

  function onPointerUp() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (currentRef.current && currentRef.current.points.length > 0) {
      strokesRef.current.push(currentRef.current);
      setStrokeCount(strokesRef.current.length);
    }
    currentRef.current = null;
  }

  function undo() {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redraw();
  }

  function clearAll() {
    strokesRef.current = [];
    bgRef.current = null;
    setStrokeCount(0);
    redraw();
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#00897b]/90 flex flex-col" onClick={onClose}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white shadow-[0_4px_20px_rgba(0,137,123,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-gray-600">颜色</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`颜色 ${c}`}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                color === c ? "border-[#00897b] scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-sans text-sm text-gray-600">粗细</span>
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWidth(w)}
              aria-label={`粗细 ${w}`}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                width === w ? "bg-[#00897b]/15" : "hover:bg-[#00897b]/10"
              }`}
            >
              <span className="rounded-full bg-[#374151]" style={{ width: w + 2, height: w + 2 }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={strokeCount === 0}
            className="rounded-full font-bold text-sm px-4 py-2 bg-white text-[#00897b] border-2 border-[#00897b]/20 hover:bg-[#fffde7] transition-all disabled:opacity-40"
          >
            撤销
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-full font-bold text-sm px-4 py-2 bg-white text-[#ff6f61] border-2 border-[#ff6f61]/30 hover:bg-[#fff8e1] transition-all"
          >
            清空
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-full font-bold text-sm px-5 py-2 bg-[#00897b] text-white shadow-[0_4px_16px_rgba(0,137,123,0.3)] hover:bg-[#00796b] transition-all disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存涂鸦"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full font-bold text-sm px-4 py-2 bg-white text-gray-600 border-2 border-[#00897b]/20 hover:bg-[#fffde7] transition-all"
          >
            关闭
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          className="relative inline-block rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,137,123,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt="批改照片"
            className="block max-w-[90vw] max-h-[70vh] select-none"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
      </div>
    </div>
  );
}
