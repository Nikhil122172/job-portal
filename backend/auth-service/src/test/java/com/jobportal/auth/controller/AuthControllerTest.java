package com.jobportal.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobportal.auth.config.SecurityConfig;
import com.jobportal.auth.dto.AuthDto;
import com.jobportal.auth.model.User;
import com.jobportal.auth.security.jwt.JwtUtil;
import com.jobportal.auth.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AuthService authService;
    @MockBean private JwtUtil jwtUtil;

    @Test
    void register_returnsCreatedUser() throws Exception {
        AuthDto.RegisterRequest req = AuthDto.RegisterRequest.builder()
                .username("user")
                .email("user@test.com")
                .password("secret123")
                .otp("123456")
                .fullName("Test User")
                .phoneNumber("1234567890")
                .role(User.Role.ROLE_JOB_SEEKER)
                .build();
        AuthDto.AuthResponse resp = AuthDto.AuthResponse.builder()
                .accessToken("a")
                .refreshToken("r")
                .user(AuthDto.UserResponse.builder().id(1L).email("user@test.com").build())
                .build();
        when(authService.register(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.id").value(1L))
                .andExpect(jsonPath("$.accessToken").value("a"));
    }

    @Test
    void getCurrentUser_returnsUser() throws Exception {
        AuthDto.UserResponse user = AuthDto.UserResponse.builder().id(5L).email("u@test.com").build();
        when(authService.getCurrentUser(5L)).thenReturn(user);

        mockMvc.perform(get("/api/v1/users/me").header("X-User-Id", 5L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5L))
                .andExpect(jsonPath("$.email").value("u@test.com"));
    }
}
