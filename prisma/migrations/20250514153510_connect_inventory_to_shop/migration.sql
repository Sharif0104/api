-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "shopId" INTEGER;

-- Set existing rows to NULL for shopId
UPDATE "Inventory" SET "shopId" = NULL;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
