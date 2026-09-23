"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitAssignment } from "@/lib/actions/submission";
import { PaperButton, Field, SectionLabel, inputClass } from "@/components/ui";
import { ImageInput } from "./ImageInput";

export function SubmissionForm({
  assignmentId,
  submitted,
  initialRemark,
  initialImages,
  canSubmit,
}: {
  assignmentId: string;
  submitted: boolean;
  initialRemark?: string;
  initialImages?: string[];
  canSubmit: boolean;
}) {
  const router = useRouter();
  const [remark, setRemark] = useState(initialRemark ?? "");
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (images.length === 0) {
      setError("请至少上传一张作业照片。");
      return;
    }
    setPending(true);
    const res = await submitAssignment({ assignmentId, remark, images });
    if (!res.ok) {
      setError(res.error ?? "提交失败。");
      setPending(false);
      return;
    }
    router.push(res.redirectTo ?? `/student/assignments/${assignmentId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? (
        <p className="font-sans text-sm text-[#ff6f61]">{error}</p>
      ) : null}

      <SectionLabel
        label={`作业照片（拍照上传，可多张，${images.length}/10）`}
        hint="请上传清晰可辨的作业照片"
      >
        <ImageInput images={images} onChange={setImages} />
      </SectionLabel>

      <Field label="备注（可选）">
        <textarea
          className={inputClass}
          rows={3}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="可填写补充说明…"
        />
      </Field>

      <PaperButton
        type="submit"
        variant="primary"
        disabled={pending || !canSubmit}
      >
        {pending ? "提交中…" : submitted ? "保存修改" : "提交作业"}
      </PaperButton>
    </form>
  );
}
