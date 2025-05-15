/*
  Warnings:

  - Added the required column `minute` to the `TimeSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TimeSlot" ADD COLUMN     "minute" INTEGER NOT NULL;
