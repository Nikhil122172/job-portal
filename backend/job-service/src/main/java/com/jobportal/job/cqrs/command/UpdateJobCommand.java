package com.jobportal.job.cqrs.command;

import com.jobportal.job.model.Job;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * CQRS Command: Represents the intent to update an existing job posting.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateJobCommand {

    /** Populated by the controller from the path variable */
    private Long jobId;

    /** Populated by the controller from the gateway header */
    private Long recruiterId;

    /** Populated by the controller from the gateway header – used for admin bypass */
    private String role;

    // All fields are optional (null = no change)
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
