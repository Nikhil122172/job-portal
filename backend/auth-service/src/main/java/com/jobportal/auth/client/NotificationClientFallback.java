package com.jobportal.auth.client;

import com.jobportal.auth.dto.NotificationRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationClientFallback implements NotificationClient {

    @Override
    public void sendNotification(NotificationRequest request) {
        log.warn("Notification service unavailable, skipping notification to {}", request.getTo());
    }
}
