import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSubmissionById } from "@/lib/supabase/db";
import { formatDateTime } from "@/lib/format";
import { blueLinkClass, SectionTitle } from "@/components/ui";
import { ScoreCell } from "@/components/ScoreCell";
import { AnnotatedPhotos } from "@/components/AnnotatedPhotos";
import { FeedbackForm } from "@/components/FeedbackForm";

export default function SubmissionView() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      setSub(await getSubmissionById(submissionId));
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading || !sub) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  const late = new Date(sub.submitted_at).getTime() > new Date(sub.assignments.due_at).getTime();
  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="font-sans text-sm text-gray-500">
          <Link to={`/teacher/assignments/${sub.assignment_id}`} className={link}>{sub.assignments.title}</Link>
        </p>
        <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b] mt-1">
          {sub.profiles.name} 的提交
        </h1>
        <p className="font-sans text-sm text-gray-500 mt-1">
          提交时间：{" "}
          <span className={late ? "text-[#ff6f61]" : "text-[#00897b]"}>{formatDateTime(sub.submitted_at)}</span>
          {late ? <span className="text-[#ff6f61]">（迟交）</span> : null}
        </p>
      </div>

      <div className="mb-8">
        <SectionTitle number="1" title="提交内容" className="mb-3" />
        {sub.images?.length > 0 ? (
          <AnnotatedPhotos submissionId={sub.id} images={sub.images} annotations={sub.annotations ?? []} onSaved={reload} />
        ) : (
          <p className="font-sans text-sm text-gray-500">（未上传照片）</p>
        )}
        {sub.remark ? (
          <div className="mt-4">
            <p className="font-sans font-bold text-sm text-[#00897b]">备注</p>
            <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">{sub.remark}</p>
          </div>
        ) : null}
      </div>

      <div className="mb-8">
        <SectionTitle number="2" title="评语" className="mb-3" />
        <FeedbackForm submissionId={sub.id} initialFeedback={sub.feedback} initialFeedbackImages={sub.feedback_images ?? []} onSaved={reload} />
      </div>

      <div className="mb-8">
        <SectionTitle number="3" title="评分" className="mb-3" />
        <div className="font-sans text-sm">
          <ScoreCell submissionId={sub.id} score={sub.score} graded={sub.graded} onSaved={reload} />
        </div>
      </div>
    </div>
  );
}
