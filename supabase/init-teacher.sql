-- ============================================================
-- 一次性初始化：建初始班级 + 教师账号
-- 用法：Supabase → SQL Editor → 整段粘贴执行。
-- 执行后可用「王老师 / teacher123」登录。
-- 改账号：把下面的 '王老师' 和 'teacher123' 换成你想要的用户名/密码即可。
-- ============================================================

create extension if not exists pgcrypto;

-- 1. 初始班级
insert into public.classes (name) values ('1班') on conflict (name) do nothing;

-- 2. 教师账号（登录标识 = 用户名哈希出的邮箱，与前端逻辑保持一致）
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'u' || left(encode(digest('王老师', 'sha256'), 'hex'), 40) || '@eteaching.local',
  crypt('teacher123', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"王老师","username":"王老师"}'
where not exists (
  select 1 from public.profiles where username = '王老师'
);

-- 3. 把该账号设为教师（触发器默认建为 student）
update public.profiles set role = 'teacher' where username = '王老师';
