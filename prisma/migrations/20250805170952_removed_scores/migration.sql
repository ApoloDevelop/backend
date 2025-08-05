/*
  Warnings:

  - You are about to drop the column `user_score` on the `artist` table. All the data in the column will be lost.
  - You are about to drop the column `verified_score` on the `artist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `artist` DROP COLUMN `user_score`,
    DROP COLUMN `verified_score`;
