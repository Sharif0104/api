/*
  Warnings:

  - You are about to alter the column `name` on the `Shop` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `location` on the `Shop` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "location" SET DATA TYPE VARCHAR(255);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
