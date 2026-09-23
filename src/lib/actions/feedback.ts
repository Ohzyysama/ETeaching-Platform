"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validation";
import { validateImages } from "@/lib/uploads";
import { parseAnnotations } from "@/lib/json";
import type { ActionResult } from "@/lib/types";

async function requireOwningTeacher(submissionId: string) {
  const user = await getSession();
  if (!user || user.role !== "TEACHER") {
    return { error: "仅教师可批改。" as const };
  }
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: { select: { createdById: true } } },
  });
  if (!submission || submission.assignment.createdById !== user.id) {
    return { error: "无权批改该提交。" as const };
  }
  return { user, submission };
}

/** Save the teacher's written feedback + feedback images. */
export async function saveFeedback(input: {
  submissionId: string;
  feedback: string;
  feedbackImages: string[];
}): Promise<ActionResult> {
  const r = await requireOwningTeacher(input.submissionId);
  if ("error" in r) return { ok: false, error: r.error };

  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const imgError = validateImages(parsed.data.feedbackImages);
  if (imgError) return { ok: false, error: imgError };

  await prisma.submission.update({
    where: { id: input.submissionId },
    data: {
      feedback: parsed.data.feedback,
      feedbackImages: JSON.stringify(parsed.data.feedbackImages),
      graded: true,
      gradedById: r.user.id,
      gradedAt: new Date(),
    },
  });

  return { ok: true };
}

/** Save the doodle annotation (transparent PNG overlay) for one photo. */
export async function saveAnnotation(input: {
  submissionId: string;
  index: number;
  dataUrl: string;
}): Promise<ActionResult> {
  const r = await requireOwningTeacher(input.submissionId);
  if ("error" in r) return { ok: false, error: r.error };

  if (
    typeof input.dataUrl !== "string" ||
    !input.dataUrl.startsWith("data:image/png")
  ) {
    return { ok: false, error: "涂鸦数据格式错误。" };
  }
  if (input.dataUrl.length > 5 * 1024 * 1024) {
    return { ok: false, error: "涂鸦数据过大。" };
  }

  const annotations = parseAnnotations(r.submission.annotations);
  if (input.index < 0 || input.index >= 100) {
    return { ok: false, error: "照片序号错误。" };
  }
  annotations[input.index] = input.dataUrl;

  await prisma.submission.update({
    where: { id: input.submissionId },
    data: {
      annotations: JSON.stringify(annotations),
      graded: true,
      gradedById: r.user.id,
      gradedAt: new Date(),
    },
  });

  return { ok: true };
}
