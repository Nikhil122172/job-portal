package com.jobportal.application.cqrs.command;

import com.jobportal.application.model.JobApplication;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Command: recruiter updates the status of an application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateApplicationStatusCommand {
    private Long applicationId;
    @NotNull(message = "Application status is required")
    private JobApplication.ApplicationStatus status;
    private String statusNote;
    /** Set from gateway header */
    private Long recruiterId;
    private String role;
}
