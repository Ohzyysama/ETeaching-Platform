import { useState } from "react";
import { deleteAssignment } from "@/lib/supabase/db";

export function DeleteAssignmentButton({
  id,
  onSaved,
}: {
  id: string;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!window.confirm("确定删除这份作业？该操作不可撤销。")) return;
    setPending(true);
    const res = await deleteAssignment(id);
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
