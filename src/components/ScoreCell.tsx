"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setScore } from "@/lib/actions/submission";

export function ScoreCell({
  submissionId,
  score,
  graded,
}: {
  submissionId: string;
  score: number;
  graded: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(score));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    setSaving(true);
    const res = await setScore({ submissionId, score: num });
    setSaving(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className={graded ? "" : "text-gray-500"}>{score}</span>
        {!graded ? (
          <span className="text-gray-500 text-xs">未批改</span>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setValue(String(score));
            setEditing(true);
          }}
          className="text-[#00897b] hover:underline underline-offset-2 text-xs font-sans"
        >
          编辑
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        step="0.5"
        min="0"
        className="font-sans rounded-2xl border border-[#00897b]/20 bg-white px-2 py-1 text-sm text-gray-700 focus:outline-none focus:border-[#00897b] w-20"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="text-[#00897b] hover:underline underline-offset-2 text-xs font-sans"
      >
        {saving ? "保存中" : "保存"}
      </button>
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          setValue(String(score));
        }}
        className="text-gray-500 hover:underline underline-offset-2 text-xs font-sans"
      >
        取消
      </button>
    </span>
  );
}
