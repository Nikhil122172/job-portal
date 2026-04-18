package com.jobportal.auth.mapper;

import com.jobportal.auth.dto.AuthDto;
import com.jobportal.auth.model.User;
import org.mapstruct.*;

/**
 * MapStruct mapper for User entity <-> Auth DTOs.
 *
 * Replaces the original hand-written @Component UserMapper.
 * MapStruct generates the implementation at compile time; Spring autowires it as a bean.
 */
@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE,
    unmappedTargetPolicy = ReportingPolicy.IGNORE
)
public interface UserMapper {

    /**
    * Map User entity -> UserResponse DTO.
     * role is an enum; we convert it to its string name via a named helper.
     * Timestamps are LocalDateTime; we format them to ISO strings.
     */
    @Mapping(target = "role",      source = "role",      qualifiedByName = "roleToString")
    @Mapping(target = "createdAt", source = "createdAt", qualifiedByName = "localDateTimeToString")
    @Mapping(target = "updatedAt", source = "updatedAt", qualifiedByName = "localDateTimeToString")
    AuthDto.UserResponse toUserResponse(User user);

    /**
    * Map RegisterRequest -> User entity (password hashing done by AuthService, not here).
     */
    @Mapping(target = "id",                   ignore = true)
    @Mapping(target = "password",             ignore = true)  // hashed in service
    @Mapping(target = "isActive",             ignore = true)  // default true
    @Mapping(target = "isEmailVerified",      ignore = true)  // default false
    @Mapping(target = "profileImageUrl",      ignore = true)
    @Mapping(target = "profileImagePublicId", ignore = true)
    @Mapping(target = "bio",                  ignore = true)
    @Mapping(target = "location",             ignore = true)
    @Mapping(target = "createdAt",            ignore = true)
    @Mapping(target = "updatedAt",            ignore = true)
    User toEntity(AuthDto.RegisterRequest request);

    /**
     * Apply non-null UpdateProfileRequest fields onto an existing User.
     */
    @Mapping(target = "id",                   ignore = true)
    @Mapping(target = "username",             ignore = true)
    @Mapping(target = "email",                ignore = true)
    @Mapping(target = "password",             ignore = true)
    @Mapping(target = "role",                 ignore = true)
    @Mapping(target = "isActive",             ignore = true)
    @Mapping(target = "isEmailVerified",      ignore = true)
    @Mapping(target = "profileImageUrl",      ignore = true)
    @Mapping(target = "profileImagePublicId", ignore = true)
    @Mapping(target = "createdAt",            ignore = true)
    @Mapping(target = "updatedAt",            ignore = true)
    void updateFromRequest(AuthDto.UpdateProfileRequest request, @MappingTarget User user);

    // ── Helpers ───────────────────────────────────────────────────────────────

    @Named("roleToString")
    default String roleToString(User.Role role) {
        if (role == null) return null;
        String name = role.name();
        // Strip the ROLE_ prefix so frontend receives JOB_SEEKER, RECRUITER, ADMIN
        return name.startsWith("ROLE_") ? name.substring(5) : name;
    }

    @Named("localDateTimeToString")
    default String localDateTimeToString(java.time.LocalDateTime ldt) {
        return ldt != null ? ldt.toString() : null;
    }
}
