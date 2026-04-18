package com.jobportal.application.client;

import com.jobportal.application.dto.JobClientDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component @Slf4j
public class JobClientFallback implements JobClient {
    @Override
    public JobClientDto getJobById(String id) {
        log.warn("Job service unavailable for job {}", id);
        return JobClientDto.builder().title("Unknown").company("Unknown").build();
    }
    @Override
    public void incrementApplicationCount(Long id) {
        log.warn("Could not increment application count for job {}", id);
    }
}
