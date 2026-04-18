package com.jobportal.application.cqrs.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Command: job-seeker withdraws their application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawApplicationCommand {
    private Long applicationId;
    private Long userId;
}
