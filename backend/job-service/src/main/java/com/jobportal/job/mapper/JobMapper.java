package com.jobportal.job.mapper;

import com.jobportal.job.cqrs.command.CreateJobCommand;
import com.jobportal.job.cqrs.command.UpdateJobCommand;
import com.jobportal.job.dto.JobDto;
import com.jobportal.job.model.Job;
import org.mapstruct.*;

/**
 * MapStruct mapper for Job entity <-> DTOs / Commands.
 *
 * MapStruct generates the implementation at compile time.
 * componentModel = "spring" makes it a Spring bean (@Component).
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface JobMapper {

    // Command -> Entity

    /**
     * Map CreateJobCommand to a new Job entity.
     * recruiterId is injected by the service layer (from gateway header), not from body.
     */
    @Mapping(target = "id",               ignore = true)
    @Mapping(target = "status",           ignore = true)  // set by @PrePersist
    @Mapping(target = "viewsCount",       ignore = true)
    @Mapping(target = "applicationsCount",ignore = true)
    @Mapping(target = "createdAt",        ignore = true)
    @Mapping(target = "updatedAt",        ignore = true)
    @Mapping(target = "salaryCurrency",   defaultValue = "USD")
    @Mapping(target = "isRemote",         defaultValue = "false")
    Job toEntity(CreateJobCommand command);

    /**
     * Apply non-null fields from UpdateJobCommand onto an existing Job entity.
     * NullValuePropertyMappingStrategy.IGNORE means null fields are skipped.
     */
    @Mapping(target = "id",               ignore = true)
    @Mapping(target = "recruiterId",      ignore = true)
    @Mapping(target = "viewsCount",       ignore = true)
    @Mapping(target = "applicationsCount",ignore = true)
    @Mapping(target = "createdAt",        ignore = true)
    @Mapping(target = "updatedAt",        ignore = true)
    void updateEntityFromCommand(UpdateJobCommand command, @MappingTarget Job job);

    // Entity -> Response DTO

    /**
     * Map Job entity to JobResponse DTO.
    * Enum -> String conversion is done via the named method below.
     */
    @Mapping(target = "jobType",         source = "jobType",         qualifiedByName = "enumToString")
    @Mapping(target = "experienceLevel", source = "experienceLevel", qualifiedByName = "enumToString")
    @Mapping(target = "status",          source = "status",          qualifiedByName = "enumToString")
    @Mapping(target = "createdAt",       source = "createdAt",       qualifiedByName = "localDateTimeToString")
    @Mapping(target = "updatedAt",       source = "updatedAt",       qualifiedByName = "localDateTimeToString")
    @Mapping(target = "recruiterName",   ignore = true)  // enriched by service via Feign
    @Mapping(target = "recruiterEmail",  ignore = true)
    JobDto.JobResponse toResponse(Job job);

    // DTO -> Command

    /** Map CreateJobRequest DTO to a CreateJobCommand (recruiterId set separately). */
    @Mapping(target = "recruiterId", ignore = true)
    CreateJobCommand toCreateCommand(JobDto.CreateJobRequest request);

    /** Map UpdateJobRequest DTO to an UpdateJobCommand (jobId + recruiterId + role set separately). */
    @Mapping(target = "jobId",      ignore = true)
    @Mapping(target = "recruiterId",ignore = true)
    @Mapping(target = "role",       ignore = true)
    UpdateJobCommand toUpdateCommand(JobDto.UpdateJobRequest request);

    // ── Helpers ───────────────────────────────────────────────────────────────

    @Named("enumToString")
    default String enumToString(Enum<?> e) {
        return e != null ? e.name() : null;
    }

    @Named("localDateTimeToString")
    default String localDateTimeToString(java.time.LocalDateTime ldt) {
        return ldt != null ? ldt.toString() : null;
    }
}
