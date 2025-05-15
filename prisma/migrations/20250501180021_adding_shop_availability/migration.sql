-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "ShopAvailability" (
    "id" SERIAL NOT NULL,
    "shopId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopAvailability_shopId_dayOfWeek_key" ON "ShopAvailability"("shopId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopAvailability" ADD CONSTRAINT "ShopAvailability_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
