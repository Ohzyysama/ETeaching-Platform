"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canStudentEdit } from "@/lib/status";
import { submissionSchema, scoreSchema } from "@/lib/validation";
import { validateImages } from "@/lib/uploads";
import type { ActionResult } from "@/lib/types";

export async function submitAssignment(input: {
  assignmentId: string;
  remark: string;
  images: string[];
}): Promise<ActionResult> {
  const user = await getSession();
  if (!user || user.role !== "STUDENT") {
    return { ok: false, error: "请先以学生身份登录。" };
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: input.assignmentId },
    include: { students: { select: { studentId: true } } },
  });
  if (!assignment) return { ok: false, error: "作业不存在。" };
  if (!assignment.students.some((s) => s.studentId === user.id)) {
    return { ok: false, error: "你不在该作业的提交名单中。" };
  }

  const parsed = submissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const imgError = validateImages(parsed.data.images);
  if (imgError) return { ok: false, error: imgError };

  const imagesJson = JSON.stringify(parsed.data.images);
  const existing = await prisma.submission.findUnique({
    where: {
      assignmentId_studentId: {
        assignmentId: input.assignmentId,
        studentId: user.id,
      },
    },
  });

  if (existing) {
    // Editing an existing submission: only before grading AND before deadline.
    const edit = canStudentEdit({
      graded: existing.graded,
      dueAt: assignment.dueAt,
      submitted: true,
    });
    if (!edit.allowed) return { ok: false, error: edit.reason ?? "当前无法修改。" };

    await prisma.submission.update({
      where: { id: existing.id },
      data: { remark: parsed.data.remark, images: imagesJson },
    });
  } else {
    // First submission — allowed even after the deadline (recorded as late).
    await prisma.submission.create({
      data: {
        assignmentId: input.assignmentId,
        studentId: user.id,
        remark: parsed.data.remark,
        images: imagesJson,
        submittedAt: new Date(),
      },
    });
  }

  return { ok: true, redirectTo: `/student/assignments/${input.assignmentId}` };
}

export async function setScore(input: {
  submissionId: string;
  score: number;
}): Promise<ActionResult> {
  const user = await getSession();
  if (!user || user.role !== "TEACHER") {
    return { ok: false, error: "仅教师可批改分数。" };
  }

  const parsed = scoreSchema.safeParse({ score: input.score });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const submission = await prisma.submission.findUnique({
    where: { id: input.submissionId },
    include: { assignment: { select: { createdById: true } } },
  });
  if (!submission) return { ok: false, error: "提交记录不存在。" };
  if (submission.assignment.createdById !== user.id) {
    return { ok: false, error: "无权批改该作业。" };
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      score: parsed.data.score,
      graded: true,
      gradedById: user.id,
      gradedAt: new Date(),
    },
  });

  return { ok: true };
}
