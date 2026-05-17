-- =============================================================
-- Database: dyslexia_db
-- Description: Dyslexia screening & therapy platform database
-- Engine: MySQL 8.x / MariaDB
-- Charset: utf8mb4
-- =============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- -------------------------------------------------------------
-- Create & select database
-- -------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `dyslexia_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `dyslexia_db`;

-- =============================================================
-- TABLE STRUCTURE
-- =============================================================

-- -------------------------------------------------------------
-- therapist
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `therapist`;
CREATE TABLE `therapist` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)  NOT NULL,
  `email`         VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `login_count`   INT          NOT NULL DEFAULT 0,
  `last_login`    DATETIME     DEFAULT NULL,
  `last_ip`       VARCHAR(45)  DEFAULT NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`),
  UNIQUE KEY `uq_email`    (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- parent
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `parent`;
CREATE TABLE `parent` (
  `id`                    INT          NOT NULL AUTO_INCREMENT,
  `full_name`             VARCHAR(255) NOT NULL,
  `email`                 VARCHAR(255) NOT NULL,
  `phone`                 VARCHAR(20)  DEFAULT NULL,
  `password_hash`         VARCHAR(255) NOT NULL,
  `assigned_therapist_id` INT          DEFAULT NULL,
  `login_count`           INT          NOT NULL DEFAULT 0,
  `last_login`            DATETIME     DEFAULT NULL,
  `last_ip`               VARCHAR(45)  DEFAULT NULL,
  `created_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`),
  KEY `fk_parent_therapist` (`assigned_therapist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- child
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `child`;
CREATE TABLE `child` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `parent_id`  INT          NOT NULL,
  `full_name`  VARCHAR(255) NOT NULL,
  `grade`      INT          NOT NULL,
  `dob`        DATE         DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_child_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- child_session
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `child_session`;
CREATE TABLE `child_session` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `child_name`  VARCHAR(255) NOT NULL,
  `child_grade` INT          NOT NULL,
  `parent_id`   INT          DEFAULT NULL,
  `child_id`    INT          DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_cs_parent` (`parent_id`),
  KEY `fk_cs_child`  (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- activity
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `activity`;
CREATE TABLE `activity` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `name`             VARCHAR(255) NOT NULL,
  `description`      TEXT         DEFAULT NULL,
  `difficulty_level` INT          NOT NULL DEFAULT 1,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type`             VARCHAR(50)  NOT NULL DEFAULT 'syllable',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- child_activity_progress
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `child_activity_progress`;
CREATE TABLE `child_activity_progress` (
  `id`           INT      NOT NULL AUTO_INCREMENT,
  `child_id`     INT      NOT NULL,
  `activity_id`  INT      NOT NULL,
  `completed`    TINYINT(1) NOT NULL DEFAULT 0,
  `score`        INT      DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `created_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_activity` (`child_id`, `activity_id`),
  KEY `fk_cap_activity` (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- message
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `parent_id`    INT          NOT NULL,
  `therapist_id` INT          NOT NULL,
  `sender_role`  ENUM('parent','therapist') NOT NULL,
  `content`      TEXT         NOT NULL,
  `is_read`      TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_msg_parent`    (`parent_id`),
  KEY `fk_msg_therapist` (`therapist_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- therapist_note
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `therapist_note`;
CREATE TABLE `therapist_note` (
  `id`            INT       NOT NULL AUTO_INCREMENT,
  `therapist_id`  INT       NOT NULL,
  `child_id`      INT       DEFAULT NULL,
  `note_text`     TEXT      NOT NULL,
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tn_therapist` (`therapist_id`),
  KEY `fk_tn_child`     (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- quiz_questions  (parent pre-screening questionnaire)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `quiz_questions`;
CREATE TABLE `quiz_questions` (
  `id`            INT  NOT NULL AUTO_INCREMENT,
  `question_text` TEXT NOT NULL,
  `display_order` INT  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- parent_screening
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `parent_screening`;
CREATE TABLE `parent_screening` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `child_session_id` VARCHAR(255) DEFAULT NULL,
  `parent_id`        INT          DEFAULT NULL,
  `child_id`         INT          DEFAULT NULL,
  `q1`               ENUM('yes','no') DEFAULT NULL,
  `q2`               ENUM('yes','no') DEFAULT NULL,
  `q3`               ENUM('yes','no') DEFAULT NULL,
  `q4`               ENUM('yes','no') DEFAULT NULL,
  `q5`               ENUM('yes','no') DEFAULT NULL,
  `q6`               ENUM('yes','no') DEFAULT NULL,
  `q7`               ENUM('yes','no') DEFAULT NULL,
  `q8`               ENUM('yes','no') DEFAULT NULL,
  `answers`          JSON         NOT NULL,
  `total_yes_count`  INT          NOT NULL DEFAULT 0,
  `risk_level`       VARCHAR(20)  NOT NULL,
  `risk_score`       DECIMAL(5,2) NOT NULL,
  `completed_at`     DATETIME     DEFAULT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_ps_parent` (`parent_id`),
  KEY `fk_ps_child`  (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- reading_words  (Task 1 – word reading)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `reading_words`;
CREATE TABLE `reading_words` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `word_text`     VARCHAR(100) NOT NULL,
  `category`      ENUM('similar','non_similar','pseudo') NOT NULL,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- task1_word_results
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `task1_word_results`;
CREATE TABLE `task1_word_results` (
  `id`                      INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`        INT          NOT NULL,
  `child_id`                INT          DEFAULT NULL,
  `similar_words_score`     INT          NOT NULL DEFAULT 0,
  `non_similar_words_score` INT          NOT NULL DEFAULT 0,
  `pseudo_words_score`      INT          NOT NULL DEFAULT 0,
  `total_score`             INT          NOT NULL DEFAULT 0,
  `total_words`             INT          NOT NULL DEFAULT 60,
  `percentage`              DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_time_seconds`      INT          NOT NULL DEFAULT 0,
  `avg_time_per_word`       DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `error_patterns`          JSON         DEFAULT NULL,
  `completed_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t1_child` (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- reading_texts  (Task 2 – oral reading passage)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `reading_texts`;
CREATE TABLE `reading_texts` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(255) NOT NULL,
  `content`    TEXT         NOT NULL,
  `word_count` INT          NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- task2_results
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `task2_results`;
CREATE TABLE `task2_results` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`   INT          NOT NULL,
  `child_id`           INT          DEFAULT NULL,
  `total_words`        INT          NOT NULL DEFAULT 0,
  `correct_count`      INT          NOT NULL DEFAULT 0,
  `incorrect_count`    INT          NOT NULL DEFAULT 0,
  `timeout_count`      INT          NOT NULL DEFAULT 0,
  `percentage`         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_time_seconds` INT          NOT NULL DEFAULT 0,
  `avg_time_per_word`  DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `word_details`       JSON         DEFAULT NULL,
  `completed_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t2_child` (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- letter_similarity_exercises  (Task 3 – letter group comparison)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `letter_similarity_exercises`;
CREATE TABLE `letter_similarity_exercises` (
  `id`              INT         NOT NULL AUTO_INCREMENT,
  `exercise_number` INT         NOT NULL,
  `group1`          VARCHAR(50) NOT NULL,
  `group2`          VARCHAR(50) NOT NULL,
  `is_same`         TINYINT(1)  NOT NULL,
  `display_order`   INT         NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- task3_letter_similarity_results
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `task3_letter_similarity_results`;
CREATE TABLE `task3_letter_similarity_results` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`   INT          NOT NULL,
  `child_id`           INT          DEFAULT NULL,
  `total_comparisons`  INT          NOT NULL DEFAULT 20,
  `correct_count`      INT          NOT NULL DEFAULT 0,
  `incorrect_count`    INT          NOT NULL DEFAULT 0,
  `timeout_count`      INT          NOT NULL DEFAULT 0,
  `percentage`         DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `total_time_seconds` INT          NOT NULL DEFAULT 0,
  `avg_time_per_item`  DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `comparison_details` JSON         DEFAULT NULL,
  `completed_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t3_child` (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- number_sequences  (Task 4 – digit span)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `number_sequences`;
CREATE TABLE `number_sequences` (
  `id`                    INT       NOT NULL AUTO_INCREMENT,
  `sequence_number`       INT       NOT NULL,
  `numbers`               JSON      NOT NULL,
  `length`                INT       NOT NULL,
  `response_time_seconds` INT       NOT NULL,
  `display_order`         INT       NOT NULL DEFAULT 0,
  `created_at`            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- task4_number_memory_results
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `task4_number_memory_results`;
CREATE TABLE `task4_number_memory_results` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `child_session_id`   INT          NOT NULL,
  `child_id`           INT          DEFAULT NULL,
  `seq_total`          INT          NOT NULL DEFAULT 20,
  `seq_correct`        INT          NOT NULL DEFAULT 0,
  `seq_incorrect`      INT          NOT NULL DEFAULT 0,
  `seq_timeout`        INT          NOT NULL DEFAULT 0,
  `seq_percentage`     DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `seq_time_seconds`   INT          NOT NULL DEFAULT 0,
  `seq_details`        JSON         DEFAULT NULL,
  `rev_total`          INT          NOT NULL DEFAULT 10,
  `rev_correct`        INT          NOT NULL DEFAULT 0,
  `rev_incorrect`      INT          NOT NULL DEFAULT 0,
  `rev_timeout`        INT          NOT NULL DEFAULT 0,
  `rev_percentage`     DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `rev_time_seconds`   INT          NOT NULL DEFAULT 0,
  `rev_details`        JSON         DEFAULT NULL,
  `overall_percentage` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `completed_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_t4_child` (`child_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- full_assessment_summary
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `full_assessment_summary`;
CREATE TABLE `full_assessment_summary` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `child_session_id` INT          NOT NULL,
  `child_id`         INT          DEFAULT NULL,
  `parent_id`        INT          DEFAULT NULL,
  `task1_score`      DECIMAL(5,2) DEFAULT NULL,
  `task2_score`      DECIMAL(5,2) DEFAULT NULL,
  `task3_score`      DECIMAL(5,2) DEFAULT NULL,
  `task4_score`      DECIMAL(5,2) DEFAULT NULL,
  `overall_score`    DECIMAL(5,2) DEFAULT NULL,
  `risk_level`       ENUM('Low Risk','Moderate Risk','High Risk') DEFAULT NULL,
  `completed_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_child_session` (`child_session_id`),
  KEY `fk_fas_child`  (`child_id`),
  KEY `fk_fas_parent` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- spelling_words  (bonus spelling game)
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `spelling_words`;
CREATE TABLE `spelling_words` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `word`          VARCHAR(50)  NOT NULL,
  `image_path`    VARCHAR(255) NOT NULL,
  `letters`       JSON         NOT NULL,
  `display_order` INT          NOT NULL DEFAULT 0,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_word` (`word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- spelling_results
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `spelling_results`;
CREATE TABLE `spelling_results` (
  `id`               INT       NOT NULL AUTO_INCREMENT,
  `child_id`         INT       NOT NULL,
  `child_session_id` INT       DEFAULT NULL,
  `score`            INT       NOT NULL,
  `total_words`      INT       NOT NULL,
  `completed`        TINYINT(1) NOT NULL DEFAULT 1,
  `played_at`        DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `details`          JSON      DEFAULT NULL COMMENT 'Stores misspelled words or other metadata',
  PRIMARY KEY (`id`),
  KEY `idx_child`         (`child_id`),
  KEY `idx_child_session` (`child_session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- refresh_token
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `refresh_token`;
CREATE TABLE `refresh_token` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(128) NOT NULL,
  `user_id`    INT          NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `expires_at` DATETIME     NOT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `revoked`    TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token`   (`token`),
  KEY `idx_expires`       (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- password_reset_token
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_token`;
CREATE TABLE `password_reset_token` (
  `id`         INT         NOT NULL AUTO_INCREMENT,
  `token`      VARCHAR(64) NOT NULL,
  `user_id`    INT         NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `expires_at` DATETIME    NOT NULL,
  `used`       TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token`       (`token`),
  KEY `idx_expires_at`        (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- audit_log
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `audit_log`;
CREATE TABLE `audit_log` (
  `id`         INT          NOT NULL AUTO_INCREMENT,
  `user_id`    INT          NOT NULL,
  `user_role`  ENUM('parent','therapist') NOT NULL,
  `event_type` VARCHAR(50)  NOT NULL,
  `ip_address` VARCHAR(45)  DEFAULT NULL,
  `user_agent` VARCHAR(512) DEFAULT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user`       (`user_id`, `user_role`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================================

ALTER TABLE `child`
  ADD CONSTRAINT `fk_child_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`) ON DELETE CASCADE;

ALTER TABLE `child_activity_progress`
  ADD CONSTRAINT `fk_cap_child`    FOREIGN KEY (`child_id`)    REFERENCES `child`    (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cap_activity` FOREIGN KEY (`activity_id`) REFERENCES `activity` (`id`) ON DELETE CASCADE;

ALTER TABLE `child_session`
  ADD CONSTRAINT `fk_cs_parent` FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_cs_child`  FOREIGN KEY (`child_id`)  REFERENCES `child`  (`id`) ON DELETE SET NULL;

ALTER TABLE `full_assessment_summary`
  ADD CONSTRAINT `fk_fas_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_fas_child`   FOREIGN KEY (`child_id`)         REFERENCES `child`          (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_fas_parent`  FOREIGN KEY (`parent_id`)        REFERENCES `parent`         (`id`) ON DELETE SET NULL;

ALTER TABLE `message`
  ADD CONSTRAINT `fk_msg_parent`    FOREIGN KEY (`parent_id`)    REFERENCES `parent`    (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_msg_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `therapist` (`id`) ON DELETE CASCADE;

ALTER TABLE `parent`
  ADD CONSTRAINT `fk_parent_therapist`
    FOREIGN KEY (`assigned_therapist_id`) REFERENCES `therapist` (`id`) ON DELETE SET NULL;

ALTER TABLE `parent_screening`
  ADD CONSTRAINT `fk_ps_parent` FOREIGN KEY (`parent_id`) REFERENCES `parent` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ps_child`  FOREIGN KEY (`child_id`)  REFERENCES `child`  (`id`) ON DELETE SET NULL;

ALTER TABLE `spelling_results`
  ADD CONSTRAINT `fk_spelling_child`         FOREIGN KEY (`child_id`)         REFERENCES `child`         (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_spelling_child_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE SET NULL;

ALTER TABLE `task1_word_results`
  ADD CONSTRAINT `fk_t1_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_t1_child`   FOREIGN KEY (`child_id`)         REFERENCES `child`          (`id`) ON DELETE SET NULL;

ALTER TABLE `task2_results`
  ADD CONSTRAINT `fk_t2_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_t2_child`   FOREIGN KEY (`child_id`)         REFERENCES `child`          (`id`) ON DELETE SET NULL;

ALTER TABLE `task3_letter_similarity_results`
  ADD CONSTRAINT `fk_t3_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_t3_child`   FOREIGN KEY (`child_id`)         REFERENCES `child`          (`id`) ON DELETE SET NULL;

ALTER TABLE `task4_number_memory_results`
  ADD CONSTRAINT `fk_t4_session` FOREIGN KEY (`child_session_id`) REFERENCES `child_session` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_t4_child`   FOREIGN KEY (`child_id`)         REFERENCES `child`          (`id`) ON DELETE SET NULL;

ALTER TABLE `therapist_note`
  ADD CONSTRAINT `fk_tn_therapist` FOREIGN KEY (`therapist_id`) REFERENCES `therapist` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tn_child`     FOREIGN KEY (`child_id`)     REFERENCES `child`      (`id`) ON DELETE SET NULL;


-- =============================================================
-- SEED DATA  (static / lookup tables + default accounts)
-- =============================================================

-- -------------------------------------------------------------
-- Therapist default account
-- Password: therapist (bcrypt)
-- CHANGE THIS PASSWORD IN PRODUCTION
-- -------------------------------------------------------------
INSERT INTO `therapist` (`id`, `username`, `email`, `password_hash`, `login_count`, `created_at`) VALUES
(1, 'therapist', 'therapist@dyslexiaplatform.com',
 '$2b$12$oY59mCDWwrF.qxDex8Bm5uXZP8vpt06W4LUOPe0ag39GWfwCAXjBi',
 0, NOW());

-- -------------------------------------------------------------
-- Activities
-- -------------------------------------------------------------
INSERT INTO `activity` (`id`, `name`, `description`, `difficulty_level`, `type`) VALUES
(1, 'Alphabet Swiping',
   'Swipe through animal flashcards, then match the first letter to the animal picture. Builds phonemic awareness and letter‑sound association.',
   1, 'letter_sound'),
(2, 'Syllable Breaking',
   'Break words into syllables, hear each part, then build the word by dragging letters into the correct syllable slots. Teaches word segmentation.',
   1, 'syllable');

-- -------------------------------------------------------------
-- Quiz questions  (parent pre-screening)
-- -------------------------------------------------------------
INSERT INTO `quiz_questions` (`id`, `question_text`, `display_order`) VALUES
(1, 'Does your child have any diagnosed vision problems (even if corrected with glasses)?',          1),
(2, 'Has your child had hearing difficulties or frequent ear infections?',                           2),
(3, 'Does your child have any history of neurological disorders or seizures?',                       3),
(4, 'Has your child been diagnosed with any developmental delay (speech, language, or motor skills)?', 4),
(5, 'Does your child struggle to recognize letters or match letters to sounds?',                      5),
(6, 'Does your child confuse similar letters (such as b/d, p/q) or reverse letters while reading or writing?', 6),
(7, 'Does your child read significantly slower than other children of the same age?',                7),
(8, 'Is there a family history of reading difficulties or dyslexia?',                               8);

-- -------------------------------------------------------------
-- Reading words  (Task 1 – 20 similar / 20 non-similar / 20 pseudo)
-- -------------------------------------------------------------
INSERT INTO `reading_words` (`id`, `word_text`, `category`, `display_order`) VALUES
-- similar
( 1,'cat',    'similar',     1),( 2,'bat',    'similar',     2),( 3,'hat',    'similar',     3),
( 4,'mat',    'similar',     4),( 5,'cap',    'similar',     5),( 6,'cup',    'similar',     6),
( 7,'map',    'similar',     7),( 8,'mop',    'similar',     8),( 9,'pin',    'similar',     9),
(10,'pen',    'similar',    10),(11,'sit',    'similar',    11),(12,'set',    'similar',    12),
(13,'bad',    'similar',    13),(14,'bed',    'similar',    14),(15,'big',    'similar',    15),
(16,'pig',    'similar',    16),(17,'fan',    'similar',    17),(18,'van',    'similar',    18),
(19,'tap',    'similar',    19),(20,'top',    'similar',    20),
-- non-similar
(21,'house',  'non_similar',  1),(22,'tree',   'non_similar',  2),(23,'school', 'non_similar',  3),
(24,'water',  'non_similar',  4),(25,'mother', 'non_similar',  5),(26,'father', 'non_similar',  6),
(27,'child',  'non_similar',  7),(28,'book',   'non_similar',  8),(29,'table',  'non_similar',  9),
(30,'chair',  'non_similar', 10),(31,'apple',  'non_similar', 11),(32,'bread',  'non_similar', 12),
(33,'car',    'non_similar', 13),(34,'road',   'non_similar', 14),(35,'sun',    'non_similar', 15),
(36,'moon',   'non_similar', 16),(37,'dog',    'non_similar', 17),(38,'friend', 'non_similar', 18),
(39,'teacher','non_similar', 19),(40,'garden', 'non_similar', 20),
-- pseudo
(41,'mip',  'pseudo', 1),(42,'lat',  'pseudo', 2),(43,'nob',  'pseudo', 3),(44,'kep',  'pseudo', 4),
(45,'sud',  'pseudo', 5),(46,'fik',  'pseudo', 6),(47,'zan',  'pseudo', 7),(48,'pel',  'pseudo', 8),
(49,'mot',  'pseudo', 9),(50,'rib',  'pseudo',10),(51,'dak',  'pseudo',11),(52,'vun',  'pseudo',12),
(53,'sep',  'pseudo',13),(54,'gol',  'pseudo',14),(55,'tim',  'pseudo',15),(56,'paf',  'pseudo',16),
(57,'lod',  'pseudo',17),(58,'kes',  'pseudo',18),(59,'bim',  'pseudo',19),(60,'ran',  'pseudo',20);

-- -------------------------------------------------------------
-- Reading text  (Task 2 – oral reading passage)
-- -------------------------------------------------------------
INSERT INTO `reading_texts` (`id`, `title`, `content`, `word_count`) VALUES
(1, 'Lina\'s Morning',
   'Lina wakes up in the morning. She eats bread and drinks milk then goes outside to play with her friend Sara in the yard. They run, laugh, and play hide and seek near the trees. Lina finds Sara and they are very happy. After playing, they sit under a tree and rest together.',
   53);

-- -------------------------------------------------------------
-- Letter similarity exercises  (Task 3 – 20 comparisons)
-- -------------------------------------------------------------
INSERT INTO `letter_similarity_exercises` (`id`, `exercise_number`, `group1`, `group2`, `is_same`, `display_order`) VALUES
( 1, 1, 'T Z R',          'T Z R',          1,  1),
( 2, 2, 'B L N',          'B L N',          1,  2),
( 3, 3, 'S D Z',          'Z D S',          0,  3),
( 4, 4, 'F Q R S',        'SH S Q F',       0,  4),
( 5, 5, 'F Q',            'F Q',            1,  5),
( 6, 6, 'B Y T',          'B Y T',          1,  6),
( 7, 7, 'A B M Y',        'A B M A',        0,  7),
( 8, 8, 'H KH J',         'H KH J',         1,  8),
( 9, 9, 'Y R W',          'Y S J D',        0,  9),
(10,10, 'D D D D',        'D D D D',        1, 10),
(11,11, 'A GH F',         'A GH F',         1, 11),
(12,12, 'Q S S',          'Q S S',          1, 12),
(13,13, 'W Z R',          'R R Z W',        0, 13),
(14,14, 'TH DH H',        'TH DH H',        1, 14),
(15,15, 'S SH S Z',       'S SH S Z',       1, 15),
(16,16, 'A L SH J R T',   'A L SH J R T',   1, 16),
(17,17, 'TH F Q KH',      'Q F TH KH',      0, 17),
(18,18, 'Y I L A',        'I Y L A',        0, 18),
(19,19, 'T TH B',         'T TH B',         1, 19),
(20,20, 'P R B',          'P R B',          1, 20);

-- -------------------------------------------------------------
-- Number sequences  (Task 4 – digit span, forward + reverse)
-- -------------------------------------------------------------
INSERT INTO `number_sequences` (`id`, `sequence_number`, `numbers`, `length`, `response_time_seconds`, `display_order`) VALUES
(1, 1, '[4, 7]',    2, 10, 1),
(2, 2, '[3, 8]',    2, 10, 2),
(3, 3, '[9, 2]',    2, 10, 3),
(4, 4, '[1, 5, 3]', 3, 15, 4),
(5, 5, '[2, 6, 4]', 3, 15, 5),
(6, 6, '[7, 0, 9]', 3, 15, 6);

-- -------------------------------------------------------------
-- Spelling words  (bonus spelling game – 10 words)
-- -------------------------------------------------------------
INSERT INTO `spelling_words` (`id`, `word`, `image_path`, `letters`, `display_order`) VALUES
( 1,'CAT',  '/assets/CAT.png',  '["C","A","T"]',         1),
( 2,'DOG',  '/assets/DOG.png',  '["D","O","G"]',         2),
( 3,'SUN',  '/assets/SUN.png',  '["S","U","N"]',         3),
( 4,'BALL', '/assets/BALL.png', '["B","A","L","L"]',     4),
( 5,'FISH', '/assets/FISH.png', '["F","I","S","H"]',     5),
( 6,'BOOK', '/assets/BOOK.png', '["B","O","O","K"]',     6),
( 7,'TREE', '/assets/TREE.png', '["T","R","E","E"]',     7),
( 8,'BIRD', '/assets/BIRD.png', '["B","I","R","D"]',     8),
( 9,'STAR', '/assets/STAR.png', '["S","T","A","R"]',     9),
(10,'MOON', '/assets/MOON.png', '["M","O","O","N"]',    10);


SET FOREIGN_KEY_CHECKS = 1;
COMMIT;