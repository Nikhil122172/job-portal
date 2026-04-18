package com.jobportal.auth.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisOtpServiceTest {

    @Mock private StringRedisTemplate redis;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks private RedisOtpService redisOtpService;

    @BeforeEach
    void setup() {
        when(redis.opsForValue()).thenReturn(valueOps);
        ReflectionTestUtils.setField(redisOtpService, "otpExpiryMinutes",    10L);
        ReflectionTestUtils.setField(redisOtpService, "otpRequestsPerWindow", 5);
        ReflectionTestUtils.setField(redisOtpService, "otpWindowSeconds",   600L);
    }

    @Test
    void verifyOtp_whenMatch_returnsTrueDeletesOtpAndSetsVerifiedFlag() {
        when(valueOps.get("otp:user@example.com")).thenReturn("123456");

        boolean result = redisOtpService.verifyOtp("user@example.com", "123456");

        assertThat(result).isTrue();
        // raw OTP key deleted
        verify(redis).delete(eq("otp:user@example.com"));
        // verified flag planted
        verify(valueOps).set(eq("otp:verified:user@example.com"), eq("1"), any());
    }

    @Test
    void verifyOtp_whenNoMatch_returnsFalse() {
        when(valueOps.get("otp:user@example.com")).thenReturn("999999");

        boolean result = redisOtpService.verifyOtp("user@example.com", "123456");

        assertThat(result).isFalse();
        verify(redis, never()).delete(anyString());
    }

    @Test
    void isEmailVerified_whenFlagPresent_returnsTrueAndKeepsFlag() {
        when(valueOps.get("otp:verified:user@example.com")).thenReturn("1");

        boolean result = redisOtpService.isEmailVerified("user@example.com");

        assertThat(result).isTrue();
        verify(redis, never()).delete("otp:verified:user@example.com");
    }

    @Test
    void isEmailVerified_whenFlagAbsent_returnsFalse() {
        when(valueOps.get("otp:verified:user@example.com")).thenReturn(null);

        boolean result = redisOtpService.isEmailVerified("user@example.com");

        assertThat(result).isFalse();
        verify(redis, never()).delete(anyString());
    }

    @Test
    void incrementAndCheckRate_overLimit_returnsTrue() {
        when(valueOps.increment("rl:otp:user@example.com")).thenReturn(6L);

        boolean limited = redisOtpService.incrementAndCheckRate("user@example.com");

        assertThat(limited).isTrue();
        verify(redis, never()).expire(any(), any());
    }
}
