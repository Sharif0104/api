/*
  Warnings:

  - Added the required column `availabilityId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "availabilityId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "ShopAvailability"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
