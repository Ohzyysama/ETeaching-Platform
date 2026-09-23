import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/supabase/db";
import { PaperButton, Field, inputClass } from "@/components/ui";

export function ProfileForm({
  initialName,
  initialUsername,
}: {
  initialName: string;
  initialUsername: string;
}) {
  const { profile, refresh } = useAuth();
  const [name, setName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!profile) return setError("未登录。");
    setPending(true);
    const res = await updateProfile(profile.id, name, username);
    if (!res.ok) {
      setError(res.error ?? "保存失败。");
      setPending(false);
      return;
    }
    setSaved(true);
    setPending(false);
    await refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}
      {saved ? <p className="font-sans text-sm text-[#00897b]">已保存。</p> : null}

      <Field label="姓名">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>

      <Field label="用户名" hint="用于登录展示，支持汉字，不能与他人重复">
        <input className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} required />
      </Field>

      <PaperButton type="submit" variant="primary" disabled={pending}>
        {pending ? "保存中…" : "保存"}
      </PaperButton>
    </form>
  );
}
