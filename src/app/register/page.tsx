import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage() {
  const user = await getSession();
  if (user) redirect(user.role === "TEACHER" ? "/teacher" : "/student");

  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="px-6 py-12 md:py-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-sans tracking-tight text-2xl md:text-3xl text-[#00897b]">
            学生注册
          </h1>
          <p className="font-sans text-sm text-gray-500 mt-1">
            注册后选择加入一个班级
          </p>
        </div>
        <RegisterForm classes={classes} />
      </div>
    </div>
  );
}
