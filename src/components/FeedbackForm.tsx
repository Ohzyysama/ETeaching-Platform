"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFeedback } from "@/lib/actions/feedback";
import { PaperButton, Field, SectionLabel, inputClass } from "@/components/ui";
import { ImageInput } from "./ImageInput";

export function FeedbackForm({
  submissionId,
  initialFeedback,
  initialFeedbackImages,
}: {
  submissionId: string;
  initialFeedback: string;
  initialFeedbackImages: string[];
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(initialFeedback);
  const [feedbackImages, setFeedbackImages] = useState<string[]>(initialFeedbackImages);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const res = await saveFeedback({ submissionId, feedback, feedbackImages });
    if (!res.ok) {
      setError(res.error ?? "保存失败。");
      setPending(false);
      return;
    }
    setSaved(true);
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p className="font-sans text-sm text-[#ff6f61]">{error}</p>
      ) : null}
      {saved ? (
        <p className="font-sans text-sm text-[#00897b]">评语已保存。</p>
      ) : null}

      <Field label="文字评语（可选）">
        <textarea
          className={inputClass}
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="填写对该作业的评语…"
        />
      </Field>

      <SectionLabel label="评语配图（可选）">
        <ImageInput images={feedbackImages} onChange={setFeedbackImages} />
      </SectionLabel>

      <PaperButton type="submit" variant="primary" disabled={pending}>
        {pending ? "保存中…" : "保存评语"}
      </PaperButton>
    </form>
  );
}
