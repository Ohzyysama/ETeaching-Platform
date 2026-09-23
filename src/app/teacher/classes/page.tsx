import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SectionTitle, blueLinkClass } from "@/components/ui";
import { AddClassForm } from "@/components/AddClassForm";
import { DeleteClassButton } from "@/components/DeleteClassButton";

export default async function ClassesPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { students: true, assignments: true } },
    },
  });

  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <SectionTitle number="1" title="管理班级" />
        <Link href="/teacher" className={link}>
          返回工作台
        </Link>
      </div>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-sm text-[#00897b] mb-2">
          新增班级
        </h2>
        <AddClassForm />
      </div>

      <div>
        <h2 className="font-sans font-bold text-sm text-[#00897b] mb-2">
          班级列表（共 {classes.length} 个，至少保留 1 个）
        </h2>
        <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#fffde7] text-[#00897b]">
              <tr>
                <th className="px-4 py-3 text-sm font-bold">班级号</th>
                <th className="px-4 py-3 text-sm font-bold">学生数</th>
                <th className="px-4 py-3 text-sm font-bold">作业数</th>
                <th className="px-4 py-3 text-sm font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-t border-[#00897b]/10">
                  <td className="px-4 py-3 font-bold">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c._count.students}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c._count.assignments}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteClassButton
                      id={c.id}
                      name={c.name}
                      disabled={classes.length <= 1}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {classes.length <= 1 ? (
          <p className="font-sans text-sm text-gray-500 mt-2">
            当前只剩 1 个班级，无法继续删除。
          </p>
        ) : null}
      </div>
    </div>
  );
}
