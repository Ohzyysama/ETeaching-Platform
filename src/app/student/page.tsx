import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { SectionTitle, blueLinkClass } from "@/components/ui";
import { JoinClassForm } from "@/components/JoinClassForm";

export default async function StudentDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/teacher");

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    include: { class: { select: { id: true, name: true } } },
  });

  // A student may lose their class if the teacher deleted it; require re-join.
  if (!me?.class) {
    const classes = await prisma.class.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    });
    return (
      <div className="px-6 md:px-8 py-8 md:py-10 max-w-md mx-auto">
        <SectionTitle number="1" title="请选择班级" className="mb-2" />
        <p className="font-sans text-sm text-gray-500 mb-4">
          你尚未加入任何班级，请先选择一个班级。
        </p>
        <JoinClassForm classes={classes} />
      </div>
    );
  }

  const now = new Date();
  const links = await prisma.assignmentStudent.findMany({
    where: { studentId: user.id },
    include: {
      assignment: {
        include: { submissions: { where: { studentId: user.id } } },
      },
    },
  });

  const items = links
    .map((l) => {
      const a = l.assignment;
      const s = a.submissions[0] ?? null;
      const overdue = !s && now.getTime() > a.dueAt.getTime();
      const late = !!s && s.submittedAt.getTime() > a.dueAt.getTime();
      return { a, s, overdue, late };
    })
    .sort((x, y) => x.a.dueAt.getTime() - y.a.dueAt.getTime());

  const overdueCount = items.filter((i) => i.overdue).length;
  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <SectionTitle number="1" title="我的作业" />
        <div className="flex items-center gap-4">
          <span className="font-sans text-sm text-gray-500">
            班级：{me.class.name}
          </span>
          <Link href="/student/profile" className={link}>
            修改个人信息
          </Link>
        </div>
      </div>

      {overdueCount > 0 ? (
        <div className="mb-6 rounded-2xl bg-white border-2 border-[#ff6f61]/30 px-6 py-4 font-sans">
          <p className="text-sm text-[#ff6f61] font-bold">
            提醒：您有 {overdueCount} 份作业已逾期未交。
          </p>
          <p className="text-sm text-gray-500 mt-1">
            仍可补交，但提交时间会被标记为迟交。
          </p>
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-5 font-sans text-sm text-gray-500">
          暂无需要提交的作业。
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#fffde7] text-[#00897b]">
              <tr>
                <th className="px-4 py-3 text-sm font-bold">作业</th>
                <th className="px-4 py-3 text-sm font-bold">截止时间</th>
                <th className="px-4 py-3 text-sm font-bold">状态</th>
                <th className="px-4 py-3 text-sm font-bold">分数</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ a, s, overdue, late }) => (
                <tr key={a.id} className="border-t border-[#00897b]/10">
                  <td className="px-4 py-3">
                    <Link href={`/student/assignments/${a.id}`} className={link}>
                      {a.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(a.dueAt)}
                  </td>
                  <td className="px-4 py-3">
                    {overdue ? (
                      <span className="text-[#ff6f61] font-bold">逾期未交</span>
                    ) : late ? (
                      <span className="text-[#ff6f61]">已提交（迟交）</span>
                    ) : s ? (
                      <span>已提交</span>
                    ) : (
                      <span className="text-gray-500">待提交</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s?.graded ? (
                      <span className="font-bold">{s.score}</span>
                    ) : (
                      <span className="text-gray-500">
                        {s ? "未批改" : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
