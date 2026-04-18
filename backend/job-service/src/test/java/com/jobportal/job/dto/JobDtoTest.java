package com.jobportal.job.dto;

import com.jobportal.job.model.Job;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class JobDtoTest {

    @Test
    void builder_populatesFields() {
        LocalDateTime deadline = LocalDateTime.now();

        JobDto.CreateJobRequest createReq = JobDto.CreateJobRequest.builder()
                .title("Engineer")
                .description("Build things")
                .company("Acme")
                .location("Remote")
                .jobType(Job.JobType.FULL_TIME)
                .experienceLevel(Job.ExperienceLevel.MID)
                .salaryMin(BigDecimal.TEN)
                .salaryMax(BigDecimal.valueOf(20))
                .salaryCurrency("USD")
                .requirements("req")
                .responsibilities("resp")
                .category("Tech")
                .skills("Java")
                .applicationDeadline(deadline)
                .isRemote(true)
                .build();

        assertThat(createReq.getTitle()).isEqualTo("Engineer");
        assertThat(createReq.getJobType()).isEqualTo(Job.JobType.FULL_TIME);
        assertThat(createReq.getExperienceLevel()).isEqualTo(Job.ExperienceLevel.MID);
        assertThat(createReq.getApplicationDeadline()).isEqualTo(deadline);
    }

    @Test
    void jobResponse_builderSetsFields() {
        JobDto.JobResponse resp = JobDto.JobResponse.builder()
                .id(1L)
                .title("Engineer")
                .status("ACTIVE")
                .recruiterId(2L)
                .recruiterName("Alice")
                .build();

        assertThat(resp.getId()).isEqualTo(1L);
        assertThat(resp.getRecruiterName()).isEqualTo("Alice");
        assertThat(resp.getStatus()).isEqualTo("ACTIVE");
    }
}
