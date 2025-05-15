/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the `Booking` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopCache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "createdAt",
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "location" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "Booking";

-- DropTable
DROP TABLE "ShopCache";

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "hour" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shopId" INTEGER NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
