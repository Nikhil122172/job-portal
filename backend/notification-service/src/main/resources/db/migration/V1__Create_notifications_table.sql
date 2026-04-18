-- Create notifications table for Notification Service
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    application_id BIGINT,
    recipient_email VARCHAR(255),
    subject VARCHAR(500),
    body LONGTEXT,
    type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    error_message TEXT,
    sent_at DATETIME,
    created_at DATETIME,
    INDEX idx_user_id (user_id),
    INDEX idx_application_id (application_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
