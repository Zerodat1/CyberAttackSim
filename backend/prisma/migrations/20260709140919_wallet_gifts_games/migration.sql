-- CreateEnum
CREATE TYPE "GiftType" AS ENUM ('STATIC', 'LUCKY');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('DICE_GUESS');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'GIFT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'GIFT_LUCKY_WIN';
ALTER TYPE "NotificationType" ADD VALUE 'GAME_WIN';

-- AlterTable
ALTER TABLE "CommissionSettings" ADD COLUMN     "goldPerCurrencyUnit" DECIMAL(10,2) NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "UserWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goldBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "diamondBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "type" "GiftType" NOT NULL DEFAULT 'STATIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "diamondShareRate" DECIMAL(5,2) NOT NULL DEFAULT 50.0,
    "luckyOdds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftSend" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "roomId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalGoldCost" DECIMAL(14,2) NOT NULL,
    "diamondsAwarded" DECIMAL(14,2) NOT NULL,
    "isLucky" BOOLEAN NOT NULL DEFAULT false,
    "luckyMultiplier" DECIMAL(6,2),
    "luckyPayoutGold" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftSend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL DEFAULT 'DICE_GUESS',
    "playerId" TEXT NOT NULL,
    "roomId" TEXT,
    "betAmount" DECIMAL(14,2) NOT NULL,
    "choice" INTEGER NOT NULL,
    "rolledNumber" INTEGER NOT NULL,
    "multiplier" DECIMAL(6,2) NOT NULL,
    "payout" DECIMAL(14,2) NOT NULL,
    "isWin" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSettings" (
    "id" TEXT NOT NULL DEFAULT 'dice_guess',
    "minBet" DECIMAL(14,2) NOT NULL DEFAULT 10,
    "maxBet" DECIMAL(14,2) NOT NULL DEFAULT 5000,
    "winMultiplier" DECIMAL(6,2) NOT NULL DEFAULT 9.0,
    "dailyBetLimit" DECIMAL(14,2) NOT NULL DEFAULT 20000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "UserWallet"("userId");

-- CreateIndex
CREATE INDEX "GiftSend_recipientId_createdAt_idx" ON "GiftSend"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "GiftSend_senderId_createdAt_idx" ON "GiftSend"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "GiftSend_roomId_createdAt_idx" ON "GiftSend"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "GameRound_playerId_createdAt_idx" ON "GameRound"("playerId", "createdAt");

-- CreateIndex
CREATE INDEX "GameRound_roomId_createdAt_idx" ON "GameRound"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSend" ADD CONSTRAINT "GiftSend_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSend" ADD CONSTRAINT "GiftSend_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSend" ADD CONSTRAINT "GiftSend_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftSend" ADD CONSTRAINT "GiftSend_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
