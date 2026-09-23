import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { getStudentAssignments, listClasses } from "@/lib/supabase/db";
import { formatDateTime } from "@/lib/format";
import { SectionTitle, blueLinkClass } from "@/components/ui";
import { JoinClassForm } from "@/components/JoinClassForm";

export default function Dashboard() {
  const { profile } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const cls = await listClasses();
      setClasses(cls.map((c) => ({ id: c.id, name: c.name })));
      if (!profile.class_id) {
        setItems([]);
        return;
      }
      setClassName(cls.find((c) => c.id === profile.class_id)?.name ?? "");
      setItems(await getStudentAssignments(profile.id));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  const link = blueLinkClass();

  if (loading) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  if (!profile?.class_id) {
    return (
      <div className="px-6 md:px-8 py-8 md:py-10 max-w-md mx-auto">
        <SectionTitle number="1" title="请选择班级" className="mb-2" />
        <p className="font-sans text-sm text-gray-500 mb-4">你尚未加入任何班级，请先选择一个班级。</p>
        <JoinClassForm classes={classes} onSaved={reload} />
      </div>
    );
  }

  const now = new Date();
  const rows = items
    .map(({ assignment: a, submission: s }) => {
      const overdue = !s && now.getTime() > new Date(a.due_at).getTime();
      const late = !!s && new Date(s.submitted_at).getTime() > new Date(a.due_at).getTime();
      return { a, s, overdue, late };
    })
    .sort((x, y) => new Date(x.a.due_at).getTime() - new Date(y.a.due_at).getTime());
  const overdueCount = rows.filter((i) => i.overdue).length;

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-4xl mx-auto">
      <div className="flex items-baseline justify-between gap-4 mb-6">
        <SectionTitle number="1" title="我的作业" />
        <div className="flex items-center gap-4">
          <span className="font-sans text-sm text-gray-500">班级：{className}</span>
          <Link to="/student/profile" className={link}>修改个人信息</Link>
        </div>
      </div>

      {overdueCount > 0 ? (
        <div className="mb-6 rounded-2xl bg-white border-2 border-[#ff6f61]/30 px-6 py-4 font-sans">
          <p className="text-sm text-[#ff6f61] font-bold">提醒：您有 {overdueCount} 份作业已逾期未交。</p>
          <p className="text-sm text-gray-500 mt-1">仍可补交，但提交时间会被标记为迟交。</p>
        </div>
      ) : null}

      {rows.length === 0 ? (
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
              {rows.map(({ a, s, overdue, late }) => (
                <tr key={a.id} className="border-t border-[#00897b]/10">
                  <td className="px-4 py-3">
                    <Link to={`/student/assignments/${a.id}`} className={link}>{a.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(a.due_at)}</td>
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
                    {s?.graded ? <span className="font-bold">{s.score}</span> : <span className="text-gray-500">{s ? "未批改" : "—"}</span>}
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
