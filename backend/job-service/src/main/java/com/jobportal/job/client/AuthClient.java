package com.jobportal.job.client;

import com.jobportal.job.dto.UserClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service", fallback = AuthClientFallback.class)
public interface AuthClient {

    @GetMapping("/api/v1/users/{id}")
    UserClientDto getUserById(@PathVariable("id") Long id);
}
