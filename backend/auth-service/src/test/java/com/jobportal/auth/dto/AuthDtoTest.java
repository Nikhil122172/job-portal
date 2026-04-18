package com.jobportal.auth.dto;

import com.jobportal.auth.model.User;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthDtoTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void authResponse_builderSetsFields() {
        AuthDto.UserResponse user = AuthDto.UserResponse.builder().id(1L).email("a@test.com").role("ROLE_JOB_SEEKER").build();
        AuthDto.AuthResponse resp = AuthDto.AuthResponse.builder()
                .accessToken("access")
                .refreshToken("refresh")
                .tokenType("Bearer")
                .expiresIn(3600L)
                .user(user)
                .build();

        assertThat(resp.getAccessToken()).isEqualTo("access");
        assertThat(resp.getUser().getEmail()).isEqualTo("a@test.com");
    }

    @Test
    void registerRequest_builderStoresRole() {
        AuthDto.RegisterRequest req = AuthDto.RegisterRequest.builder()
                .username("user")
                .email("u@test.com")
                .password("secret")
                .otp("123456")
                .fullName("User")
                .phoneNumber("+1234567890")
                .role(User.Role.ROLE_RECRUITER)
                .build();

        assertThat(req.getRole()).isEqualTo(User.Role.ROLE_RECRUITER);
        assertThat(req.getOtp()).isEqualTo("123456");
    }

    @Test
    void registerRequest_requiresPhoneNumber() {
        AuthDto.RegisterRequest req = AuthDto.RegisterRequest.builder()
                .username("user")
                .email("u@test.com")
                .password("secret")
                .fullName("User")
                .role(User.Role.ROLE_JOB_SEEKER)
                .build();

        assertThat(validator.validate(req))
                .extracting("message")
                .contains("Phone number is required");
    }

        @Test
        void registerRequest_rejectsNonTenDigitPhoneNumber() {
        AuthDto.RegisterRequest req = AuthDto.RegisterRequest.builder()
            .username("user")
            .email("u@test.com")
            .password("secret")
            .fullName("User")
            .phoneNumber("+911234567890")
            .role(User.Role.ROLE_JOB_SEEKER)
            .build();

        assertThat(validator.validate(req))
            .extracting("message")
            .contains("Phone number must be exactly 10 digits");
        }
}
