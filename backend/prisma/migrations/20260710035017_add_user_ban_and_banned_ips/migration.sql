-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "bannedReason" TEXT;

-- CreateTable
CREATE TABLE "BannedIp" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "reason" TEXT,
    "bannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedIp_ipAddress_key" ON "BannedIp"("ipAddress");

-- CreateIndex
CREATE INDEX "BannedIp_ipAddress_idx" ON "BannedIp"("ipAddress");

-- AddForeignKey
ALTER TABLE "BannedIp" ADD CONSTRAINT "BannedIp_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
