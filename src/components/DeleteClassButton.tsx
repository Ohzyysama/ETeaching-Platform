import { useState } from "react";
import { deleteClass } from "@/lib/supabase/db";

export function DeleteClassButton({
  id,
  name,
  disabled,
  onSaved,
}: {
  id: string;
  name: string;
  disabled?: boolean;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!window.confirm(`确定删除班级「${name}」？该班作业与提交记录将一并删除，班内学生需重新选班。`)) return;
    setPending(true);
    const res = await deleteClass(id);
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
      disabled={pending || disabled}
      className="font-sans text-sm text-[#ff6f61] hover:underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {pending ? "删除中…" : "删除"}
    </button>
  );
}
