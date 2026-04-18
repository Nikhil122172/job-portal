package com.jobportal.application.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationEvent {
    private Long id;
    private Long userId;
    private Long jobId;
    private Long recruiterId;
    private String applicantEmail;
    private String applicantName;
    private String recruiterEmail;
    private String recruiterName;
    private String jobTitle;
    private String companyName;
    private String status;
    private String action; // SUBMITTED, STATUS_CHANGED, WITHDRAWN
}
