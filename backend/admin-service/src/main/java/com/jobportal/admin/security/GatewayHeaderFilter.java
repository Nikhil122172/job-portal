package com.jobportal.admin.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * GatewayHeaderFilter – trusts X-User-Id / X-User-Role headers injected
 * by the API Gateway after JWT validation.  This service MUST NOT be
 * reachable directly from the internet; it sits behind the gateway.
 *
 * If the headers are absent the request is treated as unauthenticated and
 * Spring Security's AuthorizationFilter will reject it.
 */
@Component
@Slf4j
public class GatewayHeaderFilter extends OncePerRequestFilter {

    private static final String HEADER_USER_ID   = "X-User-Id";
    private static final String HEADER_USER_ROLE = "X-User-Role";
    private static final String HEADER_USER_EMAIL = "X-User-Email";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String userId = request.getHeader(HEADER_USER_ID);
        String role   = request.getHeader(HEADER_USER_ROLE);
        String email  = request.getHeader(HEADER_USER_EMAIL);

        if (userId != null && role != null) {
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            email != null ? email : userId,
                            null,
                            List.of(new SimpleGrantedAuthority(authority)));
            auth.setDetails(userId);
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Admin-service: authenticated userId={} role={}", userId, role);
        }

        chain.doFilter(request, response);
    }
}
