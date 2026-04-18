package com.jobportal.notification.kafka;

import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.event.UserEvent;
import com.jobportal.notification.service.KafkaEventIdempotencyService;
import com.jobportal.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * UserEventListener - consumes user-events from Kafka and dispatches
 * the appropriate notification via NotificationService.
 *
 * Events handled:
 *  - REGISTERED      -> welcome email (fallback in case the auth-service
 *                       direct call failed or was skipped)
 *  - TOGGLED_STATUS  -> account activated / deactivated email
 *  - DELETED         -> account deletion confirmation email
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventListener {

    private final NotificationService notificationService;
    private final KafkaEventIdempotencyService idempotencyService;

    @KafkaListener(
        topics   = "${app.kafka.topics.user-events:user-events}",
        groupId  = "notification-service"
    )
    public void onUserEvent(UserEvent event) {
        log.info("Received user event: action={} id={} email={}",
                 event.getAction(), event.getId(), event.getEmail());

        String eventKey = "user:" + nvl(event.getAction()) + ":" + nvl(event.getId()) + ":" + nvl(event.getEmail());
        // Skip if event already processed once.
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }

        if (event.getEmail() == null || event.getEmail().isBlank()) {
            log.warn("Skipping user event - missing email: {}", event);
            return;
        }

        try {
            switch (event.getAction()) {
                case "REGISTERED" -> notificationService.sendNotificationSync(
                    NotificationRequest.builder()
                        .to(event.getEmail())
                        .subject("Welcome to CareerBridge")
                        .body("Your account has been created successfully. Welcome to CareerBridge - start exploring opportunities today!")
                        .type("WELCOME")
                        .userId(event.getId())
                        .ctaLabel("Open CareerBridge")
                        .ctaUrl("/login")
                        .build()
                );
                case "TOGGLED_STATUS" -> notificationService.sendNotificationSync(
                    NotificationRequest.builder()
                        .to(event.getEmail())
                        .subject("CareerBridge account status update")
                        .body("Your account status has been updated by an administrator. If you have questions, please contact support.")
                        .type("ACCOUNT_STATUS")
                        .userId(event.getId())
                        .ctaLabel("Review Account")
                        .ctaUrl("/profile")
                        .build()
                );
                case "DELETED" -> {
                    if (event.getEmail() != null) {
                        notificationService.sendNotificationSync(
                            NotificationRequest.builder()
                                .to(event.getEmail())
                                .subject("CareerBridge account deleted")
                                .body("Your CareerBridge account has been permanently deleted. Thank you for using our platform.")
                                .type("ACCOUNT_DELETED")
                                .userId(event.getId())
                                .ctaLabel("Contact Support")
                                .ctaUrl("/contact")
                                .build()
                        );
                    }
                }
                default -> log.warn("Unhandled user event action: {}", event.getAction());
            }
        } catch (RuntimeException ex) {
            // Remove key so retry can process again.
            idempotencyService.unmark(eventKey);
            throw ex;
        }
    }

    private String nvl(Object value) {
        return value == null ? "null" : String.valueOf(value);
    }
}

