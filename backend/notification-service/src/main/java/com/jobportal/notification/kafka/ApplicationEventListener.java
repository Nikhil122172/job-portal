package com.jobportal.notification.kafka;

import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.event.ApplicationEvent;
import com.jobportal.notification.service.KafkaEventIdempotencyService;
import com.jobportal.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * ApplicationEventListener - consumes application-events from Kafka and
 * dispatches email notifications via NotificationService.
 *
 * Events handled:
 *  - SUBMITTED      -> confirmation email to the applicant
 *                    -> new-application email to the recruiter (if present)
 *  - STATUS_CHANGED -> status update email to the applicant
 *  - WITHDRAWN      -> withdrawal confirmation email to the applicant
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationEventListener {

    private final NotificationService notificationService;
    private final KafkaEventIdempotencyService idempotencyService;

    @KafkaListener(
        topics  = "${app.kafka.topics.application-events:application-events}",
        groupId = "notification-service"
    )
    public void onApplicationEvent(ApplicationEvent event) {
        log.info("Received application event: action={} id={} userId={} status={}",
                 event.getAction(), event.getId(), event.getUserId(), event.getStatus());

        switch (event.getAction()) {
            case "SUBMITTED" -> {
                sendApplicantSubmitted(event);
                sendRecruiterNewApplication(event);
            }
            case "STATUS_CHANGED" -> sendApplicantStatusChanged(event);
            case "WITHDRAWN" -> sendApplicantWithdrawn(event);
            default -> log.warn("Unhandled application event action: {}", event.getAction());
        }
    }

    private void sendApplicantSubmitted(ApplicationEvent event) {
        if (event.getApplicantEmail() == null || event.getApplicantEmail().isBlank()) {
            log.warn("Skipping applicant SUBMITTED email for applicationId={} - missing applicantEmail", event.getId());
            return;
        }
        String eventKey = "application:submitted:applicant:" + event.getId();
        // Skip if this exact message was already processed.
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }
        try {
            notificationService.sendNotificationSync(
                NotificationRequest.builder()
                    .to(event.getApplicantEmail())
                    .subject("Application received successfully")
                    .body("Your application has been received and is ready for review.")
                    .type("JOB_APPLIED")
                    .userId(event.getUserId())
                    .applicationId(event.getId())
                    .userName(event.getApplicantName())
                    .jobTitle(event.getJobTitle())
                    .companyName(event.getCompanyName())
                    .ctaLabel("View Application")
                    .ctaUrl("/applications")
                    .build()
            );
        } catch (RuntimeException ex) {
            // Undo key so retry can process this event again.
            idempotencyService.unmark(eventKey);
            throw ex;
        }
    }

    private void sendRecruiterNewApplication(ApplicationEvent event) {
        if (event.getRecruiterEmail() == null || event.getRecruiterEmail().isBlank()) {
            log.info("No recruiter email on SUBMITTED event for applicationId={} - recruiter notification skipped", event.getId());
            return;
        }
        String eventKey = "application:submitted:recruiter:" + event.getId();
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }
        try {
            notificationService.sendNotificationSync(
                NotificationRequest.builder()
                    .to(event.getRecruiterEmail())
                    .subject("New application for " + defaultValue(event.getJobTitle(), "your job"))
                    .body("A new candidate has applied for "
                        + defaultValue(event.getJobTitle(), "your job")
                        + " at "
                        + defaultValue(event.getCompanyName(), "your company")
                        + ".")
                    .type("NEW_APPLICATION")
                    .userId(event.getRecruiterId())
                    .applicationId(event.getId())
                    .userName(event.getRecruiterName())
                    .jobTitle(event.getJobTitle())
                    .companyName(event.getCompanyName())
                    .status(event.getStatus())
                    .ctaLabel("Review Candidate")
                    .ctaUrl("/recruiter/applications")
                    .build()
            );
        } catch (RuntimeException ex) {
            // Undo key so retry can process this event again.
            idempotencyService.unmark(eventKey);
            throw ex;
        }
    }

    private void sendApplicantStatusChanged(ApplicationEvent event) {
        if (event.getApplicantEmail() == null || event.getApplicantEmail().isBlank()) {
            log.warn("Skipping applicant STATUS_CHANGED email for applicationId={} - missing applicantEmail", event.getId());
            return;
        }
        String eventKey = "application:status-changed:" + event.getId() + ":" + defaultValue(event.getStatus(), "UNKNOWN");
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }
        try {
            notificationService.sendNotificationSync(
                NotificationRequest.builder()
                    .to(event.getApplicantEmail())
                    .subject("Update on your application")
                    .body("Your application status has been updated to: " + defaultValue(event.getStatus(), "UPDATED") + ".")
                    .type("STATUS_CHANGED")
                    .userId(event.getUserId())
                    .applicationId(event.getId())
                    .userName(event.getApplicantName())
                    .jobTitle(event.getJobTitle())
                    .companyName(event.getCompanyName())
                    .status(event.getStatus())
                    .ctaLabel("View Status")
                    .ctaUrl("/applications")
                    .build()
            );
        } catch (RuntimeException ex) {
            // Undo key so retry can process this event again.
            idempotencyService.unmark(eventKey);
            throw ex;
        }
    }

    private void sendApplicantWithdrawn(ApplicationEvent event) {
        if (event.getApplicantEmail() == null || event.getApplicantEmail().isBlank()) {
            log.warn("Skipping applicant WITHDRAWN email for applicationId={} - missing applicantEmail", event.getId());
            return;
        }
        String eventKey = "application:withdrawn:" + event.getId();
        if (!idempotencyService.markIfNew(eventKey)) {
            return;
        }
        try {
            notificationService.sendNotificationSync(
                NotificationRequest.builder()
                    .to(event.getApplicantEmail())
                    .subject("Application withdrawn")
                    .body("Your application has been withdrawn successfully. You can apply for other opportunities at any time.")
                    .type("APPLICATION_WITHDRAWN")
                    .userId(event.getUserId())
                    .applicationId(event.getId())
                    .userName(event.getApplicantName())
                    .jobTitle(event.getJobTitle())
                    .companyName(event.getCompanyName())
                    .ctaLabel("Explore Jobs")
                    .ctaUrl("/jobs")
                    .build()
            );
        } catch (RuntimeException ex) {
            // Undo key so retry can process this event again.
            idempotencyService.unmark(eventKey);
            throw ex;
        }
    }

    private String defaultValue(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}

