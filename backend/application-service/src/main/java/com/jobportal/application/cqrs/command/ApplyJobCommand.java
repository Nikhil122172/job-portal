package com.jobportal.application.cqrs.command;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Command: intent to submit a job application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyJobCommand {
    @NotNull(message = "Job ID is required")
    private Long jobId;
    private String coverLetter;
    private String resumeUrl;
    private String resumePublicId;
    /** Set from gateway header */
    private Long userId;
}
