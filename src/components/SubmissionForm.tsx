import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submitAssignment } from "@/lib/supabase/db";
import { PaperButton, Field, SectionLabel, inputClass } from "@/components/ui";
import { ImageInput } from "./ImageInput";

export function SubmissionForm({
  assignmentId,
  submitted,
  initialRemark,
  initialImages,
  canSubmit,
  onSaved,
}: {
  assignmentId: string;
  submitted: boolean;
  initialRemark?: string;
  initialImages?: string[];
  canSubmit: boolean;
  onSaved: () => void;
}) {
  const { profile } = useAuth();
  const [remark, setRemark] = useState(initialRemark ?? "");
  const [images, setImages] = useState<string[]>(initialImages ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (images.length === 0) return setError("请至少上传一张作业照片。");
    if (!profile) return setError("未登录。");

    setPending(true);
    const res = await submitAssignment({
      assignmentId,
      studentId: profile.id,
      remark,
      images,
    });
    if (!res.ok) {
      setError(res.error ?? "提交失败。");
      setPending(false);
      return;
    }
    setPending(false);
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}

      <SectionLabel label={`作业照片（拍照上传，可多张，${images.length}/10）`} hint="请上传清晰可辨的作业照片">
        <ImageInput bucket="submission-images" images={images} onChange={setImages} />
      </SectionLabel>

      <Field label="备注（可选）">
        <textarea className={inputClass} rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="可填写补充说明…" />
      </Field>

      <PaperButton type="submit" variant="primary" disabled={pending || !canSubmit}>
        {pending ? "提交中…" : submitted ? "已提交（可修改）" : "提交作业"}
      </PaperButton>
    </form>
  );
}
