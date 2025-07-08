import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const testUsers = [
  {
    username: "test",
    password: "password",
  },
];

async function main() {
  console.log("Starting database seed...");

  console.log("Clearing existing data...");
  await prisma.taskExecution.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating test users...");
  const withHashedPassword = await Promise.all(
    testUsers.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    })),
  );

  await prisma.user.createMany({
    data: withHashedPassword,
  });

  console.log("Created test users:");
  for (const user of withHashedPassword) {
    console.log(`- ${user.username}: ${user.password}`);
  }

  console.log("Database seed completed successfully!");
  console.log("\nYou can now use these credentials with:");
  console.log("- POST /auth/login (for JWT token)");
  console.log("- POST /auth/register (to create new users)");
  console.log("- GET /auth/profile (with JWT Bearer token)");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
