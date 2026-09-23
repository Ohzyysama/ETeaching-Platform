import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canStudentEdit } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { parseImages, parseAnnotations } from "@/lib/json";
import { SectionTitle } from "@/components/ui";
import { SubmissionForm } from "@/components/SubmissionForm";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/teacher");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      students: { where: { studentId: user.id }, select: { studentId: true } },
      submissions: { where: { studentId: user.id } },
    },
  });
  if (!assignment) notFound();
  if (assignment.students.length === 0) notFound();

  const submission = assignment.submissions[0] ?? null;
  const now = new Date();
  const submitted = !!submission;
  const late = submitted && submission.submittedAt.getTime() > assignment.dueAt.getTime();
  const overdue = !submitted && now.getTime() > assignment.dueAt.getTime();

  let canSubmit = true;
  let lockReason: string | null = null;
  if (submitted) {
    const edit = canStudentEdit({
      graded: submission.graded,
      dueAt: assignment.dueAt,
      submitted: true,
    });
    canSubmit = edit.allowed;
    lockReason = edit.reason;
  }

  const images = parseImages(assignment.images);
  const submittedImages = submitted ? parseImages(submission.images) : [];
  const annotations = submitted ? parseAnnotations(submission.annotations) : [];
  const feedbackImages = submitted ? parseImages(submission.feedbackImages) : [];

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">
        {assignment.title}
      </h1>
      <p className="font-sans text-sm text-gray-500 mt-1">
        开始 {formatDateTime(assignment.startAt)} · 截止{" "}
        {formatDateTime(assignment.dueAt)}
      </p>

      {assignment.description ? (
        <div className="mt-5">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">作业说明</h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-5">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">配图</h2>
          <div className="flex flex-wrap gap-3 mt-2">
            {images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`配图 ${i + 1}`}
                className="max-w-xs border border-[#00897b]/20 rounded-2xl"
              />
            ))}
          </div>
        </div>
      ) : null}

      {submitted ? (
        <div className="mt-8 mb-6 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-4 font-sans">
          <p className="text-sm text-gray-700">
            已于{" "}
            <span className={late ? "text-[#ff6f61]" : ""}>
              {formatDateTime(submission.submittedAt)}
            </span>{" "}
            提交{late ? <span className="text-[#ff6f61]">（迟交）</span> : null}。
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {submission.graded
              ? `分数：${submission.score}（已批改）`
              : "尚未批改。"}
          </p>
        </div>
      ) : overdue ? (
        <div className="mt-8 mb-6 rounded-2xl bg-white border-2 border-[#ff6f61]/30 px-6 py-4 font-sans">
          <p className="text-sm text-[#ff6f61] font-bold">
            该作业已过截止时间，提交将被标记为迟交。
          </p>
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
              {submittedImages.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`提交照片 ${i + 1}`}
                    className="max-w-xs border border-[#00897b]/20 rounded-2xl"
                  />
                  {annotations[i] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={annotations[i]!}
                      alt="批改涂鸦"
                      className="absolute inset-0 w-full h-full rounded-2xl"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-sm text-gray-500">
              （未上传照片）
            </p>
          )}
          {submission.remark ? (
            <div className="mt-4">
              <p className="font-sans font-bold text-sm text-[#00897b]">备注</p>
              <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">
                {submission.remark}
              </p>
            </div>
          ) : null}

          {submission.graded && (submission.feedback || feedbackImages.length > 0) ? (
            <div className="mt-6">
              <p className="font-sans font-bold text-sm text-[#00897b]">教师评语</p>
              {submission.feedback ? (
                <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              ) : null}
              {feedbackImages.length > 0 ? (
                <div className="flex flex-wrap gap-3 mt-2">
                  {feedbackImages.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt={`评语配图 ${i + 1}`}
                      className="max-w-xs border border-[#00897b]/20 rounded-2xl"
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-8">
          <SectionTitle
            number="1"
            title={submitted ? "修改提交" : "提交作业"}
            className="mb-4"
          />
          <SubmissionForm
            assignmentId={id}
            submitted={submitted}
            initialRemark={submission?.remark ?? ""}
            initialImages={submitted ? submittedImages : []}
            canSubmit={canSubmit}
          />
        </div>
      )}
    </div>
  );
}
