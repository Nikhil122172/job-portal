package com.jobportal.job.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * CQRS Query: encapsulates all job-search filter criteria plus pagination.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchJobsQuery {
    private String keyword;
    private String location;
    private String category;
    private String jobType;
    private String experienceLevel;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private Boolean isRemote;
    private String status;

    @Builder.Default private int page    = 0;
    @Builder.Default private int size    = 10;
    @Builder.Default private String sortBy = "createdAt";
}
