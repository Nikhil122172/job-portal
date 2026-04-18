package com.jobportal.application.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** CQRS Query: all applicants for a specific job. */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GetJobApplicantsQuery {
    private Long jobId;
    @Builder.Default private int page = 0;
    @Builder.Default private int size = 10;
}
