/*
  Warnings:

  - A unique constraint covering the columns `[listId,itemId]` on the table `custom_list_item` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `custom_list_item_listId_itemId_key` ON `custom_list_item`(`listId`, `itemId`);
