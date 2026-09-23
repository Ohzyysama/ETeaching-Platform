"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function login(input: {
  username: string;
  password: string;
}): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { ok: false, error: "用户名或密码错误。" };
  }

  await createSession(user.id);
  return { ok: true, redirectTo: user.role === "TEACHER" ? "/teacher" : "/student" };
}

export async function register(input: {
  name: string;
  username: string;
  password: string;
  classId: string;
}): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) return { ok: false, error: "该用户名已被注册，请换一个。" };

  const cls = await prisma.class.findUnique({ where: { id: parsed.data.classId } });
  if (!cls) return { ok: false, error: "所选班级不存在，请刷新后重试。" };

  const created = await prisma.user
    .create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        passwordHash: await bcrypt.hash(parsed.data.password, 10),
        role: "STUDENT",
        classId: cls.id,
      },
    })
    .catch((e) => {
      // Unique constraint on username — race-safe duplicate check.
      if ((e as { code?: string }).code === "P2002") return null;
      throw e;
    });
  if (!created) return { ok: false, error: "该用户名已被注册，请换一个。" };

  await createSession(created.id);
  return { ok: true, redirectTo: "/student" };
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
