package com.jobportal.notification.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DeadLetterEventListener {

    @KafkaListener(
        topics = "${app.kafka.topics.application-events:application-events}.DLT",
        groupId = "notification-service-dlt"
    )
    public void onApplicationEventDlt(Object payload) {
        log.error("Application event moved to DLT. payload={}", payload);
    }

    @KafkaListener(
        topics = "${app.kafka.topics.user-events:user-events}.DLT",
        groupId = "notification-service-dlt"
    )
    public void onUserEventDlt(Object payload) {
        log.error("User event moved to DLT. payload={}", payload);
    }

    @KafkaListener(
        topics = "${app.kafka.topics.job-events:job-events}.DLT",
        groupId = "notification-service-dlt"
    )
    public void onJobEventDlt(Object payload) {
        log.error("Job event moved to DLT. payload={}", payload);
    }
}
