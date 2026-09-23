import { useAuth } from "@/lib/auth-context";
import { SectionTitle } from "@/components/ui";
import { ProfileForm } from "@/components/ProfileForm";

export default function Profile() {
  const { profile, loading } = useAuth();
  if (loading || !profile) return <p className="py-16 text-center font-sans text-sm text-gray-500">加载中…</p>;

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-md mx-auto">
      <SectionTitle number="1" title="修改个人信息" className="mb-6" />
      <ProfileForm initialName={profile.name} initialUsername={profile.username} />
    </div>
  );
}
