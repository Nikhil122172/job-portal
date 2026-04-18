package com.jobportal.notification.event;

import lombok.Data;

@Data
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
    private String action;
}
