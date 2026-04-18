package com.jobportal.auth.security.filter;

import com.jobportal.auth.security.jwt.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JwtFilter - runs once per request inside the SecurityFilterChain.
 *
 * Flow:
 *  1. Request arrives (e.g. POST /api/v1/auth/login).
 *  2. Filter checks for an Authorization: Bearer <token> header.
 *  3a. No header present -> skip validation, call filterChain.doFilter()
 *      so the request continues to the controller (public endpoints like /login
 *      are permitted by SecurityConfig's requestMatchers).
 *  3b. Header present -> extract and validate the token.
 *      - Valid   -> build an Authentication object, store it in
 *                  SecurityContextHolder, then doFilter().
 *      - Invalid -> clear the context and return 401 immediately.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        // No Authorization header - skip JWT validation
        // The request will continue through the chain. If it targets a protected
        // endpoint, Spring Security's AuthorizationFilter will reject it (401/403).
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // strip "Bearer "

        // Validate the token
        if (!jwtUtil.isTokenValid(token)) {
            log.warn("Invalid or expired JWT for request: {}", request.getRequestURI());
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
            return;
        }

        // Token is valid - populate SecurityContextHolder
        try {
            Claims claims = jwtUtil.extractClaims(token);
            String role    = claims.get("role", String.class);   // e.g. "ROLE_USER"
            String email   = claims.get("email", String.class);
            Long   userId  = Long.valueOf(claims.getSubject());

            // Normalise: Spring Security expects "ROLE_" prefix in SimpleGrantedAuthority
            String authority = (role != null && role.startsWith("ROLE_")) ? role : "ROLE_" + role;

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,          // principal (used downstream to identify the caller)
                            null,           // credentials - not needed after token validation
                            List.of(new SimpleGrantedAuthority(authority))
                    );

            // Attach userId as a detail so controllers can read it without re-parsing the token
            authentication.setDetails(userId);

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("Authenticated user: id={} email={} role={}", userId, email, role);

        } catch (Exception e) {
            log.error("Failed to set authentication from JWT: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token processing error");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
