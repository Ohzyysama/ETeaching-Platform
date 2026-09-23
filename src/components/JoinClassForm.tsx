"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinClass } from "@/lib/actions/class";
import { PaperButton, inputClass } from "@/components/ui";

export function JoinClassForm({
  classes,
}: {
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!classId) {
      setError("请选择班级。");
      return;
    }
    setPending(true);
    const res = await joinClass(classId);
    if (!res.ok) {
      setError(res.error ?? "加入失败。");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <p className="font-sans text-sm text-[#ff6f61]">{error}</p>
      ) : null}
      <select
        className={inputClass}
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        required
      >
        <option value="" disabled>
          请选择班级
        </option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <PaperButton type="submit" variant="primary" disabled={pending}>
        {pending ? "加入中…" : "加入班级"}
      </PaperButton>
    </form>
  );
}
