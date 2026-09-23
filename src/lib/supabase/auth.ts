"use client";

import { supabase } from "./client";
import type { Profile } from "./types";

export type AuthResult = { ok: true } | { ok: false; error: string };

/** 学生注册：先查用户名唯一，再 signUp，最后绑定班级。 */
export async function signUp(input: {
  email: string;
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

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name, username: input.username } },
  });
  if (error) {
    if (/already registered|already been registered/i.test(error.message)) {
      return { ok: false, error: "该邮箱已被注册。" };
    }
    return { ok: false, error: error.message };
  }

  if (data.user) {
    await supabase
      .from("profiles")
      .update({ class_id: input.classId })
      .eq("id", data.user.id);
  }

  return { ok: true };
}

/** 登录：邮箱 + 密码。 */
export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) return { ok: false, error: "邮箱或密码错误。" };
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
