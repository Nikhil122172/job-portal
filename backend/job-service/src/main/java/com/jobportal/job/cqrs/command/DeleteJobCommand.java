package com.jobportal.job.cqrs.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Command: Represents the intent to delete a job posting.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeleteJobCommand {
    private Long jobId;
    private Long recruiterId;
    private String role;
}
