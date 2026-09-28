// Supabase Edge Function: delete-student
// 彻底删除一个学生账号：删 auth 用户 → 级联删掉 profile / 提交记录，并清理该生在
// Storage 里的图片。删除后用户名（哈希出的登录邮箱）会被释放，可以重新注册。
//
// 为什么必须放在服务端：删 auth 用户需要 service_role 权限，前端只有 anon key。
// service_role key 由 Supabase 自动注入到 Edge Function 的运行环境，不进前端。
//
// 调用方式（前端 supabase.functions.invoke("delete-student", { body: { studentId } })）：
//   POST /functions/v1/delete-student   body: { "studentId": "<uuid>" }
//   请求头需带登录用户的 Authorization（Supabase 的 verify_jwt 会先校验一遍）。
// 只有 role = 'teacher' 的登录用户可以调用，且只能删学生。

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// 学生图片所在的公开桶（与 schema.sql 里的存储桶保持一致）
const BUCKETS = ["assignment-images", "submission-images", "feedback-images", "annotations"];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** 从公开 URL 里解析出所属桶和对象路径；不是本项目的 Storage 地址则返回 null。 */
function parseStorageUrl(raw: unknown): { bucket: string; path: string } | null {
  if (typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    const parts = url.pathname.split("/").filter(Boolean);
    // 形如 /storage/v1/object/public/<bucket>/<path...>
    const i = parts.indexOf("public");
    if (parts[0] !== "storage" || i < 0) return null;
    const bucket = parts[i + 1];
    const path = parts.slice(i + 2).join("/");
    if (!BUCKETS.includes(bucket) || !path) return null;
    return { bucket, path: decodeURIComponent(path) };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "只支持 POST。" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return json({ error: "Edge Function 缺少 Supabase 环境变量，无法删除。" }, 500);
  }

  // ---------- 1. 校验调用者：必须是已登录的教师 ----------
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "未登录。" }, 401);

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: auth, error: authErr } = await caller.auth.getUser(token);
  if (authErr || !auth.user) return json({ error: "登录状态已失效，请重新登录。" }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (callerProfile?.role !== "teacher") {
    return json({ error: "只有教师可以删除学生账号。" }, 403);
  }

  // ---------- 2. 校验参数与目标 ----------
  let studentId: unknown;
  try {
    ({ studentId } = await req.json());
  } catch {
    return json({ error: "请求体不是合法 JSON。" }, 400);
  }
  if (typeof studentId !== "string" || !UUID_RE.test(studentId)) {
    return json({ error: "studentId 无效。" }, 400);
  }
  if (studentId === auth.user.id) {
    return json({ error: "不能删除自己的账号。" }, 400);
  }

  const { data: target } = await admin
    .from("profiles")
    .select("id, role")
    .eq("id", studentId)
    .maybeSingle();
  if (!target) return json({ error: "该学生不存在或已被删除。" }, 404);
  if (target.role !== "student") return json({ error: "只能删除学生账号。" }, 400);

  // ---------- 3. 先收集要清理的图片，再删数据 ----------
  // 删 auth 用户后提交记录会被级联删掉，那时就查不到图片地址了。
  const { data: submissions } = await admin
    .from("submissions")
    .select("images, feedback_images, annotations")
    .eq("student_id", studentId);

  const files = new Map<string, Set<string>>();
  for (const s of submissions ?? []) {
    for (const field of [s.images, s.feedback_images, s.annotations]) {
      if (!Array.isArray(field)) continue;
      for (const raw of field) {
        const parsed = parseStorageUrl(raw);
        if (!parsed) continue;
        if (!files.has(parsed.bucket)) files.set(parsed.bucket, new Set());
        files.get(parsed.bucket)!.add(parsed.path);
      }
    }
  }

  // ---------- 4. 删 auth 用户（profiles / submissions 由外键级联删除）----------
  const { error: delErr } = await admin.auth.admin.deleteUser(studentId);
  if (delErr) return json({ error: `删除失败：${delErr.message}` }, 500);

  // ---------- 5. 清理 Storage 里的图片（失败不影响删除结果，只记日志）----------
  for (const [bucket, paths] of files) {
    const list = [...paths];
    if (list.length === 0) continue;
    const { error } = await admin.storage.from(bucket).remove(list);
    if (error) console.error(`清理 ${bucket} 失败：`, error.message);
  }

  return json({ ok: true });
});
