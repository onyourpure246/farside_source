-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Feb 12, 2026 at 08:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `casdu_internalis`
--

-- --------------------------------------------------------

--
-- Table structure for table `common_activity_logs`
--

CREATE TABLE `common_activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `level` varchar(20) DEFAULT 'INFO',
  `action` varchar(50) NOT NULL,
  `resource_type` varchar(50) NOT NULL,
  `resource_id` varchar(100) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `common_activity_logs`
--

INSERT INTO `common_activity_logs` (`id`, `user_id`, `level`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '1', '{\"displayname\":\"System Admin\"}', 'unknown', 'node', '2026-02-12 10:13:02'),
(2, 1, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '1', '{\"displayname\":\"System Admin\"}', 'unknown', 'node', '2026-02-12 10:14:14'),
(3, 1, 'INFO', 'CREATE_FOLDER', 'FOLDER', '1', '{\"name\":\"ระบบจัดการกระดาษทำการ\",\"parent\":null}', 'unknown', 'node', '2026-02-12 10:19:58'),
(4, 1, 'INFO', 'CREATE_FOLDER', 'FOLDER', '2', '{\"name\":\"โปรแกรม ACL (Audit Command Language)\",\"parent\":null}', 'unknown', 'node', '2026-02-12 10:26:54'),
(5, 1, 'INFO', 'UPLOAD_FILE', 'FILE', '1', '{\"filename\":\"acl9_manual.pdf\",\"sysname\":\"09974e62-0b39-4102-b195-df5bbf4b3641\",\"parent\":2}', 'unknown', 'node', '2026-02-12 10:27:58'),
(6, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 10:55:42'),
(7, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 10:58:10'),
(8, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 11:03:00'),
(9, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 11:04:07'),
(10, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 11:05:59'),
(11, 1, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '1', '{\"displayname\":\"System Admin\"}', 'unknown', 'node', '2026-02-12 11:06:53'),
(12, 3, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '3', '{\"displayname\":\"Kukkik Tester\"}', 'unknown', 'node', '2026-02-12 11:38:25'),
(13, 1, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '1', '{\"displayname\":\"System Admin\"}', 'unknown', 'node', '2026-02-12 11:38:43'),
(14, 1, 'INFO', 'UPDATE_USER', 'USER', '3', '{\"updates\":{\"role\":\"admin\",\"status\":\"active\"}}', 'unknown', 'node', '2026-02-12 13:07:45'),
(15, 1, 'INFO', 'UPDATE_USER', 'USER', '3', '{\"updates\":{\"role\":\"user\",\"status\":\"active\"}}', 'unknown', 'node', '2026-02-12 13:11:39'),
(16, 1, 'INFO', 'UPDATE_USER', 'USER', '3', '{\"updates\":{\"role\":\"admin\",\"status\":\"active\"}}', 'unknown', 'node', '2026-02-12 13:11:45'),
(17, 1, 'INFO', 'UPDATE_USER', 'USER', '3', '{\"updates\":{\"role\":\"user\",\"status\":\"active\"}}', 'unknown', 'node', '2026-02-12 13:11:57'),
(18, 1, 'INFO', 'UPDATE_USER', 'USER', '3', '{\"updates\":{\"role\":\"admin\",\"status\":\"active\"}}', 'unknown', 'node', '2026-02-12 13:12:12'),
(19, 1, 'INFO', 'UPDATE_USER', 'USER', '2', '{\"updates\":{\"role\":\"user\",\"status\":\"inactive\"}}', 'unknown', 'node', '2026-02-12 13:21:48'),
(20, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 13:22:18'),
(21, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 13:25:34'),
(22, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 13:26:02'),
(23, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 13:28:12'),
(24, 2, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '2', '{\"displayname\":\"Somchai User\"}', 'unknown', 'node', '2026-02-12 13:32:48'),
(25, 3, 'INFO', 'VERIFY_EMPLOYEE', 'AUTH', '3', '{\"displayname\":\"Kukkik Tester\"}', 'unknown', 'node', '2026-02-12 13:33:07'),
(26, 3, 'INFO', 'CREATE_NEWS', 'NEWS', '1', '{\"title\":\"ทดสอบระบแจ้งประชาสัมพันธ์\"}', 'unknown', 'node', '2026-02-12 13:37:01'),
(27, 3, 'INFO', 'CREATE_NEWS', 'NEWS', '2', '{\"title\":\"ดอดก\"}', 'unknown', 'node', '2026-02-12 13:41:13'),
(28, 0, 'INFO', 'DOWNLOAD_UUID', 'FILE', '866bb71f-c602-48f8-a786-56178195f5cf', '{\"sysname\":\"866bb71f-c602-48f8-a786-56178195f5cf\"}', 'unknown', 'node', '2026-02-12 13:43:20'),
(29, 3, 'INFO', 'CREATE_FOLDER', 'FOLDER', '3', '{\"name\":\"ประเมินความเสี่ยง\",\"parent\":1}', 'unknown', 'node', '2026-02-12 13:52:40');

-- --------------------------------------------------------

--
-- Table structure for table `common_news`
--

CREATE TABLE `common_news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'published',
  `publish_date` datetime DEFAULT current_timestamp(),
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `view_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `common_news`
--

INSERT INTO `common_news` (`id`, `title`, `content`, `category`, `cover_image`, `status`, `publish_date`, `isactive`, `created_by`, `created_at`, `updated_by`, `updated_at`, `view_count`) VALUES
(1, 'ทดสอบระบแจ้งประชาสัมพันธ์', '<p class=\"leading-normal [&amp;:not(:first-child)]:mt-0\"><b><strong class=\"font-bold\" style=\"white-space: pre-wrap;\">ประกาศทดสอบระบบประชาสัมพันธ์</strong></b></p>', 'ประชาสัมพันธ์', '866bb71f-c602-48f8-a786-56178195f5cf', 'Published', '2026-02-12 06:37:01', 1, 'Kukkik Tester', '2026-02-12 13:37:01', 'Kukkik Tester', '2026-02-12 13:37:01', 0),
(2, 'ดอดก', '<p class=\"leading-normal [&amp;:not(:first-child)]:mt-0\"><span style=\"white-space: pre-wrap;\">พำเพำเเ</span></p>', 'กิจกรรม', '9023f5ae-0bba-485c-b6a2-25344588a07d', 'draft', '2026-02-12 06:41:13', 1, 'Kukkik Tester', '2026-02-12 13:41:13', 'Kukkik Tester', '2026-02-12 13:41:13', 0);

-- --------------------------------------------------------

--
-- Table structure for table `common_participants`
--

CREATE TABLE `common_participants` (
  `id` int(11) NOT NULL,
  `codename` varchar(50) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `common_tags`
--

CREATE TABLE `common_tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `colour` varchar(20) DEFAULT 'gray',
  `icon` varchar(50) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `common_users`
--

CREATE TABLE `common_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `displayname` varchar(100) DEFAULT NULL,
  `firstname` varchar(100) DEFAULT NULL,
  `lastname` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `jobtitle` varchar(100) DEFAULT NULL,
  `isadmin` tinyint(1) DEFAULT 0,
  `role` varchar(50) NOT NULL DEFAULT 'user',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `common_users`
--

INSERT INTO `common_users` (`id`, `username`, `password`, `displayname`, `firstname`, `lastname`, `email`, `jobtitle`, `isadmin`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, '1101000093449', '$2b$10$fV51OBSrYiY4R2xRg2EKie37GaSVODsu6gi2vGm5QseUajGrfP5FO', 'System Admin', 'System', 'Admin', 'admin@system.local', 'Administrator', 1, 'admin', 'active', '2026-02-12 10:13:02', '2026-02-12 11:38:43'),
(2, '3101000046943', '$2b$10$9bUt7Z5brRhe7orPfuVr4uUvPQucd.aXyirO6Ep9m8klCFOwsw8Nm', 'Somchai User', 'Somchai', 'User', 'somchai@test.local', 'Tester', 0, 'user', 'inactive', '2026-02-12 10:55:42', '2026-02-12 13:32:48'),
(3, '1123455567891', '$2b$10$DdeecEXZh/U750eAauZiqOQxpc/l6yJ6vgzdXgkFVdphXJQcUb28y', 'Kukkik Tester', 'Kukkik', 'Tester', 'kukkik.testtest@system.test', 'Tester', 1, 'admin', 'active', '2026-02-12 11:38:25', '2026-02-12 13:33:07');

-- --------------------------------------------------------

--
-- Table structure for table `dl_files`
--

CREATE TABLE `dl_files` (
  `id` int(11) NOT NULL,
  `parent` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `filename` varchar(255) NOT NULL,
  `sysname` varchar(255) NOT NULL,
  `mui_icon` varchar(50) DEFAULT NULL,
  `mui_colour` varchar(50) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `downloads` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dl_files`
--

INSERT INTO `dl_files` (`id`, `parent`, `name`, `description`, `filename`, `sysname`, `mui_icon`, `mui_colour`, `isactive`, `downloads`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 2, 'คู่มือการใช้งานโปรแกรม ACL', '-', 'acl9_manual.pdf', '09974e62-0b39-4102-b195-df5bbf4b3641', 'PictureAsPdf', '#E73E29', 2, 0, 1, '2026-02-12 10:27:58', 1, '2026-02-12 10:27:58');

-- --------------------------------------------------------

--
-- Table structure for table `dl_folders`
--

CREATE TABLE `dl_folders` (
  `id` int(11) NOT NULL,
  `abbr` varchar(50) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `mui_icon` varchar(50) DEFAULT NULL,
  `mui_colour` varchar(50) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dl_folders`
--

INSERT INTO `dl_folders` (`id`, `abbr`, `name`, `description`, `parent`, `mui_icon`, `mui_colour`, `isactive`, `created_by`, `created_at`, `updated_by`, `updated_at`) VALUES
(1, 'CADWP', 'ระบบจัดการกระดาษทำการ', NULL, NULL, 'Folder', '#FFCE3C', 1, 1, '2026-02-12 10:19:58', 1, '2026-02-12 10:19:58'),
(2, 'ACL', 'โปรแกรม ACL (Audit Command Language)', NULL, NULL, 'Folder', '#E73E29', 1, 1, '2026-02-12 10:26:54', 1, '2026-02-12 10:26:54'),
(3, 'CADRISK', 'ประเมินความเสี่ยง', NULL, 1, 'Folder', '#E73E29', 1, 3, '2026-02-12 13:52:40', 3, '2026-02-12 13:52:40');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(11) NOT NULL,
  `cid` varchar(20) NOT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `cid`, `firstname`, `lastname`, `email`, `position`, `isactive`, `created_at`, `updated_at`) VALUES
(1, '1101000093449', 'System', 'Admin', 'admin@system.local', 'Administrator', 1, '2026-02-10 14:25:22', '2026-02-10 14:27:05'),
(2, '3101000046943', 'Somchai', 'User', 'somchai@test.local', 'Tester', 1, '2026-02-10 14:27:05', '2026-02-12 10:49:16'),
(4, '1123455567891', 'Kukkik', 'Tester', 'kukkik.testtest@system.test', 'Tester', 1, '2026-02-12 10:48:29', '2026-02-12 10:48:29');

-- --------------------------------------------------------

--
-- Table structure for table `planner_projects`
--

CREATE TABLE `planner_projects` (
  `id` int(11) NOT NULL,
  `shortname` varchar(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `displayorder` int(11) DEFAULT 0,
  `manager_participant_id` int(11) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `planner_tasks`
--

CREATE TABLE `planner_tasks` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `displayorder` int(11) DEFAULT 0,
  `planned_start_date` date DEFAULT NULL,
  `planned_end_date` date DEFAULT NULL,
  `actual_start_date` date DEFAULT NULL,
  `actual_end_date` date DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `planner_task_participants`
--

CREATE TABLE `planner_task_participants` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `participant_id` int(11) NOT NULL,
  `isactive` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_by` varchar(50) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `planner_task_tags`
--

CREATE TABLE `planner_task_tags` (
  `task_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `search_logs`
--

CREATE TABLE `search_logs` (
  `id` int(11) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `results_count` int(11) DEFAULT 0,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `search_logs`
--

INSERT INTO `search_logs` (`id`, `keyword`, `user_id`, `results_count`, `ip_address`, `created_at`) VALUES
(1, 'สวัสดี', 2, 0, 'unknown', '2026-02-11 02:37:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `common_activity_logs`
--
ALTER TABLE `common_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `level_idx` (`level`),
  ADD KEY `action_idx` (`action`),
  ADD KEY `created_at_idx` (`created_at`);

--
-- Indexes for table `common_news`
--
ALTER TABLE `common_news`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `common_participants`
--
ALTER TABLE `common_participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `common_tags`
--
ALTER TABLE `common_tags`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `common_users`
--
ALTER TABLE `common_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `dl_files`
--
ALTER TABLE `dl_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent` (`parent`),
  ADD KEY `sysname` (`sysname`);

--
-- Indexes for table `dl_folders`
--
ALTER TABLE `dl_folders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parent` (`parent`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cid` (`cid`),
  ADD KEY `idx_cid` (`cid`);

--
-- Indexes for table `planner_projects`
--
ALTER TABLE `planner_projects`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `planner_tasks`
--
ALTER TABLE `planner_tasks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `planner_task_participants`
--
ALTER TABLE `planner_task_participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `planner_task_tags`
--
ALTER TABLE `planner_task_tags`
  ADD PRIMARY KEY (`task_id`,`tag_id`);

--
-- Indexes for table `search_logs`
--
ALTER TABLE `search_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_search_logs_keyword` (`keyword`),
  ADD KEY `idx_search_logs_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `common_activity_logs`
--
ALTER TABLE `common_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `common_news`
--
ALTER TABLE `common_news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `common_participants`
--
ALTER TABLE `common_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `common_tags`
--
ALTER TABLE `common_tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `common_users`
--
ALTER TABLE `common_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `dl_files`
--
ALTER TABLE `dl_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `dl_folders`
--
ALTER TABLE `dl_folders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `planner_projects`
--
ALTER TABLE `planner_projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `planner_tasks`
--
ALTER TABLE `planner_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `planner_task_participants`
--
ALTER TABLE `planner_task_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `search_logs`
--
ALTER TABLE `search_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dl_files`
--
ALTER TABLE `dl_files`
  ADD CONSTRAINT `fk_dl_files_parent` FOREIGN KEY (`parent`) REFERENCES `dl_folders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `dl_folders`
--
ALTER TABLE `dl_folders`
  ADD CONSTRAINT `fk_dl_folders_parent` FOREIGN KEY (`parent`) REFERENCES `dl_folders` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
