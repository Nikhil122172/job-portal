package com.jobportal.notification.event;

import lombok.Data;
import java.util.List;

/**
 * Mirrors com.jobportal.job.event.JobEvent published by job-service.
 *
 * Fields:
 *   id              – database ID of the job
 *   title           – job title (for email body)
 *   company         – company name  (for email body)
 *   action          – CREATED | UPDATED | DELETED
 *   applicantEmails – populated only on DELETED; list of email addresses
 *                     of applicants whose applications were APPLIED or
 *                     UNDER_REVIEW at the time of deletion.
 *                     Null / empty for CREATED and UPDATED events.
 */
@Data
public class JobEvent {
    private Long         id;
    private String       title;
    private String       company;
    private String       action;
    private List<String> applicantEmails;
}
