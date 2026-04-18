package com.jobportal.application.cqrs.handler;

import com.jobportal.application.client.AuthClient;
import com.jobportal.application.client.JobClient;
import com.jobportal.application.cqrs.command.ApplyJobCommand;
import com.jobportal.application.cqrs.command.UpdateApplicationStatusCommand;
import com.jobportal.application.cqrs.command.WithdrawApplicationCommand;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.dto.JobClientDto;
import com.jobportal.application.dto.UserClientDto;
import com.jobportal.application.event.ApplicationEvent;
import com.jobportal.application.exception.DuplicateApplicationException;
import com.jobportal.application.exception.ResourceNotFoundException;
import com.jobportal.application.exception.UnauthorizedException;
import com.jobportal.application.kafka.ApplicationEventProducer;
import com.jobportal.application.mapper.ApplicationMapper;
import com.jobportal.application.model.JobApplication;
import com.jobportal.application.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * CQRS Command Handler - all write (CUD) operations for JobApplication.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationCommandHandler {

    private final ApplicationRepository    applicationRepository;
    private final ApplicationMapper        applicationMapper;
    private final AuthClient               authClient;
    private final JobClient                jobClient;
    private final ApplicationEventProducer eventProducer;

    // ── Apply ─────────────────────────────────────────────────────────────────

    @Transactional
    public ApplicationDto.ApplicationResponse handle(ApplyJobCommand command) {
        // Prevent duplicate applications (but allow re-apply after withdrawal)
        JobApplication existing = applicationRepository
            .findByUserIdAndJobId(command.getUserId(), command.getJobId())
            .orElse(null);

        if (existing != null && existing.getStatus() != JobApplication.ApplicationStatus.WITHDRAWN)
            throw new DuplicateApplicationException("You have already applied for this job");

        // Fetch user and job info via Feign
        UserClientDto user = authClient.getUserById(command.getUserId());
        JobClientDto  job  = jobClient.getJobById(String.valueOf(command.getJobId()));

        if (job == null || "CLOSED".equals(job.getStatus()))
            throw new ResourceNotFoundException("Job is not available");

        JobApplication application;
        if (existing != null) {
            // Re-apply after withdrawal - update fields in-place
            existing.setStatus(JobApplication.ApplicationStatus.APPLIED);
            existing.setStatusNote(null);
            existing.setRecruiterId(job.getRecruiterId());
            existing.setCoverLetter(command.getCoverLetter());
            existing.setResumeUrl(command.getResumeUrl());
            existing.setResumePublicId(command.getResumePublicId());
            existing.setApplicantName(user.getFullName());
            existing.setApplicantEmail(user.getEmail());
            existing.setApplicantPhone(user.getPhoneNumber());
            existing.setJobTitle(job.getTitle());
            existing.setCompanyName(job.getCompany());
            existing.setAppliedAt(java.time.LocalDateTime.now());
            application = existing;
        } else {
            application = applicationMapper.toEntity(command);
            application.setUserId(command.getUserId());
            application.setRecruiterId(job.getRecruiterId());
            application.setApplicantName(user.getFullName());
            application.setApplicantEmail(user.getEmail());
            application.setApplicantPhone(user.getPhoneNumber());
            application.setJobTitle(job.getTitle());
            application.setCompanyName(job.getCompany());
        }

        application = applicationRepository.save(application);

        UserClientDto recruiter = null;
        try {
            recruiter = authClient.getUserById(job.getRecruiterId());
        } catch (Exception e) {
            log.warn("Could not fetch recruiter details for jobId={}: {}", job.getId(), e.getMessage());
        }

        try {
            eventProducer.publish(ApplicationEvent.builder()
                .id(application.getId())
                .userId(command.getUserId())
                .jobId(command.getJobId())
                .recruiterId(job.getRecruiterId())
                .applicantEmail(user.getEmail())
                .applicantName(user.getFullName())
                .recruiterEmail(recruiter != null ? recruiter.getEmail() : null)
                .recruiterName(recruiter != null ? recruiter.getFullName() : null)
                .jobTitle(job.getTitle())
                .companyName(job.getCompany())
                .status(application.getStatus().name())
                .action("SUBMITTED")
                .build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for application SUBMITTED id={}: {}", application.getId(), ex.getMessage());
        }

        try { jobClient.incrementApplicationCount(command.getJobId()); }
        catch (Exception e) { log.warn("Could not increment job application count"); }

        return applicationMapper.toResponse(application);
    }

    // ── Update status ─────────────────────────────────────────────────────────

    @Transactional
    public ApplicationDto.ApplicationResponse handle(UpdateApplicationStatusCommand command) {
        JobApplication app = applicationRepository.findById(command.getApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!app.getRecruiterId().equals(command.getRecruiterId())
                && !"ROLE_ADMIN".equals(command.getRole()))
            throw new UnauthorizedException("Not authorized to update this application");

        app.setStatus(command.getStatus());
        if (command.getStatusNote() != null) app.setStatusNote(command.getStatusNote());
        app = applicationRepository.save(app);

        try {
            eventProducer.publish(ApplicationEvent.builder()
                .id(app.getId()).userId(app.getUserId()).jobId(app.getJobId())
                .recruiterId(app.getRecruiterId())
                .applicantEmail(app.getApplicantEmail())
                .applicantName(app.getApplicantName())
                .jobTitle(app.getJobTitle())
                .companyName(app.getCompanyName())
                .status(app.getStatus().name())
                .action("STATUS_CHANGED").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for STATUS_CHANGED id={}: {}", app.getId(), ex.getMessage());
        }

        return applicationMapper.toResponse(app);
    }

    // ── Withdraw ──────────────────────────────────────────────────────────────

    @Transactional
    public void handle(WithdrawApplicationCommand command) {
        JobApplication app = applicationRepository.findById(command.getApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!app.getUserId().equals(command.getUserId()))
            throw new UnauthorizedException("Not authorized");

        app.setStatus(JobApplication.ApplicationStatus.WITHDRAWN);
        applicationRepository.save(app);

        try {
            eventProducer.publish(ApplicationEvent.builder()
                .id(app.getId()).userId(app.getUserId()).jobId(app.getJobId())
                .recruiterId(app.getRecruiterId())
                .applicantEmail(app.getApplicantEmail())
                .applicantName(app.getApplicantName())
                .jobTitle(app.getJobTitle())
                .companyName(app.getCompanyName())
                .status(app.getStatus().name())
                .action("WITHDRAWN").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for WITHDRAWN application id={}: {}", app.getId(), ex.getMessage());
        }
    }
}
