package com.jobportal.notification.repository;

import com.jobportal.notification.model.Notification;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class NotificationRepositoryTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @Test
    void findByUserId_returnsPage() {
        notificationRepository.save(Notification.builder()
                .userId(2L)
                .to("u@test.com")
                .subject("Hi")
                .body("b")
                .build());

        Page<Notification> page = notificationRepository.findByUserId(2L, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getTo()).isEqualTo("u@test.com");
    }
}
