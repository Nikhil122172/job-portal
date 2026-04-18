package com.jobportal.auth.repository;

import com.jobportal.auth.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    Optional<User> findByUuid(String uuid);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhoneNumber(String phoneNumber);
    Page<User> findByRole(User.Role role, Pageable pageable);
    @Query(value = """
        SELECT u FROM User u
        WHERE (:keyword IS NULL OR (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))))
        AND (:role IS NULL OR u.role = :role)
        AND (:isActive IS NULL OR u.isActive = :isActive)
        """,
        countQuery = """
        SELECT COUNT(u) FROM User u
        WHERE (:keyword IS NULL OR (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))))
        AND (:role IS NULL OR u.role = :role)
        AND (:isActive IS NULL OR u.isActive = :isActive)
        """)
    Page<User> searchUsers(@Param("keyword") String keyword,
                           @Param("role") User.Role role,
                           @Param("isActive") Boolean isActive,
                           Pageable pageable);
    long countByRole(User.Role role);
}
