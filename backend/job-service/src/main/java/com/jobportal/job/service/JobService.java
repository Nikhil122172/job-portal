package com.jobportal.job.service;

import com.jobportal.job.cqrs.command.CreateJobCommand;
import com.jobportal.job.cqrs.command.DeleteJobCommand;
import com.jobportal.job.cqrs.command.UpdateJobCommand;
import com.jobportal.job.cqrs.handler.JobCommandHandler;
import com.jobportal.job.cqrs.handler.JobQueryHandler;
import com.jobportal.job.cqrs.query.GetJobByIdQuery;
import com.jobportal.job.cqrs.query.GetRecruiterJobsQuery;
import com.jobportal.job.cqrs.query.SearchJobsQuery;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.exception.ResourceNotFoundException;
import com.jobportal.job.mapper.JobMapper;
import com.jobportal.job.model.Job;
import com.jobportal.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * JobService acts as the application-layer façade (thin orchestration layer).
 *
 * Following the CQRS principle:
 *   - Write paths (create / update / delete) are dispatched to {@link JobCommandHandler}.
 *   - Read  paths (query / search / stats)   are dispatched to {@link JobQueryHandler}.
 *
 * Mapping between request DTOs and Commands/Queries is done via {@link JobMapper} (MapStruct).
 * The controller still talks to this single service class so the public API is unchanged.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobCommandHandler commandHandler;
    private final JobQueryHandler   queryHandler;
    private final JobMapper         jobMapper;
    private final JobRepository     jobRepository;

    // ── Commands (writes) ─────────────────────────────────────────────────────

    public JobDto.JobResponse createJob(JobDto.CreateJobRequest req, Long recruiterId) {
        CreateJobCommand command = jobMapper.toCreateCommand(req);
        command.setRecruiterId(recruiterId);
        return commandHandler.handle(command);
    }

    public JobDto.JobResponse updateJob(Long jobId, JobDto.UpdateJobRequest req, Long recruiterId, String role) {
        UpdateJobCommand command = jobMapper.toUpdateCommand(req);
        command.setJobId(jobId);
        command.setRecruiterId(recruiterId);
        command.setRole(role);
        return commandHandler.handle(command);
    }

    public void deleteJob(Long jobId, Long recruiterId, String role) {
        commandHandler.handle(DeleteJobCommand.builder()
            .jobId(jobId)
            .recruiterId(recruiterId)
            .role(role)
            .build());
    }

    public void incrementApplicationCount(Long jobId) {
        commandHandler.incrementApplicationCount(jobId);
    }

    // ── Queries (reads) ───────────────────────────────────────────────────────

    public JobDto.JobResponse getJobById(Long jobId) {
        return getJobById(jobId, true);
    }

    public JobDto.JobResponse getJobById(Long jobId, boolean incrementViewCount) {
        return queryHandler.handle(new GetJobByIdQuery(jobId), incrementViewCount);
    }

    public Page<JobDto.JobResponse> searchJobs(JobDto.JobSearchRequest req, int page, int size, String sortBy) {
        SearchJobsQuery query = SearchJobsQuery.builder()
            .keyword(req.getKeyword())
            .location(req.getLocation())
            .category(req.getCategory())
            .jobType(req.getJobType())
            .experienceLevel(req.getExperienceLevel())
            .isRemote(req.getIsRemote())
            .status(req.getStatus())
            .page(page)
            .size(size)
            .sortBy(sortBy)
            .build();
        return queryHandler.handle(query);
    }

    public Page<JobDto.JobResponse> getRecruiterJobs(Long recruiterId, int page, int size) {
        return queryHandler.handle(GetRecruiterJobsQuery.builder()
            .recruiterId(recruiterId)
            .page(page)
            .size(size)
            .build());
    }

    public JobDto.JobStatsResponse getStats() {
        return queryHandler.getStats();
    }

    public List<String> getAllCategories() {
        return queryHandler.getCategories();
    }

    public JobDto.JobResponse getJobByReference(String jobRef, boolean incrementViewCount) {
        return getJobById(resolveJobId(jobRef), incrementViewCount);
    }

    public JobDto.JobResponse updateJobByReference(String jobRef, JobDto.UpdateJobRequest req, Long recruiterId, String role) {
        return updateJob(resolveJobId(jobRef), req, recruiterId, role);
    }

    public void deleteJobByReference(String jobRef, Long recruiterId, String role) {
        deleteJob(resolveJobId(jobRef), recruiterId, role);
    }

    public void incrementApplicationCountByReference(String jobRef) {
        incrementApplicationCount(resolveJobId(jobRef));
    }

    private Long resolveJobId(String jobRef) {
        if (jobRef == null || jobRef.isBlank()) {
            throw new ResourceNotFoundException("Job not found");
        }
        try {
            return Long.parseLong(jobRef);
        } catch (NumberFormatException ignored) {
            return jobRepository.findByUuid(jobRef)
                .map(Job::getId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found"));
        }
    }
}
