-- CMA Tool Database Schema
-- Aurora MySQL compatible with GeoSpatial support

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `brokerage` VARCHAR(255),
  `phone` VARCHAR(50),
  `avatar_url` VARCHAR(500),
  `canva_access_token_enc` TEXT,
  `canva_refresh_token_enc` TEXT,
  `canva_token_expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `subject_properties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mls_number` VARCHAR(50),
  `street_address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `zip` VARCHAR(20) NOT NULL,
  `country` VARCHAR(10) NOT NULL DEFAULT 'CA',
  `latitude` DECIMAL(10, 7),
  `longitude` DECIMAL(10, 7),
  `location` POINT NOT NULL,
  `property_type` VARCHAR(100),
  `style` VARCHAR(100),
  `bedrooms` INT,
  `bedrooms_plus` INT,
  `bathrooms` INT,
  `bathrooms_half` INT,
  `sqft` INT,
  `lot_sqft` INT,
  `year_built` INT,
  `garage` VARCHAR(100),
  `garage_spaces` INT,
  `basement` VARCHAR(100),
  `heating` VARCHAR(100),
  `cooling` VARCHAR(100),
  `pool` VARCHAR(100),
  `list_price` DECIMAL(12, 2),
  `taxes_annual` DECIMAL(10, 2),
  `maintenance_fee` DECIMAL(10, 2),
  `days_on_market` INT,
  `description` TEXT,
  `images` JSON,
  `data_json` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  SPATIAL INDEX `idx_subject_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `cma_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `status` ENUM('draft', 'in_progress', 'completed', 'archived') NOT NULL DEFAULT 'draft',
  `subject_property_id` INT,
  `price_low` DECIMAL(12, 2),
  `price_mid` DECIMAL(12, 2),
  `price_high` DECIMAL(12, 2),
  `notes` TEXT,
  `canva_design_id` VARCHAR(255),
  `canva_design_url` VARCHAR(500),
  `pdf_url` VARCHAR(500),
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`subject_property_id`) REFERENCES `subject_properties`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `comparable_properties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cma_report_id` INT NOT NULL,
  `mls_number` VARCHAR(50),
  `street_address` VARCHAR(255) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(50) NOT NULL,
  `zip` VARCHAR(20) NOT NULL,
  `latitude` DECIMAL(10, 7),
  `longitude` DECIMAL(10, 7),
  `location` POINT NOT NULL,
  `property_type` VARCHAR(100),
  `style` VARCHAR(100),
  `bedrooms` INT,
  `bedrooms_plus` INT,
  `bathrooms` INT,
  `bathrooms_half` INT,
  `sqft` INT,
  `lot_sqft` INT,
  `year_built` INT,
  `garage` VARCHAR(100),
  `garage_spaces` INT,
  `basement` VARCHAR(100),
  `heating` VARCHAR(100),
  `cooling` VARCHAR(100),
  `pool` VARCHAR(100),
  `sold_price` DECIMAL(12, 2),
  `list_price` DECIMAL(12, 2),
  `sold_date` DATE,
  `days_on_market` INT,
  `distance_km` DECIMAL(8, 3),
  `adjusted_price` DECIMAL(12, 2),
  `total_adjustment` DECIMAL(12, 2),
  `weight` DECIMAL(5, 4),
  `images` JSON,
  `data_json` JSON,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cma_report_id`) REFERENCES `cma_reports`(`id`) ON DELETE CASCADE,
  SPATIAL INDEX `idx_comp_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `adjustments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comparable_id` INT NOT NULL,
  `category` ENUM('location', 'size', 'bedrooms', 'bathrooms', 'age', 'lot_size', 'garage', 'basement', 'condition', 'pool', 'other') NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `subject_value` VARCHAR(100),
  `comp_value` VARCHAR(100),
  `auto_amount` DECIMAL(12, 2) NOT NULL,
  `adjustment_amount` DECIMAL(12, 2) NOT NULL,
  `is_manual` BOOLEAN NOT NULL DEFAULT FALSE,
  `notes` TEXT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`comparable_id`) REFERENCES `comparable_properties`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `adjustment_presets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT,
  `category` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `amount_per_unit` DECIMAL(12, 2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `market_snapshots` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `cma_report_id` INT NOT NULL,
  `period` VARCHAR(20) NOT NULL,
  `avg_price` DECIMAL(12, 2),
  `median_price` DECIMAL(12, 2),
  `avg_dom` INT,
  `active_count` INT,
  `sold_count` INT,
  `new_count` INT,
  `avg_price_per_sqft` DECIMAL(10, 2),
  `absorption_rate` DECIMAL(5, 2),
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cma_report_id`) REFERENCES `cma_reports`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `listing_cache` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mls_number` VARCHAR(50) NOT NULL UNIQUE,
  `board_id` INT,
  `latitude` DECIMAL(10, 7),
  `longitude` DECIMAL(10, 7),
  `location` POINT NOT NULL,
  `list_price` DECIMAL(12, 2),
  `sold_price` DECIMAL(12, 2),
  `status` VARCHAR(10),
  `property_type` VARCHAR(100),
  `data_json` JSON NOT NULL,
  `fetched_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  SPATIAL INDEX `idx_cache_location` (`location`),
  INDEX `idx_cache_mls` (`mls_number`),
  INDEX `idx_cache_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default adjustment presets
INSERT INTO `adjustment_presets` (`category`, `label`, `amount_per_unit`, `unit`, `is_default`) VALUES
  ('size', 'Living Area (per sqft)', 150.00, 'sqft', TRUE),
  ('bedrooms', 'Bedrooms', 15000.00, 'bedroom', TRUE),
  ('bathrooms', 'Bathrooms', 10000.00, 'bathroom', TRUE),
  ('age', 'Age (per year)', 1000.00, 'year', TRUE),
  ('lot_size', 'Lot Size (per sqft)', 20.00, 'sqft', TRUE),
  ('garage', 'Garage Spaces', 15000.00, 'space', TRUE),
  ('basement', 'Basement (finished vs not)', 25000.00, 'level', TRUE),
  ('pool', 'Pool', 20000.00, 'presence', TRUE),
  ('location', 'Location (per km)', -2000.00, 'km', TRUE),
  ('condition', 'Condition (per grade)', 10000.00, 'grade', TRUE);

-- Seed a default user for development
INSERT INTO `users` (`email`, `name`, `password_hash`) VALUES
  ('chadges@canva.com', 'Chris Hadges', '$2a$10$placeholder_hash_for_dev');
