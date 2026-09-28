-- ============================================================
-- 增量迁移：多班级 + 删除学生
-- 在 Supabase SQL Editor 整段执行。每一步都做了幂等处理，可放心重复运行
-- （新装环境请直接跑 schema.sql，本文件只服务于已经建过表的老库）。
-- 前提：已执行过「修复 RLS 递归」的 SQL（is_assignment_owner 等函数已存在）。
-- ============================================================

-- 1. 作业-班级中间表（多对多）
create table if not exists public.assignment_classes (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  primary key (assignment_id, class_id)
);
create index if not exists assignment_classes_class_id_idx on public.assignment_classes(class_id);

-- 2. 迁移现有数据（单班级 → 中间表）
-- 必须先判断 assignments.class_id 还在不在：第 3 步会把它删掉，所以本文件第二次执行时
-- 这一列已经不存在了，裸写 select class_id 会报 42703 并把整段事务回滚掉。
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assignments'
      and column_name = 'class_id'
  ) then
    insert into public.assignment_classes (assignment_id, class_id)
    select id, class_id from public.assignments where class_id is not null
    on conflict do nothing;
  end if;
end $$;

-- 3. 删除 assignments 的单班级列
alter table public.assignments drop column if exists class_id;

-- 4. 学生软删除字段
alter table public.profiles add column if not exists deleted_at timestamptz;

-- 5. RLS：assignment_classes
alter table public.assignment_classes enable row level security;

drop policy if exists assignment_classes_select on public.assignment_classes;
create policy assignment_classes_select on public.assignment_classes
  for select using (auth.role() = 'authenticated');

drop policy if exists assignment_classes_insert on public.assignment_classes;
create policy assignment_classes_insert on public.assignment_classes
  for insert with check (public.is_assignment_owner(assignment_id));

drop policy if exists assignment_classes_delete on public.assignment_classes;
create policy assignment_classes_delete on public.assignment_classes
  for delete using (public.is_assignment_owner(assignment_id));

-- 6. RLS：教师可更新学生 profile（用于软删除）
drop policy if exists profiles_update_teacher on public.profiles;
create policy profiles_update_teacher on public.profiles
  for update using (public.is_teacher()) with check (public.is_teacher());

-- 7. 注册时直接把班级写进 profile
-- 旧版触发器只写 name / username，班级要等前端在 signUp 返回后再补一次 update，
-- 那次 update 与界面读取 profile 存在时序竞争（读早了 class_id 就是 null，
-- 学生会被要求「请选择班级」）。改成建 profile 时就写好，从根上消除竞争。
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username, class_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'username', new.email),
    -- 先确认班级存在再写入：id 不合法或班级已不存在就存 null，否则外键报错会把
    -- 整个注册事务回滚掉，用户只会看到一句 "Database error saving new user"。
    case
      when coalesce(new.raw_user_meta_data->>'class_id', '') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      then (select c.id from public.classes c
            where c.id = (new.raw_user_meta_data->>'class_id')::uuid)
    end
  );
  return new;
end;
$$;

-- 8. 把四个存储桶强制设为公开
-- 列一个具体现象：学生上传后教师端照片全是裂图、学生自己刷新却能看到。
-- 原因是上传成功（走 RLS 的 insert 策略，与桶是否公开无关）但读取失败——
-- 前端用的是 getPublicUrl()，即 /object/public/... 这条路径，桶 public = false
-- 时会被 Storage 拒掉（400）。学生那边之所以正常，只是浏览器把刚上传的图缓存了
-- （uploadFile 里 cacheControl 3600）。
-- schema.sql 原来写的是 on conflict do nothing，早先在控制台手工建过桶、且没勾
-- Public 的项目重跑也不会被纠正，所以这里补一次。
update storage.buckets
set public = true
where id in ('assignment-images', 'submission-images', 'feedback-images', 'annotations');
