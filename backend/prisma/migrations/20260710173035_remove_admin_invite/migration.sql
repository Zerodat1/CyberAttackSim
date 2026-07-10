-- DropForeignKey
ALTER TABLE "AdminInvite" DROP CONSTRAINT "AdminInvite_createdById_fkey";

-- DropForeignKey
ALTER TABLE "AdminInvite" DROP CONSTRAINT "AdminInvite_usedById_fkey";

-- DropTable
DROP TABLE "AdminInvite";

