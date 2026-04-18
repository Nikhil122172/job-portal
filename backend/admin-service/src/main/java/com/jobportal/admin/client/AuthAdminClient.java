package com.jobportal.admin.client;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@FeignClient(name = "auth-service", fallback = AuthAdminClientFallback.class)
public interface AuthAdminClient {
    @GetMapping("/api/v1/users")
    Map<String,Object> getAllUsers(@RequestParam(required = false) String keyword,
                                   @RequestParam(required = false) String role,
                                   @RequestParam(required = false) Boolean isActive,
                                   @RequestParam int page,
                                   @RequestParam int size);
    @GetMapping("/api/v1/users/{id}")
    Map<String,Object> getUserById(@PathVariable String id);
    @DeleteMapping("/api/v1/users/{id}")
    void deleteUser(@PathVariable String id);
    @PatchMapping("/api/v1/users/{id}/toggle-status")
    void toggleUserStatus(@PathVariable String id);
}
