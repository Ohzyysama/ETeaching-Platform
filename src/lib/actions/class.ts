"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { classSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function createClass(input: { name: string }): Promise<ActionResult> {
  const user = await getSession();
  if (!user || user.role !== "TEACHER") {
    return { ok: false, error: "仅教师可管理班级。" };
  }

  const parsed = classSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.class.findUnique({ where: { name: parsed.data.name } });
  if (existing) return { ok: false, error: "该班级号已存在，请换一个。" };

  await prisma.class.create({ data: { name: parsed.data.name } });
  return { ok: true };
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const user = await getSession();
  if (!user || user.role !== "TEACHER") {
    return { ok: false, error: "仅教师可管理班级。" };
  }

  const count = await prisma.class.count();
  if (count <= 1) return { ok: false, error: "至少保留 1 个班级，无法删除。" };

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return { ok: false, error: "班级不存在。" };

  // Cascades: the class's assignments (and their submissions) are removed;
  // its students become unassigned (classId -> null) and can re-join.
  await prisma.class.delete({ where: { id } });
  return { ok: true };
}

/** A student (re)joins a class — used when they register or after their class was deleted. */
export async function joinClass(id: string): Promise<ActionResult> {
  const user = await getSession();
  if (!user || user.role !== "STUDENT") {
    return { ok: false, error: "请先以学生身份登录。" };
  }

  const cls = await prisma.class.findUnique({ where: { id } });
  if (!cls) return { ok: false, error: "班级不存在。" };

  await prisma.user.update({ where: { id: user.id }, data: { classId: cls.id } });
  return { ok: true };
}
