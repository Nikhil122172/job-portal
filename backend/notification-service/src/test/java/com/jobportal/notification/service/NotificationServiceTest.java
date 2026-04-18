package com.jobportal.notification.service;

import com.jobportal.notification.dto.NotificationRequest;
import com.jobportal.notification.model.Notification;
import com.jobportal.notification.repository.NotificationRepository;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private JavaMailSender mailSender;
    @Mock private NotificationRepository notificationRepository;

    @InjectMocks private NotificationService notificationService;

    @Test
    void sendNotification_marksAsSentOnSuccess() throws Exception {
        NotificationRequest request = NotificationRequest.builder()
                .to("user@test.com").subject("Hi").body("Body").type("JOB_APPLIED").build();

        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationService.sendNotification(request);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        Notification finalSave = captor.getAllValues().get(1);
        assertThat(finalSave.getStatus()).isEqualTo(Notification.NotificationStatus.SENT);
        assertThat(finalSave.getSentAt()).isNotNull();
    }

    @Test
    void sendNotification_marksFailedWhenEmailThrows() throws Exception {
        NotificationRequest request = NotificationRequest.builder()
                .to("user@test.com").subject("Hi").body("Body").type("JOB_APPLIED").build();

        MimeMessage mimeMessage = new MimeMessage((Session) null);
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new RuntimeException("smtp down")).when(mailSender).send(any(MimeMessage.class));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        notificationService.sendNotification(request);

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, times(2)).save(captor.capture());
        Notification finalSave = captor.getAllValues().get(1);
        assertThat(finalSave.getStatus()).isEqualTo(Notification.NotificationStatus.FAILED);
        assertThat(finalSave.getErrorMessage()).contains("smtp down");
    }
}
