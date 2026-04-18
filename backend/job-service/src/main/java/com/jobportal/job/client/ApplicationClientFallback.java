package com.jobportal.job.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class ApplicationClientFallback implements ApplicationClient {

    @Override
    public List<String> getActiveApplicantEmails(Long jobId) {
        log.warn("Application service unavailable, no applicant emails returned for jobId={}", jobId);
        return Collections.emptyList();
    }
}
