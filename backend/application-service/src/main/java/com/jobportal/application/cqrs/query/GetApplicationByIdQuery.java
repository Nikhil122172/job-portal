package com.jobportal.application.cqrs.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** CQRS Query: fetch a single application, with auth context for access check. */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class GetApplicationByIdQuery {
    private Long applicationId;
    private Long userId;
    private String role;
}
