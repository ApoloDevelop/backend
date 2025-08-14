/*
  Warnings:

  - You are about to drop the column `duration` on the `track` table. All the data in the column will be lost.
  - You are about to drop the column `release_date` on the `track` table. All the data in the column will be lost.
  - You are about to drop the column `user_score` on the `track` table. All the data in the column will be lost.
  - You are about to drop the column `verified_score` on the `track` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `track` DROP COLUMN `duration`,
    DROP COLUMN `release_date`,
    DROP COLUMN `user_score`,
    DROP COLUMN `verified_score`;
