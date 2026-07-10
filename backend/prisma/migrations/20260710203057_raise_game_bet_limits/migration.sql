-- AlterTable
ALTER TABLE "GameSettings" ALTER COLUMN "minBet" SET DEFAULT 1000,
ALTER COLUMN "maxBet" SET DEFAULT 1000000,
ALTER COLUMN "dailyBetLimit" SET DEFAULT 5000000;

-- DataMigration: apply the new bet limits to existing per-game rows
UPDATE "GameSettings"
SET "minBet" = 1000, "maxBet" = 1000000, "dailyBetLimit" = 5000000
WHERE "id" IN ('DICE_GUESS', 'LUCKY_WHEEL', 'SLOT_MACHINE', 'CRASH_GUESS');
