package com.jobportal.job.kafka;

import com.jobportal.job.event.JobEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobEventProducer {

    private final KafkaTemplate<String, JobEvent> kafkaTemplate;

    @Value("${app.kafka.topics.job-events:job-events}")
    private String topic;

    public void publish(JobEvent event) {
        kafkaTemplate.send(topic, event.getId() != null ? event.getId().toString() : null, event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish job event {}", event, ex);
                    } else {
                        log.info("Published job event action={} id={} partition={} offset={}",
                                event.getAction(), event.getId(), result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}
