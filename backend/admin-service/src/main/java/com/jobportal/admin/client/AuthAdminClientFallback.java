package com.jobportal.admin.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class AuthAdminClientFallback implements AuthAdminClient {

    @Override
    public Map<String, Object> getAllUsers(String keyword, String role, Boolean isActive, int page, int size) {
        log.warn("Auth service unavailable, returning empty users list fallback");
        return Map.of("content", List.of(), "page", page, "size", size, "totalElements", 0);
    }

    @Override
    public Map<String, Object> getUserById(String id) {
        log.warn("Auth service unavailable for user {}", id);
        return Map.of("id", id, "message", "Auth service unavailable");
    }

    @Override
    public void deleteUser(String id) {
        log.warn("Auth service unavailable, could not delete user {}", id);
    }

    @Override
    public void toggleUserStatus(String id) {
        log.warn("Auth service unavailable, could not toggle status for user {}", id);
    }
}
