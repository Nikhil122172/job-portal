package com.jobportal.application.service;

import com.jobportal.application.client.JobClient;
import com.jobportal.application.cqrs.command.ApplyJobCommand;
import com.jobportal.application.cqrs.command.WithdrawApplicationCommand;
import com.jobportal.application.cqrs.handler.ApplicationCommandHandler;
import com.jobportal.application.cqrs.handler.ApplicationQueryHandler;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.dto.JobClientDto;
import com.jobportal.application.exception.ResourceNotFoundException;
import com.jobportal.application.mapper.ApplicationMapper;
import com.jobportal.application.model.JobApplication;
import com.jobportal.application.repository.ApplicationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock private ApplicationCommandHandler commandHandler;
    @Mock private ApplicationQueryHandler queryHandler;
    @Mock private ApplicationMapper applicationMapper;
    @Mock private com.cloudinary.Cloudinary cloudinary;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private JobClient jobClient;

    @InjectMocks private ApplicationService applicationService;

    @Test
    void apply_resolvesUuidAndDelegatesToCommandHandler() {
        ApplicationDto.ApplyRequest req = ApplicationDto.ApplyRequest.builder()
                .jobId("job-uuid")
                .coverLetter("hi")
                .build();
        ApplyJobCommand mappedCommand = new ApplyJobCommand();
        ApplicationDto.ApplicationResponse expected = ApplicationDto.ApplicationResponse.builder()
                .id(10L)
                .jobId(42L)
                .userId(7L)
                .build();

        when(applicationMapper.toApplyCommand(req)).thenReturn(mappedCommand);
        when(jobClient.getJobById("job-uuid")).thenReturn(JobClientDto.builder().id(42L).build());
        when(commandHandler.handle(mappedCommand)).thenReturn(expected);

        ApplicationDto.ApplicationResponse actual = applicationService.apply(req, 7L);

        assertThat(actual.getId()).isEqualTo(10L);
        assertThat(mappedCommand.getUserId()).isEqualTo(7L);
        assertThat(mappedCommand.getJobId()).isEqualTo(42L);
        verify(commandHandler).handle(mappedCommand);
    }

    @Test
    void apply_withNumericJobId_doesNotCallJobClient() {
        ApplicationDto.ApplyRequest req = ApplicationDto.ApplyRequest.builder()
                .jobId("15")
                .build();
        ApplyJobCommand mappedCommand = new ApplyJobCommand();
        ApplicationDto.ApplicationResponse expected = ApplicationDto.ApplicationResponse.builder().id(21L).build();

        when(applicationMapper.toApplyCommand(req)).thenReturn(mappedCommand);
        when(commandHandler.handle(mappedCommand)).thenReturn(expected);

        ApplicationDto.ApplicationResponse actual = applicationService.apply(req, 5L);

        assertThat(actual.getId()).isEqualTo(21L);
        assertThat(mappedCommand.getJobId()).isEqualTo(15L);
        verify(jobClient, never()).getJobById(any());
    }

    @Test
    void withdrawApplicationByReference_resolvesUuidAndDelegates() {
        when(applicationRepository.findByUuid("app-uuid"))
                .thenReturn(Optional.of(JobApplication.builder().id(9L).build()));

        applicationService.withdrawApplicationByReference("app-uuid", 3L);

        ArgumentCaptor<WithdrawApplicationCommand> captor = ArgumentCaptor.forClass(WithdrawApplicationCommand.class);
        verify(commandHandler).handle(captor.capture());
        assertThat(captor.getValue().getApplicationId()).isEqualTo(9L);
        assertThat(captor.getValue().getUserId()).isEqualTo(3L);
    }

    @Test
    void withdrawApplicationByReference_whenMissing_throwsNotFound() {
        when(applicationRepository.findByUuid("missing-uuid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> applicationService.withdrawApplicationByReference("missing-uuid", 3L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
