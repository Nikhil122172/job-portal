package com.jobportal.admin.controller;

import com.jobportal.admin.client.AuthAdminClient;
import com.jobportal.admin.client.ApplicationAdminClient;
import com.jobportal.admin.client.JobAdminClient;
import com.jobportal.admin.config.SecurityConfig;
import com.jobportal.admin.security.GatewayHeaderFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminController.class)
@Import({SecurityConfig.class, GatewayHeaderFilter.class})
class AdminControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private AuthAdminClient authClient;
    @MockBean private JobAdminClient jobClient;
    @MockBean private ApplicationAdminClient applicationClient;

    @Test
    void dashboard_returnsOk() throws Exception {
        when(jobClient.getJobStats()).thenReturn(Map.of("totalJobs", 1));
        when(authClient.getAllUsers(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), anyInt(), anyInt()))
            .thenReturn(Map.of("totalElements", 0));
        when(applicationClient.getAllApplications(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), anyInt(), anyInt()))
            .thenReturn(Map.of("totalElements", 0));

        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteUser_invokesClient() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/5")
                        .header("X-User-Id", "1")
                        .header("X-User-Role", "ROLE_ADMIN"))
                .andExpect(status().isNoContent());
        verify(authClient).deleteUser("5");
    }
}
