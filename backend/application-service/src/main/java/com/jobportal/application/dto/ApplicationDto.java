package com.jobportal.application.dto;

import com.jobportal.application.model.JobApplication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

public class ApplicationDto {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApplyRequest {
        @NotBlank(message = "Job reference is required")
        private String jobId;

        @Size(max = 3000, message = "Cover letter cannot exceed 3000 characters")
        private String coverLetter;
        // resume uploaded separately via /files endpoint
        @Size(max = 1000, message = "Resume URL is too long")
        private String resumeUrl;

        @Size(max = 255, message = "Resume public ID is too long")
        private String resumePublicId;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateStatusRequest {
        @NotNull(message = "Application status is required")
        private JobApplication.ApplicationStatus status;

        @Size(max = 1000, message = "Status note cannot exceed 1000 characters")
        private String statusNote;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApplicationResponse {
        private Long id;
        private String uuid;
        private Long userId;
        private Long jobId;
        private Long recruiterId;
        private String status;
        private String resumeUrl;
        private String coverLetter;
        private String applicantName;
        private String applicantEmail;
        private String applicantPhone;
        private String jobTitle;
        private String companyName;
        private String statusNote;
        private String appliedAt;
        private String updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApplicationStatsResponse {
        private long totalApplications;
        private long applied;
        private long underReview;
        private long shortlisted;
        private long rejected;
        private long offered;
    }
}
