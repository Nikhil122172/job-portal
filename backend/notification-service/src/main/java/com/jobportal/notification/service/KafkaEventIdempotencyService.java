package com.jobportal.notification.service;

import com.jobportal.notification.model.ProcessedKafkaEvent;
import com.jobportal.notification.repository.ProcessedKafkaEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaEventIdempotencyService {

    private final ProcessedKafkaEventRepository repository;

    @Transactional
    public boolean markIfNew(String eventKey) {
        try {
            // Save once per unique event key. Duplicate insert means event already handled.
            repository.save(ProcessedKafkaEvent.builder().eventKey(eventKey).build());
            return true;
        } catch (DataIntegrityViolationException ex) {
            log.info("Duplicate Kafka event skipped. eventKey={}", eventKey);
            return false;
        }
    }

    @Transactional
    public void unmark(String eventKey) {
        // Remove key when processing fails so Kafka retry can process it again.
        repository.deleteByEventKey(eventKey);
    }
}
