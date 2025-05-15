/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `ShopAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `ShopAvailability` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `ShopAvailability` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,timeSlotId]` on the table `ShopAvailability` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `timeSlotId` to the `ShopAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ShopAvailability_shopId_dayOfWeek_key";

-- AlterTable
ALTER TABLE "ShopAvailability" DROP COLUMN "dayOfWeek",
DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "timeSlotId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ShopAvailability_shopId_timeSlotId_key" ON "ShopAvailability"("shopId", "timeSlotId");

-- AddForeignKey
ALTER TABLE "ShopAvailability" ADD CONSTRAINT "ShopAvailability_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
