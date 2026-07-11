-- CreateEnum
CREATE TYPE "HostAgencyRole" AS ENUM ('OWNER', 'HOST');

-- CreateTable
CREATE TABLE "HostAgency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HostAgency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostAgencyMember" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HostAgencyRole" NOT NULL DEFAULT 'HOST',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostAgencyMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HostAgency_isActive_idx" ON "HostAgency"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "HostAgencyMember_userId_key" ON "HostAgencyMember"("userId");

-- CreateIndex
CREATE INDEX "HostAgencyMember_agencyId_idx" ON "HostAgencyMember"("agencyId");

-- AddForeignKey
ALTER TABLE "HostAgency" ADD CONSTRAINT "HostAgency_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostAgencyMember" ADD CONSTRAINT "HostAgencyMember_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "HostAgency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostAgencyMember" ADD CONSTRAINT "HostAgencyMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
