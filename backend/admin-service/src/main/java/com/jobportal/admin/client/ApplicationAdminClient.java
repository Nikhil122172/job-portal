package com.jobportal.admin.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@FeignClient(name = "application-service", fallback = ApplicationAdminClientFallback.class)
public interface ApplicationAdminClient {
    @GetMapping("/api/v1/applications/admin/all")
    Map<String, Object> getAllApplications(@RequestParam(required = false) String keyword,
                                           @RequestParam(required = false) String status,
                                           @RequestParam int page,
                                           @RequestParam int size);
}
