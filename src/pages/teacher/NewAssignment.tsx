import { useEffect, useState } from "react";
import { listClasses, listStudents } from "@/lib/supabase/db";
import { SectionTitle } from "@/components/ui";
import { AssignmentForm } from "@/components/AssignmentForm";

export default function NewAssignment() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; username: string; classId: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [c, s] = await Promise.all([listClasses(), listStudents()]);
      setClasses(c.map((x) => ({ id: x.id, name: x.name })));
      setStudents(s.map((x) => ({ id: x.id, name: x.name, username: x.username, classId: x.class_id })));
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <SectionTitle number="1" title="发布作业" className="mb-6" />
      <AssignmentForm classes={classes} students={students} />
    </div>
  );
}
