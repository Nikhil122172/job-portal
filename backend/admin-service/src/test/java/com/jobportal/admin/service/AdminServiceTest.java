package com.jobportal.admin.service;

import com.jobportal.admin.client.AuthAdminClient;
import com.jobportal.admin.client.JobAdminClient;
import com.jobportal.admin.dto.AnalyticsDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private AuthAdminClient authClient;
    @Mock private JobAdminClient jobClient;

    @InjectMocks private AdminService adminService;

    @Test
    void getDashboardAnalytics_returnsAggregatedStats() {
        when(jobClient.getJobStats()).thenReturn(Map.of(
                "totalJobs", 12L,
                "activeJobs", 10L,
                "closedJobs", 2L
        ));

        AnalyticsDto analytics = adminService.getDashboardAnalytics();

        assertThat(analytics.getTotalJobs()).isEqualTo(12L);
        assertThat(analytics.getActiveJobs()).isEqualTo(10L);
        assertThat(analytics.getClosedJobs()).isEqualTo(2L);
    }

    @Test
    void getDashboardAnalytics_whenClientFails_returnsEmptyDto() {
        when(jobClient.getJobStats()).thenThrow(new RuntimeException("down"));

        AnalyticsDto analytics = adminService.getDashboardAnalytics();

        assertThat(analytics.getTotalJobs()).isZero();
        assertThat(analytics.getActiveJobs()).isZero();
    }
}
