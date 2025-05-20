/*
  Warnings:

  - You are about to drop the `FarmInventory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FarmInventory" DROP CONSTRAINT "FarmInventory_userId_fkey";

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "userId" INTEGER;

-- DropTable
DROP TABLE "FarmInventory";

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
