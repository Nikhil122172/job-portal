package com.jobportal.auth.config;

import com.jobportal.auth.model.User;
import com.jobportal.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * DataSeeder - runs at startup and ensures the default admin account exists.
 *
 * Credentials:
 *   username : admin
 *   email    : admin@jobportal.com
 *   password : Admin@123
 *
 * The seeder is idempotent; it will never overwrite an existing admin record.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
    }

    private void seedAdmin() {
        String adminEmail    = "admin@jobportal.com";
        String adminUsername = "admin";

        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin account already exists - skipping seed.");
            return;
        }

        User admin = User.builder()
                .username(adminUsername)
                .email(adminEmail)
                .password(passwordEncoder.encode("Admin@123"))
                .fullName("System Administrator")
                .role(User.Role.ROLE_ADMIN)
                .isActive(true)
                .isEmailVerified(true)
                .build();

        userRepository.save(admin);
        log.info("Default admin account seeded (email: {}, password: Admin@123)", adminEmail);
    }
}
