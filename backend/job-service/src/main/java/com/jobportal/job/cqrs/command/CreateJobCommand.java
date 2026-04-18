package com.jobportal.job.cqrs.command;

import com.jobportal.job.model.Job;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CQRS Command: Represents the intent to create a new job posting.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobCommand {

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

    /** Set from the authenticated gateway header - not from the request body */
    private Long recruiterId;
}
