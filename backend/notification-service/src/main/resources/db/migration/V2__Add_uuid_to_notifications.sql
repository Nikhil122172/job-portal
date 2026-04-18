-- Add UUID support to notifications table (compatible with existing Long IDs)
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS uuid CHAR(36) NULL AFTER id;

-- Backfill UUID values for existing rows
UPDATE notifications
SET uuid = UUID()
WHERE uuid IS NULL OR uuid = '';

-- Enforce UUID presence and uniqueness
ALTER TABLE notifications
    MODIFY COLUMN uuid CHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_notifications_uuid ON notifications (uuid);
