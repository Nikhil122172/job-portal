package com.jobportal.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic Kafka event DTO used as the fallback deserialisation target when
 * spring.json.default.value.type is set.  Individual listeners declare their
 * own concrete event types (ApplicationEvent, JobEvent, UserEvent); this class
 * exists solely to satisfy the Kafka consumer configuration and to absorb any
 * unrecognised event shapes gracefully without a ClassNotFoundException.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventDTO {
    private Long   id;
    private String action;
    private String type;
    private String email;
    private String role;
    private Long   userId;
    private Long   jobId;
    private Long   applicationId;
    private Long   recruiterId;
    private String status;
    private String title;
    private String company;
    private String subject;
    private String body;
}
