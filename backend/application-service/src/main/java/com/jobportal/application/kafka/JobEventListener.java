package com.jobportal.application.kafka;

import com.jobportal.application.event.JobEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * application-service no longer sends notifications from job-events.
 * Notification side-effects are handled by notification-service via Kafka.
 */
@Component
@Slf4j
public class JobEventListener {

    @KafkaListener(
        topics  = "${app.kafka.topics.job-events:job-events}",
        groupId = "application-service"
    )
    public void onJobEvent(JobEvent event) {
        log.info("Observed job event in application-service: action={} jobId={} title='{}'",
            event.getAction(), event.getId(), event.getTitle());
    }
}
