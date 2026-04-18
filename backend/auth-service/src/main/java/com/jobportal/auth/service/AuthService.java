package com.jobportal.auth.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.jobportal.auth.client.NotificationClient;
import com.jobportal.auth.dto.AuthDto;
import com.jobportal.auth.dto.NotificationRequest;
import com.jobportal.auth.event.UserEvent;
import com.jobportal.auth.exception.*;
import com.jobportal.auth.kafka.UserEventProducer;
import com.jobportal.auth.mapper.UserMapper;
import com.jobportal.auth.model.User;
import com.jobportal.auth.repository.UserRepository;
import com.jobportal.auth.security.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.SecureRandom;
import java.util.Map;

@Service @RequiredArgsConstructor @Slf4j
public class AuthService {

    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtUtil           jwtUtil;
    private final UserMapper        userMapper;
    private final Cloudinary        cloudinary;
    private final NotificationClient notificationClient;
    private final RedisOtpService   redisOtpService;
    private final UserEventProducer userEventProducer;

    @Value("${otp.expiry-minutes:10}")
    private long otpExpiryMinutes;

    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthDto.MessageResponse requestEmailOtp(AuthDto.SendOtpRequest req) {
        // Normalize email once to keep Redis and DB keys consistent.
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email))
            throw new DuplicateResourceException("Email already registered");
        if (redisOtpService.incrementAndCheckRate(email))
            throw new BadRequestException("Too many OTP requests. Please try again later.");

        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));
        // Save OTP first so user can retry delivery failures safely.
        redisOtpService.saveOtp(email, otp);

        try {
            notificationClient.sendNotification(NotificationRequest.builder()
                .to(email)
                .subject("Verify your CareerBridge email")
                .body("Your verification code is " + otp + ". It expires in " + otpExpiryMinutes + " minutes.")
                .type("EMAIL_VERIFICATION")
                .ctaLabel("Verify Email")
                .ctaUrl("/login")
                .build());
        } catch (Exception ex) {
            log.warn("OTP email dispatch failed for {}: {}", email, ex.getMessage());
        }

        return AuthDto.MessageResponse.builder().message("OTP sent to your email").build();
    }

    @Transactional
    public AuthDto.MessageResponse verifyEmailOtp(AuthDto.VerifyOtpRequest req) {
        boolean ok = redisOtpService.verifyOtp(req.getEmail().trim().toLowerCase(), req.getOtp());
        if (!ok) throw new BadRequestException("Invalid or expired OTP");
        return AuthDto.MessageResponse.builder().message("Email verified successfully").build();
    }

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email))
            throw new DuplicateResourceException("Email already registered");
        if (userRepository.existsByUsername(req.getUsername()))
            throw new DuplicateResourceException("Username already taken");
        // FIX: Validate phone number uniqueness
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()
                && userRepository.existsByPhoneNumber(req.getPhoneNumber().trim()))
            throw new DuplicateResourceException("Phone number already registered");

        // Accept verified flag first, then raw OTP fallback.
        boolean emailVerified = redisOtpService.isEmailVerified(email);
        if (!emailVerified) {
            // Fallback: try to verify with the OTP provided in the registration request
            emailVerified = redisOtpService.verifyOtpForRegistration(email, req.getOtp());
        }
        if (!emailVerified) {
            throw new BadRequestException("Please verify your email before registering. " +
                "Your OTP may have expired - please request a new one.");
        }

        User user = userMapper.toEntity(req);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setIsEmailVerified(true);
        user = userRepository.save(user);

        try {
            userEventProducer.publish(UserEvent.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .action("REGISTERED")
                .build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed for user {}: {}", email, ex.getMessage());
        }

        return buildAuthResponse(user);
    }

    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword()))
            throw new UnauthorizedException("Invalid username or password");
        if (!user.getIsActive())
            throw new UnauthorizedException("Account is deactivated");
        if (!Boolean.TRUE.equals(user.getIsEmailVerified()))
            throw new UnauthorizedException("Please verify your email before login");
        return buildAuthResponse(user);
    }

    public AuthDto.AuthResponse refreshToken(String refreshToken) {
        if (!jwtUtil.isTokenValid(refreshToken))
            throw new UnauthorizedException("Invalid or expired refresh token");
        Long userId = jwtUtil.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return buildAuthResponse(user);
    }

    public AuthDto.UserResponse getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public AuthDto.UserResponse updateProfile(Long userId, AuthDto.UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // Only update fields that are explicitly provided (non-null)
        if (req.getFullName()    != null && !req.getFullName().isBlank())    user.setFullName(req.getFullName().trim());
        if (req.getPhoneNumber() != null && !req.getPhoneNumber().isBlank()) user.setPhoneNumber(req.getPhoneNumber().trim());
        if (req.getBio()         != null)                                    user.setBio(req.getBio());
        if (req.getLocation()    != null)                                    user.setLocation(req.getLocation());
        if (req.getCompanyName() != null)                                    user.setCompanyName(req.getCompanyName());
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, AuthDto.ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPassword()))
            throw new BadRequestException("Current password is incorrect");
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public AuthDto.UserResponse uploadProfileImage(Long userId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getProfileImagePublicId() != null)
            cloudinary.uploader().destroy(user.getProfileImagePublicId(),
                ObjectUtils.asMap("invalidate", true));

        // BUG FIX: transformation must be a Map (not a String) for the Cloudinary Java SDK.
        // BUG FIX: "invalidate: true" clears the CDN cache so the new image is
        //           immediately visible to all users (not just the uploader).
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(),
            ObjectUtils.asMap(
                "folder", "job-portal/profiles",
                "resource_type", "image",
                "invalidate", true,
                "transformation", ObjectUtils.asMap(
                    "width", 400, "height", 400,
                    "crop", "fill", "gravity", "face", "quality", "auto"
                )
            ));
        user.setProfileImageUrl((String) result.get("secure_url"));
        user.setProfileImagePublicId((String) result.get("public_id"));
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public Page<AuthDto.UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toUserResponse);
    }

    public Page<AuthDto.UserResponse> getAllUsers(Pageable pageable, String keyword, User.Role role, Boolean isActive) {
        return userRepository.searchUsers(keyword, role, isActive, pageable).map(userMapper::toUserResponse);
    }

    public Page<AuthDto.UserResponse> getUsersByRole(User.Role role, Pageable pageable) {
        return userRepository.findByRole(role, pageable).map(userMapper::toUserResponse);
    }

    @Transactional
    public void toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        try {
            userEventProducer.publish(UserEvent.builder()
                .id(user.getId()).email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .action("TOGGLED_STATUS").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed: {}", ex.getMessage());
        }
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId))
            throw new ResourceNotFoundException("User not found");
        userRepository.deleteById(userId);
        try {
            userEventProducer.publish(UserEvent.builder().id(userId).action("DELETED").build());
        } catch (Exception ex) {
            log.warn("Kafka publish failed: {}", ex.getMessage());
        }
    }

    public AuthDto.UserResponse getCurrentUserByReference(String userRef) {
        return userMapper.toUserResponse(resolveUserByReference(userRef));
    }

    @Transactional
    public void toggleUserStatusByReference(String userRef) {
        toggleUserStatus(resolveUserByReference(userRef).getId());
    }

    @Transactional
    public void deleteUserByReference(String userRef) {
        deleteUser(resolveUserByReference(userRef).getId());
    }

    private User resolveUserByReference(String userRef) {
        if (userRef == null || userRef.isBlank()) {
            throw new ResourceNotFoundException("User not found");
        }
        try {
            Long id = Long.parseLong(userRef);
            return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        } catch (NumberFormatException ignored) {
            return userRepository.findByUuid(userRef)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
    }

    private AuthDto.AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        return AuthDto.AuthResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtUtil.getExpiration())
            .user(userMapper.toUserResponse(user))
            .build();
    }
}
