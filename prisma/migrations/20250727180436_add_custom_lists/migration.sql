-- CreateTable
CREATE TABLE `custom_list` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `userId` INTEGER NOT NULL,
    `itemType` ENUM('track', 'album', 'artist', 'venue', 'genre') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `custom_list_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `custom_list_item` (
    `listId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,

    INDEX `custom_list_item_itemId_idx`(`itemId`),
    PRIMARY KEY (`listId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `custom_list` ADD CONSTRAINT `custom_list_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_list_item` ADD CONSTRAINT `custom_list_item_listId_fkey` FOREIGN KEY (`listId`) REFERENCES `custom_list`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `custom_list_item` ADD CONSTRAINT `custom_list_item_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
