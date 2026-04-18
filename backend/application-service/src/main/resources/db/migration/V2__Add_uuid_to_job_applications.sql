-- Add UUID support to job_applications table (compatible with existing Long IDs)
ALTER TABLE job_applications
    ADD COLUMN IF NOT EXISTS uuid CHAR(36) NULL AFTER id;

-- Backfill UUID values for existing rows
UPDATE job_applications
SET uuid = UUID()
WHERE uuid IS NULL OR uuid = '';

-- Enforce UUID presence and uniqueness
ALTER TABLE job_applications
    MODIFY COLUMN uuid CHAR(36) NOT NULL;

CREATE UNIQUE INDEX uk_job_applications_uuid ON job_applications (uuid);
