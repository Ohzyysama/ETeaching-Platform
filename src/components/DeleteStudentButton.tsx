import { useState } from "react";
import { deleteStudent } from "@/lib/supabase/db";

export function DeleteStudentButton({
  id,
  name,
  onSaved,
}: {
  id: string;
  name: string;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!window.confirm(`确定删除学生「${name}」？删除后该学生将无法再登录使用。`)) return;
    setPending(true);
    const res = await deleteStudent(id);
    if (res.ok) {
      onSaved();
    } else {
      window.alert(res.error ?? "删除失败。");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="font-sans text-sm text-[#ff6f61] hover:underline underline-offset-2 disabled:opacity-50"
    >
      {pending ? "删除中…" : "删除"}
    </button>
  );
}
