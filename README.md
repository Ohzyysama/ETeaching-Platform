# 作业提交平台（ETeaching Platform）

一个面向线上教学的作业提交与批改平台。教师发布作业、学生在线提交，系统自动统计提交情况、标记迟交，并提醒逾期未交的学生。

## 功能

- **登录**：所有人需登录；教师由管理员预先注册，学生自助注册。
- **班级**：教师可设置班级号、增删班级（至少保留 1 个）；学生注册时下拉选择加入一个班级；各班级事务相互独立。初始含 1 个班级。
- **发布作业**：教师发布作业（可配图），先选班级再勾选该班内学生（支持全选），可设置起止时间。
- **提交作业**：学生以拍照上传为主（可多张、带预览），可附一句备注；迟交自动标红。
- **迟交提醒**：到截止时间仍未交的学生会在站内被提醒（逾期未交高亮），仍可补交但会被标记为迟交。
- **提交统计**：每份作业有提交情况列表（姓名 / 是否提交 / 提交时间 / 分数）与图表；迟交的提交时间标红；分数默认 0，仅教师可编辑。
- **修改规则**：教师可修改作业；学生在教师批改前且截止时间前可修改自己的提交。
- **界面**：热带天堂风（Tropical Paradise）——蓝绿 #00897b 主色 + 暖黄底色、圆润卡片与按钮、温暖彩色阴影、衬线→无衬线。

## 技术栈

- [Next.js 16](https://nextjs.org)（App Router + Server Actions）+ React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com)
- [Prisma](https://www.prisma.io) + SQLite（默认，零配置；可切换 Postgres/MySQL）
- bcryptjs 密码哈希 + httpOnly Cookie 会话
- 图片 / 附件以 base64 存库，不依赖对象存储

## 本地运行

环境要求：Node.js 20.9+（推荐 22）。

> Windows 提示：下面命令在 PowerShell 5.1 里请**逐行**执行（PowerShell 5.1 不支持 `&&`）；在 Git Bash 或 PowerShell 7+ 中可用 `&&` 连接。

```bash
npm install          # 已配置国内镜像 registry.npmmirror.com
npm run db:push      # 初始化 SQLite 数据库
npm run db:seed      # 创建默认教师 + 示例学生
npm run dev          # 启动开发服务器 http://localhost:3000
```

默认账号（仅用于本地测试，上线后请修改）：

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | `teacher` | `teacher123` |
| 学生 | `student1` / `student2` / `student3` | `student123` |

### 添加教师账号

```bash
npm run create-teacher -- --name 王老师 --username teacher2 --password 123456
```

学生无需管理员操作，在注册页自助注册即可。

## 部署到国内服务器

代码托管在 GitHub，运行时部署到国内云服务器（阿里云 / 腾讯云轻量应用服务器），国内直连、无需备案外的额外服务。

在服务器上（Node 环境）：

```bash
# 1. 拉取代码
git clone <你的仓库地址>
cd ETeaching-Platform

# 2. 安装依赖（国内服务器可用 npm 或淘宝镜像）
npm install

# 3. 初始化数据库 + 创建管理员教师账号
npm run db:push
npm run db:seed
npm run create-teacher -- --name 管理员 --username admin --password <强密码>

# 4. 构建并启动
npm run build
npm start        # 默认 3000 端口，可用 Nginx 反向代理 + PM2 守护
```

数据全部存放在项目内的 `prisma/dev.db`（SQLite 单文件）与 base64 图片/附件里，备份只需复制该文件。推荐用 PM2 常驻：

```bash
npm i -g pm2
pm2 start npm --name eteaching -- start
pm2 save && pm2 startup
```

## 关于 exFAT 磁盘（本地开发提示）

如果你的项目目录在 **exFAT 格式的移动硬盘**上（不支持的符号链接/连接点），本项目已内置兼容处理：

- `scripts/patch-fs.cjs` 修正了 exFAT 上 `fs.readlink` 的异常返回；
- `npm run dev / build / start` 通过 `scripts/next.cjs` 包装并自动加载该补丁；
- 构建使用 webpack（`--webpack`），避免 Turbopack 在 exFAT 上创建连接点失败。

部署到服务器（Linux ext4 / Windows NTFS）时这些都不需要，属于纯本地开发兼容。

## 切换数据库（可选）

默认 SQLite 适合小班教学与单服务器部署。若需要 Postgres/MySQL：

1. 修改 `prisma/schema.prisma` 中 `datasource db.provider` 为 `postgresql`（或 `mysql`）；
2. 修改 `.env` 的 `DATABASE_URL`；
3. 运行 `npm run db:push` 重新建表。

其余代码无需改动。

## 目录结构

```
src/
  app/                    # 页面（登录 / 注册 / 教师 / 学生）
  components/             # UI 组件（表单、表格、图表等）
  lib/
    actions/              # Server Actions（登录、发布、提交、批改）
    auth.ts               # 会话与 Cookie
    status.ts             # 迟交 / 提交状态判断
    validation.ts         # zod 校验
prisma/
  schema.prisma           # 数据模型
  seed.ts                 # 初始化账号
  createTeacher.ts        # 命令行添加教师
scripts/
  patch-fs.cjs            # exFAT 文件系统补丁
  next.cjs                # Next CLI 包装
```
