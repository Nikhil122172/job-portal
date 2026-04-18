-- CareerBridge database initialization
-- These databases are also auto-created by Spring Boot via createDatabaseIfNotExist=true
-- but pre-creating them speeds up startup

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS job_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS application_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Default admin user seed ───────────────────────────────────────────────
-- Password hash for 'Admin@123' using BCrypt (cost 10)
-- The DataSeeder in auth-service will also create this on startup if missing.
-- Including here allows a fresh DB to have the admin available immediately.
INSERT INTO auth_db.users (username, email, password, full_name, role, is_active, is_email_verified, created_at, updated_at)
SELECT 'admin', 'admin@jobportal.com',
       '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8RkpWoqPz6N6uZHpW2',
       'System Administrator', 'ROLE_ADMIN', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth_db.users WHERE email = 'admin@jobportal.com');
