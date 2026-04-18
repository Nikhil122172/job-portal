package com.jobportal.application.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationRequest {
    private String to;
    private String subject;
    private String body;
    private String type; // JOB_APPLIED, STATUS_CHANGED
    private Long userId;
    private Long applicationId;
    private String userName;
    private String jobTitle;
    private String companyName;
    private String status;
    private String ctaLabel;
    private String ctaUrl;
}
