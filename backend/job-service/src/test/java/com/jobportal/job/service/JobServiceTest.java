package com.jobportal.job.service;

import com.jobportal.job.cqrs.command.CreateJobCommand;
import com.jobportal.job.cqrs.command.DeleteJobCommand;
import com.jobportal.job.cqrs.command.UpdateJobCommand;
import com.jobportal.job.cqrs.handler.JobCommandHandler;
import com.jobportal.job.cqrs.handler.JobQueryHandler;
import com.jobportal.job.cqrs.query.GetJobByIdQuery;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.mapper.JobMapper;
import com.jobportal.job.model.Job;
import com.jobportal.job.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock private JobCommandHandler commandHandler;
    @Mock private JobQueryHandler queryHandler;
    @Mock private JobMapper jobMapper;
    @Mock private JobRepository jobRepository;

    @InjectMocks private JobService jobService;

    @Test
    void updateJob_mapsRequestAndDelegatesToCommandHandler() {
        JobDto.UpdateJobRequest request = JobDto.UpdateJobRequest.builder().title("New Title").build();
        UpdateJobCommand mapped = UpdateJobCommand.builder().title("New Title").build();
        JobDto.JobResponse expected = JobDto.JobResponse.builder().id(1L).title("New Title").build();
        String role = "ROLE_RECRUITER";

        when(jobMapper.toUpdateCommand(request)).thenReturn(mapped);
        when(commandHandler.handle(mapped)).thenReturn(expected);

        JobDto.JobResponse actual = jobService.updateJob(1L, request, 9L, role);

        assertThat(actual).isSameAs(expected);
        assertThat(mapped.getJobId()).isEqualTo(1L);
        assertThat(mapped.getRecruiterId()).isEqualTo(9L);
        assertThat(mapped.getRole()).isEqualTo(role);
        verify(commandHandler).handle(mapped);
    }

    @Test
    void getJobById_delegatesToQueryHandlerWithIncrementEnabled() {
        JobDto.JobResponse expected = JobDto.JobResponse.builder().id(2L).title("Backend Engineer").build();
        when(queryHandler.handle(any(GetJobByIdQuery.class), eq(true))).thenReturn(expected);

        JobDto.JobResponse response = jobService.getJobById(2L);
        ArgumentCaptor<GetJobByIdQuery> queryCaptor = ArgumentCaptor.forClass(GetJobByIdQuery.class);

        assertThat(response.getId()).isEqualTo(2L);
        verify(queryHandler).handle(queryCaptor.capture(), eq(true));
        assertThat(queryCaptor.getValue().getJobId()).isEqualTo(2L);
    }

    @Test
    void deleteJob_buildsCommandAndDelegates() {
        jobService.deleteJob(3L, 1L, "ROLE_ADMIN");

        ArgumentCaptor<DeleteJobCommand> captor = ArgumentCaptor.forClass(DeleteJobCommand.class);
        verify(commandHandler).handle(captor.capture());

        DeleteJobCommand command = captor.getValue();
        assertThat(command.getJobId()).isEqualTo(3L);
        assertThat(command.getRecruiterId()).isEqualTo(1L);
        assertThat(command.getRole()).isEqualTo("ROLE_ADMIN");
    }

    @Test
    void createJob_mapsRequestAndDelegatesToCommandHandler() {
        JobDto.CreateJobRequest req = JobDto.CreateJobRequest.builder()
                .title("Dev").description("desc").company("Corp")
                .location("Remote").build();

        CreateJobCommand mapped = CreateJobCommand.builder().title("Dev").company("Corp").build();
        JobDto.JobResponse expected = JobDto.JobResponse.builder().id(1L).title("Dev").build();
        when(jobMapper.toCreateCommand(req)).thenReturn(mapped);
        when(commandHandler.handle(mapped)).thenReturn(expected);

        JobDto.JobResponse response = jobService.createJob(req, 7L);

        assertThat(response).isSameAs(expected);
        assertThat(mapped.getRecruiterId()).isEqualTo(7L);
        verify(commandHandler).handle(mapped);
    }

    @Test
    void getJobByReference_withUuid_resolvesIdBeforeDelegating() {
        Job job = Job.builder().id(55L).uuid("ref-55").build();
        JobDto.JobResponse expected = JobDto.JobResponse.builder().id(55L).build();

        when(jobRepository.findByUuid("ref-55")).thenReturn(Optional.of(job));
        when(queryHandler.handle(any(GetJobByIdQuery.class), eq(false))).thenReturn(expected);

        JobDto.JobResponse response = jobService.getJobByReference("ref-55", false);

        assertThat(response).isSameAs(expected);
        verify(jobRepository).findByUuid("ref-55");
        verify(queryHandler).handle(argThat(q -> q.getJobId().equals(55L)), eq(false));
    }
}
