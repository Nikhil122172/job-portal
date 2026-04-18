package com.jobportal.admin.controller;

import com.jobportal.admin.client.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController @RequestMapping("/api/v1/admin")
@RequiredArgsConstructor @Slf4j
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@Tag(name = "Admin", description = "Admin management APIs")
@SecurityRequirement(name = "Bearer Auth")
public class AdminController {

    private final AuthAdminClient authClient;
    private final JobAdminClient  jobClient;
    private final ApplicationAdminClient applicationClient;

    @GetMapping({"/dashboard", "/analytics"})
    @Operation(summary = "Get admin analytics summary")
    public ResponseEntity<Map<String,Object>> analytics() {
        return ResponseEntity.ok(buildAnalytics());
    }

    private Map<String,Object> buildAnalytics() {
        Map<String,Object> stats = new HashMap<>();
        try {
            Map<String,Object> jobStats = jobClient.getJobStats();
            if (jobStats != null) {
                stats.put("totalJobs",   jobStats.getOrDefault("totalJobs", 0));
                stats.put("activeJobs",  jobStats.getOrDefault("activeJobs", 0));
                stats.put("closedJobs",  jobStats.getOrDefault("closedJobs", 0));
            }
        } catch (Exception e) { log.warn("job stats failed: {}", e.getMessage()); }
        try {
            Map<String,Object> usersPage = authClient.getAllUsers(null, null, null, 0, 1);
            Object total = usersPage != null ? usersPage.get("totalElements") : null;
            stats.put("totalUsers", total != null ? total : 0);
        } catch (Exception e) { log.warn("user stats failed: {}", e.getMessage()); }
        try {
            Map<String,Object> appsPage = applicationClient.getAllApplications(null, null, 0, 1);
            Object total = appsPage != null ? appsPage.get("totalElements") : null;
            stats.put("totalApplications", total != null ? total : 0);
        } catch (Exception e) { log.warn("application stats failed: {}", e.getMessage()); }
        return stats;
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users")
    public ResponseEntity<Map<String,Object>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(authClient.getAllUsers(keyword, role, isActive, page, size));
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete user")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        authClient.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/toggle-status")
    @Operation(summary = "Toggle user active status")
    public ResponseEntity<Void> toggleUser(@PathVariable String id) {
        authClient.toggleUserStatus(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/jobs")
    @Operation(summary = "Get all jobs")
    public ResponseEntity<Map<String,Object>> getJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(jobClient.getAllJobs(keyword, normalizeStatus(status), page, size));
    }

    @DeleteMapping("/jobs/{id}")
    @Operation(summary = "Delete job (Admin)")
    public ResponseEntity<Void> deleteJob(@PathVariable String id,
            @RequestHeader("X-User-Id") Long adminId) {
        jobClient.deleteJob(id, adminId, "ROLE_ADMIN");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/applications")
    @Operation(summary = "Get all applications (Admin view)")
    public ResponseEntity<Map<String,Object>> getApplications(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")   int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(applicationClient.getAllApplications(keyword, normalizeStatus(status), page, size));
    }

    private String normalizeStatus(String status) {
        if (status == null) return "ALL";
        String trimmed = status.trim();
        return trimmed.isEmpty() ? "ALL" : trimmed;
    }
}
