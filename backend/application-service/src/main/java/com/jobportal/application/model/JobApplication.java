package com.jobportal.application.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_applications",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "job_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class JobApplication {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false, length = 36)
    private String uuid;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "recruiter_id", nullable = false)
    private Long recruiterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(name = "resume_url")
    private String resumeUrl;

    @Column(name = "resume_public_id")
    private String resumePublicId;

    @Column(name = "cover_letter", columnDefinition = "TEXT")
    private String coverLetter;

    @Column(name = "applicant_name")
    private String applicantName;

    @Column(name = "applicant_email")
    private String applicantEmail;

    @Column(name = "applicant_phone")
    private String applicantPhone;

    @Column(name = "job_title")
    private String jobTitle;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "status_note", columnDefinition = "TEXT")
    private String statusNote;

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null || uuid.isBlank()) uuid = UUID.randomUUID().toString();
        appliedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum ApplicationStatus {
        APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW_SCHEDULED, REJECTED, OFFERED, WITHDRAWN
    }
}
