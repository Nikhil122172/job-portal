package com.jobportal.application.client;

import com.jobportal.application.dto.NotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
    name = "notification-service",
    fallback = NotificationClientFallback.class
)
public interface NotificationClient {
    @PostMapping("/api/v1/notifications/send")
    void sendNotification(@RequestBody NotificationRequest request);
}
