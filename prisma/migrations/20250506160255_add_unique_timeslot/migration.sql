/*
  Warnings:

  - A unique constraint covering the columns `[shopId,date,hour,minute]` on the table `TimeSlot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TimeSlot_shopId_date_hour_minute_key" ON "TimeSlot"("shopId", "date", "hour", "minute");
