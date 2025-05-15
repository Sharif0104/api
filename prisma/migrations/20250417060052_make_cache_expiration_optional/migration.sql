/*
  Warnings:

  - Made the column `cacheExpiration` on table `ShopCache` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ShopCache" ALTER COLUMN "cacheExpiration" SET NOT NULL;
