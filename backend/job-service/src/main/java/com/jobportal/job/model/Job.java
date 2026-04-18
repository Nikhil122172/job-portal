package com.jobportal.job.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity @Table(name = "jobs")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Job {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, updatable = false, length = 36)
    private String uuid;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 200)
    private String company;

    @Column(nullable = false, length = 100)
    private String location;

    @Enumerated(EnumType.STRING) @Column(name = "job_type")
    private JobType jobType;

    @Enumerated(EnumType.STRING) @Column(name = "experience_level")
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Column(name = "salary_currency", length = 10) @Builder.Default
    private String salaryCurrency = "USD";

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String responsibilities;

    @Column(length = 100)
    private String category;

    private String skills;

    @Column(name = "recruiter_id", nullable = false)
    private Long recruiterId;

    @Column(name = "application_deadline")
    private LocalDateTime applicationDeadline;

    @Column(name = "is_remote") @Builder.Default
    private Boolean isRemote = false;

    @Column(name = "views_count") @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "applications_count") @Builder.Default
    private Integer applicationsCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (uuid == null || uuid.isBlank()) uuid = UUID.randomUUID().toString();
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = JobStatus.ACTIVE;
    }

    @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public enum JobType { FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE }
    public enum ExperienceLevel { ENTRY, JUNIOR, MID, SENIOR, LEAD }
    public enum JobStatus { ACTIVE, CLOSED, DRAFT, EXPIRED }
}
