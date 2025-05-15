-- AlterTable
ALTER TABLE "ShopCache" ADD COLUMN     "cacheExpiration" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_shopId_idx" ON "Booking"("shopId");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");
