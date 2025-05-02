-- CreateTable
CREATE TABLE `album` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `release_date` DATE NULL,
    `tracks_number` INTEGER NULL DEFAULT 0,
    `user_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `verified_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `item_id` INTEGER NOT NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `album_artist` (
    `id_album` INTEGER NOT NULL,
    `id_artist` INTEGER NOT NULL,

    INDEX `id_artist`(`id_artist`),
    PRIMARY KEY (`id_album`, `id_artist`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author_id` INTEGER NOT NULL,
    `published_date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `image_url` VARCHAR(255) NULL,
    `views` INTEGER NULL DEFAULT 0,

    INDEX `author_id`(`author_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_tag` (
    `article_id` INTEGER NOT NULL,
    `tag_id` INTEGER NOT NULL,

    INDEX `tag_id`(`tag_id`),
    PRIMARY KEY (`article_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `artist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `biography` TEXT NULL,
    `verified_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `user_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `birthdate` DATE NULL,
    `item_id` INTEGER NOT NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `article_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `parent_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` ENUM('active', 'deleted') NULL DEFAULT 'active',

    INDEX `article_id`(`article_id`),
    INDEX `parent_id`(`parent_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `date` DATETIME(0) NOT NULL,
    `venue_id` INTEGER NULL,
    `description` TEXT NULL,
    `ticket_url` VARCHAR(255) NULL,

    INDEX `venue_id`(`venue_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_artist` (
    `event_id` INTEGER NOT NULL,
    `artist_id` INTEGER NOT NULL,

    INDEX `artist_id`(`artist_id`),
    PRIMARY KEY (`event_id`, `artist_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorite` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `created_date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_item_favorite`(`item_id`),
    INDEX `user`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `seguidor_id` INTEGER NOT NULL,
    `seguido_id` INTEGER NOT NULL,
    `fecha_seguimiento` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `seguido_id`(`seguido_id`),
    UNIQUE INDEX `seguidor_id`(`seguidor_id`, `seguido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `NAME` VARCHAR(50) NOT NULL,
    `content` TEXT NULL,
    `item_id` INTEGER NOT NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genre_album` (
    `genre_id` INTEGER NOT NULL,
    `album_id` INTEGER NOT NULL,

    INDEX `album_id`(`album_id`),
    PRIMARY KEY (`genre_id`, `album_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genre_artist` (
    `genre_id` INTEGER NOT NULL,
    `artist_id` INTEGER NOT NULL,

    INDEX `artist_id`(`artist_id`),
    PRIMARY KEY (`genre_id`, `artist_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genre_subgenre` (
    `genre_id` INTEGER NOT NULL,
    `subgenre_id` INTEGER NOT NULL,

    INDEX `subgenre_id`(`subgenre_id`),
    PRIMARY KEY (`genre_id`, `subgenre_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `genre_track` (
    `genre_id` INTEGER NOT NULL,
    `track_id` INTEGER NOT NULL,

    INDEX `track_id`(`track_id`),
    PRIMARY KEY (`genre_id`, `track_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_type` ENUM('track', 'album', 'artist', 'venue', 'genre') NOT NULL,
    `item_id` INTEGER NOT NULL,

    UNIQUE INDEX `item_type`(`item_type`, `item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `score` DOUBLE NOT NULL,
    `verified` TINYINT NOT NULL DEFAULT 0,
    `text` TEXT NULL,
    `item_id` INTEGER NOT NULL,
    `title` TINYTEXT NULL,

    INDEX `fk_item_review`(`item_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('admin', 'mod', 'reader', 'writer', 'verified') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subgenre` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `NAME` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tag` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(70) NOT NULL,
    `item_id` INTEGER NOT NULL,

    INDEX `fk_item_tag`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `duration` INTEGER NULL,
    `user_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `verified_score` DECIMAL(3, 2) NULL DEFAULT 0.00,
    `release_date` DATE NULL,
    `item_id` INTEGER NOT NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track_album` (
    `track_id` INTEGER NOT NULL,
    `album_id` INTEGER NOT NULL,

    INDEX `album_id`(`album_id`),
    PRIMARY KEY (`track_id`, `album_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `track_artist` (
    `track_id` INTEGER NOT NULL,
    `artist_id` INTEGER NOT NULL,

    INDEX `artist_id`(`artist_id`),
    PRIMARY KEY (`track_id`, `artist_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullname` VARCHAR(255) NOT NULL,
    `username` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NULL,
    `birthdate` DATE NOT NULL,
    `country` VARCHAR(255) NULL,
    `city` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `spotify_link` VARCHAR(255) NULL,
    `biography` TEXT NULL,
    `profile_pic` VARCHAR(255) NULL,
    `cover_pic` VARCHAR(255) NULL,
    `register_date` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `auth_strategy` VARCHAR(50) NULL,
    `role_id` INTEGER NOT NULL DEFAULT 5,
    `oauth_id` VARCHAR(255) NULL,

    UNIQUE INDEX `nombre_usuario`(`username`),
    UNIQUE INDEX `correo`(`email`),
    UNIQUE INDEX `unique_phone`(`phone`),
    UNIQUE INDEX `oauth_id`(`oauth_id`),
    INDEX `user_type`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `item_id` INTEGER NOT NULL,
    `content` TEXT NULL,
    `timestamp` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_item_activity`(`item_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `venue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `capacity` INTEGER NULL,
    `venue_type` ENUM('stadium', 'arena', 'theater', 'club', 'outdoor', 'other') NOT NULL,
    `contact_info` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `item_id` INTEGER NOT NULL,

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `votes` (
    `user_id` INTEGER NOT NULL,
    `post_id` INTEGER NOT NULL,
    `timestamp` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `post_id`(`post_id`),
    PRIMARY KEY (`user_id`, `post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `album` ADD CONSTRAINT `album_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `album_artist` ADD CONSTRAINT `album_artist_ibfk_1` FOREIGN KEY (`id_album`) REFERENCES `album`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `album_artist` ADD CONSTRAINT `album_artist_ibfk_2` FOREIGN KEY (`id_artist`) REFERENCES `artist`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `article` ADD CONSTRAINT `article_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `article_tag` ADD CONSTRAINT `article_tag_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `article_tag` ADD CONSTRAINT `article_tag_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `artist` ADD CONSTRAINT `artist_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_1` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `comment_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `comment`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `event` ADD CONSTRAINT `event_ibfk_1` FOREIGN KEY (`venue_id`) REFERENCES `venue`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `event_artist` ADD CONSTRAINT `event_artist_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `event_artist` ADD CONSTRAINT `event_artist_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artist`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `favorite_ibfk_1` FOREIGN KEY (`user`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `fk_item_favorite` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `follow` ADD CONSTRAINT `follow_ibfk_1` FOREIGN KEY (`seguidor_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `follow` ADD CONSTRAINT `follow_ibfk_2` FOREIGN KEY (`seguido_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre` ADD CONSTRAINT `genre_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_album` ADD CONSTRAINT `genre_album_ibfk_1` FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_album` ADD CONSTRAINT `genre_album_ibfk_2` FOREIGN KEY (`album_id`) REFERENCES `album`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_artist` ADD CONSTRAINT `genre_artist_ibfk_1` FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_artist` ADD CONSTRAINT `genre_artist_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artist`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_subgenre` ADD CONSTRAINT `genre_subgenre_ibfk_1` FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_subgenre` ADD CONSTRAINT `genre_subgenre_ibfk_2` FOREIGN KEY (`subgenre_id`) REFERENCES `subgenre`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_track` ADD CONSTRAINT `genre_track_ibfk_1` FOREIGN KEY (`genre_id`) REFERENCES `genre`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `genre_track` ADD CONSTRAINT `genre_track_ibfk_2` FOREIGN KEY (`track_id`) REFERENCES `track`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `fk_item_review` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `review` ADD CONSTRAINT `review_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `tag` ADD CONSTRAINT `fk_item_tag` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `track` ADD CONSTRAINT `track_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `track_album` ADD CONSTRAINT `track_album_ibfk_1` FOREIGN KEY (`track_id`) REFERENCES `track`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `track_album` ADD CONSTRAINT `track_album_ibfk_2` FOREIGN KEY (`album_id`) REFERENCES `album`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `track_artist` ADD CONSTRAINT `track_artist_ibfk_1` FOREIGN KEY (`track_id`) REFERENCES `track`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `track_artist` ADD CONSTRAINT `track_artist_ibfk_2` FOREIGN KEY (`artist_id`) REFERENCES `artist`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_activity` ADD CONSTRAINT `fk_item_activity` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `user_activity` ADD CONSTRAINT `user_activity_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `venue` ADD CONSTRAINT `venue_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `votes` ADD CONSTRAINT `votes_ibfk_2` FOREIGN KEY (`post_id`) REFERENCES `user_activity`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
