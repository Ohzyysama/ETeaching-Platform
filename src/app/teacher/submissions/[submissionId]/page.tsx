import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { parseImages, parseAnnotations } from "@/lib/json";
import { blueLinkClass, SectionTitle } from "@/components/ui";
import { ScoreCell } from "@/components/ScoreCell";
import { AnnotatedPhotos } from "@/components/AnnotatedPhotos";
import { FeedbackForm } from "@/components/FeedbackForm";

export default async function SubmissionViewPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      student: true,
      assignment: { select: { id: true, title: true, dueAt: true, createdById: true } },
    },
  });
  if (!submission || submission.assignment.createdById !== user.id) notFound();

  const late = submission.submittedAt.getTime() > submission.assignment.dueAt.getTime();
  const images = parseImages(submission.images);
  const annotations = parseAnnotations(submission.annotations);
  const feedbackImages = parseImages(submission.feedbackImages);
  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <div className="mb-6">
        <p className="font-sans text-sm text-gray-500">
          <Link href={`/teacher/assignments/${submission.assignmentId}`} className={link}>
            {submission.assignment.title}
          </Link>
        </p>
        <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b] mt-1">
          {submission.student.name} 的提交
        </h1>
        <p className="font-sans text-sm text-gray-500 mt-1">
          提交时间：{" "}
          <span className={late ? "text-[#ff6f61]" : "text-[#00897b]"}>
            {formatDateTime(submission.submittedAt)}
          </span>
          {late ? <span className="text-[#ff6f61]">（迟交）</span> : null}
        </p>
      </div>

      <div className="mb-8">
        <SectionTitle number="1" title="提交内容" className="mb-3" />

        {images.length > 0 ? (
          <AnnotatedPhotos
            submissionId={submission.id}
            images={images}
            annotations={annotations}
          />
        ) : (
          <p className="font-sans text-sm text-gray-500">（未上传照片）</p>
        )}

        {submission.remark ? (
          <div className="mt-4">
            <p className="font-sans font-bold text-sm text-[#00897b]">备注</p>
            <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">
              {submission.remark}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mb-8">
        <SectionTitle number="2" title="评语" className="mb-3" />
        <FeedbackForm
          submissionId={submission.id}
          initialFeedback={submission.feedback}
          initialFeedbackImages={feedbackImages}
        />
      </div>

      <div className="mb-8">
        <SectionTitle number="3" title="评分" className="mb-3" />
        <div className="font-sans text-sm">
          <ScoreCell
            submissionId={submission.id}
            score={submission.score}
            graded={submission.graded}
          />
        </div>
      </div>
    </div>
  );
}
