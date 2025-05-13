/*
  Warnings:

  - You are about to drop the column `genre` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `genre`,
    ADD COLUMN `social_genre` ENUM('male', 'female', 'non_binary', 'other') NULL;
