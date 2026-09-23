"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/** Update the current user's own name and username. */
export async function updateProfile(input: {
  name: string;
  username: string;
}): Promise<ActionResult> {
  const user = await getSession();
  if (!user) return { ok: false, error: "请先登录。" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing && existing.id !== user.id) {
    return { ok: false, error: "该用户名已被其他人使用，请换一个。" };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, username: parsed.data.username },
    });
  } catch (e) {
    // Race-safe duplicate check against the DB unique constraint.
    if ((e as { code?: string }).code === "P2002") {
      return { ok: false, error: "该用户名已被其他人使用，请换一个。" };
    }
    throw e;
  }

  return { ok: true };
}
