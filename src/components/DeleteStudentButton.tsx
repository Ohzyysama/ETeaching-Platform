import { useState } from "react";
import { deleteStudentPermanently } from "@/lib/supabase/db";

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
    if (
      !window.confirm(
        `确定彻底删除学生「${name}」？\n\n该生的登录账号与全部提交记录会被永久删除，无法恢复；用户名将可被重新注册。`
      )
    )
      return;
    setPending(true);
    const res = await deleteStudentPermanently(id);
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
