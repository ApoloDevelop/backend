-- AlterTable
ALTER TABLE `user` ADD COLUMN `reset_password_expires` TIMESTAMP(0) NULL,
    ADD COLUMN `reset_password_token` VARCHAR(255) NULL;
