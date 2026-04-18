package com.jobportal.admin.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class JobAdminClientFallback implements JobAdminClient {

    @Override
    public Map<String, Object> getJobStats() {
        log.warn("Job service unavailable, returning fallback stats");
        return Map.of("totalJobs", 0, "activeJobs", 0, "closedJobs", 0);
    }

    @Override
    public Map<String, Object> getAllJobs(String keyword, String status, int page, int size) {
        log.warn("Job service unavailable, returning empty jobs list fallback");
        return Map.of("content", List.of(), "page", page, "size", size, "totalElements", 0);
    }

    @Override
    public void deleteJob(String id, Long userId, String role) {
        log.warn("Job service unavailable, could not delete job {}", id);
    }
}
