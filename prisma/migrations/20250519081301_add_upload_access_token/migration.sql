/*
  Warnings:

  - You are about to drop the column `emailHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessToken]` on the table `Upload` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessToken` to the `Upload` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_emailHash_key";

-- AlterTable
ALTER TABLE "Upload" ADD COLUMN     "accessToken" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailHash";

-- CreateIndex
CREATE UNIQUE INDEX "Upload_accessToken_key" ON "Upload"("accessToken");
