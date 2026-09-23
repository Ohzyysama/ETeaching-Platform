import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getStudentAssignment } from "@/lib/supabase/db";
import { canStudentEdit } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import { SubmissionForm } from "@/components/SubmissionForm";

export default function Assignment() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [assignment, setAssignment] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!id || !profile) return;
    setLoading(true);
    try {
      const { assignment: a, submission: s } = await getStudentAssignment(id, profile.id);
      setAssignment(a);
      setSubmission(s);
    } finally {
      setLoading(false);
    }
  }, [id, profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading || !assignment) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  const submitted = !!submission;
  const now = new Date();
  const dueAt = new Date(assignment.due_at);
  const late = submitted && new Date(submission.submitted_at).getTime() > dueAt.getTime();
  const overdue = !submitted && now.getTime() > dueAt.getTime();

  let canSubmit = true;
  let lockReason: string | null = null;
  if (submitted) {
    const edit = canStudentEdit({ graded: submission.graded, dueAt, submitted: true });
    canSubmit = edit.allowed;
    lockReason = edit.reason;
  }

  const images = assignment.images ?? [];
  const submittedImages = submission?.images ?? [];
  const annotations = submission?.annotations ?? [];
  const feedbackImages = submission?.feedback_images ?? [];

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">{assignment.title}</h1>
      <p className="font-sans text-sm text-gray-500 mt-1">开始 {formatDateTime(assignment.start_at)} · 截止 {formatDateTime(assignment.due_at)}</p>

      {assignment.description ? (
        <div className="mt-5">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">作业说明</h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">{assignment.description}</p>
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-5">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">配图</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {images.map((src: string, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={`配图 ${i + 1}`} className="max-w-xs border-2 border-[#00897b]/20 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : null}

      {submitted ? (
        <div className="mt-8 mb-6 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-4 font-sans">
          <p className="text-sm text-gray-700">
            已于 <span className={late ? "text-[#ff6f61]" : ""}>{formatDateTime(submission.submitted_at)}</span> 提交
            {late ? <span className="text-[#ff6f61]">（迟交）</span> : null}。
          </p>
          <p className="text-sm text-gray-500 mt-1">{submission.graded ? `分数：${submission.score}（已批改）` : "尚未批改。"}</p>
        </div>
      ) : overdue ? (
        <div className="mt-8 mb-6 rounded-2xl bg-white border-2 border-[#ff6f61]/30 px-6 py-4 font-sans">
          <p className="text-sm text-[#ff6f61] font-bold">该作业已过截止时间，提交将被标记为迟交。</p>
        </div>
      ) : null}

      {submitted && !canSubmit ? (
        <div className="mt-6">
          <div className="mb-4 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-4 font-sans">
            <p className="text-sm text-gray-500">{lockReason}</p>
          </div>
          <SectionTitle number="1" title="我的提交内容" className="mb-3" />
          {submittedImages.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {submittedImages.map((src: string, i: number) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`提交照片 ${i + 1}`} className="max-w-xs border-2 border-[#00897b]/20 rounded-2xl" />
                  {annotations[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={annotations[i]!} alt="批改涂鸦" className="absolute inset-0 w-full h-full rounded-2xl" />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-sm text-gray-500">（未上传照片）</p>
          )}
          {submission.remark ? (
            <div className="mt-4">
              <p className="font-sans font-bold text-sm text-[#00897b]">备注</p>
              <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">{submission.remark}</p>
            </div>
          ) : null}

          {submission.graded && (submission.feedback || feedbackImages.length > 0) ? (
            <div className="mt-6">
              <p className="font-sans font-bold text-sm text-[#00897b]">教师评语</p>
              {submission.feedback ? (
                <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">{submission.feedback}</p>
              ) : null}
              {feedbackImages.length > 0 ? (
                <div className="flex flex-wrap gap-3 mt-2">
                  {feedbackImages.map((src: string, i: number) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`评语配图 ${i + 1}`} className="max-w-xs border-2 border-[#00897b]/20 rounded-2xl" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8">
          <SectionTitle number="1" title={submitted ? "修改提交" : "提交作业"} className="mb-4" />
          <SubmissionForm
            assignmentId={id!}
            submitted={submitted}
            initialRemark={submission?.remark ?? ""}
            initialImages={submitted ? submittedImages : []}
            canSubmit={canSubmit}
            onSaved={reload}
          />
        </div>
      )}
    </div>
  );
}
