import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { LoginForm } from "@/components/LoginForm";

export default function Login() {
  const { profile, loading } = useAuth();
  if (!loading && profile) {
    return <Navigate to={profile.role === "teacher" ? "/teacher" : "/student"} replace />;
  }

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
