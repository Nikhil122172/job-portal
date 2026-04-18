package com.jobportal.job.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "application-service", fallback = ApplicationClientFallback.class)
public interface ApplicationClient {

    @GetMapping("/api/v1/applications/internal/jobs/{jobId}/active-applicant-emails")
    List<String> getActiveApplicantEmails(@PathVariable("jobId") Long jobId);
}
