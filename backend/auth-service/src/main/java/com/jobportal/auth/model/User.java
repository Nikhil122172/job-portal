package com.jobportal.auth.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false, length = 36)
    private String uuid;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "profile_image_public_id")
    private String profileImagePublicId;

    @Column(length = 500)
    private String bio;

    @Column(length = 100)
    private String location;

    @Column(name = "company_name", length = 100)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "is_active") @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_email_verified") @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() {
        if (uuid == null || uuid.isBlank()) uuid = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Role {
        ROLE_JOB_SEEKER,
        ROLE_RECRUITER,
        ROLE_ADMIN;

        @JsonCreator
        public static Role fromValue(String value) {
            if (value == null || value.isBlank()) {
                return null;
            }

            String normalized = value.trim().toUpperCase(Locale.ROOT);
            if (!normalized.startsWith("ROLE_")) {
                normalized = "ROLE_" + normalized;
            }

            return Role.valueOf(normalized);
        }
    }
}
