# 作业提交平台（ETeaching Platform）

线上教学作业提交与批改平台。教师发布作业、学生拍照提交，系统自动统计提交情况、标记迟交，支持评语与涂鸦批改。

前端为纯静态站点（部署在 GitHub Pages），后端使用 Supabase（数据库 + 登录 + 存储）。

## 功能

- **登录**：用户名 + 密码登录（支持汉字用户名）；教师由管理员开通，学生自助注册。
- **班级**：教师增删班级（至少保留 1 个）；学生注册时选择加入一个班级；各班事务独立。
- **管理学生**：教师可彻底删除学生账号（连登录账号一起删，用户名释放）。
- **发布作业**：可配图、按班级选学生（支持全选）、设置起止时间。
- **提交作业**：学生拍照上传（可多张）+ 备注；迟交自动标红。
- **批改**：分数（仅教师可改）、文字/图片评语、在提交照片上鼠标涂鸦批改。
- **统计**：每份作业的提交列表 + 图表；逾期未交提醒。
- **界面**：热带天堂风（Tropical Paradise）。

## 技术栈

- 前端：Vite + React + TypeScript + React Router（Hash 路由）+ Tailwind CSS 4
- 后端：Supabase（Postgres + Auth + Storage + RLS 行级安全）

## 一、Supabase 配置

1. 在 [supabase.com](https://supabase.com) 新建一个项目（选离你近的区域）。
2. **建表**：打开 Supabase 控制台 → SQL Editor → 新建查询，粘贴 [supabase/schema.sql](supabase/schema.sql) 整段执行。
3. **关闭邮箱确认**：Authentication → Providers → Email → 把「Confirm email」**关掉**（否则学生注册后要收确认邮件才能登录）。
4. **获取密钥**：Project Settings → API，复制 **Project URL** 和 **anon public key**。

## 二、本地运行

```bash
npm install

# 复制环境变量文件，填入你的 Supabase 值
cp .env.example .env.local   # 编辑 .env.local，填 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

npm run dev    # http://localhost:5173
```

## 三、部署到 GitHub Pages

1. 把代码推到 GitHub 仓库。
2. 仓库 Settings → Secrets and variables → Actions，新增两个 secret：
   - `VITE_SUPABASE_URL` = 你的 Project URL
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon key
3. 仓库 Settings → Pages → Source 选 **GitHub Actions**。
4. 推送 `main` 分支，`.github/workflows/deploy.yml` 会自动构建并部署。
5. 部署完成后访问 `https://<用户名>.github.io/<仓库名>/`。

> anon key 是公开的（前端直接用）；`service_role` key 有管理员权限，**绝不能**放进前端或 secret 里。

## 四、开通教师账号

系统里教师的角色存在 `profiles.role` 字段（默认 `student`）。开通教师有两种方式：

1. 先让学生正常注册，然后在 Supabase 控制台 → Table Editor → `profiles` 表，把该用户的 `role` 改成 `teacher`。
2. 或在 SQL Editor 执行：
   ```sql
   update public.profiles set role = 'teacher', class_id = null where username = '要设为老师的用户名';
   ```

## 五、彻底删除学生（Edge Function）

「管理学生」里的删除会**连登录账号一起删掉**：用户名随即释放、可以重新注册，该生的提交记录也一并清除。删 auth 用户需要 `service_role` 权限，前端只有 anon key，所以这一步放在 Edge Function [supabase/functions/delete-student](supabase/functions/delete-student/index.ts) 里，用登录用户的身份调用、由函数校验「必须是教师」。

**部署一次即可**（改代码后需重新部署）：

```bash
# 1. 安装 Supabase CLI（任选其一）
npm install -g supabase          # 或用 scoop/brew 安装

# 2. 登录并关联到你的项目（Project Settings → General → Reference ID 即项目 ref）
supabase login
supabase link --project-ref <你的-project-ref>

# 3. 部署函数（会自动注入 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY，无需手动配）
supabase functions deploy delete-student
```

> `service_role` key 由 Supabase 自动注入函数的运行环境，**不要**写进代码或前端的 `.env.local`。
> 函数默认开启 `verify_jwt`，未登录的请求会被平台直接拒绝；教师身份的校验在函数内部完成。
> 不部署也能正常使用其它功能，只是点「删除」时会提示找不到云函数。

## 目录结构

```
src/
  pages/                # 路由页面（登录 / 注册 / 教师 / 学生）
  components/           # UI 组件（表单、表格、图表、涂鸦等）
  lib/
    auth-context.tsx    # 登录状态上下文
    supabase/           # Supabase 客户端、数据访问、存储上传
  main.tsx / App.tsx    # 入口 + HashRouter 路由
supabase/
  schema.sql            # 建表 + RLS + 存储桶（一次性执行）
  functions/
    delete-student/     # Edge Function：彻底删除学生账号（需 supabase functions deploy）
.github/workflows/
  deploy.yml            # 自动部署到 GitHub Pages
```
