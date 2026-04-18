package com.jobportal.job.repository;

import com.jobportal.job.model.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    Optional<Job> findByUuid(String uuid);
    Page<Job> findByRecruiterId(Long recruiterId, Pageable pageable);
    Page<Job> findByStatus(Job.JobStatus status, Pageable pageable);

    /**
     * BUG FIX: original query used the string literal 'ACTIVE' which causes a
     * type-mismatch with the JobStatus enum on some JPA providers.
     * Now uses a named parameter :activeStatus bound to Job.JobStatus.ACTIVE
     * at the call site, making it type-safe and provider-agnostic.
     */
    @Query(value = """
        SELECT j FROM Job j
        WHERE (:status IS NULL OR j.status = :status)
        AND (:keyword IS NULL OR (LOWER(j.title) LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(j.company) LIKE LOWER(CONCAT('%',:keyword,'%'))))
        AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%',:location,'%')))
        AND (:category IS NULL OR j.category = :category)
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:isRemote IS NULL OR j.isRemote = :isRemote)
        """,
        countQuery = """
        SELECT COUNT(j) FROM Job j
        WHERE (:status IS NULL OR j.status = :status)
        AND (:keyword IS NULL OR (LOWER(j.title) LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(j.description) LIKE LOWER(CONCAT('%',:keyword,'%'))
             OR LOWER(j.company) LIKE LOWER(CONCAT('%',:keyword,'%'))))
        AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%',:location,'%')))
        AND (:category IS NULL OR j.category = :category)
        AND (:jobType IS NULL OR j.jobType = :jobType)
        AND (:experienceLevel IS NULL OR j.experienceLevel = :experienceLevel)
        AND (:isRemote IS NULL OR j.isRemote = :isRemote)
        """)
    Page<Job> searchJobs(@Param("keyword")         String keyword,
                         @Param("location")        String location,
                         @Param("category")        String category,
                         @Param("jobType")         Job.JobType jobType,
                         @Param("experienceLevel") Job.ExperienceLevel experienceLevel,
                         @Param("isRemote")        Boolean isRemote,
                         @Param("status")          Job.JobStatus status,
                         Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Job j SET j.viewsCount = j.viewsCount + 1 WHERE j.id = :id")
    void incrementViews(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Job j SET j.applicationsCount = j.applicationsCount + 1 WHERE j.id = :id")
    void incrementApplications(@Param("id") Long id);

    long countByStatus(Job.JobStatus status);
    long countByRecruiterId(Long recruiterId);

    @Query("SELECT DISTINCT j.category FROM Job j WHERE j.category IS NOT NULL")
    List<String> findAllCategories();
}
