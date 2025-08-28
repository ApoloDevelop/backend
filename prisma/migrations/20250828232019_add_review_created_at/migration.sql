-- AlterTable
ALTER TABLE `review` ADD COLUMN `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- CreateIndex
CREATE INDEX `review_item_id_verified_created_at_idx` ON `review`(`item_id`, `verified`, `created_at`);
