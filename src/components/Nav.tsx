import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { blueLinkClass } from "@/components/ui";

export async function Nav() {
  const user = await getSession();
  const link = blueLinkClass();

  return (
    <nav className="bg-[#fffde7] text-[#00897b] border-b-2 border-[#00897b]/20 px-4 md:px-8 lg:px-12 sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-6xl mx-auto gap-4 md:gap-6 py-3">
        <Link
          href="/"
          className="font-bold tracking-tight text-xl md:text-2xl text-[#00897b] hover:text-[#ff6f61] transition-colors"
        >
          作业提交平台
        </Link>

        <div className="flex items-center gap-4 md:gap-6 font-sans text-xs md:text-sm">
          {user ? (
            <>
              <span className="text-gray-600">
                {user.name}
                <span className="ml-1 text-[#ff6f61]">
                  （{user.role === "TEACHER" ? "教师" : "学生"}）
                </span>
              </span>
              <Link
                href={user.role === "TEACHER" ? "/teacher" : "/student"}
                className={link}
              >
                工作台
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="font-sans text-xs md:text-sm text-[#00897b] hover:text-[#ff6f61] hover:underline underline-offset-2"
                >
                  退出登录
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={link}>
                登录
              </Link>
              <Link href="/register" className={link}>
                学生注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
