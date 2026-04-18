package com.jobportal.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisOtpService {

    private final StringRedisTemplate redis;

    @Value("${otp.expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${otp.requests-per-window:5}")
    private int otpRequestsPerWindow;

    @Value("${otp.window-seconds:600}")
    private long otpWindowSeconds;

    private String otpKey(String email) {
        // Raw OTP storage key.
        return "otp:" + email.toLowerCase();
    }

    private String verifiedKey(String email) {
        // Marker key used after successful OTP verification.
        return "otp:verified:" + email.toLowerCase();
    }

    private String rateKey(String email) {
        return "rl:otp:" + email.toLowerCase();
    }

    public void saveOtp(String email, String otp) {
        // Clear any stale verified flag when a fresh OTP is requested
        redis.delete(verifiedKey(email));
        redis.opsForValue().set(otpKey(email), otp, Duration.ofMinutes(otpExpiryMinutes));
    }

    /**
     * Verifies the OTP entered by the user.
     * On success: deletes the raw OTP and stores a short-lived "verified" flag.
     * The flag is kept (not consumed on check) so that if registration fails
     * partway (e.g. duplicate username), the user can retry without re-doing OTP.
     */
    public boolean verifyOtp(String email, String otp) {
        String key    = otpKey(email);
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(otp)) {
            return false;
        }
        // OTP matched: delete the raw OTP and plant a verified marker
        redis.delete(key);
        redis.opsForValue().set(verifiedKey(email), "1", Duration.ofMinutes(otpExpiryMinutes));
        return true;
    }

    /**
     * Checks whether the email was already verified in this session.
    * Does NOT delete the flag - allows the user to retry registration
     * if it fails for other reasons (e.g. duplicate username).
     * The flag expires naturally via TTL.
     */
    public boolean isEmailVerified(String email) {
        String key    = verifiedKey(email.toLowerCase());
        String marker = redis.opsForValue().get(key);
        return "1".equals(marker);
    }

    /**
     * Also verify email using a raw OTP (fallback for register endpoint).
     * This allows registration to succeed even if Redis lost the verified flag
     * (e.g. after a Redis restart) but the user still has their OTP.
     */
    public boolean verifyOtpForRegistration(String email, String otp) {
        if (otp == null || otp.isBlank()) return false;
        String key    = otpKey(email);
        String stored = redis.opsForValue().get(key);
        if (stored != null && stored.equals(otp)) {
            redis.delete(key);
            return true;
        }
        return false;
    }

    public boolean incrementAndCheckRate(String email) {
        String key   = rateKey(email);
        Long   count = redis.opsForValue().increment(key);
        if (count != null && count == 1L) {
            // Start window only on first request.
            redis.expire(key, Duration.ofSeconds(otpWindowSeconds));
        }
        return count != null && count > otpRequestsPerWindow;
    }
}
