/*
  Warnings:

  - You are about to drop the column `auth_strategy` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `oauth_id` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `oauth_id` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `auth_strategy`,
    DROP COLUMN `oauth_id`;
