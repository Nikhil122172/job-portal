package com.jobportal.job.cqrs.handler;

import com.jobportal.job.client.AuthClient;
import com.jobportal.job.cqrs.query.GetJobByIdQuery;
import com.jobportal.job.cqrs.query.GetRecruiterJobsQuery;
import com.jobportal.job.cqrs.query.SearchJobsQuery;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.dto.UserClientDto;
import com.jobportal.job.exception.ResourceNotFoundException;
import com.jobportal.job.mapper.JobMapper;
import com.jobportal.job.model.Job;
import com.jobportal.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CQRS Query Handler - handles all read operations for Job.
 *
 * Responsibility: look up data, apply caching, enrich with Feign data.
 * No writes happen here; mutations live in {@link JobCommandHandler}.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JobQueryHandler {

    private final JobRepository jobRepository;
    private final JobMapper     jobMapper;
    private final AuthClient    authClient;

    // ── Single job ────────────────────────────────────────────────────────────

    /**
     * Fetch a job by ID and increment its view counter.
     * View increment is a lightweight write, acceptable on the read path.
     */
    @Transactional
    public JobDto.JobResponse handle(GetJobByIdQuery query, boolean incrementViewCount) {
        Job job = jobRepository.findById(query.getJobId())
            .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + query.getJobId()));
        if (incrementViewCount) {
            jobRepository.incrementViews(query.getJobId());
            job.setViewsCount(job.getViewsCount() + 1);
        }
        return enrich(jobMapper.toResponse(job), job.getRecruiterId());
    }

    // ── Paginated search ──────────────────────────────────────────────────────

    public Page<JobDto.JobResponse> handle(SearchJobsQuery query) {
        int page   = Math.max(0, query.getPage());
        int size   = Math.min(Math.max(1, query.getSize()), 100);
        String sort = (query.getSortBy() == null || query.getSortBy().isBlank())
                      ? "createdAt" : query.getSortBy();
        Pageable pageable = PageRequest.of(page, size, Sort.by(sort).descending());

        // Safe enum parse - invalid strings treated as null (no filter)
        Job.JobType        jobType  = safeEnum(Job.JobType.class,        query.getJobType());
        Job.ExperienceLevel expLevel = safeEnum(Job.ExperienceLevel.class, query.getExperienceLevel());
        String keyword = normalizeBlank(query.getKeyword());
        String location = normalizeBlank(query.getLocation());
        String category = normalizeBlank(query.getCategory());
        Job.JobStatus status = safeEnum(Job.JobStatus.class, query.getStatus());

        return jobRepository.searchJobs(
            keyword, location, category,
            jobType, expLevel, query.getIsRemote(), status, pageable
        ).map(job -> jobMapper.toResponse(job));
    }

    // ── Recruiter's jobs ──────────────────────────────────────────────────────

    public Page<JobDto.JobResponse> handle(GetRecruiterJobsQuery query) {
        int page = Math.max(0, query.getPage());
        int size = Math.min(Math.max(1, query.getSize()), 100);
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findByRecruiterId(query.getRecruiterId(), pageable)
            .map(job -> jobMapper.toResponse(job));
    }

    // ── Stats & categories ────────────────────────────────────────────────────

    @Cacheable(cacheNames = "job:stats", key = "'all'")
    public JobDto.JobStatsResponse getStats() {
        return JobDto.JobStatsResponse.builder()
            .totalJobs(jobRepository.count())
            .activeJobs(jobRepository.countByStatus(Job.JobStatus.ACTIVE))
            .closedJobs(jobRepository.countByStatus(Job.JobStatus.CLOSED))
            .draftJobs(jobRepository.countByStatus(Job.JobStatus.DRAFT))
            .build();
    }

    private static final List<String> DEFAULT_CATEGORIES = List.of(
        "Technology", "Finance", "Healthcare", "Marketing", "Sales",
        "Human Resources", "Design", "Operations", "Legal", "Education",
        "Engineering", "Customer Service", "Data Science", "General"
    );

    @Cacheable(cacheNames = "job:categories", key = "'all'")
    public List<String> getCategories() {
        List<String> dbCategories = jobRepository.findAllCategories();
        // Merge DB categories with defaults; deduplicate while preserving order
        if (dbCategories == null || dbCategories.isEmpty()) {
            return DEFAULT_CATEGORIES;
        }
        java.util.LinkedHashSet<String> merged = new java.util.LinkedHashSet<>(dbCategories);
        DEFAULT_CATEGORIES.forEach(merged::add);
        return new java.util.ArrayList<>(merged);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Enrich response with recruiter name/email via Feign (best-effort). */
    private JobDto.JobResponse enrich(JobDto.JobResponse response, Long recruiterId) {
        try {
            UserClientDto recruiter = authClient.getUserById(recruiterId);
            if (recruiter != null) {
                response.setRecruiterName(recruiter.getFullName());
                response.setRecruiterEmail(recruiter.getEmail());
            }
        } catch (Exception e) {
            log.warn("Could not fetch recruiter info for id={}: {}", recruiterId, e.getMessage());
        }
        return response;
    }

    private <E extends Enum<E>> E safeEnum(Class<E> cls, String value) {
        if (value == null || value.isBlank()) return null;
        try { return Enum.valueOf(cls, value); }
        catch (IllegalArgumentException ignored) { return null; }
    }

    private String normalizeBlank(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
