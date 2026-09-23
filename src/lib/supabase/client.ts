import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 浏览器端 Supabase 客户端（静态站直接从前端调用）。
// Vite 用 import.meta.env.VITE_* 暴露环境变量（构建时内联）。
// anon key 本来就是公开的，可放心放前端。

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "缺少 Supabase 环境变量：请在 .env.local 配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY"
  );
}

export const supabase: SupabaseClient = createClient(url, anonKey);
