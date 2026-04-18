package com.jobportal.file.controller;

import com.jobportal.file.dto.FileUploadResponse;
import com.jobportal.file.service.CloudinaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Tag(name = "Files", description = "File upload APIs (Cloudinary)")
@SecurityRequirement(name = "Bearer Auth")
public class FileController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("/profile-image")
    @Operation(summary = "Upload profile image")
    public ResponseEntity<FileUploadResponse> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(cloudinaryService.uploadProfileImage(file, userId));
    }

    @PostMapping("/resume")
    @Operation(summary = "Upload resume (PDF/Word)")
    public ResponseEntity<FileUploadResponse> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(cloudinaryService.uploadResume(file, userId));
    }

    @PostMapping("/company-logo")
    @Operation(summary = "Upload company logo")
    public ResponseEntity<FileUploadResponse> uploadCompanyLogo(
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(cloudinaryService.uploadCompanyLogo(file, userId));
    }

    @DeleteMapping
    @Operation(summary = "Delete a file by public ID")
    public ResponseEntity<Void> deleteFile(
            @RequestParam("publicId") String publicId,
            @RequestParam(value = "resourceType", defaultValue = "image") String resourceType) {
        cloudinaryService.deleteFile(publicId, resourceType);
        return ResponseEntity.noContent().build();
    }
}
