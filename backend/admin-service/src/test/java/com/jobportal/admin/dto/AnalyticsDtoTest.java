package com.jobportal.admin.dto;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class AnalyticsDtoTest {
    @Test
    void builder_setsFields() {
        AnalyticsDto dto = AnalyticsDto.builder()
                .totalJobs(5)
                .activeJobs(3)
                .closedJobs(2)
                .build();
        assertThat(dto.getTotalJobs()).isEqualTo(5);
        assertThat(dto.getClosedJobs()).isEqualTo(2);
    }
}
