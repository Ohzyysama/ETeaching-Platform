import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PaperButton, blueLinkClass } from "@/components/ui";

export default async function Home() {
  const user = await getSession();
  if (user) {
    redirect(user.role === "TEACHER" ? "/teacher" : "/student");
  }

  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center px-4 py-16 md:py-28">
      {/* tropical decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-64 w-64 rounded-full bg-[#00897b] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[#ff6f61] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-[#ffc107] opacity-20 blur-3xl" />

      <div className="relative max-w-2xl w-full text-center">
        <p className="font-sans text-sm text-[#00897b]">在线教学 · 作业提交</p>
        <h1 className="font-bold tracking-tight text-4xl md:text-6xl text-[#00897b] mt-2">
          作业提交平台
        </h1>
        <p className="font-sans text-gray-600 text-sm md:text-base mt-2">
          教师发布作业，学生在线提交，自动统计与批改
        </p>

        <div className="mx-auto max-w-xl mt-10 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,137,123,0.1)] p-5 md:p-6 text-left">
          <p className="font-bold text-sm text-[#00897b]">平台简介</p>
          <p className="font-sans text-sm md:text-base leading-relaxed text-gray-600 mt-2">
            平台为教师提供作业发布（可配图、按班级选学生、设置起止时间）与提交情况统计；
            为学生提供拍照上传与迟交标记；逾期未交自动提醒。
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-4 mt-10">
          <Link href="/login">
            <PaperButton variant="primary">登录</PaperButton>
          </Link>
          <Link href="/register">
            <PaperButton variant="secondary">学生注册</PaperButton>
          </Link>
        </div>

        <p className="font-sans text-sm text-gray-500 mt-8">
          教师账号由管理员预先注册；学生可{" "}
          <Link href="/register" className={blueLinkClass()}>
            自助注册
          </Link>
          。
        </p>
      </div>
    </div>
  );
}
