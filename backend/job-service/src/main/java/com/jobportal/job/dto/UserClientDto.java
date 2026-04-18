package com.jobportal.job.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserClientDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String companyName;
    private String profileImageUrl;
    private String role;
}
