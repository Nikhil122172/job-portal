package com.jobportal.application.mapper;

import com.jobportal.application.cqrs.command.ApplyJobCommand;
import com.jobportal.application.dto.ApplicationDto;
import com.jobportal.application.model.JobApplication;
import org.mapstruct.*;

/**
 * MapStruct mapper for JobApplication entity <-> DTOs / Commands.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface ApplicationMapper {

    // Command -> Entity

    /**
     * Seed a new JobApplication from an ApplyJobCommand.
     * Fields populated from Feign (applicantName, jobTitle, etc.) are left for the handler.
     */
    @Mapping(target = "id",             ignore = true)
    @Mapping(target = "status",         ignore = true)  // set by @Builder.Default
    @Mapping(target = "recruiterId",    ignore = true)  // fetched from job-service
    @Mapping(target = "applicantName",  ignore = true)  // fetched from auth-service
    @Mapping(target = "applicantEmail", ignore = true)
    @Mapping(target = "applicantPhone", ignore = true)
    @Mapping(target = "jobTitle",       ignore = true)  // fetched from job-service
    @Mapping(target = "companyName",    ignore = true)
    @Mapping(target = "statusNote",     ignore = true)
    @Mapping(target = "appliedAt",      ignore = true)
    @Mapping(target = "updatedAt",      ignore = true)
    JobApplication toEntity(ApplyJobCommand command);

    // DTO -> Command

    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "jobId", ignore = true)
    ApplyJobCommand toApplyCommand(ApplicationDto.ApplyRequest request);

    // Entity -> Response DTO

    @Mapping(target = "status",    source = "status",    qualifiedByName = "enumToString")
    @Mapping(target = "appliedAt", source = "appliedAt", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "updatedAt", source = "updatedAt", qualifiedByName = "localDateTimeToString")
    ApplicationDto.ApplicationResponse toResponse(JobApplication application);

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
