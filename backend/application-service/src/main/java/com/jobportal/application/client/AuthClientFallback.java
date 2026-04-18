package com.jobportal.application.client;

import com.jobportal.application.dto.UserClientDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component @Slf4j
public class AuthClientFallback implements AuthClient {
    @Override
    public UserClientDto getUserById(Long id) {
        log.warn("Auth service unavailable for user {}", id);
        return UserClientDto.builder().id(id).fullName("Unknown").email("").build();
    }
}
