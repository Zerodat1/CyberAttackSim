-- CreateTable
CREATE TABLE "RoomChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomChatMessage_roomId_createdAt_idx" ON "RoomChatMessage"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "RoomChatMessage" ADD CONSTRAINT "RoomChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomChatMessage" ADD CONSTRAINT "RoomChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
