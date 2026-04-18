package com.jobportal.application.cqrs.handler;

import com.jobportal.application.cqrs.query.GetApplicationByIdQuery;
import com.jobportal.application.cqrs.query.GetJobApplicantsQuery;
import com.jobportal.application.cqrs.query.GetUserApplicationsQuery;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.exception.ResourceNotFoundException;
import com.jobportal.application.exception.UnauthorizedException;
import com.jobportal.application.mapper.ApplicationMapper;
import com.jobportal.application.model.JobApplication;
import com.jobportal.application.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;

/**
 * CQRS Query Handler - all read operations for JobApplication.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationQueryHandler {

    private final ApplicationRepository applicationRepository;
    private final ApplicationMapper     applicationMapper;

    public Page<ApplicationDto.ApplicationResponse> handle(GetUserApplicationsQuery query) {
        int page = Math.max(0, query.getPage());
        int size = Math.min(Math.max(1, query.getSize()), 100);
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return applicationRepository.findByUserId(query.getUserId(), pageable)
            .map(applicationMapper::toResponse);
    }

    public Page<ApplicationDto.ApplicationResponse> handle(GetJobApplicantsQuery query) {
        int page = Math.max(0, query.getPage());
        int size = Math.min(Math.max(1, query.getSize()), 100);
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return applicationRepository.findByJobId(query.getJobId(), pageable)
            .map(applicationMapper::toResponse);
    }

    public ApplicationDto.ApplicationResponse handle(GetApplicationByIdQuery query) {
        JobApplication app = applicationRepository.findById(query.getApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
        if (!app.getUserId().equals(query.getUserId())
                && !app.getRecruiterId().equals(query.getUserId())
                && !"ROLE_ADMIN".equals(query.getRole()))
            throw new UnauthorizedException("Not authorized");
        return applicationMapper.toResponse(app);
    }

    public Page<ApplicationDto.ApplicationResponse> getRecruiterApplications(Long recruiterId, int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 100);
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return applicationRepository.findByRecruiterId(recruiterId, pageable)
            .map(applicationMapper::toResponse);
    }

    public ApplicationDto.ApplicationStatsResponse getUserStats(Long userId) {
        return ApplicationDto.ApplicationStatsResponse.builder()
            .totalApplications(applicationRepository.countByUserIdAndStatusNot(
                userId, JobApplication.ApplicationStatus.WITHDRAWN))
            .applied(applicationRepository.countByUserIdAndStatus(
                userId, JobApplication.ApplicationStatus.APPLIED))
            .underReview(applicationRepository.countByUserIdAndStatus(
                userId, JobApplication.ApplicationStatus.UNDER_REVIEW))
            .shortlisted(applicationRepository.countByUserIdAndStatus(
                userId, JobApplication.ApplicationStatus.SHORTLISTED))
            .rejected(applicationRepository.countByUserIdAndStatus(
                userId, JobApplication.ApplicationStatus.REJECTED))
            .offered(applicationRepository.countByUserIdAndStatus(
                userId, JobApplication.ApplicationStatus.OFFERED))
            .build();
    }

    public Page<ApplicationDto.ApplicationResponse> getAllApplications(int page, int size) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 200);
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return applicationRepository.findAll(pageable)
            .map(applicationMapper::toResponse);
    }

    public Page<ApplicationDto.ApplicationResponse> getAllApplications(int page, int size, String keyword, String status) {
        page = Math.max(0, page);
        size = Math.min(Math.max(1, size), 200);
        Pageable pageable = PageRequest.of(page, size, Sort.by("appliedAt").descending());
        return applicationRepository.searchApplications(normalizeBlank(keyword), parseStatus(status), pageable)
            .map(applicationMapper::toResponse);
    }

    private String normalizeBlank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private JobApplication.ApplicationStatus parseStatus(String value) {
        String normalized = normalizeBlank(value);
        if (normalized == null || "ALL".equalsIgnoreCase(normalized)) {
            return null;
        }
        try {
            return JobApplication.ApplicationStatus.valueOf(normalized);
        } catch (IllegalArgumentException ignored) {
            return null;
        }
    }
}
