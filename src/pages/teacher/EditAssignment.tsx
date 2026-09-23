import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAssignment, listClasses, listStudents } from "@/lib/supabase/db";
import { supabase } from "@/lib/supabase/client";
import { toLocalInputValue } from "@/lib/format";
import { SectionTitle } from "@/components/ui";
import { AssignmentForm, type AssignmentInitial } from "@/components/AssignmentForm";

export default function EditAssignment() {
  const { id } = useParams<{ id: string }>();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string; username: string; classId: string | null }[]>([]);
  const [initial, setInitial] = useState<AssignmentInitial | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const [assignment, c, s, { data: links }] = await Promise.all([
        getAssignment(id),
        listClasses(),
        listStudents(),
        supabase.from("assignment_students").select("student_id").eq("assignment_id", id),
      ]);
      setClasses(c.map((x) => ({ id: x.id, name: x.name })));
      setStudents(s.map((x) => ({ id: x.id, name: x.name, username: x.username, classId: x.class_id })));
      setInitial({
        title: assignment.title,
        description: assignment.description,
        startAt: toLocalInputValue(new Date(assignment.start_at)),
        dueAt: toLocalInputValue(new Date(assignment.due_at)),
        classIds: assignment.classIds,
        studentIds: (links ?? []).map((l) => l.student_id),
        images: assignment.images,
      });
      setLoading(false);
    })();
  }, [id]);

  if (loading || !initial) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <SectionTitle number="1" title="修改作业" className="mb-6" />
      <AssignmentForm classes={classes} students={students} assignmentId={id} initial={initial} />
    </div>
  );
}
