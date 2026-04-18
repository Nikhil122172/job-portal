package com.jobportal.application.repository;

import com.jobportal.application.model.JobApplication;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ApplicationRepositoryTest {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Test
    void findByUserId_returnsPage() {
        JobApplication app = applicationRepository.save(JobApplication.builder()
                .userId(1L).jobId(2L).recruiterId(3L).build());

        Page<JobApplication> page = applicationRepository.findByUserId(1L, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getId()).isEqualTo(app.getId());
    }

    @Test
    void countByStatus_countsCorrectly() {
        applicationRepository.save(JobApplication.builder()
                .userId(1L).jobId(3L).recruiterId(4L).status(JobApplication.ApplicationStatus.APPLIED).build());
        applicationRepository.save(JobApplication.builder()
                .userId(1L).jobId(4L).recruiterId(4L).status(JobApplication.ApplicationStatus.REJECTED).build());

        long applied = applicationRepository.countByUserIdAndStatus(1L, JobApplication.ApplicationStatus.APPLIED);
        long rejected = applicationRepository.countByUserIdAndStatus(1L, JobApplication.ApplicationStatus.REJECTED);

        assertThat(applied).isEqualTo(1);
        assertThat(rejected).isEqualTo(1);
    }
}
