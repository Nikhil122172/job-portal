package com.jobportal.job.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Query: fetch all jobs belonging to a specific recruiter.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetRecruiterJobsQuery {
    private Long recruiterId;
    @Builder.Default private int page = 0;
    @Builder.Default private int size = 10;
}
