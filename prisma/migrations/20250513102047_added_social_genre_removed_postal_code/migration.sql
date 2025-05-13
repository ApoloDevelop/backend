/*
  Warnings:

  - You are about to drop the column `postalCode` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `postalCode`,
    ADD COLUMN `genre` ENUM('male', 'female', 'non_binary', 'other', 'prefer_not_to_say') NOT NULL DEFAULT 'prefer_not_to_say';
