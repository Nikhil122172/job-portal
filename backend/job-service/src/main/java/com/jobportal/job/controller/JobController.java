package com.jobportal.job.controller;

import com.jobportal.job.dto.JobDto;
import com.jobportal.job.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController @RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
@Tag(name = "Jobs", description = "Job management APIs")
public class JobController {

    private final JobService jobService;

    @PostMapping
    @Operation(summary = "Create a new job posting", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<JobDto.JobResponse> createJob(
            @Valid @RequestBody JobDto.CreateJobRequest req,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {
        if (!role.equals("ROLE_RECRUITER") && !role.equals("ROLE_ADMIN"))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(jobService.createJob(req, recruiterId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update job posting", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<JobDto.JobResponse> updateJob(
            @PathVariable String id,
            @RequestBody JobDto.UpdateJobRequest req,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {
        if (!role.equals("ROLE_RECRUITER") && !role.equals("ROLE_ADMIN"))
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(jobService.updateJobByReference(id, req, recruiterId, role));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete job posting", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Void> deleteJob(
            @PathVariable String id,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {
        jobService.deleteJobByReference(id, recruiterId, role);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get job by ID")
    public ResponseEntity<JobDto.JobResponse> getJobById(
            @PathVariable String id,
            @RequestParam(defaultValue = "true") boolean incrementViewCount) {
        return ResponseEntity.ok(jobService.getJobByReference(id, incrementViewCount));
    }

    @GetMapping("/search")
    @Operation(summary = "Search and filter jobs")
    public ResponseEntity<Page<JobDto.JobResponse>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) Boolean isRemote,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        JobDto.JobSearchRequest req = JobDto.JobSearchRequest.builder()
                .keyword(keyword).location(location).category(category)
                .jobType(jobType).experienceLevel(experienceLevel).isRemote(isRemote)
                .status(normalizeStatus(status)).build();
        return ResponseEntity.ok(jobService.searchJobs(req, page, size, sortBy));
    }

    @GetMapping
    @Operation(summary = "Get all active jobs (paginated)")
    public ResponseEntity<Page<JobDto.JobResponse>> getAllJobs(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        JobDto.JobSearchRequest req = JobDto.JobSearchRequest.builder().status("ACTIVE").build();
        return ResponseEntity.ok(jobService.searchJobs(req, page, size, "createdAt"));
    }

    @GetMapping("/recruiter/my-jobs")
    @Operation(summary = "Get recruiter's job listings", security = @SecurityRequirement(name = "Bearer Auth"))
    public ResponseEntity<Page<JobDto.JobResponse>> getRecruiterJobs(
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.getRecruiterJobs(recruiterId, page, size));
    }

    @GetMapping("/recruiter/{recruiterId}")
    @Operation(summary = "Get jobs by recruiter ID")
    public ResponseEntity<Page<JobDto.JobResponse>> getJobsByRecruiter(
            @PathVariable Long recruiterId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(jobService.getRecruiterJobs(recruiterId, page, size));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get all job categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(jobService.getAllCategories());
    }

    @GetMapping("/stats")
    @Operation(summary = "Get job statistics")
    public ResponseEntity<JobDto.JobStatsResponse> getStats() {
        return ResponseEntity.ok(jobService.getStats());
    }

    @PatchMapping("/{id}/increment-application")
    @Operation(summary = "Increment application count (internal)")
    public ResponseEntity<Void> incrementApplication(@PathVariable String id) {
        jobService.incrementApplicationCountByReference(id);
        return ResponseEntity.noContent().build();
    }

    private String normalizeStatus(String status) {
        if (status == null) return "ACTIVE";
        String trimmed = status.trim();
        if (trimmed.isEmpty()) return "ACTIVE";
        if ("ALL".equalsIgnoreCase(trimmed)) return null;
        return trimmed;
    }
}
