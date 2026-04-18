package com.jobportal.file.controller;

import com.jobportal.file.dto.FileUploadResponse;
import com.jobportal.file.service.CloudinaryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = FileController.class)
class FileControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockBean private CloudinaryService cloudinaryService;

    @Test
    void uploadResume_returnsResponse() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[]{1});
        when(cloudinaryService.uploadResume(any(), eq(9L))).thenReturn(FileUploadResponse.builder()
                .url("http://cdn/resume.pdf").publicId("pid").resourceType("raw").build());

        mockMvc.perform(multipart("/api/v1/files/resume").file(file).header("X-User-Id", 9L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.publicId").value("pid"));
    }
}
