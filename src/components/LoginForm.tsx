import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signIn, getCurrentProfile } from "@/lib/supabase/auth";
import { PaperButton, Field, inputClass, blueLinkClass } from "@/components/ui";

export function LoginForm() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn({ username, password });
    if (!res.ok) {
      setError(res.error ?? "登录失败。");
      setPending(false);
      return;
    }
    const profile = await getCurrentProfile();
    navigate(profile?.role === "teacher" ? "/teacher" : "/student");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}

      <Field label="用户名">
        <input
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </Field>

      <Field label="密码">
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </Field>

      <PaperButton type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? "登录中…" : "登录"}
      </PaperButton>

      <p className="font-sans text-sm text-gray-500">
        还没有账号？{" "}
        <Link to="/register" className={blueLinkClass()}>
          学生自助注册
        </Link>
      </p>
    </form>
  );
}
