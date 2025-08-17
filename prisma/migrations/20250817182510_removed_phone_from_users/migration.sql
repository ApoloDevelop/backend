/*
  Warnings:

  - You are about to drop the column `phone` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `unique_phone` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `phone`;
