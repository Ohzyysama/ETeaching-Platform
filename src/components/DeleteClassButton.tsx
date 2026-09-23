"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteClass } from "@/lib/actions/class";

export function DeleteClassButton({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (
      !window.confirm(
        `确定删除班级「${name}」？该班作业与提交记录将一并删除，班内学生需重新选班。`
      )
    ) {
      return;
    }
    setPending(true);
    const res = await deleteClass(id);
    if (res.ok) {
      router.refresh();
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
