package com.jobportal.file.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jobportal.file.dto.FileUploadResponse;
import com.jobportal.file.exception.FileUploadException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Arrays;
import java.util.List;

@Service @RequiredArgsConstructor @Slf4j
public class FileService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg","image/jpg","image/png","image/webp","image/gif");
    private static final List<String> ALLOWED_RESUME_TYPES = Arrays.asList(
            "application/pdf","application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    public FileUploadResponse uploadProfileImage(MultipartFile file) throws IOException {
        // Validate early to avoid bad uploads reaching Cloudinary.
        validateFile(file, ALLOWED_IMAGE_TYPES, "image");
        Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "job-portal/profiles",
                        "resource_type", "image",
                        "transformation", "w_400,h_400,c_fill,g_face,q_auto"));
        return buildResponse(result, "image");
    }

    public FileUploadResponse uploadResume(MultipartFile file) throws IOException {
        // Resume uses raw resource type to keep original document format.
        validateFile(file, ALLOWED_RESUME_TYPES, "resume");
        Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "job-portal/resumes",
                        "resource_type", "raw",
                        "use_filename", true,
                        "unique_filename", true));
        return buildResponse(result, "raw");
    }

    public void deleteFile(String publicId, String resourceType) throws IOException {
        cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", resourceType != null ? resourceType : "image"));
    }

    private void validateFile(MultipartFile file, List<String> allowedTypes, String type) {
        if (file == null || file.isEmpty())
            throw new FileUploadException("File is empty");
        if (file.getSize() > MAX_FILE_SIZE)
            throw new FileUploadException("File size exceeds 10MB limit");
        if (!allowedTypes.contains(file.getContentType()))
            throw new FileUploadException("Invalid file type for " + type + ". Allowed: " + allowedTypes);
    }

    private FileUploadResponse buildResponse(Map<?,?> result, String resourceType) {
        // Convert Cloudinary response map into our DTO.
        return FileUploadResponse.builder()
                .url((String) result.get("secure_url"))
                .publicId((String) result.get("public_id"))
                .resourceType(resourceType)
                .format((String) result.get("format"))
                .size(result.get("bytes") != null ? ((Number) result.get("bytes")).longValue() : 0)
                .uploadedAt(LocalDateTime.now().toString())
                .build();
    }
}
