package com.jobportal.application.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** CQRS Query: all applications submitted by a specific user. */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GetUserApplicationsQuery {
    private Long userId;
    @Builder.Default private int page = 0;
    @Builder.Default private int size = 10;
}
