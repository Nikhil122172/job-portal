package com.jobportal.notification.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationRequest {
    private String to;
    private String subject;
    private String body;
    private String type;
    private Long userId;
    private Long applicationId;
    private String userName;
    private String jobTitle;
    private String companyName;
    private String status;
    private String ctaLabel;
    private String ctaUrl;
}
