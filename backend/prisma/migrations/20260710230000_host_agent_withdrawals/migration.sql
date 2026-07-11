-- CreateEnum
CREATE TYPE "HostAgentWithdrawalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PAID', 'COMPLETED', 'REJECTED', 'CANCELLED', 'REFUNDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_PAID';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_WITHDRAWAL_REFUNDED';

-- AlterTable
ALTER TABLE "RechargeAgent" ADD COLUMN     "diamondBalance" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "HostAgentWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "rechargeAgentId" TEXT NOT NULL,
    "diamondsAmount" DECIMAL(14,2) NOT NULL,
    "usdAmount" DECIMAL(10,2) NOT NULL,
    "payoutMethod" TEXT NOT NULL,
    "payoutAccount" TEXT NOT NULL,
    "status" "HostAgentWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "paymentReference" TEXT,
    "rejectionReason" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostAgentWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HostAgentWithdrawalRequest_hostId_status_idx" ON "HostAgentWithdrawalRequest"("hostId", "status");

-- CreateIndex
CREATE INDEX "HostAgentWithdrawalRequest_rechargeAgentId_status_idx" ON "HostAgentWithdrawalRequest"("rechargeAgentId", "status");

-- CreateIndex
CREATE INDEX "HostAgentWithdrawalRequest_status_expiresAt_idx" ON "HostAgentWithdrawalRequest"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "HostAgentWithdrawalRequest" ADD CONSTRAINT "HostAgentWithdrawalRequest_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostAgentWithdrawalRequest" ADD CONSTRAINT "HostAgentWithdrawalRequest_rechargeAgentId_fkey" FOREIGN KEY ("rechargeAgentId") REFERENCES "RechargeAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
