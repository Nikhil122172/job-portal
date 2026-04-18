package com.jobportal.file.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FileUploadResponse {
    private String url;
    private String publicId;
    private String resourceType;
    private String format;
    private long size;
    private String uploadedAt;
}
