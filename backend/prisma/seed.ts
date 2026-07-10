import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.commissionSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  await prisma.hostEconomySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  const existingPackages = await prisma.rechargePackage.count();
  if (existingPackages === 0) {
    const packages: { priceUsd: number; baseGold: number; bonusPercent: number; sortOrder: number }[] = [
      { priceUsd: 1, baseGold: 10_000, bonusPercent: 0, sortOrder: 1 },
      { priceUsd: 10, baseGold: 100_000, bonusPercent: 5, sortOrder: 2 },
      { priceUsd: 50, baseGold: 500_000, bonusPercent: 10, sortOrder: 3 },
      { priceUsd: 100, baseGold: 1_000_000, bonusPercent: 15, sortOrder: 4 },
      { priceUsd: 500, baseGold: 5_000_000, bonusPercent: 20, sortOrder: 5 },
    ];
    await prisma.rechargePackage.createMany({
      data: packages.map((p) => ({
        ...p,
        totalGold: p.baseGold * (1 + p.bonusPercent / 100),
      })),
    });
  }

  const existingTiers = await prisma.hostTargetTier.count();
  if (existingTiers === 0) {
    await prisma.hostTargetTier.createMany({
      data: [
        { thresholdDiamonds: 1_000_000, salaryUsd: 50, sortOrder: 1 },
        { thresholdDiamonds: 3_000_000, salaryUsd: 150, sortOrder: 2 },
        { thresholdDiamonds: 6_000_000, salaryUsd: 350, sortOrder: 3 },
        { thresholdDiamonds: 10_000_000, salaryUsd: 650, sortOrder: 4 },
        { thresholdDiamonds: 20_000_000, salaryUsd: 1500, sortOrder: 5 },
      ],
    });
  }

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

  const vipLevels: {
    level: number;
    name: string;
    priceGold: number;
    durationDays: number;
    badgeColor: string;
    frameColorHex: string;
    frameEmoji: string;
    entranceText: string;
    entranceColorHex: string;
  }[] = [
    { level: 1, name: "VIP 1", priceGold: 500, durationDays: 30, badgeColor: "#9e9e9e", frameColorHex: "#9e9e9e", frameEmoji: "⭐", entranceText: "دخل عضو VIP", entranceColorHex: "#9e9e9e" },
    { level: 2, name: "VIP 2", priceGold: 1000, durationDays: 30, badgeColor: "#4fc3f7", frameColorHex: "#4fc3f7", frameEmoji: "⭐", entranceText: "دخل عضو VIP 2", entranceColorHex: "#4fc3f7" },
    { level: 3, name: "VIP 3", priceGold: 2000, durationDays: 30, badgeColor: "#7c6cf9", frameColorHex: "#7c6cf9", frameEmoji: "💫", entranceText: "دخل عضو VIP 3", entranceColorHex: "#7c6cf9" },
    { level: 4, name: "VIP 4", priceGold: 4000, durationDays: 30, badgeColor: "#00cec9", frameColorHex: "#00cec9", frameEmoji: "💎", entranceText: "🎉 دخل عضو VIP 4", entranceColorHex: "#00cec9" },
    { level: 5, name: "VIP 5", priceGold: 8000, durationDays: 30, badgeColor: "#e17055", frameColorHex: "#e17055", frameEmoji: "🔥", entranceText: "🔥 دخل عضو VIP 5", entranceColorHex: "#e17055" },
    { level: 6, name: "VIP 6", priceGold: 16000, durationDays: 30, badgeColor: "#e84393", frameColorHex: "#e84393", frameEmoji: "👑", entranceText: "👑 دخل عضو VIP 6", entranceColorHex: "#e84393" },
    { level: 7, name: "VIP 7", priceGold: 32000, durationDays: 30, badgeColor: "#ffd700", frameColorHex: "#ffd700", frameEmoji: "👑", entranceText: "🎉👑 دخل ملك الغرفة VIP 7", entranceColorHex: "#ffd700" },
  ];

  for (const vip of vipLevels) {
    await prisma.vipLevel.upsert({
      where: { level: vip.level },
      update: {},
      create: vip,
    });
  }

  const existingStoreItems = await prisma.storeItem.count();
  if (existingStoreItems === 0) {
    await prisma.storeItem.createMany({
      data: [
        { category: "FRAME", name: "إطار ذهبي", emoji: "🥇", colorHex: "#f5c451", priceGold: 2000, durationDays: null },
        { category: "FRAME", name: "إطار نجمة", emoji: "⭐", colorHex: "#7c6cf9", priceGold: 1000, durationDays: 30 },
        { category: "FRAME", name: "إطار قلب", emoji: "❤️", colorHex: "#ff3d9a", priceGold: 800, durationDays: 30 },
        { category: "ENTRANCE", name: "دخول ملكي", emoji: "👑", colorHex: "#ffd700", priceGold: 3000, durationDays: 30 },
        { category: "ENTRANCE", name: "دخول ناري", emoji: "🔥", colorHex: "#ff5722", priceGold: 1500, durationDays: 30 },
        { category: "ENTRANCE", name: "دخول نجمي", emoji: "✨", colorHex: "#00cec9", priceGold: 1000, durationDays: 30 },
        { category: "BUBBLE", name: "فقاعة وردية", emoji: "🌸", colorHex: "#ff3d9a", priceGold: 500, durationDays: 30 },
        { category: "BUBBLE", name: "فقاعة ذهبية", emoji: "✨", colorHex: "#f5c451", priceGold: 800, durationDays: 30 },
        { category: "BUBBLE", name: "فقاعة زرقاء", emoji: "💧", colorHex: "#0984e3", priceGold: 500, durationDays: 30 },
        { category: "MIC_EFFECT", name: "توهج أزرق", emoji: "🔵", colorHex: "#0984e3", priceGold: 700, durationDays: 30 },
        { category: "MIC_EFFECT", name: "توهج ناري", emoji: "🔥", colorHex: "#e17055", priceGold: 900, durationDays: 30 },
        { category: "MIC_EFFECT", name: "توهج قوس قزح", emoji: "🌈", colorHex: "#7c6cf9", priceGold: 1500, durationDays: 30 },
      ],
    });
  }

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
