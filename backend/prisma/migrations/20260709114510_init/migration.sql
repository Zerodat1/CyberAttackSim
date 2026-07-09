-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('USER', 'RECHARGE_MANAGER', 'OWNER');

-- CreateEnum
CREATE TYPE "RechargeAgentRole" AS ENUM ('MASTER', 'SUB_AGENT');

-- CreateEnum
CREATE TYPE "RechargeAgencyStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RechargeTransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WalletOwnerType" AS ENUM ('AGENCY', 'AGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'APPLICATION_CHANGES_REQUESTED', 'APPLICATION_SUSPENDED', 'WALLET_CREDITED', 'WALLET_DEBITED', 'CHARGE_SUCCESS', 'CHARGE_FAILED', 'TOPUP_REQUEST_SUBMITTED', 'TOPUP_REQUEST_APPROVED', 'TOPUP_REQUEST_REJECTED', 'WITHDRAWAL_REQUESTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_REJECTED', 'LOW_BALANCE', 'NEW_DEVICE_LOGIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "country" TEXT,
    "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "device" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "device" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeAgencyApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "paymentMethods" TEXT[],
    "previousExperience" TEXT,
    "yearsOfExperience" INTEGER,
    "socialLinks" JSONB,
    "idDocumentUrl" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechargeAgencyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeAgency" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "RechargeAgencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "monthlyTarget" DECIMAL(14,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechargeAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "role" "RechargeAgentRole" NOT NULL DEFAULT 'SUB_AGENT',
    "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "status" "RechargeAgencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RechargeAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeWallet" (
    "id" TEXT NOT NULL,
    "ownerType" "WalletOwnerType" NOT NULL,
    "agencyId" TEXT,
    "agentId" TEXT,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopUpRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "proofUrl" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopUpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "method" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RechargeTransaction" (
    "id" TEXT NOT NULL,
    "transactionNumber" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "agentCommission" DECIMAL(14,2) NOT NULL,
    "agencyCommission" DECIMAL(14,2) NOT NULL,
    "platformShare" DECIMAL(14,2) NOT NULL,
    "status" "RechargeTransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "ipAddress" TEXT,
    "device" TEXT,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RechargeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "agentCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    "agencyCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 2.0,
    "platformRate" DECIMAL(5,2) NOT NULL DEFAULT 93.0,
    "dailyChargeLimit" DECIMAL(14,2) NOT NULL DEFAULT 5000,
    "dailyWithdrawLimit" DECIMAL(14,2) NOT NULL DEFAULT 2000,
    "largeTransactionAlert" DECIMAL(14,2) NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_globalRole_idx" ON "User"("globalRole");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "LoginHistory_userId_createdAt_idx" ON "LoginHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeAgencyApplication_applicantId_key" ON "RechargeAgencyApplication"("applicantId");

-- CreateIndex
CREATE INDEX "RechargeAgencyApplication_status_idx" ON "RechargeAgencyApplication"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeAgency_applicationId_key" ON "RechargeAgency"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeAgency_ownerId_key" ON "RechargeAgency"("ownerId");

-- CreateIndex
CREATE INDEX "RechargeAgency_status_idx" ON "RechargeAgency"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeAgent_userId_key" ON "RechargeAgent"("userId");

-- CreateIndex
CREATE INDEX "RechargeAgent_agencyId_idx" ON "RechargeAgent"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeWallet_agencyId_key" ON "RechargeWallet"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeWallet_agentId_key" ON "RechargeWallet"("agentId");

-- CreateIndex
CREATE INDEX "TopUpRequest_agentId_status_idx" ON "TopUpRequest"("agentId", "status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_agentId_status_idx" ON "WithdrawalRequest"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeTransaction_transactionNumber_key" ON "RechargeTransaction"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RechargeTransaction_idempotencyKey_key" ON "RechargeTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "RechargeTransaction_agentId_createdAt_idx" ON "RechargeTransaction"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "RechargeTransaction_targetUserId_createdAt_idx" ON "RechargeTransaction"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginHistory" ADD CONSTRAINT "LoginHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgencyApplication" ADD CONSTRAINT "RechargeAgencyApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgencyApplication" ADD CONSTRAINT "RechargeAgencyApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgency" ADD CONSTRAINT "RechargeAgency_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RechargeAgencyApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgency" ADD CONSTRAINT "RechargeAgency_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgent" ADD CONSTRAINT "RechargeAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeAgent" ADD CONSTRAINT "RechargeAgent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "RechargeAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeWallet" ADD CONSTRAINT "RechargeWallet_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "RechargeAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeWallet" ADD CONSTRAINT "RechargeWallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RechargeAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUpRequest" ADD CONSTRAINT "TopUpRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RechargeAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUpRequest" ADD CONSTRAINT "TopUpRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RechargeAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RechargeTransaction" ADD CONSTRAINT "RechargeTransaction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RechargeAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
