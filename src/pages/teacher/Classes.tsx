import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listClasses } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/client";
import { SectionTitle, blueLinkClass } from "@/components/ui";
import { AddClassForm } from "@/components/AddClassForm";
import { DeleteClassButton } from "@/components/DeleteClassButton";

interface ClassRow {
  id: string;
  name: string;
  studentCount: number;
  assignmentCount: number;
}

export default function Classes() {
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const cls = await listClasses();
      const withCounts = await Promise.all(
        cls.map(async (c) => {
          const [{ count: sc }, { count: ac }] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }).eq("class_id", c.id),
            supabase.from("assignments").select("*", { count: "exact", head: true }).eq("class_id", c.id),
          ]);
          return { id: c.id, name: c.name, studentCount: sc ?? 0, assignmentCount: ac ?? 0 };
        })
      );
      setRows(withCounts);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const link = blueLinkClass();

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <SectionTitle number="1" title="管理班级" />
        <Link to="/teacher" className={link}>返回工作台</Link>
      </div>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-sm text-[#00897b] mb-2">新增班级</h2>
        <AddClassForm onSaved={reload} />
      </div>

      <div>
        <h2 className="font-sans font-bold text-sm text-[#00897b] mb-2">
          班级列表（共 {rows.length} 个，至少保留 1 个）
        </h2>
        {loading ? (
          <p className="font-sans text-sm text-gray-500">加载中…</p>
        ) : (
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
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-[#00897b]/10">
                    <td className="px-4 py-3 font-bold">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.studentCount}</td>
                    <td className="px-4 py-3 text-gray-500">{c.assignmentCount}</td>
                    <td className="px-4 py-3">
                      <DeleteClassButton id={c.id} name={c.name} disabled={rows.length <= 1} onSaved={reload} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length <= 1 ? (
          <p className="font-sans text-sm text-gray-500 mt-2">当前只剩 1 个班级，无法继续删除。</p>
        ) : null}
      </div>
    </div>
  );
}
