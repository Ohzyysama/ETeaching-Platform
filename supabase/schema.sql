-- ============================================================
-- ETeaching Platform — Supabase 建表 SQL
-- 用法：Supabase 控制台 → SQL Editor → 新建查询 → 整段粘贴执行。
-- 顺序说明：先建表，再定义依赖这些表的函数（check_function_bodies 默认开启）。
-- ============================================================

-- ---------- 表 ----------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  username text not null unique,
  role text not null default 'student' check (role in ('teacher','student')),
  class_id uuid references public.classes(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  images jsonb not null default '[]'::jsonb,      -- 图片 URL 数组（存 Storage）
  start_at timestamptz not null,
  due_at timestamptz not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assignment_students (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  primary key (assignment_id, student_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  remark text not null default '',                -- 学生备注
  images jsonb not null default '[]'::jsonb,      -- 学生照片 URL 数组
  feedback text not null default '',              -- 教师评语
  feedback_images jsonb not null default '[]'::jsonb, -- 评语配图 URL 数组
  annotations jsonb not null default '[]'::jsonb, -- 每张照片的涂鸦 PNG URL（索引对应 images）
  submitted_at timestamptz not null,
  updated_at timestamptz not null default now(),
  score numeric not null default 0,
  graded boolean not null default false,
  graded_by uuid,
  graded_at timestamptz,
  unique (assignment_id, student_id)
);

-- ---------- 索引 ----------
create index if not exists assignments_class_id_idx on public.assignments(class_id);
create index if not exists assignments_created_by_idx on public.assignments(created_by);
create index if not exists submissions_assignment_id_idx on public.submissions(assignment_id);
create index if not exists profiles_class_id_idx on public.profiles(class_id);

-- ---------- 工具函数（依赖上面的表，故放在建表之后）----------
create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;

create or replace function public.is_student() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'student');
$$;

-- ---------- 注册时自动创建 profile ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'username', new.email)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at 自动更新 ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists assignments_touch on public.assignments;
create trigger assignments_touch before update on public.assignments
  for each row execute function public.touch_updated_at();

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 行级安全（RLS）
-- ============================================================
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.assignments enable row level security;
alter table public.assignment_students enable row level security;
alter table public.submissions enable row level security;

-- ---- profiles：所有登录用户可读（展示姓名），只能改自己 ----
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- classes：登录可读；教师可增删 ----
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select using (auth.role() = 'authenticated');

drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes
  for insert with check (public.is_teacher());

drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes
  for delete using (public.is_teacher());

-- ---- assignments：教师管自己的；学生看自己被分配的 ----
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments
  for select using (
    created_by = auth.uid()
    or exists (
      select 1 from public.assignment_students s
      where s.assignment_id = id and s.student_id = auth.uid()
    )
  );

drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments
  for insert with check (public.is_teacher() and created_by = auth.uid());

drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists assignments_delete on public.assignments;
create policy assignments_delete on public.assignments
  for delete using (created_by = auth.uid());

-- ---- assignment_students：教师管自己的作业；学生看自己 ----
drop policy if exists assignment_students_select on public.assignment_students;
create policy assignment_students_select on public.assignment_students
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.created_by = auth.uid()
    )
  );

drop policy if exists assignment_students_insert on public.assignment_students;
create policy assignment_students_insert on public.assignment_students
  for insert with check (
    exists (select 1 from public.assignments a where a.id = assignment_id and a.created_by = auth.uid())
  );

drop policy if exists assignment_students_delete on public.assignment_students;
create policy assignment_students_delete on public.assignment_students
  for delete using (
    exists (select 1 from public.assignments a where a.id = assignment_id and a.created_by = auth.uid())
  );

-- ---- submissions：学生管自己的（未批改且未截止才可改）；教师管自己作业的 ----
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.created_by = auth.uid()
    )
  );

drop policy if exists submissions_insert on public.submissions;
create policy submissions_insert on public.submissions
  for insert with check (public.is_student() and student_id = auth.uid());

drop policy if exists submissions_update_student on public.submissions;
create policy submissions_update_student on public.submissions
  for update using (
    public.is_student()
    and student_id = auth.uid()
    and graded = false
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.due_at > now()
    )
  ) with check (
    student_id = auth.uid() and graded = false
  );

drop policy if exists submissions_update_teacher on public.submissions;
create policy submissions_update_teacher on public.submissions
  for update using (
    public.is_teacher()
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id and a.created_by = auth.uid()
    )
  );

-- ============================================================
-- 存储桶（图片 / 涂鸦）
-- ============================================================
insert into storage.buckets (id, name, public)
values
  ('assignment-images', 'assignment-images', true),
  ('submission-images', 'submission-images', true),
  ('feedback-images', 'feedback-images', true),
  ('annotations', 'annotations', true)
on conflict (id) do nothing;

-- 允许登录用户上传；公开桶已允许公共读取
do $$
declare b text;
begin
  foreach b in array array['assignment-images','submission-images','feedback-images','annotations']
  loop
    execute format(
      'drop policy if exists %I on storage.objects; create policy %I on storage.objects for insert with check (bucket_id = %L and auth.role() = ''authenticated'');',
      'upload_' || b, 'upload_' || b, b
    );
    execute format(
      'drop policy if exists %I on storage.objects; create policy %I on storage.objects for update with check (bucket_id = %L and auth.role() = ''authenticated'');',
      'update_' || b, 'update_' || b, b
    );
  end loop;
end $$;
