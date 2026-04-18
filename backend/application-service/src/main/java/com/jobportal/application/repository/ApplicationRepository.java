package com.jobportal.application.repository;

import com.jobportal.application.model.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByUuid(String uuid);
    boolean existsByUserIdAndJobId(Long userId, Long jobId);
    Optional<JobApplication> findByUserIdAndJobId(Long userId, Long jobId);
    Page<JobApplication> findByUserId(Long userId, Pageable pageable);
    Page<JobApplication> findByJobId(Long jobId, Pageable pageable);
    List<JobApplication> findByJobIdAndStatusIn(Long jobId, List<JobApplication.ApplicationStatus> statuses);
    Page<JobApplication> findByRecruiterId(Long recruiterId, Pageable pageable);
    Page<JobApplication> findByUserIdAndStatus(Long userId, JobApplication.ApplicationStatus status, Pageable pageable);

        @Query(value = """
           SELECT a FROM JobApplication a
           WHERE (:keyword IS NULL OR (LOWER(a.applicantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.applicantEmail) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))))
           AND (:status IS NULL OR a.status = :status)
           """,
           countQuery = """
           SELECT COUNT(a) FROM JobApplication a
           WHERE (:keyword IS NULL OR (LOWER(a.applicantName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.applicantEmail) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.jobTitle) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(a.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))))
           AND (:status IS NULL OR a.status = :status)
           """)
        Page<JobApplication> searchApplications(@Param("keyword") String keyword,
                                        @Param("status") JobApplication.ApplicationStatus status,
                                        Pageable pageable);

    long countByUserId(Long userId);
    long countByUserIdAndStatusNot(Long userId, JobApplication.ApplicationStatus status);
    long countByJobId(Long jobId);
    long countByRecruiterId(Long recruiterId);
    long countByStatus(JobApplication.ApplicationStatus status);
    long countByUserIdAndStatus(Long userId, JobApplication.ApplicationStatus status);

    @Query("SELECT a.status, COUNT(a) FROM JobApplication a WHERE a.userId = :userId GROUP BY a.status")
    java.util.List<Object[]> countByUserIdGroupByStatus(@Param("userId") Long userId);

    @Query("SELECT a.status, COUNT(a) FROM JobApplication a WHERE a.recruiterId = :recruiterId GROUP BY a.status")
    java.util.List<Object[]> countByRecruiterIdGroupByStatus(@Param("recruiterId") Long recruiterId);
}
