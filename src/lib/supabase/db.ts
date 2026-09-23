import { supabase } from "./client";
import type { Assignment, Class, Profile, Submission } from "./types";

export type Result = { ok: true } | { ok: false; error: string };

// ---------- classes ----------
export async function listClasses(): Promise<Class[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Class[];
}

export async function createClass(name: string): Promise<Result> {
  const { data: existing } = await supabase
    .from("classes")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return { ok: false, error: "该班级号已存在，请换一个。" };
  const { error } = await supabase.from("classes").insert({ name });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteClass(id: string): Promise<Result> {
  const { count } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true });
  if ((count ?? 0) <= 1) return { ok: false, error: "至少保留 1 个班级，无法删除。" };
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------- profiles / students ----------
export async function listStudents(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "student")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function updateProfile(
  userId: string,
  name: string,
  username: string
): Promise<Result> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing && existing.id !== userId) {
    return { ok: false, error: "该用户名已被其他人使用，请换一个。" };
  }
  const { error } = await supabase
    .from("profiles")
    .update({ name, username })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function joinClass(userId: string, classId: string): Promise<Result> {
  const { error } = await supabase
    .from("profiles")
    .update({ class_id: classId })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------- assignments ----------
export async function listTeacherAssignments(teacherId: string) {
  const { data: assignments, error } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .eq("created_by", teacherId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (assignments ?? []) as (Assignment & { classes: { name: string } })[];
  const ids = rows.map((a) => a.id);
  if (ids.length === 0) return [];

  const [{ data: links }, { data: subs }] = await Promise.all([
    supabase.from("assignment_students").select("assignment_id").in("assignment_id", ids),
    supabase
      .from("submissions")
      .select("assignment_id, submitted_at, graded")
      .in("assignment_id", ids),
  ]);

  const totalBy = new Map<string, number>();
  for (const l of links ?? []) totalBy.set(l.assignment_id, (totalBy.get(l.assignment_id) ?? 0) + 1);
  const subsBy = new Map<string, { submitted_at: string; graded: boolean }[]>();
  for (const s of subs ?? []) {
    const arr = subsBy.get(s.assignment_id) ?? [];
    arr.push(s);
    subsBy.set(s.assignment_id, arr);
  }

  return rows.map((a) => {
    const total = totalBy.get(a.id) ?? 0;
    const subs = (subsBy.get(a.id) ?? []).map((s) => ({
      submittedAt: new Date(s.submitted_at),
      graded: s.graded,
    }));
    const late = subs.filter((s) => s.submittedAt.getTime() > new Date(a.due_at).getTime()).length;
    return {
      ...a,
      className: a.classes?.name ?? "",
      total,
      submitted: subs.length,
      late,
      unsubmitted: total - subs.length,
      graded: subs.filter((s) => s.graded).length,
    };
  });
}

export async function getAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from("assignments")
    .select("*, classes(name)")
    .eq("id", assignmentId)
    .single();
  if (error) throw error;
  return data as Assignment & { classes: { name: string } };
}

export async function getAssignmentStats(assignmentId: string) {
  const assignment = await getAssignment(assignmentId);
  const [{ data: links }, { data: subs }] = await Promise.all([
    supabase.from("assignment_students").select("student_id").eq("assignment_id", assignmentId),
    supabase.from("submissions").select("*").eq("assignment_id", assignmentId),
  ]);
  const [{ data: profiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, username")
      .in(
        "id",
        (links ?? []).map((l) => l.student_id)
      ),
  ]);
  const subBy = new Map((subs ?? []).map((s) => [s.student_id, s]));
  const rows = (links ?? []).map((l) => {
    const p = (profiles ?? []).find((x) => x.id === l.student_id);
    const s = subBy.get(l.student_id);
    const submittedAt = s ? new Date(s.submitted_at) : null;
    const late = submittedAt ? submittedAt.getTime() > new Date(assignment.due_at).getTime() : false;
    return {
      studentId: l.student_id,
      name: p?.name ?? "未知",
      username: p?.username ?? "",
      submitted: !!s,
      submittedAt,
      late,
      score: s?.score ?? 0,
      graded: s?.graded ?? false,
      submissionId: s?.id ?? null,
    };
  });
  rows.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
  return { assignment, rows };
}

export async function createAssignment(input: {
  title: string;
  description: string;
  images: string[];
  startAt: string;
  dueAt: string;
  classId: string;
  studentIds: string[];
  teacherId: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      title: input.title,
      description: input.description,
      images: input.images,
      start_at: new Date(input.startAt).toISOString(),
      due_at: new Date(input.dueAt).toISOString(),
      class_id: input.classId,
      created_by: input.teacherId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const { error: linkError } = await supabase.from("assignment_students").insert(
    input.studentIds.map((sid) => ({ assignment_id: data.id, student_id: sid }))
  );
  if (linkError) return { ok: false, error: linkError.message };
  return { ok: true, id: data.id };
}

export async function updateAssignment(
  assignmentId: string,
  input: {
    title: string;
    description: string;
    images: string[];
    startAt: string;
    dueAt: string;
    classId: string;
    studentIds: string[];
  }
): Promise<Result> {
  const { error } = await supabase
    .from("assignments")
    .update({
      title: input.title,
      description: input.description,
      images: input.images,
      start_at: new Date(input.startAt).toISOString(),
      due_at: new Date(input.dueAt).toISOString(),
      class_id: input.classId,
    })
    .eq("id", assignmentId);
  if (error) return { ok: false, error: error.message };

  const { error: delErr } = await supabase
    .from("assignment_students")
    .delete()
    .eq("assignment_id", assignmentId);
  if (delErr) return { ok: false, error: delErr.message };

  const { error: linkErr } = await supabase.from("assignment_students").insert(
    input.studentIds.map((sid) => ({ assignment_id: assignmentId, student_id: sid }))
  );
  if (linkErr) return { ok: false, error: linkErr.message };
  return { ok: true };
}

export async function deleteAssignment(id: string): Promise<Result> {
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ---------- submissions ----------
export async function getStudentAssignments(studentId: string) {
  const { data: links, error } = await supabase
    .from("assignment_students")
    .select("assignment_id")
    .eq("student_id", studentId);
  if (error) throw error;
  const ids = (links ?? []).map((l) => l.assignment_id);
  if (ids.length === 0) return [];

  const [{ data: assignments }, { data: subs }] = await Promise.all([
    supabase.from("assignments").select("*").in("id", ids),
    supabase.from("submissions").select("*").eq("student_id", studentId).in("assignment_id", ids),
  ]);
  const subBy = new Map((subs ?? []).map((s) => [s.assignment_id, s]));
  return (assignments ?? [])
    .map((a) => ({ assignment: a as Assignment, submission: (subBy.get(a.id) as Submission | undefined) ?? null }))
    .sort((x, y) => new Date(x.assignment.due_at).getTime() - new Date(y.assignment.due_at).getTime());
}

export async function getStudentAssignment(assignmentId: string, studentId: string) {
  const assignment = await getAssignment(assignmentId);
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  return { assignment, submission: (data as Submission | null) ?? null };
}

export async function getSubmissionById(submissionId: string) {
  const { data, error } = await supabase
    .from("submissions")
    .select("*, profiles(name, username), assignments(title, due_at)")
    .eq("id", submissionId)
    .single();
  if (error) throw error;
  return data as Submission & {
    profiles: { name: string; username: string };
    assignments: { title: string; due_at: string };
  };
}

export async function submitAssignment(input: {
  assignmentId: string;
  studentId: string;
  remark: string;
  images: string[];
}): Promise<Result> {
  const { error } = await supabase.from("submissions").upsert(
    {
      assignment_id: input.assignmentId,
      student_id: input.studentId,
      remark: input.remark,
      images: input.images,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveFeedback(input: {
  submissionId: string;
  feedback: string;
  feedbackImages: string[];
  teacherId: string;
}): Promise<Result> {
  const { error } = await supabase
    .from("submissions")
    .update({
      feedback: input.feedback,
      feedback_images: input.feedbackImages,
      graded: true,
      graded_by: input.teacherId,
      graded_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveAnnotation(input: {
  submissionId: string;
  index: number;
  dataUrl: string;
  teacherId: string;
  annotations: (string | null)[];
}): Promise<Result> {
  const next = [...input.annotations];
  next[input.index] = input.dataUrl;
  const { error } = await supabase
    .from("submissions")
    .update({
      annotations: next,
      graded: true,
      graded_by: input.teacherId,
      graded_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function setScore(input: {
  submissionId: string;
  score: number;
  teacherId: string;
}): Promise<Result> {
  const { error } = await supabase
    .from("submissions")
    .update({
      score: input.score,
      graded: true,
      graded_by: input.teacherId,
      graded_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
