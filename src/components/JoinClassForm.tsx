import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { joinClass } from "@/lib/supabase/db";
import { PaperButton, inputClass } from "@/components/ui";

export function JoinClassForm({
  classes,
  onSaved,
}: {
  classes: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!classId) return setError("请选择班级。");
    if (!profile) return setError("未登录。");
    setPending(true);
    const res = await joinClass(profile.id, classId);
    if (!res.ok) {
      setError(res.error ?? "加入失败。");
      setPending(false);
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}
      <select className={inputClass} value={classId} onChange={(e) => setClassId(e.target.value)} required>
        <option value="" disabled>请选择班级</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <PaperButton type="submit" variant="primary" disabled={pending}>
        {pending ? "加入中…" : "加入班级"}
      </PaperButton>
    </form>
  );
}
