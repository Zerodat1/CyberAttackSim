import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.commissionSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const ownerEmail = process.env.SEED_OWNER_EMAIL || "owner@code.app";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD || "ChangeMe123!";

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      username: "owner",
      fullName: "Platform Owner",
      passwordHash: await argon2.hash(ownerPassword),
      globalRole: "OWNER",
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Owner account: ${ownerEmail}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
