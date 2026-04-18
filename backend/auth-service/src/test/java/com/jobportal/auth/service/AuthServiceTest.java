package com.jobportal.auth.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.jobportal.auth.client.NotificationClient;
import com.jobportal.auth.dto.AuthDto;
import com.jobportal.auth.dto.NotificationRequest;
import com.jobportal.auth.event.UserEvent;
import com.jobportal.auth.exception.BadRequestException;
import com.jobportal.auth.exception.DuplicateResourceException;
import com.jobportal.auth.exception.ResourceNotFoundException;
import com.jobportal.auth.exception.UnauthorizedException;
import com.jobportal.auth.kafka.UserEventProducer;
import com.jobportal.auth.mapper.UserMapper;
import com.jobportal.auth.model.User;
import com.jobportal.auth.repository.UserRepository;
import com.jobportal.auth.security.jwt.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private UserMapper userMapper;
    @Mock private Cloudinary cloudinary;
    @Mock private Uploader uploader;
    @Mock private NotificationClient notificationClient;
    @Mock private RedisOtpService redisOtpService;
    @Mock private UserEventProducer userEventProducer;

    @InjectMocks private AuthService authService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(authService, "otpExpiryMinutes", 10L);
    }

    @Test
    void requestEmailOtp_savesOtpAndNotifies() throws Exception {
        AuthDto.SendOtpRequest req = new AuthDto.SendOtpRequest("TEST@Example.com");
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(redisOtpService.incrementAndCheckRate("test@example.com")).thenReturn(false);

        AuthDto.MessageResponse response = authService.requestEmailOtp(req);

        assertThat(response.getMessage()).isEqualTo("OTP sent to your email");

        ArgumentCaptor<String> otpCaptor = ArgumentCaptor.forClass(String.class);
        verify(redisOtpService).saveOtp(eq("test@example.com"), otpCaptor.capture());
        assertThat(otpCaptor.getValue()).matches("\\d{6}");

        ArgumentCaptor<NotificationRequest> notificationCaptor = ArgumentCaptor.forClass(NotificationRequest.class);
        verify(notificationClient).sendNotification(notificationCaptor.capture());
        NotificationRequest sent = notificationCaptor.getValue();
        assertThat(sent.getTo()).isEqualTo("test@example.com");
        assertThat(sent.getSubject()).contains("Verify your CareerBridge email");
        assertThat(sent.getBody()).contains("verification code");
        assertThat(sent.getBody()).contains(otpCaptor.getValue());
    }

    @Test
    void requestEmailOtp_existingEmail_throwsDuplicateResource() {
        AuthDto.SendOtpRequest req = new AuthDto.SendOtpRequest("taken@example.com");
        when(userRepository.existsByEmail("taken@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.requestEmailOtp(req))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void login_withInvalidPassword_throwsUnauthorized() {
        User user = User.builder().email("demo@example.com").password("encoded").isActive(true).isEmailVerified(true).build();
        when(userRepository.findByEmail("demo@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("plain", "encoded")).thenReturn(false);

        AuthDto.LoginRequest req = new AuthDto.LoginRequest("demo@example.com", "plain");
        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void login_withUnknownEmail_throwsResourceNotFound() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        AuthDto.LoginRequest req = new AuthDto.LoginRequest("missing@example.com", "plain");
        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void refreshToken_invalidToken_throwsUnauthorized() {
        when(jwtUtil.isTokenValid("bad")).thenReturn(false);

        assertThatThrownBy(() -> authService.refreshToken("bad"))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsBadRequest() {
        User user = User.builder().id(1L).password("encoded").build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded")).thenReturn(false);

        AuthDto.ChangePasswordRequest req = new AuthDto.ChangePasswordRequest();
        ReflectionTestUtils.setField(req, "currentPassword", "wrong");
        ReflectionTestUtils.setField(req, "newPassword", "NewPass123");

        assertThatThrownBy(() -> authService.changePassword(1L, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Current password is incorrect");
    }

    @Test
    void register_publishesUserEvent() {
        AuthDto.RegisterRequest req = AuthDto.RegisterRequest.builder()
                .username("john").email("john@test.com").password("pass")
                .fullName("John Doe").otp("123456").role(User.Role.ROLE_JOB_SEEKER).build();

        when(userRepository.existsByEmail("john@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("john")).thenReturn(false);
        when(redisOtpService.isEmailVerified("john@test.com")).thenReturn(true);
        when(passwordEncoder.encode("pass")).thenReturn("encoded");
        when(userMapper.toEntity(any(AuthDto.RegisterRequest.class))).thenReturn(User.builder().build());
        User saved = User.builder().id(1L).username("john").email("john@test.com")
                .fullName("John Doe").role(User.Role.ROLE_JOB_SEEKER).isEmailVerified(true).build();
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(jwtUtil.generateAccessToken(any(), any(), any())).thenReturn("access");
        when(jwtUtil.generateRefreshToken(any())).thenReturn("refresh");
        when(userMapper.toUserResponse(any(User.class))).thenReturn(AuthDto.UserResponse.builder().id(1L).build());

        authService.register(req);

        verify(userEventProducer).publish(any(UserEvent.class));
    }

    @Test
    void deleteUser_publishesDeletedEvent() {
        when(userRepository.existsById(42L)).thenReturn(true);

        authService.deleteUser(42L);

        verify(userRepository).deleteById(42L);
        ArgumentCaptor<UserEvent> captor = ArgumentCaptor.forClass(UserEvent.class);
        verify(userEventProducer).publish(captor.capture());
        assertThat(captor.getValue().getAction()).isEqualTo("DELETED");
        assertThat(captor.getValue().getId()).isEqualTo(42L);
    }
}
