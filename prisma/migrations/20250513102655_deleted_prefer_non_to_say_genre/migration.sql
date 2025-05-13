/*
  Warnings:

  - The values [prefer_not_to_say] on the enum `user_genre` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `genre` ENUM('male', 'female', 'non_binary', 'other') NULL;
