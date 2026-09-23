import { supabase } from "./client";
import type { Profile } from "./types";

export type AuthResult = { ok: true } | { ok: false; error: string };

// Supabase 登录账号必须是邮箱，这里把「用户名」用 SHA-256 哈希成一个内部邮箱，
// 让用户可以始终用「用户名 + 密码」登录（中文用户名也支持）。
export async function usernameToEmail(username: string): Promise<string> {
  const data = new TextEncoder().encode(username);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `u${hex.slice(0, 40)}@eteaching.local`;
}

/** 学生注册：先查用户名唯一，再 signUp，最后绑定班级。 */
export async function signUp(input: {
  name: string;
  username: string;
  password: string;
  classId: string;
}): Promise<AuthResult> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", input.username)
    .maybeSingle();
  if (existing) return { ok: false, error: "该用户名已被注册，请换一个。" };

  const email = await usernameToEmail(input.username);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { name: input.name, username: input.username } },
  });
  if (error) return { ok: false, error: error.message };

  if (data.user) {
    await supabase
      .from("profiles")
      .update({ class_id: input.classId })
      .eq("id", data.user.id);
  }
  return { ok: true };
}

/** 登录：用户名 + 密码。 */
export async function signIn(input: {
  username: string;
  password: string;
}): Promise<AuthResult> {
  const email = await usernameToEmail(input.username);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error) return { ok: false, error: "用户名或密码错误。" };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** 当前登录用户对应的 profile（含 role / class_id）。 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  return (data as Profile) ?? null;
}

/** 订阅登录状态变化（用于前端路由守卫）。 */
export function onAuthChange(cb: (profile: Profile | null) => void) {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      cb(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    cb((data as Profile) ?? null);
  });
}
