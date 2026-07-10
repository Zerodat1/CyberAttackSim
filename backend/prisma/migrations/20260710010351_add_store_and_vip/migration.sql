-- CreateEnum
CREATE TYPE "StoreItemCategory" AS ENUM ('FRAME', 'ENTRANCE', 'BUBBLE', 'MIC_EFFECT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeBubbleId" TEXT,
ADD COLUMN     "activeEntranceId" TEXT,
ADD COLUMN     "activeFrameId" TEXT,
ADD COLUMN     "activeMicEffectId" TEXT,
ADD COLUMN     "vipExpiresAt" TIMESTAMP(3),
ADD COLUMN     "vipLevel" INTEGER;

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" TEXT NOT NULL,
    "category" "StoreItemCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "priceGold" DECIMAL(14,2) NOT NULL,
    "durationDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStoreItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeItemId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserStoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VipLevel" (
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "priceGold" DECIMAL(14,2) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "badgeColor" TEXT NOT NULL,
    "frameColorHex" TEXT NOT NULL,
    "frameEmoji" TEXT NOT NULL,
    "entranceText" TEXT NOT NULL,
    "entranceColorHex" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipLevel_pkey" PRIMARY KEY ("level")
);

-- CreateIndex
CREATE INDEX "StoreItem_category_isActive_idx" ON "StoreItem"("category", "isActive");

-- CreateIndex
CREATE INDEX "UserStoreItem_userId_idx" ON "UserStoreItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStoreItem_userId_storeItemId_key" ON "UserStoreItem"("userId", "storeItemId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeFrameId_fkey" FOREIGN KEY ("activeFrameId") REFERENCES "StoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeEntranceId_fkey" FOREIGN KEY ("activeEntranceId") REFERENCES "StoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeBubbleId_fkey" FOREIGN KEY ("activeBubbleId") REFERENCES "StoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeMicEffectId_fkey" FOREIGN KEY ("activeMicEffectId") REFERENCES "StoreItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoreItem" ADD CONSTRAINT "UserStoreItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStoreItem" ADD CONSTRAINT "UserStoreItem_storeItemId_fkey" FOREIGN KEY ("storeItemId") REFERENCES "StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
