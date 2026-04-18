package com.jobportal.admin.dto;
import lombok.*;
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AnalyticsDto {
    private long totalUsers;
    private long totalJobSeekers;
    private long totalRecruiters;
    private long totalJobs;
    private long activeJobs;
    private long closedJobs;
    private long totalApplications;
    private long pendingApplications;
    private long shortlistedApplications;
}
