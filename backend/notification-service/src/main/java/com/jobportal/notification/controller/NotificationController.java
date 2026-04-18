package com.jobportal.notification.controller;

import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.model.Notification;
import com.jobportal.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController @RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Notification management APIs")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    @Operation(summary = "Send a notification (internal use)", description = "Sends an email notification and persists it")
    public ResponseEntity<Void> send(@RequestBody NotificationRequest req) {
        notificationService.sendNotification(req);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/my")
    @Operation(summary = "Get my notifications", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Page<Notification>> getMy(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(notificationService.getUserNotifications(userId, page, size));
    }

    @GetMapping(value = "/my/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to my notification stream", security = @SecurityRequirement(name = "Bearer Auth"))
    public SseEmitter streamMyNotifications(@RequestHeader("X-User-Id") Long userId) {
        return notificationService.subscribe(userId);
    }

    @PatchMapping("/my/{notificationId}/read")
    @Operation(summary = "Mark notification as read", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Void> markAsRead(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable String notificationId) {
        return notificationService.markAsReadByReference(userId, notificationId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @PatchMapping("/my/read-all")
    @Operation(summary = "Mark all my notifications as read", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Void> markAllAsRead(@RequestHeader("X-User-Id") Long userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/my")
    @Operation(summary = "Clear all my notifications", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Void> clearMy(@RequestHeader("X-User-Id") Long userId) {
        notificationService.clearUserNotifications(userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/my/{notificationId}")
    @Operation(summary = "Delete one notification", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Void> deleteOne(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable String notificationId) {
        return notificationService.deleteUserNotificationByReference(userId, notificationId)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
