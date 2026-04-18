package com.jobportal.notification.security;

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
 * Reads X-User-Id / X-User-Role headers injected by the API Gateway
 * and populates the Spring Security context.
 */
@Component
@Slf4j
public class GatewayHeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String userId = request.getHeader("X-User-Id");
        String role   = request.getHeader("X-User-Role");
        String email  = request.getHeader("X-User-Email");

        if (userId != null && role != null) {
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            var auth = new UsernamePasswordAuthenticationToken(
                    email != null ? email : userId, null,
                    List.of(new SimpleGrantedAuthority(authority)));
            auth.setDetails(userId);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }
}
