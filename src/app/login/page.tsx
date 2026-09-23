import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(user.role === "TEACHER" ? "/teacher" : "/student");

  return (
    <div className="px-6 py-12 md:py-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">
            登录
          </h1>
          <p className="font-sans text-sm text-gray-500 mt-1">
            教师与学生均可登录
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
