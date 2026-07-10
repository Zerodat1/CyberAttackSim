-- AlterTable
ALTER TABLE "HostAgency" ADD COLUMN     "commissionBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthKey" TEXT,
ADD COLUMN     "monthlyDiamonds" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyTargetDiamonds" DECIMAL(14,2);

-- AlterTable
ALTER TABLE "HostAgencyMember" ADD COLUMN     "lifetimeDiamonds" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "monthKey" TEXT,
ADD COLUMN     "monthlyDiamonds" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "RechargeTransaction" ADD COLUMN     "bonusPercent" DECIMAL(5,2),
ADD COLUMN     "goldCredited" DECIMAL(14,2),
ADD COLUMN     "packageId" TEXT;

-- CreateTable
CREATE TABLE "RechargePackage" (
    "id" TEXT NOT NULL,
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "baseGold" DECIMAL(14,2) NOT NULL,
    "bonusPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalGold" DECIMAL(14,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechargePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostAgencyCommissionEntry" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "giftSendId" TEXT NOT NULL,
    "diamondsAwarded" DECIMAL(14,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "commissionUsd" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostAgencyCommissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostTargetTier" (
    "id" TEXT NOT NULL,
    "thresholdDiamonds" DECIMAL(14,2) NOT NULL,
    "salaryUsd" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostTargetTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostEconomySettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "giftHostShareRate" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "agencyBaseRate" DECIMAL(5,2) NOT NULL DEFAULT 8,
    "agencyTargetRate" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "agencyPremiumRate" DECIMAL(5,2) NOT NULL DEFAULT 12,
    "diamondToUsdRate" DECIMAL(10,8) NOT NULL DEFAULT 0.00005,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostEconomySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "diamondsAmount" DECIMAL(14,2) NOT NULL,
    "usdAmount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyWithdrawalRequest" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "usdAmount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyWithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RechargePackage_isActive_idx" ON "RechargePackage"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HostAgencyCommissionEntry_giftSendId_key" ON "HostAgencyCommissionEntry"("giftSendId");

-- CreateIndex
CREATE INDEX "HostAgencyCommissionEntry_agencyId_createdAt_idx" ON "HostAgencyCommissionEntry"("agencyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HostTargetTier_thresholdDiamonds_key" ON "HostTargetTier"("thresholdDiamonds");

-- CreateIndex
CREATE INDEX "HostTargetTier_thresholdDiamonds_idx" ON "HostTargetTier"("thresholdDiamonds");

-- CreateIndex
CREATE INDEX "HostWithdrawalRequest_hostId_status_idx" ON "HostWithdrawalRequest"("hostId", "status");

-- CreateIndex
CREATE INDEX "AgencyWithdrawalRequest_agencyId_status_idx" ON "AgencyWithdrawalRequest"("agencyId", "status");

-- AddForeignKey
ALTER TABLE "HostAgencyCommissionEntry" ADD CONSTRAINT "HostAgencyCommissionEntry_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "HostAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostWithdrawalRequest" ADD CONSTRAINT "HostWithdrawalRequest_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostWithdrawalRequest" ADD CONSTRAINT "HostWithdrawalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyWithdrawalRequest" ADD CONSTRAINT "AgencyWithdrawalRequest_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "HostAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyWithdrawalRequest" ADD CONSTRAINT "AgencyWithdrawalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

