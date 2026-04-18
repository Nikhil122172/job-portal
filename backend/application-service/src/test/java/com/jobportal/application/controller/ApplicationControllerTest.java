package com.jobportal.application.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.application.config.SecurityConfig;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.service.ApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ApplicationController.class)
@Import(SecurityConfig.class)
class ApplicationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ApplicationService applicationService;

    @Test
    void apply_returnsCreated() throws Exception {
        ApplicationDto.ApplyRequest req = ApplicationDto.ApplyRequest.builder().jobId("1").resumeUrl("r").build();
        ApplicationDto.ApplicationResponse resp = ApplicationDto.ApplicationResponse.builder()
                .id(10L).jobId(1L).userId(5L).build();
        when(applicationService.apply(any(), eq(5L))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Id", 5L))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10L));
    }

    @Test
    void withdraw_callsService() throws Exception {
        mockMvc.perform(patch("/api/v1/applications/9/withdraw").header("X-User-Id", 7L))
                .andExpect(status().isNoContent());
        verify(applicationService).withdrawApplicationByReference("9", 7L);
    }
}
