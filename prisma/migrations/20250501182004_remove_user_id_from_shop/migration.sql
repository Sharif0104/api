/*
  Warnings:

  - You are about to drop the column `userId` on the `Shop` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_userId_fkey";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "userId";
