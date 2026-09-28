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
    // class_id 一起放进 user_metadata：数据库里的 handle_new_user 触发器在建 profile 的
    // 那一刻就把班级写好，不用等 signUp 返回后再补一次 update
    // （那次 update 会和界面读取 profile 抢时序，读早了就拿到 null）。
    options: {
      data: {
        name: input.name,
        username: input.username,
        class_id: input.classId,
      },
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "注册失败，请稍后重试。" };

  // 没拿到会话说明「Confirm email」还开着：此时没有登录态，RLS 不允许写 profiles，
  // 班级绑不上，而且用户下一步也进不去 Dashboard。与其静默失败，不如直接说清楚。
  if (!data.session) {
    return {
      ok: false,
      error: "注册未完成：Supabase 的「Confirm email」仍是开启状态，请在控制台关掉后重试。",
    };
  }

  // 兜底：数据库里的 handle_new_user 若还是旧版（不读 class_id），这里补写一次。
  // 新触发器已经写好班级时，这次写的是同样的值，无副作用。
  const { error: bindErr } = await supabase
    .from("profiles")
    .update({ class_id: input.classId })
    .eq("id", data.user.id);
  if (bindErr) return { ok: false, error: `加入班级失败：${bindErr.message}` };

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

  // 软删除的账号：立即登出并给出明确提示
  const profile = await getCurrentProfile();
  if (!profile || profile.deleted_at) {
    await supabase.auth.signOut();
    return { ok: false, error: "该账号已被删除。" };
  }
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
