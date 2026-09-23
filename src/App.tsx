import { useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabaseConfigured } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import ClassesPage from "@/pages/teacher/Classes";
import StudentsPage from "@/pages/teacher/Students";
import NewAssignment from "@/pages/teacher/NewAssignment";
import AssignmentStats from "@/pages/teacher/AssignmentStats";
import EditAssignment from "@/pages/teacher/EditAssignment";
import SubmissionView from "@/pages/teacher/SubmissionView";
import StudentDashboard from "@/pages/student/Dashboard";
import ProfilePage from "@/pages/student/Profile";
import StudentAssignment from "@/pages/student/Assignment";

function RequireAuth({
  role,
  children,
}: {
  role?: "teacher" | "student";
  children: ReactNode;
}) {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate("/login", { replace: true });
      return;
    }
    if (role && profile.role !== role) {
      navigate(profile.role === "teacher" ? "/teacher" : "/student", {
        replace: true,
      });
    }
  }, [loading, profile, role, navigate]);

  if (loading) {
    return (
      <div className="py-24 text-center font-sans text-sm text-gray-500">
        加载中…
      </div>
    );
  }
  if (!profile || (role && profile.role !== role)) return null;
  return <>{children}</>;
}

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="font-bold text-xl text-[#ff6f61]">缺少 Supabase 配置</h1>
        <p className="font-sans text-sm text-gray-600 mt-3 max-w-md leading-relaxed">
          请设置环境变量 <code className="font-mono text-xs">VITE_SUPABASE_URL</code> 和{" "}
          <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>。
          <br />
          本地：写入 <code className="font-mono text-xs">.env.local</code>；
          <br />
          部署：GitHub 仓库 Settings → Secrets and variables → Actions 新增这两个 secret。
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/teacher"
            element={
              <RequireAuth role="teacher">
                <TeacherDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/classes"
            element={
              <RequireAuth role="teacher">
                <ClassesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <RequireAuth role="teacher">
                <StudentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/assignments/new"
            element={
              <RequireAuth role="teacher">
                <NewAssignment />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/assignments/:id"
            element={
              <RequireAuth role="teacher">
                <AssignmentStats />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/assignments/:id/edit"
            element={
              <RequireAuth role="teacher">
                <EditAssignment />
              </RequireAuth>
            }
          />
          <Route
            path="/teacher/submissions/:submissionId"
            element={
              <RequireAuth role="teacher">
                <SubmissionView />
              </RequireAuth>
            }
          />

          <Route
            path="/student"
            element={
              <RequireAuth role="student">
                <StudentDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/student/profile"
            element={
              <RequireAuth role="student">
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/student/assignments/:id"
            element={
              <RequireAuth role="student">
                <StudentAssignment />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-white text-gray-600 py-8 px-4 md:px-8 border-t-2 border-[#00897b]/20">
        <div className="max-w-6xl mx-auto font-sans text-sm text-center">
          作业提交平台 · 教师发布作业，学生在线提交
        </div>
      </footer>
    </div>
  );
}
