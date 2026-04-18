package com.jobportal.notification.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaOperations;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

/**
 * KafkaConfig – notification-service consumer configuration.
 *
 * Spring Boot auto-configures ConsumerFactory and
 * ConcurrentKafkaListenerContainerFactory from application.yml
 * (spring.kafka.consumer.*), so we do NOT re-declare them here.
 *
 * This class only handles:
 *   1. Topic creation (idempotent – Kafka ignores if topics already exist)
 *   2. A shared error handler with retry + dead-letter behaviour
 */
@Configuration
@EnableKafka
public class KafkaConfig {

    // ── Topic declarations ────────────────────────────────────────────────────

    @Bean
    public NewTopic jobEventsTopic(
            @Value("${app.kafka.topics.job-events:job-events}") String topic) {
        return TopicBuilder.name(topic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic jobEventsDltTopic(
            @Value("${app.kafka.topics.job-events:job-events}") String topic) {
        return TopicBuilder.name(topic + ".DLT").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic applicationEventsTopic(
            @Value("${app.kafka.topics.application-events:application-events}") String topic) {
        return TopicBuilder.name(topic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic applicationEventsDltTopic(
            @Value("${app.kafka.topics.application-events:application-events}") String topic) {
        return TopicBuilder.name(topic + ".DLT").partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic userEventsTopic(
            @Value("${app.kafka.topics.user-events:user-events}") String topic) {
        return TopicBuilder.name(topic).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic userEventsDltTopic(
            @Value("${app.kafka.topics.user-events:user-events}") String topic) {
        return TopicBuilder.name(topic + ".DLT").partitions(3).replicas(1).build();
    }

    // ── Error handler ─────────────────────────────────────────────────────────

    /**
     * Retries a failed message up to 3 times with a 1-second delay between
     * attempts.  IllegalArgumentException (e.g. bad JSON schema) is NOT
     * retried — it goes straight to the dead-letter topic (if configured).
     *
     * Spring Boot wires this bean into the auto-configured
     * ConcurrentKafkaListenerContainerFactory automatically when it is the
     * only CommonErrorHandler bean in the context.
     */
    @Bean
    public CommonErrorHandler kafkaErrorHandler(KafkaOperations<Object, Object> kafkaOperations) {
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
            kafkaOperations,
            (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition())
        );
        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1_000L, 3));
        handler.addNotRetryableExceptions(IllegalArgumentException.class);
        return handler;
    }
}
