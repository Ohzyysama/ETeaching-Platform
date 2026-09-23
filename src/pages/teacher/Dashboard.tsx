import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { listTeacherAssignments } from "@/lib/supabase/db";
import { formatDateTime } from "@/lib/format";
import { SectionTitle, PaperLink, blueLinkClass } from "@/components/ui";
import { DeleteAssignmentButton } from "@/components/DeleteAssignmentButton";

interface Row {
  id: string;
  title: string;
  start_at: string;
  due_at: string;
  classNames: string[];
  total: number;
  submitted: number;
  late: number;
  unsubmitted: number;
  graded: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      setRows((await listTeacherAssignments(profile.id)) as Row[]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <SectionTitle number="1" title="我发布的作业" />
        <div className="flex gap-2">
          <PaperLink to="/teacher/classes" variant="secondary">管理班级</PaperLink>
          <PaperLink to="/teacher/students" variant="secondary">管理学生</PaperLink>
          <PaperLink to="/teacher/assignments/new">发布作业</PaperLink>
        </div>
      </div>

      {loading ? (
        <p className="font-sans text-sm text-gray-500">加载中…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-5 font-sans text-sm text-gray-500">
          还没有发布过作业。点击右上角「发布作业」开始。
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#fffde7] text-[#00897b]">
              <tr>
                <th className="px-4 py-3 text-sm font-bold">标题</th>
                <th className="px-4 py-3 text-sm font-bold">班级</th>
                <th className="px-4 py-3 text-sm font-bold">起止时间</th>
                <th className="px-4 py-3 text-sm font-bold">提交情况</th>
                <th className="px-4 py-3 text-sm font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-[#00897b]/10">
                  <td className="px-4 py-3">
                    <Link to={`/teacher/assignments/${a.id}`} className={link}>{a.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.classNames.join("、") || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(a.start_at)} 至 {formatDateTime(a.due_at)}
                  </td>
                  <td className="px-4 py-3">
                    已交 {a.submitted}/{a.total}
                    <span className="text-gray-500 ml-1">· 迟交 {a.late}</span>
                    <span className={a.unsubmitted > 0 ? "text-[#ff6f61] ml-1" : "text-gray-500 ml-1"}>· 未交 {a.unsubmitted}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/teacher/assignments/${a.id}`} className={link}>统计</Link>
                      <Link to={`/teacher/assignments/${a.id}/edit`} className={link}>编辑</Link>
                      <DeleteAssignmentButton id={a.id} onSaved={reload} />
                    </div>
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
