import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // 清空所有数据
  console.log("Clearing existing data...");
  await prisma.taskExecution.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();

  // 创建测试用户
  console.log("Creating test user...");
  const username = "test";
  const password = "password";
  const hashedPassword = await bcrypt.hash("password", 10);
  const testUser = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  console.log("Created test user:", {
    id: testUser.id,
    username: testUser.username,
    createdAt: testUser.createdAt,
  });

  console.log("Database seed completed successfully!");
  console.log("\nTest credentials:");
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
