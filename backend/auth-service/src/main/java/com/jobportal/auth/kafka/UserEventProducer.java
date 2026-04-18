package com.jobportal.auth.kafka;

import com.jobportal.auth.event.UserEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventProducer {

    private final KafkaTemplate<String, UserEvent> kafkaTemplate;

    @Value("${app.kafka.topics.user-events:user-events}")
    private String topic;

    public void publish(UserEvent event) {
        kafkaTemplate.send(topic, event.getId() != null ? event.getId().toString() : null, event)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish user event {}", event, ex);
                    } else {
                        log.info("Published user event action={} id={} partition={} offset={}",
                                event.getAction(), event.getId(), res.getRecordMetadata().partition(),
                                res.getRecordMetadata().offset());
                    }
                });
    }
}
