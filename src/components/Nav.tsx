import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { blueLinkClass } from "@/components/ui";

export function Nav() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const link = blueLinkClass();

  async function onSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <nav className="bg-[#fffde7] text-[#00897b] border-b-2 border-[#00897b]/20 px-4 md:px-8 lg:px-12 sticky top-0 z-20">
      <div className="flex items-center justify-between max-w-6xl mx-auto gap-4 md:gap-6 py-3">
        <Link
          to="/"
          className="font-bold tracking-tight text-xl md:text-2xl text-[#00897b] hover:text-[#ff6f61] transition-colors"
        >
          作业提交平台
        </Link>

        <div className="flex items-center gap-4 md:gap-6 font-sans text-xs md:text-sm">
          {profile ? (
            <>
              <span className="text-gray-600">
                {profile.name}
                <span className="ml-1 text-[#ff6f61]">
                  （{profile.role === "teacher" ? "教师" : "学生"}）
                </span>
              </span>
              <Link
                to={profile.role === "teacher" ? "/teacher" : "/student"}
                className={link}
              >
                工作台
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="font-sans text-xs md:text-sm text-[#00897b] hover:text-[#ff6f61] hover:underline underline-offset-2"
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={link}>
                登录
              </Link>
              <Link to="/register" className={link}>
                学生注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
