-- Add UUID support to jobs table (compatible with existing Long IDs)
ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS uuid CHAR(36) NULL AFTER id;

-- Backfill UUID values for existing rows
UPDATE jobs
SET uuid = UUID()
WHERE uuid IS NULL OR uuid = '';

-- Enforce UUID presence and uniqueness
ALTER TABLE jobs
    MODIFY COLUMN uuid CHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_jobs_uuid ON jobs (uuid);
