/*
  Warnings:

  - You are about to drop the column `biography` on the `artist` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `item_type` ON `item`;

-- AlterTable
ALTER TABLE `artist` DROP COLUMN `biography`;
