package com.jobportal.job.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CQRS Query: fetch a single job by its primary key and increment the view counter.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GetJobByIdQuery {
    private Long jobId;
}
