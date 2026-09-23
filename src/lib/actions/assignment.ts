"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { assignmentSchema } from "@/lib/validation";
import { validateImages } from "@/lib/uploads";
import type { ActionResult } from "@/lib/types";

export interface AssignmentInput {
  title: string;
  description: string;
  startAt: string; // datetime-local value
  dueAt: string;
  classId: string;
  studentIds: string[];
  images: string[];
}

async function requireTeacher() {
  const user = await getSession();
  if (!user || user.role !== "TEACHER") return { user: null };
  return { user };
}

/** Validate time range + class + that every selected student belongs to the class. */
async function validateAssignmentInput(
  parsed: z.infer<typeof assignmentSchema>
): Promise<
  { ok: false; error: string } | { ok: true; startAt: Date; dueAt: Date }
> {
  const startAt = new Date(parsed.startAt);
  const dueAt = new Date(parsed.dueAt);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(dueAt.getTime())) {
    return { ok: false, error: "时间格式不正确。" };
  }
  if (dueAt.getTime() <= startAt.getTime()) {
    return { ok: false, error: "截止时间必须晚于开始时间。" };
  }

  const cls = await prisma.class.findUnique({ where: { id: parsed.classId } });
  if (!cls) return { ok: false, error: "所选班级不存在，请刷新后重试。" };

  const students = await prisma.user.findMany({
    where: { id: { in: parsed.studentIds }, role: "STUDENT", classId: parsed.classId },
    select: { id: true },
  });
  if (students.length !== parsed.studentIds.length) {
    return { ok: false, error: "所选学生包含不属于该班级的账号，请刷新后重试。" };
  }

  const imgError = validateImages(parsed.images);
  if (imgError) return { ok: false, error: imgError };

  return { ok: true, startAt, dueAt };
}

export async function createAssignment(
  input: AssignmentInput
): Promise<ActionResult> {
  const { user } = await requireTeacher();
  if (!user) return { ok: false, error: "请先以教师身份登录。" };

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const v = await validateAssignmentInput(parsed.data);
  if (!v.ok) return { ok: false, error: v.error };
  const { startAt, dueAt } = v;

  const assignment = await prisma.assignment.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      images: JSON.stringify(parsed.data.images),
      startAt,
      dueAt,
      classId: parsed.data.classId,
      createdById: user.id,
      students: {
        create: parsed.data.studentIds.map((studentId) => ({ studentId })),
      },
    },
  });

  return { ok: true, redirectTo: `/teacher/assignments/${assignment.id}` };
}

export async function updateAssignment(
  id: string,
  input: AssignmentInput
): Promise<ActionResult> {
  const { user } = await requireTeacher();
  if (!user) return { ok: false, error: "请先以教师身份登录。" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.createdById !== user.id) {
    return { ok: false, error: "作业不存在或无权修改。" };
  }

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const v = await validateAssignmentInput(parsed.data);
  if (!v.ok) return { ok: false, error: v.error };
  const { startAt, dueAt } = v;

  await prisma.$transaction([
    prisma.assignmentStudent.deleteMany({ where: { assignmentId: id } }),
    prisma.assignment.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        images: JSON.stringify(parsed.data.images),
        startAt,
        dueAt,
        classId: parsed.data.classId,
        students: {
          create: parsed.data.studentIds.map((studentId) => ({ studentId })),
        },
      },
    }),
  ]);

  return { ok: true, redirectTo: `/teacher/assignments/${id}` };
}

export async function deleteAssignment(id: string): Promise<ActionResult> {
  const { user } = await requireTeacher();
  if (!user) return { ok: false, error: "请先以教师身份登录。" };

  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.createdById !== user.id) {
    return { ok: false, error: "作业不存在或无权删除。" };
  }

  await prisma.assignment.delete({ where: { id } });
  return { ok: true, redirectTo: "/teacher" };
}
