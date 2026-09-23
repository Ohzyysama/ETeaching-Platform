import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { createAssignment, updateAssignment } from "@/lib/supabase/db";
import { PaperButton, Field, SectionLabel, inputClass } from "@/components/ui";
import { StudentPicker } from "./StudentPicker";
import { ImageInput } from "./ImageInput";

interface StudentWithClass {
  id: string;
  name: string;
  username: string;
  classId: string | null;
}

export interface AssignmentInitial {
  title: string;
  description: string;
  startAt: string;
  dueAt: string;
  classIds: string[];
  studentIds: string[];
  images: string[];
}

export function AssignmentForm({
  classes,
  students,
  assignmentId,
  initial,
}: {
  classes: { id: string; name: string }[];
  students: StudentWithClass[];
  assignmentId?: string;
  initial?: AssignmentInitial;
}) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startAt, setStartAt] = useState(initial?.startAt ?? "");
  const [dueAt, setDueAt] = useState(initial?.dueAt ?? "");
  const [classIds, setClassIds] = useState<string[]>(initial?.classIds ?? []);
  const [studentIds, setStudentIds] = useState<string[]>(initial?.studentIds ?? []);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const classStudents = students.filter((s) => s.classId && classIds.includes(s.classId));
  const allClassesSelected = classes.length > 0 && classIds.length === classes.length;

  function toggleClass(id: string) {
    if (classIds.includes(id)) setClassIds(classIds.filter((x) => x !== id));
    else setClassIds([...classIds, id]);
    setStudentIds([]); // 班级变了，重置已选学生
  }

  function toggleAllClasses() {
    if (allClassesSelected) {
      setClassIds([]);
    } else {
      setClassIds(classes.map((c) => c.id));
    }
    setStudentIds([]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (classIds.length === 0) return setError("请选择班级。");
    if (studentIds.length === 0) return setError("请选择需要交作业的学生。");
    if (!profile) return setError("未登录。");

    setPending(true);
    const payload = { title, description, startAt, dueAt, classIds, studentIds, images };
    const res = assignmentId
      ? await updateAssignment(assignmentId, payload)
      : await createAssignment({ ...payload, teacherId: profile.id });
    if (!res.ok) {
      setError(res.error ?? "保存失败。");
      setPending(false);
      return;
    }
    navigate(assignmentId ? `/teacher/assignments/${assignmentId}` : "/teacher");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}

      <Field label="作业标题">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>

      <Field label="作业说明">
        <textarea className={inputClass} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>

      <SectionLabel label={`选择班级（可多选，已选 ${classIds.length}）`}>
        <div className="rounded-2xl border border-[#00897b]/20 bg-white">
          <label className="flex items-center gap-2 px-3 py-2 border-b border-[#00897b]/20 font-sans text-sm cursor-pointer">
            <input type="checkbox" checked={allClassesSelected} onChange={toggleAllClasses} />
            <span className="font-bold">全选</span>
            <span className="text-gray-500">（已选 {classIds.length} / {classes.length}）</span>
          </label>
          <ul className="max-h-40 overflow-y-auto">
            {classes.map((c) => (
              <li key={c.id}>
                <label className="flex items-center gap-2 px-3 py-1.5 font-sans text-sm cursor-pointer hover:bg-[#fffde7]">
                  <input type="checkbox" checked={classIds.includes(c.id)} onChange={() => toggleClass(c.id)} />
                  <span>{c.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </SectionLabel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="开始时间">
          <input type="datetime-local" className={inputClass} value={startAt} onChange={(e) => setStartAt(e.target.value)} required />
        </Field>
        <Field label="截止时间">
          <input type="datetime-local" className={inputClass} value={dueAt} onChange={(e) => setDueAt(e.target.value)} required />
        </Field>
      </div>

      <SectionLabel label="配图（可选）">
        <ImageInput bucket="assignment-images" images={images} onChange={setImages} />
      </SectionLabel>

      <SectionLabel label={`选择需要交作业的学生（已选 ${studentIds.length} / ${classStudents.length}）`} hint="先选班级，再勾选这些班级内的学生">
        {classIds.length > 0 ? (
          <StudentPicker students={classStudents} selected={studentIds} onChange={setStudentIds} />
        ) : (
          <p className="font-sans text-sm text-gray-500">请先选择班级。</p>
        )}
      </SectionLabel>

      <div className="flex gap-3">
        <PaperButton type="submit" variant="primary" disabled={pending}>
          {pending ? "保存中…" : assignmentId ? "保存修改" : "发布作业"}
        </PaperButton>
        <PaperButton type="button" variant="secondary" onClick={() => navigate(-1)}>
          取消
        </PaperButton>
      </div>
    </form>
  );
}
