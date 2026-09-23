import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SectionTitle } from "@/components/ui";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "STUDENT") redirect("/teacher");

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-md mx-auto">
      <SectionTitle number="1" title="修改个人信息" className="mb-6" />
      <ProfileForm initialName={user.name} initialUsername={user.username} />
    </div>
  );
}
