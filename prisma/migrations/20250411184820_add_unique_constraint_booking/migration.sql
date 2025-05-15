/*
  Warnings:

  - A unique constraint covering the columns `[shopId,date,hour]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_shopId_date_hour_key" ON "Booking"("shopId", "date", "hour");
