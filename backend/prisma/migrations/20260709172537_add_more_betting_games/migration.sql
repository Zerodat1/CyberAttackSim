-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GameType" ADD VALUE 'LUCKY_WHEEL';
ALTER TYPE "GameType" ADD VALUE 'SLOT_MACHINE';
ALTER TYPE "GameType" ADD VALUE 'CRASH_GUESS';

-- AlterTable
ALTER TABLE "GameSettings" ADD COLUMN     "config" JSONB,
ALTER COLUMN "id" DROP DEFAULT;
