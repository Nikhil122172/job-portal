-- Add UUID support to users table (compatible with existing Long IDs)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS uuid CHAR(36) NULL AFTER id;

-- Backfill UUID values for existing rows
UPDATE users
SET uuid = UUID()
WHERE uuid IS NULL OR uuid = '';

-- Enforce UUID presence and uniqueness
ALTER TABLE users
    MODIFY COLUMN uuid CHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_users_uuid ON users (uuid);
