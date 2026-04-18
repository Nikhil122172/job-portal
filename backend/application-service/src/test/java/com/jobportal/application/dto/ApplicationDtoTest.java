package com.jobportal.application.dto;

import com.jobportal.application.model.JobApplication;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApplicationDtoTest {

    @Test
    void applyRequest_builderStoresFields() {
        ApplicationDto.ApplyRequest req = ApplicationDto.ApplyRequest.builder()
                .jobId("1").coverLetter("hi").resumeUrl("url").resumePublicId("pid").build();
        assertThat(req.getJobId()).isEqualTo("1");
        assertThat(req.getResumePublicId()).isEqualTo("pid");
    }

    @Test
    void updateStatusRequest_holdsStatus() {
        ApplicationDto.UpdateStatusRequest req = ApplicationDto.UpdateStatusRequest.builder()
                .status(JobApplication.ApplicationStatus.SHORTLISTED)
                .statusNote("nice")
                .build();
        assertThat(req.getStatus()).isEqualTo(JobApplication.ApplicationStatus.SHORTLISTED);
        assertThat(req.getStatusNote()).isEqualTo("nice");
    }
}
