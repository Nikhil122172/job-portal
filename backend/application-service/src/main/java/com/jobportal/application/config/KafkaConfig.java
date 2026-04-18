package com.jobportal.application.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * KafkaConfig for application-service.
 *
 * Producer: publishes ApplicationEvents (SUBMITTED, STATUS_CHANGED, WITHDRAWN).
 * Consumer: subscribes to job-events to handle job DELETED → notify applicants.
 *
 * Spring Boot auto-configures ConsumerFactory and ProducerFactory from
 * application.yml — we only declare topics and error handling here.
 */
@Configuration
@EnableKafka
public class KafkaConfig {

    @Bean
    public NewTopic applicationEventsTopic(
            @Value("${app.kafka.topics.application-events:application-events}") String topic) {
        return TopicBuilder.name(topic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic jobEventsTopic(
            @Value("${app.kafka.topics.job-events:job-events}") String topic) {
        return TopicBuilder.name(topic).partitions(3).replicas(1).build();
    }

    /**
     * Shared error handler: retry up to 3 times with 1-second backoff.
     * IllegalArgumentException (bad JSON / schema mismatch) is not retried.
     */
    @Bean
    public CommonErrorHandler kafkaErrorHandler() {
        DefaultErrorHandler handler = new DefaultErrorHandler(new FixedBackOff(1_000L, 3));
        handler.addNotRetryableExceptions(IllegalArgumentException.class);
        return handler;
    }
}
