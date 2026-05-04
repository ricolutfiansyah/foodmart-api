/*
  Warnings:

  - You are about to drop the column `usedAt` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RefreshToken" DROP COLUMN "usedAt";
