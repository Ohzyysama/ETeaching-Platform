import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "@/lib/supabase/auth";
import { listClasses } from "@/lib/supabase/db";
import type { Class } from "@/lib/supabase/types";
import { PaperButton, Field, inputClass, blueLinkClass } from "@/components/ui";

export function RegisterForm() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    listClasses().then(setClasses).catch(() => setClasses([]));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("两次输入的密码不一致。");
      return;
    }
    if (!classId) {
      setError("请选择要加入的班级。");
      return;
    }

    setPending(true);
    const res = await signUp({ email, name, username, password, classId });
    if (!res.ok) {
      setError(res.error ?? "注册失败。");
      setPending(false);
      return;
    }
    navigate("/student");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <p className="font-sans text-sm text-[#ff6f61]">{error}</p> : null}

      <Field label="姓名">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
      </Field>

      <Field label="邮箱" hint="用于登录，作为账号">
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </Field>

      <Field label="用户名" hint="展示用，支持汉字，不能与他人重复">
        <input
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </Field>

      <Field label="密码" hint="至少 6 位">
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>

      <Field label="确认密码">
        <input
          className={inputClass}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
      </Field>

      <Field label="选择班级">
        <select
          className={inputClass}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          required
        >
          <option value="" disabled>
            请选择要加入的班级
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <PaperButton type="submit" variant="primary" disabled={pending} className="w-full">
        {pending ? "注册中…" : "注册"}
      </PaperButton>

      <p className="font-sans text-sm text-gray-500">
        已有账号？{" "}
        <Link to="/login" className={blueLinkClass()}>
          去登录
        </Link>
      </p>
    </form>
  );
}
