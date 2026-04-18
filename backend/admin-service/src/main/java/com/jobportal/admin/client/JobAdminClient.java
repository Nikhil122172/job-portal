package com.jobportal.admin.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@FeignClient(name = "job-service", fallback = JobAdminClientFallback.class)
public interface JobAdminClient {
    @GetMapping("/api/v1/jobs/stats")
    Map<String,Object> getJobStats();
    @GetMapping("/api/v1/jobs/search")
    Map<String,Object> getAllJobs(@RequestParam(required = false) String keyword,
                                  @RequestParam(required = false) String status,
                                  @RequestParam int page,
                                  @RequestParam int size);
    @DeleteMapping("/api/v1/jobs/{id}")
    void deleteJob(@PathVariable String id, @RequestHeader("X-User-Id") Long userId, @RequestHeader("X-User-Role") String role);
}
