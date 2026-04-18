package com.jobportal.notification.dto;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class NotificationRequestTest {
    @Test
    void builder_setsFields() {
        NotificationRequest req = NotificationRequest.builder()
                .to("u@test.com").subject("S").body("B").type("TYPE").userId(1L).applicationId(2L)
                .build();
        assertThat(req.getTo()).isEqualTo("u@test.com");
        assertThat(req.getApplicationId()).isEqualTo(2L);
    }
}
