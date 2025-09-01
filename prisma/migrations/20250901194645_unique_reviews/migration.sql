/*
  Warnings:

  - A unique constraint covering the columns `[user_id,item_id]` on the table `review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `review_user_id_item_id_key` ON `review`(`user_id`, `item_id`);
