package com.jobportal.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.notification.config.SecurityConfig;
import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.model.Notification;
import com.jobportal.notification.security.GatewayHeaderFilter;
import com.jobportal.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
@Import({SecurityConfig.class, GatewayHeaderFilter.class})
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private NotificationService notificationService;

    @Test
    void send_returnsAccepted() throws Exception {
        NotificationRequest req = NotificationRequest.builder().to("u@test.com").subject("Hi").body("b").build();
        mockMvc.perform(post("/api/v1/notifications/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isAccepted());
    }

    @Test
    void getMy_returnsPage() throws Exception {
        Page<Notification> page = new PageImpl<>(List.of(Notification.builder().id(1L).build()));
        when(notificationService.getUserNotifications(5L, 0, 10)).thenReturn(page);

        mockMvc.perform(get("/api/v1/notifications/my")
                        .header("X-User-Id", 5L)
                        .header("X-User-Role", "ROLE_JOB_SEEKER"))
                .andExpect(status().isOk());
    }
}
