package com.jobportal.job.dto;

import com.jobportal.job.model.Job;
import jakarta.validation.constraints.*;
import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobDto {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateJobRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        
        @NotBlank(message = "Job title is required")
        @Size(max = 200, message = "Job title cannot exceed 200 characters")
        private String title;

        @NotBlank(message = "Description is required")
        private String description;

        @NotBlank(message = "Company is required")
        private String company;

        @NotBlank(message = "Location is required")
        private String location;

        @NotNull(message = "Job type is required")
        private Job.JobType jobType;

        @NotNull(message = "Experience level is required")
        private Job.ExperienceLevel experienceLevel;

        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String salaryCurrency;
        private String requirements;
        private String responsibilities;
        private String category;
        private String skills;
        private LocalDateTime applicationDeadline;
        private Boolean isRemote;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateJobRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private String title;
        private String description;
        private String company;
        private String location;
        private Job.JobType jobType;
        private Job.ExperienceLevel experienceLevel;
        private Job.JobStatus status;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String salaryCurrency;
        private String requirements;
        private String responsibilities;
        private String category;
        private String skills;
        private LocalDateTime applicationDeadline;
        private Boolean isRemote;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JobResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private Long id;
        private String uuid;
        private String title;
        private String description;
        private String company;
        private String location;
        private String jobType;
        private String experienceLevel;
        private String status;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private String salaryCurrency;
        private String requirements;
        private String responsibilities;
        private String category;
        private String skills;
        private Long recruiterId;
        private String recruiterName;
        private String recruiterEmail;
        private LocalDateTime applicationDeadline;
        private Boolean isRemote;
        private Integer viewsCount;
        private Integer applicationsCount;
        private String createdAt;
        private String updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JobSearchRequest implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private String keyword;
        private String location;
        private String category;
        private String jobType;
        private String experienceLevel;
        private BigDecimal salaryMin;
        private BigDecimal salaryMax;
        private Boolean isRemote;
        private String status;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class JobStatsResponse implements Serializable {
        private static final long serialVersionUID = 1L;
        
        private long totalJobs;
        private long activeJobs;
        private long closedJobs;
        private long draftJobs;
    }
}
