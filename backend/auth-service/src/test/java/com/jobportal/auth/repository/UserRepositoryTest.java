package com.jobportal.auth.repository;

import com.jobportal.auth.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveAndFindByEmail() {
        User user = User.builder()
                .username("john")
                .email("john@test.com")
                .password("p")
                .fullName("John")
                .role(User.Role.ROLE_JOB_SEEKER)
                .build();
        userRepository.save(user);

        boolean exists = userRepository.existsByEmail("john@test.com");
        User found = userRepository.findByEmail("john@test.com").orElseThrow();

        assertThat(exists).isTrue();
        assertThat(found.getUsername()).isEqualTo("john");
    }
}
