package com.jobportal.notification.kafka;

import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.event.JobEvent;
import com.jobportal.notification.service.KafkaEventIdempotencyService;
import com.jobportal.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * JobEventListener – consumes job-events from Kafka and dispatches
 * notifications via NotificationService.
 *
 * Events handled:
 *  CREATED       → log only (recruiter created it; they already know)
 *  UPDATED       → log only (internal operational event)
 *  DELETED       → email every active applicant whose application was
 *                  APPLIED or UNDER_REVIEW at deletion time.
 *                  The job-service populates JobEvent.applicantEmails
 *                  before publishing so the notification-service stays
 *                  decoupled and never queries other services directly.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JobEventListener {

    private final NotificationService notificationService;
    private final KafkaEventIdempotencyService idempotencyService;

    @KafkaListener(
        topics  = "${app.kafka.topics.job-events:job-events}",
        groupId = "notification-service"
    )
    public void onJobEvent(JobEvent event) {
        log.info("Received job event: action={} id={} title='{}' company='{}'",
                 event.getAction(), event.getId(), event.getTitle(), event.getCompany());

        String eventKey = "job:" + nvl(event.getAction()) + ":" + nvl(event.getId());
        // Skip duplicate top-level job event.
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }

        switch (event.getAction()) {

            case "CREATED" ->
                log.info("Job created: id={} '{}' @ {}",
                         event.getId(), event.getTitle(), event.getCompany());

            case "UPDATED" ->
                log.info("Job updated: id={} '{}' @ {}",
                         event.getId(), event.getTitle(), event.getCompany());

            case "DELETED" -> handleJobDeleted(event);

            default ->
                log.warn("Unhandled job event action='{}' id={}", event.getAction(), event.getId());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Notifies every active applicant that the job they applied for has been
     * removed.  The list of recipient emails is carried in the event itself
     * (populated by job-service), keeping notification-service decoupled.
     */
    private void handleJobDeleted(JobEvent event) {
        List<String> recipients = event.getApplicantEmails();

        if (recipients == null || recipients.isEmpty()) {
            log.info("Job deleted id={} '{}' – no active applicants to notify.",
                     event.getId(), event.getTitle());
            return;
        }

        log.info("Job deleted id={} '{}' – notifying {} active applicant(s).",
                 event.getId(), event.getTitle(), recipients.size());

        for (String email : recipients) {
            if (email == null || email.isBlank()) continue;
            String emailEventKey = "job:deleted:" + nvl(event.getId()) + ":" + email.toLowerCase();
            // One key per job+email to avoid duplicate mails.
            if (!idempotencyService.markIfNew(emailEventKey)) {
                continue;
            }
            try {
                notificationService.sendNotificationSync(
                    NotificationRequest.builder()
                        .to(email)
                        .subject("Update on a job you applied for")
                        .body("The role you applied for is no longer available. Please continue exploring other opportunities on CareerBridge.")
                        .type("JOB_DELETED")
                        .jobTitle(event.getTitle())
                        .companyName(event.getCompany())
                        .ctaLabel("Browse Jobs")
                        .ctaUrl("/jobs")
                        .build()
                );
            } catch (RuntimeException ex) {
                // Remove key so retry can send this email again.
                idempotencyService.unmark(emailEventKey);
                throw ex;
            }
        }
    }

    private String nvl(Object value) {
        return value == null ? "null" : String.valueOf(value);
    }
}
