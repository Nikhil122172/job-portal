package com.jobportal.notification.kafka;

import com.jobportal.notification.event.ApplicationEvent;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.Producer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.annotation.DirtiesContext;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = {
    "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
    "spring.kafka.consumer.auto-offset-reset=earliest",
    "spring.kafka.consumer.properties.spring.json.use.type.headers=true",
    "spring.kafka.consumer.properties.spring.json.trusted.packages=com.jobportal.*",
    "management.health.mail.enabled=false"
})
@EmbeddedKafka(partitions = 1, topics = {"application-events", "application-events.DLT"})
@DirtiesContext
class ApplicationEventDltIntegrationTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @MockBean
    private JavaMailSender mailSender;

    @BeforeEach
    void setUpMailFailure() {
        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("smtp down for integration test")).when(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void submittedEvent_routesToDlt_whenSmtpFailsAfterRetries() throws Exception {
        ApplicationEvent event = new ApplicationEvent();
        event.setId(9001L);
        event.setUserId(77L);
        event.setApplicantEmail("applicant@test.com");
        event.setApplicantName("Applicant One");
        event.setJobTitle("Backend Engineer");
        event.setCompanyName("CareerBridge");
        event.setAction("SUBMITTED");
        event.setStatus("APPLIED");

        publishApplicationEvent(event);

        try (Consumer<String, String> consumer = createDltConsumer("application-events-dlt-test")) {
            consumer.subscribe(List.of("application-events.DLT"));
            ConsumerRecord<String, String> dltRecord = waitForRecord(consumer, Duration.ofSeconds(25));
            assertThat(dltRecord.topic()).isEqualTo("application-events.DLT");
            assertThat(dltRecord.value()).contains("\"action\":\"SUBMITTED\"");
            assertThat(dltRecord.value()).contains("\"id\":9001");
        }
    }

    private void publishApplicationEvent(ApplicationEvent event) throws Exception {
        Map<String, Object> producerProps = KafkaTestUtils.producerProps(embeddedKafkaBroker);
        producerProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        producerProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        try (Producer<String, ApplicationEvent> producer = new KafkaProducer<>(producerProps)) {
            producer.send(new ProducerRecord<>("application-events", String.valueOf(event.getId()), event)).get();
        }
    }

    private Consumer<String, String> createDltConsumer(String groupId) {
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps(groupId, "false", embeddedKafkaBroker);
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        consumerProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        consumerProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        return new KafkaConsumer<>(consumerProps);
    }

    private ConsumerRecord<String, String> waitForRecord(Consumer<String, String> consumer, Duration timeout) {
        Instant deadline = Instant.now().plus(timeout);
        while (Instant.now().isBefore(deadline)) {
            var records = consumer.poll(Duration.ofMillis(500));
            if (!records.isEmpty()) {
                return records.iterator().next();
            }
        }
        fail("Timed out waiting for record on DLT topic");
        return null;
    }
}
