package com.jobportal.application.controller;

import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.service.ApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController @RequestMapping("/api/v1/applications")
@RequiredArgsConstructor
@Tag(name = "Applications", description = "Job application management APIs")
@SecurityRequirement(name = "Bearer Auth")
public class ApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    @Operation(summary = "Apply for a job")
    public ResponseEntity<ApplicationDto.ApplicationResponse> apply(
            @Valid @RequestBody ApplicationDto.ApplyRequest req,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.apply(req, userId));
    }

    @PostMapping("/with-resume")
    @Operation(summary = "Apply with resume upload")
    public ResponseEntity<ApplicationDto.ApplicationResponse> applyWithResume(
            @RequestParam("jobId") String jobId,
            @RequestParam(value = "coverLetter", required = false) String coverLetter,
            @RequestParam("resume") MultipartFile resume,
            @RequestHeader("X-User-Id") Long userId) throws IOException {
        ApplicationDto.ApplyRequest req = ApplicationDto.ApplyRequest.builder()
                .jobId(jobId).coverLetter(coverLetter).build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(applicationService.uploadResumeAndApply(req, userId, resume));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my applications (Job Seeker)")
    public ResponseEntity<Page<ApplicationDto.ApplicationResponse>> getMyApplications(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getUserApplications(userId, page, size));
    }

    @GetMapping("/my/stats")
    @Operation(summary = "Get my application statistics")
    public ResponseEntity<ApplicationDto.ApplicationStatsResponse> getMyStats(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(applicationService.getUserStats(userId));
    }

    @GetMapping("/job/{jobId}")
    @Operation(summary = "Get applicants for a job (Recruiter)")
    public ResponseEntity<Page<ApplicationDto.ApplicationResponse>> getJobApplicants(
            @PathVariable String jobId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getJobApplicantsByReference(jobId, page, size));
    }

    @GetMapping("/recruiter/inbox")
    @Operation(summary = "Get all applications for recruiter")
    public ResponseEntity<Page<ApplicationDto.ApplicationResponse>> getRecruiterApplications(
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(applicationService.getRecruiterApplications(recruiterId, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get application by ID")
    public ResponseEntity<ApplicationDto.ApplicationResponse> getById(
            @PathVariable String id,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(applicationService.getApplicationByReference(id, userId, role));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update application status (Recruiter/Admin)")
    public ResponseEntity<ApplicationDto.ApplicationResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody ApplicationDto.UpdateStatusRequest req,
            @RequestHeader("X-User-Id") Long recruiterId,
            @RequestHeader("X-User-Role") String role) {
        return ResponseEntity.ok(applicationService.updateStatusByReference(id, req, recruiterId, role));
    }

    @PatchMapping("/{id}/withdraw")
    @Operation(summary = "Withdraw application (Job Seeker)")
    public ResponseEntity<Void> withdraw(
            @PathVariable String id,
            @RequestHeader("X-User-Id") Long userId) {
        applicationService.withdrawApplicationByReference(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/all")
    @Operation(summary = "Get all applications (Admin only)")
    public ResponseEntity<Page<ApplicationDto.ApplicationResponse>> getAllApplications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(applicationService.getAllApplications(page, size, keyword, status));
    }

    @GetMapping("/internal/jobs/{jobId}/active-applicant-emails")
    @Operation(summary = "Internal: get active applicant emails for a job")
    public ResponseEntity<List<String>> getActiveApplicantEmails(@PathVariable String jobId) {
        return ResponseEntity.ok(applicationService.getActiveApplicantEmailsByJobReference(jobId));
    }
}
