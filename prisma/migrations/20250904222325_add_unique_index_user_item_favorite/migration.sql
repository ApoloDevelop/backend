/*
  Warnings:

  - A unique constraint covering the columns `[user,item_id]` on the table `favorite` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `favorite_user_item_id_key` ON `favorite`(`user`, `item_id`);
