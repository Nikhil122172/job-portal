package com.jobportal.application.event;

import lombok.Data;
import java.util.List;

/**
 * Mirrors com.jobportal.job.event.JobEvent published by job-service.
 * Used by application-service to react to job lifecycle events.
 *
 * On DELETED: application-service finds all active applicants for
 * the deleted job (from its own DB) and notifies them via
 * notification-service, keeping each service decoupled.
 */
@Data
public class JobEvent {
    private Long         id;
    private String       title;
    private String       company;
    private String       action; // CREATED | UPDATED | DELETED
    private List<String> applicantEmails; // unused in application-service; populated here
}
