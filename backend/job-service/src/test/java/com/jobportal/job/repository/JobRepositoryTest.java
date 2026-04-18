package com.jobportal.job.repository;

import com.jobportal.job.model.Job;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class JobRepositoryTest {

    @Autowired
    private JobRepository jobRepository;

    @Test
    void incrementViews_updatesCounter() {
        Job job = jobRepository.save(Job.builder()
                .title("Backend")
                .description("desc")
                .company("Acme")
                .location("Remote")
                .jobType(Job.JobType.FULL_TIME)
                .experienceLevel(Job.ExperienceLevel.MID)
                .recruiterId(1L)
                .build());

        jobRepository.incrementViews(job.getId());
        jobRepository.flush();

        Job refreshed = jobRepository.findById(job.getId()).orElseThrow();
        assertThat(refreshed.getViewsCount()).isEqualTo(1);
    }

    @Test
    void searchJobs_filtersActiveAndKeyword() {
        Job active = jobRepository.save(Job.builder()
                .title("Java Developer")
                .description("Spring")
                .company("Acme")
                .location("NY")
                .jobType(Job.JobType.FULL_TIME)
                .experienceLevel(Job.ExperienceLevel.JUNIOR)
                .recruiterId(1L)
                .build());

        Job closed = jobRepository.save(Job.builder()
                .title("JavaScript Developer")
                .description("React")
                .company("Beta")
                .location("NY")
                .jobType(Job.JobType.CONTRACT)
                .experienceLevel(Job.ExperienceLevel.MID)
                .recruiterId(2L)
                .status(Job.JobStatus.CLOSED)
                .build());

        Page<Job> results = jobRepository.searchJobs("java", null, null, null, null, null, Job.JobStatus.ACTIVE, PageRequest.of(0, 10));

        assertThat(results.getContent()).extracting("id").contains(active.getId());
        assertThat(results.getContent()).extracting("id").doesNotContain(closed.getId());
    }

    @Test
    void findAllCategories_returnsDistinctValues() {
        jobRepository.save(Job.builder()
                .title("DevOps")
                .description("desc")
                .company("Acme")
                .location("Remote")
                .jobType(Job.JobType.FULL_TIME)
                .experienceLevel(Job.ExperienceLevel.MID)
                .category("Cloud")
                .recruiterId(1L)
                .build());
        jobRepository.save(Job.builder()
                .title("Frontend")
                .description("desc")
                .company("Acme")
                .location("Remote")
                .jobType(Job.JobType.FULL_TIME)
                .experienceLevel(Job.ExperienceLevel.MID)
                .category("Cloud")
                .recruiterId(1L)
                .build());

        List<String> categories = jobRepository.findAllCategories();
        assertThat(categories).containsExactly("Cloud");
    }
}
