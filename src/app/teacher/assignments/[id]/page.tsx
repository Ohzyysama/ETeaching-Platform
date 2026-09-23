import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { parseImages } from "@/lib/json";
import { PaperLink, SectionTitle } from "@/components/ui";
import { SubmissionTable, type StatsRow } from "@/components/SubmissionTable";
import { SubmissionChart } from "@/components/SubmissionChart";

export default async function AssignmentStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: { select: { name: true } },
      students: { include: { student: true } },
      submissions: { include: { student: true } },
    },
  });
  if (!assignment || assignment.createdById !== user.id) notFound();

  const byStudent = new Map(assignment.submissions.map((s) => [s.studentId, s]));
  const rows: StatsRow[] = assignment.students
    .map((link) => {
      const s = byStudent.get(link.studentId);
      const submittedAt = s?.submittedAt ?? null;
      const late = submittedAt
        ? submittedAt.getTime() > assignment.dueAt.getTime()
        : false;
      return {
        studentId: link.studentId,
        name: link.student.name,
        username: link.student.username,
        submitted: !!s,
        submittedAt,
        late,
        score: s?.score ?? 0,
        graded: s?.graded ?? false,
        submissionId: s?.id ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));

  const onTime = rows.filter((r) => r.submitted && !r.late).length;
  const late = rows.filter((r) => r.late).length;
  const unsubmitted = rows.filter((r) => !r.submitted).length;
  const graded = rows.filter((r) => r.graded).length;
  const images = parseImages(assignment.images);

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">
            {assignment.title}
          </h1>
          <p className="font-sans text-sm text-gray-500 mt-1">
            {assignment.class.name} · 开始 {formatDateTime(assignment.startAt)} ·
            截止 {formatDateTime(assignment.dueAt)}
          </p>
        </div>
        <PaperLink href={`/teacher/assignments/${id}/edit`} variant="secondary">
          编辑作业
        </PaperLink>
      </div>

      {assignment.description ? (
        <div className="mb-6">
          <h2 className="font-sans font-bold text-sm text-[#00897b]">作业说明</h2>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-1 whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="mb-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div>
          <SectionTitle number="1" title="提交情况" />
          <SubmissionChart
            onTime={onTime}
            late={late}
            unsubmitted={unsubmitted}
          />
        </div>
        <div>
          <SectionTitle number="2" title="概览" />
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-700 mt-3">
            共 {rows.length} 人需提交；已提交 {rows.length - unsubmitted} 人（按时{" "}
            {onTime} 人，迟交 {late} 人）；未交 {unsubmitted} 人；已批改 {graded}{" "}
            人。
          </p>
        </div>
      </div>

      <div className="mt-10">
        <SectionTitle number="3" title="提交名单" className="mb-3" />
        <SubmissionTable rows={rows} dueAt={assignment.dueAt} />
      </div>
    </div>
  );
}
