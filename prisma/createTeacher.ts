import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const i = process.argv.findIndex((a) => a === `--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = arg("name") ?? "教师";
  const username = arg("username");
  const password = arg("password");

  if (!username || !password) {
    console.error(
      "用法: npm run create-teacher -- --name 王老师 --username teacher2 --password 123456"
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.error(`用户名 ${username} 已存在，请换一个。`);
    process.exit(1);
  }

  await prisma.user.create({
    data: {
      username,
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      role: "TEACHER",
    },
  });
  console.log(`教师已创建: ${name} (${username})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
