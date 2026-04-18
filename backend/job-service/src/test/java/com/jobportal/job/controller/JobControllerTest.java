package com.jobportal.job.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.service.JobService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(SpringExtension.class)
@WebMvcTest(controllers = JobController.class)
class JobControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private JobService jobService;

    @Test
    void createJob_withValidRole_returnsCreated() throws Exception {
        JobDto.CreateJobRequest req = JobDto.CreateJobRequest.builder()
                .title("Backend Engineer")
                .description("desc")
                .company("Acme")
                .location("Remote")
                .jobType(com.jobportal.job.model.Job.JobType.FULL_TIME)
                .experienceLevel(com.jobportal.job.model.Job.ExperienceLevel.MID)
                .build();

        JobDto.JobResponse resp = JobDto.JobResponse.builder()
                .id(1L)
                .title("Backend Engineer")
                .recruiterId(7L)
                .build();

        when(jobService.createJob(any(), eq(7L))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Id", 7L)
                        .header("X-User-Role", "ROLE_RECRUITER"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.title").value("Backend Engineer"));
    }

    @Test
    void createJob_withForbiddenRole_returns403AndSkipsService() throws Exception {
        JobDto.CreateJobRequest req = JobDto.CreateJobRequest.builder()
                .title("Backend Engineer")
                .description("desc")
                .company("Acme")
                .location("Remote")
                .jobType(com.jobportal.job.model.Job.JobType.FULL_TIME)
                .experienceLevel(com.jobportal.job.model.Job.ExperienceLevel.MID)
                .build();

        mockMvc.perform(post("/api/v1/jobs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req))
                        .header("X-User-Id", 7L)
                        .header("X-User-Role", "ROLE_JOB_SEEKER"))
                .andExpect(status().isForbidden());

        Mockito.verify(jobService, never()).createJob(any(), any());
    }

    @Test
    void getJobById_returnsResponse() throws Exception {
        JobDto.JobResponse resp = JobDto.JobResponse.builder()
                .id(5L)
                .title("Data Engineer")
                .build();
        when(jobService.getJobByReference("5", true)).thenReturn(resp);

        mockMvc.perform(get("/api/v1/jobs/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5L))
                .andExpect(jsonPath("$.title").value("Data Engineer"));
    }
}
