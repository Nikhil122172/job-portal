package com.jobportal.file.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.jobportal.file.dto.FileUploadResponse;
import com.jobportal.file.exception.FileUploadException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FileServiceTest {

    @Mock private Cloudinary cloudinary;
    @Mock private Uploader uploader;
    @Mock private MultipartFile multipartFile;

    @InjectMocks private FileService fileService;

    @BeforeEach
    void setup() throws Exception {
        when(multipartFile.isEmpty()).thenReturn(false);
    }

    @Test
    void uploadProfileImage_uploadsToCloudinary() throws Exception {
        when(cloudinary.uploader()).thenReturn(uploader);
        when(multipartFile.getBytes()).thenReturn(new byte[] {1, 2, 3});
        when(multipartFile.getContentType()).thenReturn("image/png");
        when(multipartFile.getSize()).thenReturn(1_000_000L);
        when(uploader.upload(any(byte[].class), any(Map.class))).thenReturn(Map.of(
                "secure_url", "https://cdn/img.png",
                "public_id", "pid",
                "format", "png",
                "bytes", 1024
        ));

        FileUploadResponse response = fileService.uploadProfileImage(multipartFile);

        assertThat(response.getUrl()).isEqualTo("https://cdn/img.png");
        assertThat(response.getPublicId()).isEqualTo("pid");
        assertThat(response.getResourceType()).isEqualTo("image");
        verify(uploader).upload(any(byte[].class), any(Map.class));
    }

    @Test
    void uploadProfileImage_withInvalidType_throwsException() {
        when(multipartFile.getContentType()).thenReturn("text/plain");
        when(multipartFile.getSize()).thenReturn(100L);

        assertThatThrownBy(() -> fileService.uploadProfileImage(multipartFile))
                .isInstanceOf(FileUploadException.class);
    }
}
