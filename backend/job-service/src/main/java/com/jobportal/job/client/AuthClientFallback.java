package com.jobportal.job.client;

import com.jobportal.job.dto.UserClientDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component @Slf4j
public class AuthClientFallback implements AuthClient {
    @Override
    public UserClientDto getUserById(Long id) {
        log.warn("Auth service unavailable, returning fallback for user {}", id);
        return UserClientDto.builder().id(id).fullName("Unknown").email("").build();
    }
}
