package com.jobportal.notification.repository;

import com.jobportal.notification.model.ProcessedKafkaEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedKafkaEventRepository extends JpaRepository<ProcessedKafkaEvent, Long> {
	void deleteByEventKey(String eventKey);
}
