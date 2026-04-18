package com.jobportal.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@Slf4j
public class NotificationStreamService {

    private static final long SSE_TIMEOUT_MS = 0L;

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        userEmitters.computeIfAbsent(userId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ex) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("timestamp", Instant.now().toString())));
        } catch (IOException ex) {
            removeEmitter(userId, emitter);
            log.debug("Unable to send initial SSE handshake for userId={}", userId, ex);
        }

        return emitter;
    }

    public void publishNotification(Long userId, Long notificationId) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .id(String.valueOf(notificationId))
                        .data(Map.of("notificationId", notificationId)));
            } catch (Exception ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    @Scheduled(fixedDelay = 25000)
    public void sendHeartbeats() {
        if (userEmitters.isEmpty()) {
            return;
        }

        for (Map.Entry<Long, CopyOnWriteArrayList<SseEmitter>> entry : userEmitters.entrySet()) {
            Long userId = entry.getKey();
            for (SseEmitter emitter : entry.getValue()) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (Exception ex) {
                    removeEmitter(userId, emitter);
                }
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null) {
            return;
        }
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            userEmitters.remove(userId);
        }
    }
}