package com.jobportal.auth.dto;

import com.jobportal.auth.model.User;
import jakarta.validation.constraints.*;
import lombok.*;

public class AuthDto {

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        private String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        // otp is used as fallback verification if Redis verified flag is missing
        @Pattern(regexp = "^(\\d{6})?$", message = "OTP must be 6 digits if provided")
        private String otp;

        @NotBlank(message = "Full name is required")
        private String fullName;

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
        private String phoneNumber;

        @NotNull(message = "Role is required")
        private User.Role role;

        private String companyName; // for RECRUITER
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn;
        private UserResponse user;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserResponse {
        private Long id;
        private String uuid;
        private String username;
        private String email;
        private String fullName;
        private String phoneNumber;
        private String profileImageUrl;
        private String bio;
        private String location;
        private String companyName;
        private String role;
        private Boolean isActive;
        private String createdAt;
        private String updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateProfileRequest {
        @Size(min = 2, max = 100, message = "Full name must be 2-100 characters")
        private String fullName;

        // phoneNumber is optional in profile updates — omit to keep existing value
        @Pattern(regexp = "^(\\d{10})?$", message = "Phone number must be exactly 10 digits if provided")
        private String phoneNumber;

        @Size(max = 500, message = "Bio cannot exceed 500 characters")
        private String bio;

        @Size(max = 100, message = "Location cannot exceed 100 characters")
        private String location;

        @Size(max = 120, message = "Company name cannot exceed 120 characters")
        private String companyName;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class SendOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VerifyOtpRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Please provide a valid email address")
        private String email;

        @NotBlank(message = "OTP is required")
        @Pattern(regexp = "\\d{6}", message = "OTP must be 6 digits")
        private String otp;
    }

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MessageResponse {
        private String message;
    }
}
