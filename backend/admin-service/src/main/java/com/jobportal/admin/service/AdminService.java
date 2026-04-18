package com.jobportal.admin.service;
import com.jobportal.admin.client.*;
import com.jobportal.admin.dto.AnalyticsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;
@Service @RequiredArgsConstructor
public class AdminService {
    private final AuthAdminClient authClient;
    private final JobAdminClient jobClient;

    public Map<String,Object> getAllUsers(String keyword, String role, Boolean isActive, int page, int size) { return authClient.getAllUsers(keyword, role, isActive, page, size); }
    public Map<String,Object> getUserById(Long id) { return authClient.getUserById(String.valueOf(id)); }
    public void deleteUser(Long id) { authClient.deleteUser(String.valueOf(id)); }
    public void toggleUserStatus(Long id) { authClient.toggleUserStatus(String.valueOf(id)); }
    public Map<String,Object> getAllJobs(String keyword, String status, int page, int size) { return jobClient.getAllJobs(keyword, status, page, size); }
    public Map<String,Object> getJobStats() { return jobClient.getJobStats(); }

    public AnalyticsDto getDashboardAnalytics() {
        try {
            // Keep this light: dashboard reads only job counters for now.
            Map<String,Object> jobStats = jobClient.getJobStats();
            return AnalyticsDto.builder()
                .totalJobs(toLong(jobStats.get("totalJobs")))
                .activeJobs(toLong(jobStats.get("activeJobs")))
                .closedJobs(toLong(jobStats.get("closedJobs")))
                .build();
        } catch (Exception e) {
            // Fail safe: return empty analytics instead of failing admin dashboard.
            return new AnalyticsDto();
        }
    }
    private long toLong(Object o) { return o instanceof Number n ? n.longValue() : 0L; }
}
