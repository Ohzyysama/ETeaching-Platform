import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 浏览器端 Supabase 客户端（静态站直接从前端调用）。
// Vite 用 import.meta.env.VITE_* 暴露环境变量（构建时内联）。
// anon key 本来就是公开的，可放心放前端。

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseConfigured = Boolean(url && anonKey);

// 未配置时用占位值创建，避免模块加载时抛错导致整页白屏；
// 界面会显示「缺少 Supabase 配置」的明确提示。
export const supabase: SupabaseClient = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
