-- ============================================================
-- 增量迁移：多班级 + 删除学生
-- 在 Supabase SQL Editor 整段执行（一次性）。幂等，可重复运行。
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
insert into public.assignment_classes (assignment_id, class_id)
select id, class_id from public.assignments where class_id is not null
on conflict do nothing;

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
