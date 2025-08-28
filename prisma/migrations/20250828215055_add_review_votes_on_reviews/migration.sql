-- CreateTable
CREATE TABLE `review_vote` (
    `user_id` INTEGER NOT NULL,
    `review_id` INTEGER NOT NULL,
    `value` TINYINT NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `review_id`(`review_id`),
    PRIMARY KEY (`user_id`, `review_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `review_vote` ADD CONSTRAINT `review_vote_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_vote` ADD CONSTRAINT `review_vote_review_id_fkey` FOREIGN KEY (`review_id`) REFERENCES `review`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
