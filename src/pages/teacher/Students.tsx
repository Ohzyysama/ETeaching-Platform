import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listStudents, listClasses } from "@/lib/supabase/db";
import type { Profile } from "@/lib/supabase/types";
import { SectionTitle, blueLinkClass } from "@/components/ui";
import { DeleteStudentButton } from "@/components/DeleteStudentButton";

export default function Students() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [classMap, setClassMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([listStudents(), listClasses()]);
      setStudents(s);
      setClassMap(new Map(c.map((x) => [x.id, x.name])));
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
        <SectionTitle number="1" title="管理学生" />
        <Link to="/teacher" className={link}>返回工作台</Link>
      </div>

      {loading ? (
        <p className="font-sans text-sm text-gray-500">加载中…</p>
      ) : students.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,137,123,0.1)] px-6 py-5 font-sans text-sm text-gray-500">
          暂无学生。
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)]">
          <table className="w-full text-left font-sans text-sm">
            <thead className="bg-[#fffde7] text-[#00897b]">
              <tr>
                <th className="px-4 py-3 text-sm font-bold">姓名</th>
                <th className="px-4 py-3 text-sm font-bold">用户名</th>
                <th className="px-4 py-3 text-sm font-bold">班级</th>
                <th className="px-4 py-3 text-sm font-bold">操作</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-[#00897b]/10">
                  <td className="px-4 py-3 font-bold">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">{s.username}</td>
                  <td className="px-4 py-3 text-gray-600">{classMap.get(s.class_id ?? "") ?? "未分班"}</td>
                  <td className="px-4 py-3">
                    <DeleteStudentButton id={s.id} name={s.name} onSaved={reload} />
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
