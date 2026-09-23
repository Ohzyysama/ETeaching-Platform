import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./db";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "eteaching_session";
// 数据库里的会话过期时间（仅作清理兜底；登录是否失效由浏览器 cookie 决定）。
const SESSION_DAYS = 30;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // 不设 maxAge/expires —— 会话 Cookie，关闭浏览器后自动失效，
    // 下次打开网站需要重新登录。
  };
}

/** Resolve the current user from the session cookie, or null if not logged in. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role as SessionUser["role"],
  };
}

/** Create a session and set the cookie. Server Actions only. */
export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions());
}

/** Delete the current session and clear the cookie. Server Actions only. */
export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}
