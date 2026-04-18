package com.jobportal.notification.repository;
import com.jobportal.notification.model.Notification;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserId(Long userId, Pageable pageable);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    Optional<Notification> findByUuid(String uuid);
    Optional<Notification> findByUuidAndUserId(String uuid, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.isRead = true, n.readAt = :readAt where n.id = :id and n.userId = :userId")
    int markAsRead(Long id, Long userId, LocalDateTime readAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.isRead = true, n.readAt = :readAt where n.userId = :userId and n.isRead = false")
    int markAllAsRead(Long userId, LocalDateTime readAt);

    long deleteByUserId(Long userId);
    long deleteByIdAndUserId(Long id, Long userId);

    long countByStatus(Notification.NotificationStatus status);
}
