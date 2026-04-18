package com.jobportal.application.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UserClientDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String profileImageUrl;
    private String role;
}
