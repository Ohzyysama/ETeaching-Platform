import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const teacherUsername = process.env.TEACHER_USERNAME ?? "teacher";
  const teacherPassword = process.env.TEACHER_PASSWORD ?? "teacher123";
  const teacherName = process.env.TEACHER_NAME ?? "示例教师";

  const teacher = await prisma.user.upsert({
    where: { username: teacherUsername },
    update: { name: teacherName, role: "TEACHER" },
    create: {
      username: teacherUsername,
      name: teacherName,
      passwordHash: bcrypt.hashSync(teacherPassword, 10),
      role: "TEACHER",
    },
  });
  console.log(`[seed] 教师账号就绪: ${teacher.username} / ${teacherPassword}`);

  // 初始 1 个班级
  const defaultClass = await prisma.class.upsert({
    where: { name: "1班" },
    update: {},
    create: { name: "1班" },
  });
  console.log(`[seed] 初始班级就绪: ${defaultClass.name}`);

  const sampleStudents = [
    { username: "student1", name: "张三" },
    { username: "student2", name: "李四" },
    { username: "student3", name: "王五" },
  ];
  for (const s of sampleStudents) {
    await prisma.user.upsert({
      where: { username: s.username },
      update: { classId: defaultClass.id },
      create: {
        username: s.username,
        name: s.name,
        passwordHash: bcrypt.hashSync("student123", 10),
        role: "STUDENT",
        classId: defaultClass.id,
      },
    });
  }
  console.log("[seed] 示例学生账号就绪（密码 student123，已加入 1班）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
