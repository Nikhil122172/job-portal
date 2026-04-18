package com.jobportal.application.client;

import com.jobportal.application.dto.JobClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "job-service",
    fallback = JobClientFallback.class
)
public interface JobClient {
    @GetMapping("/api/v1/jobs/{id}")
    JobClientDto getJobById(@PathVariable("id") String id);

    @PatchMapping("/api/v1/jobs/{id}/increment-application")
    void incrementApplicationCount(@PathVariable("id") Long id);
}
