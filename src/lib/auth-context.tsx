import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase/client";
import type { Profile } from "./supabase/types";

interface AuthCtx {
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  profile: null,
  loading: true,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // refresh 会被多处并发调用（登录事件、注册后、加入班级后）。晚发出的那次不代表
  // 数据更新，所以用序号只认最后一次发起的结果，否则先发起的旧数据可能后到并覆盖新数据。
  const seqRef = useRef(0);

  const refresh = useCallback(async () => {
    const seq = ++seqRef.current;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (seq !== seqRef.current) return;
    if (!user) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (seq !== seqRef.current) return;
    const p = (data as Profile) ?? null;
    // 被删除的学生：立即登出
    if (p?.deleted_at) {
      await supabase.auth.signOut();
      setProfile(null);
      return;
    }
    setProfile(p);
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <Ctx.Provider value={{ profile, loading, refresh, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
