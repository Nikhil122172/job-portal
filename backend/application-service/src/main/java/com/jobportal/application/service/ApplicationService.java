package com.jobportal.application.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jobportal.application.cqrs.command.ApplyJobCommand;
import com.jobportal.application.cqrs.command.UpdateApplicationStatusCommand;
import com.jobportal.application.cqrs.command.WithdrawApplicationCommand;
import com.jobportal.application.cqrs.handler.ApplicationCommandHandler;
import com.jobportal.application.cqrs.handler.ApplicationQueryHandler;
import com.jobportal.application.cqrs.query.GetApplicationByIdQuery;
import com.jobportal.application.cqrs.query.GetJobApplicantsQuery;
import com.jobportal.application.cqrs.query.GetUserApplicationsQuery;
import com.jobportal.application.client.JobClient;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.exception.ResourceNotFoundException;
import com.jobportal.application.mapper.ApplicationMapper;
import com.jobportal.application.model.JobApplication;
import com.jobportal.application.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ApplicationService is a thin application-layer façade.
 *
 * CQRS separation:
 *   - Write operations -> {@link ApplicationCommandHandler}
 *   - Read  operations -> {@link ApplicationQueryHandler}
 *
 * MapStruct handles DTO ↔ Command ↔ Entity mapping via {@link ApplicationMapper}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationCommandHandler commandHandler;
    private final ApplicationQueryHandler   queryHandler;
    private final ApplicationMapper         applicationMapper;
    private final Cloudinary                cloudinary;
    private final ApplicationRepository     applicationRepository;
    private final JobClient                 jobClient;

    // These statuses are still considered active for job-deletion notifications.
    private static final List<JobApplication.ApplicationStatus> ACTIVE_STATUSES = List.of(
        JobApplication.ApplicationStatus.APPLIED,
        JobApplication.ApplicationStatus.UNDER_REVIEW,
        JobApplication.ApplicationStatus.SHORTLISTED,
        JobApplication.ApplicationStatus.INTERVIEW_SCHEDULED
    );

    // ── Commands ──────────────────────────────────────────────────────────────

    public ApplicationDto.ApplicationResponse apply(ApplicationDto.ApplyRequest req, Long userId) {
        ApplyJobCommand command = applicationMapper.toApplyCommand(req);
        command.setUserId(userId);
        command.setJobId(resolveJobId(req.getJobId()));
        return commandHandler.handle(command);
    }

    public ApplicationDto.ApplicationResponse uploadResumeAndApply(
            ApplicationDto.ApplyRequest req, Long userId, MultipartFile resume) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(resume.getBytes(),
            ObjectUtils.asMap("folder", "job-portal/resumes", "resource_type", "raw"));
        req.setResumeUrl((String) result.get("secure_url"));
        req.setResumePublicId((String) result.get("public_id"));
        return apply(req, userId);
    }

    public ApplicationDto.ApplicationResponse updateStatus(
            Long id, ApplicationDto.UpdateStatusRequest req, Long recruiterId, String role) {
        return commandHandler.handle(UpdateApplicationStatusCommand.builder()
            .applicationId(id)
            .status(req.getStatus())
            .statusNote(req.getStatusNote())
            .recruiterId(recruiterId)
            .role(role)
            .build());
    }

    public void withdrawApplication(Long id, Long userId) {
        commandHandler.handle(WithdrawApplicationCommand.builder()
            .applicationId(id)
            .userId(userId)
            .build());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    public Page<ApplicationDto.ApplicationResponse> getUserApplications(Long userId, int page, int size) {
        return queryHandler.handle(GetUserApplicationsQuery.builder()
            .userId(userId).page(page).size(size).build());
    }

    public Page<ApplicationDto.ApplicationResponse> getJobApplicants(Long jobId, int page, int size) {
        return queryHandler.handle(GetJobApplicantsQuery.builder()
            .jobId(jobId).page(page).size(size).build());
    }

    public Page<ApplicationDto.ApplicationResponse> getRecruiterApplications(Long recruiterId, int page, int size) {
        return queryHandler.getRecruiterApplications(recruiterId, page, size);
    }

    public ApplicationDto.ApplicationResponse getApplicationById(Long id, Long userId, String role) {
        return queryHandler.handle(GetApplicationByIdQuery.builder()
            .applicationId(id).userId(userId).role(role).build());
    }

    public ApplicationDto.ApplicationStatsResponse getUserStats(Long userId) {
        return queryHandler.getUserStats(userId);
    }

    public Page<ApplicationDto.ApplicationResponse> getAllApplications(int page, int size) {
        return queryHandler.getAllApplications(page, size);
    }

    public Page<ApplicationDto.ApplicationResponse> getAllApplications(int page, int size, String keyword, String status) {
        return queryHandler.getAllApplications(page, size, keyword, status);
    }

    public Page<ApplicationDto.ApplicationResponse> getJobApplicantsByReference(String jobRef, int page, int size) {
        return getJobApplicants(resolveJobId(jobRef), page, size);
    }

    public ApplicationDto.ApplicationResponse getApplicationByReference(String appRef, Long userId, String role) {
        return getApplicationById(resolveApplicationId(appRef), userId, role);
    }

    public ApplicationDto.ApplicationResponse updateStatusByReference(String appRef, ApplicationDto.UpdateStatusRequest req, Long recruiterId, String role) {
        return updateStatus(resolveApplicationId(appRef), req, recruiterId, role);
    }

    public void withdrawApplicationByReference(String appRef, Long userId) {
        withdrawApplication(resolveApplicationId(appRef), userId);
    }

    public List<String> getActiveApplicantEmailsByJobReference(String jobRef) {
        Long jobId = resolveJobId(jobRef);
        // Return unique normalized emails only.
        return applicationRepository.findByJobIdAndStatusIn(jobId, ACTIVE_STATUSES)
            .stream()
            .map(a -> a.getApplicantEmail() != null ? a.getApplicantEmail().trim() : null)
            .filter(email -> email != null && !email.isBlank())
            .map(String::toLowerCase)
            .distinct()
            .collect(Collectors.toList());
    }

    private Long resolveApplicationId(String appRef) {
        if (appRef == null || appRef.isBlank()) {
            throw new ResourceNotFoundException("Application not found");
        }
        try {
            return Long.parseLong(appRef);
        } catch (NumberFormatException ignored) {
            return applicationRepository.findByUuid(appRef)
                .map(a -> a.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        }
    }

    private Long resolveJobId(String jobRef) {
        if (jobRef == null || jobRef.isBlank()) {
            throw new ResourceNotFoundException("Job not found");
        }
        try {
            return Long.parseLong(jobRef);
        } catch (NumberFormatException ignored) {
            var job = jobClient.getJobById(jobRef);
            if (job == null || job.getId() == null) {
                throw new ResourceNotFoundException("Job not found");
            }
            return job.getId();
        }
    }
}
