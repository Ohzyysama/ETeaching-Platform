import { useState } from "react";
import { createClass } from "@/lib/supabase/db";
import { PaperButton, inputClass } from "@/components/ui";

export function AddClassForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await createClass(name);
    if (!res.ok) {
      setError(res.error ?? "创建失败。");
      setPending(false);
      return;
    }
    setName("");
    setPending(false);
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="班级号，如：2班" required />
        <PaperButton type="submit" variant="primary" disabled={pending}>
          {pending ? "添加中…" : "添加班级"}
        </PaperButton>
      </div>
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}
    </form>
  );
}
