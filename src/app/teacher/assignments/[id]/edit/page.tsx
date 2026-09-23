import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toLocalInputValue } from "@/lib/format";
import { parseImages } from "@/lib/json";
import { SectionTitle } from "@/components/ui";
import { AssignmentForm } from "@/components/AssignmentForm";

export default async function EditAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.role !== "TEACHER") redirect("/student");

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { students: { select: { studentId: true } } },
  });
  if (!assignment || assignment.createdById !== user.id) notFound();

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

  const initial = {
    title: assignment.title,
    description: assignment.description,
    startAt: toLocalInputValue(assignment.startAt),
    dueAt: toLocalInputValue(assignment.dueAt),
    classId: assignment.classId,
    studentIds: assignment.students.map((s) => s.studentId),
    images: parseImages(assignment.images),
  };

  return (
    <div className="px-6 md:px-8 py-8 md:py-10 max-w-3xl mx-auto">
      <SectionTitle number="1" title="修改作业" className="mb-6" />
      <AssignmentForm
        classes={classes}
        students={students}
        assignmentId={id}
        initial={initial}
      />
    </div>
  );
}
