package com.jobportal.application.dto;

import lombok.*;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class JobClientDto {
    private Long id;
    private String title;
    private String company;
    private String location;
    private Long recruiterId;
    private String status;
}
