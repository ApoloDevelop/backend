/*
  Warnings:

  - A unique constraint covering the columns `[name,item_id]` on the table `tag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `tag_name_item_id_key` ON `tag`(`name`, `item_id`);
