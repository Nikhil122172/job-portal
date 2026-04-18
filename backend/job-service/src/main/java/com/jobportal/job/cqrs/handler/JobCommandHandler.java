package com.jobportal.job.cqrs.handler;

import com.jobportal.job.cqrs.command.CreateJobCommand;
import com.jobportal.job.cqrs.command.DeleteJobCommand;
import com.jobportal.job.cqrs.command.UpdateJobCommand;
import com.jobportal.job.client.ApplicationClient;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.event.JobEvent;
import com.jobportal.job.exception.ResourceNotFoundException;
import com.jobportal.job.exception.UnauthorizedException;
import com.jobportal.job.kafka.JobEventProducer;
import com.jobportal.job.mapper.JobMapper;
import com.jobportal.job.model.Job;
import com.jobportal.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JobCommandHandler {

    private final JobRepository     jobRepository;
    private final JobMapper         jobMapper;
    private final ApplicationClient applicationClient;
    private final JobEventProducer  jobEventProducer;

    @Transactional
    @CacheEvict(cacheNames = {"job:stats", "job:categories"}, allEntries = true)
    public JobDto.JobResponse handle(CreateJobCommand command) {
        log.info("Handling CreateJobCommand: title={}, recruiterId={}", command.getTitle(), command.getRecruiterId());
        Job job = jobMapper.toEntity(command);
        job.setRecruiterId(command.getRecruiterId());
        Job saved = jobRepository.save(job);
        try {
            jobEventProducer.publish(JobEvent.builder()
                .id(saved.getId()).title(saved.getTitle()).company(saved.getCompany()).action("CREATED").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for job CREATED id={}: {}", saved.getId(), ex.getMessage());
        }
        log.info("Job created with id={}", saved.getId());
        return jobMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = {"job:stats", "job:categories"}, allEntries = true)
    public JobDto.JobResponse handle(UpdateJobCommand command) {
        log.info("Handling UpdateJobCommand: jobId={}, recruiterId={}", command.getJobId(), command.getRecruiterId());
        Job job = jobRepository.findById(command.getJobId())
            .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + command.getJobId()));
        if (!job.getRecruiterId().equals(command.getRecruiterId())
                && !"ROLE_ADMIN".equals(command.getRole()))
            throw new UnauthorizedException("You are not authorized to update this job");
        jobMapper.updateEntityFromCommand(command, job);
        Job saved = jobRepository.save(job);
        try {
            jobEventProducer.publish(JobEvent.builder()
                .id(saved.getId()).title(saved.getTitle()).company(saved.getCompany()).action("UPDATED").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for job UPDATED id={}: {}", saved.getId(), ex.getMessage());
        }
        log.info("Job updated: id={}", saved.getId());
        return jobMapper.toResponse(saved);
    }

    @Transactional
    @CacheEvict(cacheNames = {"job:stats", "job:categories"}, allEntries = true)
    public void handle(DeleteJobCommand command) {
        log.info("Handling DeleteJobCommand: jobId={}", command.getJobId());
        Job job = jobRepository.findById(command.getJobId())
            .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + command.getJobId()));
        if (!job.getRecruiterId().equals(command.getRecruiterId())
                && !"ROLE_ADMIN".equals(command.getRole()))
            throw new UnauthorizedException("Not authorized to delete this job");

        // Ask application-service for affected candidate emails.
        List<String> applicantEmails = Collections.emptyList();
        try {
            applicantEmails = applicationClient.getActiveApplicantEmails(job.getId());
        } catch (Exception ex) {
            log.warn("Could not fetch active applicant emails for jobId={}: {}", job.getId(), ex.getMessage());
        }

        jobRepository.delete(job);
        try {
            // Send emails list in event so notification-service can work without extra Feign calls.
            jobEventProducer.publish(JobEvent.builder()
                .id(job.getId())
                .title(job.getTitle())
                .company(job.getCompany())
                .action("DELETED")
                .applicantEmails(applicantEmails)
                .build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for job DELETED id={}: {}", job.getId(), ex.getMessage());
        }
        log.info("Job deleted: id={}", command.getJobId());
    }

    @Transactional
    @CacheEvict(cacheNames = {"job:stats"}, allEntries = true)
    public void incrementApplicationCount(Long jobId) {
        jobRepository.findById(jobId)
            .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));
        jobRepository.incrementApplications(jobId);
    }
}
