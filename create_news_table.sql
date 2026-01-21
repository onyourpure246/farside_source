-- Create table for Announcements/News
-- Run this in your MySQL Database (casdu_internalis)

CREATE TABLE IF NOT EXISTS `common_news` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL, -- HTML content or plain text
  `category` varchar(50) DEFAULT NULL, -- 'General', 'Activity', 'PR', etc.
  `cover_image` varchar(255) DEFAULT NULL, -- UUID reference to dl_files or direct filename in uploads
  `status` varchar(20) DEFAULT 'published', -- 'draft', 'published', 'archived'
  `publish_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
