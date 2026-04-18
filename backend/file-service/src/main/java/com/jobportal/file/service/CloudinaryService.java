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
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service @RequiredArgsConstructor @Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    private static final List<String> ALLOWED_IMAGE_TYPES =
            Arrays.asList("image/jpeg","image/png","image/gif","image/webp");
    private static final List<String> ALLOWED_RESUME_TYPES =
            Arrays.asList("application/pdf",
                    "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    public FileUploadResponse uploadProfileImage(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_IMAGE_TYPES, "image (JPEG/PNG/WebP)");
        try {
            // BUG FIX: transformation must be a Map (not a String) for the Cloudinary Java SDK.
            // BUG FIX: "invalidate: true" clears the CDN cache so the new image is
            //           immediately visible to all users (not just the uploader).
            Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "folder", "job-portal/profiles/" + userId,
                    "resource_type", "image",
                    "invalidate", true,
                    "transformation", ObjectUtils.asMap(
                        "width", 400, "height", 400,
                        "crop", "fill", "gravity", "face", "quality", "auto"
                    )
                ));
            return buildResponse(result);
        } catch (IOException e) { throw new FileUploadException("Failed to upload profile image", e); }
    }

    public FileUploadResponse uploadResume(MultipartFile file, Long userId) {
        validateFile(file, ALLOWED_RESUME_TYPES, "resume (PDF or Word)");
        try {
            // BUG FIX: Store original filename (with extension) so Cloudinary preserves it.
            // use_filename=true + unique_filename=true appends a unique suffix but keeps the base name.
            // The original filename is passed explicitly so the extension (.pdf, .docx) is retained,
            // which is critical for the download to open correctly on the client side.
            String originalFilename = file.getOriginalFilename();
            Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "folder", "job-portal/resumes/" + userId,
                    "resource_type", "raw",
                    "use_filename", true,
                    "unique_filename", true,
                    "filename_override", originalFilename != null ? originalFilename : "resume"
                ));
            return buildResponse(result);
        } catch (IOException e) { throw new FileUploadException("Failed to upload resume", e); }
    }

    public FileUploadResponse uploadCompanyLogo(MultipartFile file, Long recruiterId) {
        validateFile(file, ALLOWED_IMAGE_TYPES, "image");
        try {
            // BUG FIX: transformation must be a Map (not a String) for the Cloudinary Java SDK.
            // BUG FIX: "invalidate: true" clears CDN cache so updated logos are visible to all users.
            Map<?,?> result = cloudinary.uploader().upload(file.getBytes(),
                ObjectUtils.asMap(
                    "folder", "job-portal/logos/" + recruiterId,
                    "resource_type", "image",
                    "invalidate", true,
                    "transformation", ObjectUtils.asMap(
                        "width", 200, "height", 200,
                        "crop", "fit", "quality", "auto"
                    )
                ));
            return buildResponse(result);
        } catch (IOException e) { throw new FileUploadException("Failed to upload logo", e); }
    }

    public void deleteFile(String publicId, String resourceType) {
        try {
            cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("resource_type", resourceType != null ? resourceType : "image"));
        } catch (IOException e) { log.error("Delete failed for {}: {}", publicId, e.getMessage()); }
    }

    private void validateFile(MultipartFile file, List<String> allowed, String typeName) {
        if (file == null || file.isEmpty()) throw new FileUploadException("File cannot be empty");
        if (file.getSize() > 10 * 1024 * 1024) throw new FileUploadException("File must not exceed 10MB");
        String ct = file.getContentType();
        if (ct == null || !allowed.contains(ct)) throw new FileUploadException("Invalid file type. Allowed: "+typeName);
    }

    private FileUploadResponse buildResponse(Map<?,?> r) {
        return FileUploadResponse.builder()
            .url((String) r.get("secure_url")).publicId((String) r.get("public_id"))
            .resourceType((String) r.get("resource_type")).format((String) r.get("format"))
            .size(r.get("bytes") instanceof Number ? ((Number)r.get("bytes")).longValue() : 0L)
            .uploadedAt(LocalDateTime.now().toString()).build();
    }
}
