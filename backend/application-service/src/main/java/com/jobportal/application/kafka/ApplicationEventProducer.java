package com.jobportal.application.kafka;

import com.jobportal.application.event.ApplicationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationEventProducer {

    private final KafkaTemplate<String, ApplicationEvent> kafkaTemplate;

    @Value("${app.kafka.topics.application-events:application-events}")
    private String topic;

    public void publish(ApplicationEvent event) {
        kafkaTemplate.send(topic, event.getId() != null ? event.getId().toString() : null, event)
                .whenComplete((res, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish application event {}", event, ex);
                    } else {
                        log.info("Published application event action={} id={} partition={} offset={}",
                                event.getAction(), event.getId(), res.getRecordMetadata().partition(),
                                res.getRecordMetadata().offset());
                    }
                });
    }
}
