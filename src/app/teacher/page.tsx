import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { summarizeSubmissions } from "@/lib/status";
import { formatDateTime } from "@/lib/format";
import { SectionTitle, PaperLink, blueLinkClass } from "@/components/ui";
import { DeleteAssignmentButton } from "@/components/DeleteAssignmentButton";

export default async function TeacherDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const assignments = await prisma.assignment.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { students: true } },
      submissions: { select: { submittedAt: true, graded: true } },
    },
  });

  const groups = new Map<string, { name: string; items: typeof assignments }>();
  for (const a of assignments) {
    if (!groups.has(a.classId)) {
      groups.set(a.classId, { name: a.class.name, items: [] });
    }
    groups.get(a.classId)!.items.push(a);
  }

  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <SectionTitle number="1" title="我发布的作业" />
        <div className="flex gap-2">
          <PaperLink href="/teacher/classes" variant="secondary">
            管理班级
          </PaperLink>
          <PaperLink href="/teacher/assignments/new">发布作业</PaperLink>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-5 font-sans text-sm text-gray-500">
          还没有发布过作业。点击右上角「发布作业」开始。
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.values()).map((group) => (
            <section key={group.name}>
              <h2 className="font-sans tracking-tight text-lg md:text-xl text-[#00897b] border-b border-[#00897b]/20 pb-1 mb-3">
                {group.name}
              </h2>
              <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
                <table className="w-full text-left font-sans text-sm">
                  <thead className="bg-[#fffde7] text-[#00897b]">
                    <tr>
                      <th className="px-4 py-3 text-sm font-bold">标题</th>
                      <th className="px-4 py-3 text-sm font-bold">起止时间</th>
                      <th className="px-4 py-3 text-sm font-bold">提交情况</th>
                      <th className="px-4 py-3 text-sm font-bold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((a) => {
                      const s = summarizeSubmissions(
                        a._count.students,
                        a.submissions,
                        a.dueAt
                      );
                      return (
                        <tr
                          key={a.id}
                          className="border-t border-[#00897b]/10"
                        >
                          <td className="px-4 py-3">
                            <Link href={`/teacher/assignments/${a.id}`} className={link}>
                              {a.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatDateTime(a.startAt)} 至 {formatDateTime(a.dueAt)}
                          </td>
                          <td className="px-4 py-3">
                            已交 {s.submitted}/{s.total}
                            <span className="text-gray-500 ml-1">
                              · 迟交 {s.late}
                            </span>
                            <span
                              className={
                                s.unsubmitted > 0
                                  ? "text-[#ff6f61] ml-1"
                                  : "text-gray-500 ml-1"
                              }
                            >
                              · 未交 {s.unsubmitted}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/teacher/assignments/${a.id}`}
                                className={link}
                              >
                                统计
                              </Link>
                              <Link
                                href={`/teacher/assignments/${a.id}/edit`}
                                className={link}
                              >
                                编辑
                              </Link>
                              <DeleteAssignmentButton id={a.id} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
