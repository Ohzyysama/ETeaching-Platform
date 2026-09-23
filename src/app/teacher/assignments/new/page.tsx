import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SectionTitle } from "@/components/ui";
import { AssignmentForm } from "@/components/AssignmentForm";

export default async function NewAssignmentPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const [classes, students] = await Promise.all([
    prisma.class.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, username: true, classId: true },
    }),
  ]);

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <SectionTitle number="1" title="发布作业" className="mb-6" />
      <AssignmentForm classes={classes} students={students} />
    </div>
  );
}
