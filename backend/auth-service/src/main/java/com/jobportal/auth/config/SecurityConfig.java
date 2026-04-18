package com.jobportal.auth.config;

import com.jobportal.auth.security.filter.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig - defines the SecurityFilterChain for the auth-service.
 *
 * Request flow:
 *
 *  POST /api/v1/auth/login  (public)
 *  ──────────────────────────────────────────────────────────────────
 *  Request -> SecurityFilterChain
 *              └─ JwtFilter runs
 *                  - No Authorization header -> skip validation
 *                  - filterChain.doFilter() called
 *              └─ AuthorizationFilter runs
 *                  - /login matches permitAll() -> allowed
 *              └─ AuthController.login() generates and returns JWT
 *
 *  GET /api/v1/users/me  (protected)
 *  ──────────────────────────────────────────────────────────────────
 *  Request (with Authorization: Bearer <token>) -> SecurityFilterChain
 *              └─ JwtFilter runs
 *                  - Token extracted and validated
 *                  - Authentication stored in SecurityContextHolder
 *                  - filterChain.doFilter() called
 *              └─ AuthorizationFilter runs
 *                  - Endpoint requires authentication -> user IS authenticated -> allowed
 *              └─ Controller handles the request
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /** Public endpoints that never require a JWT. */
    private static final String[] PUBLIC_ENDPOINTS = {
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
        "/api/v1/auth/request-email-otp",
        "/api/v1/auth/verify-email-otp",
        // Internal service-to-service endpoints (called by other microservices via Feign)
        // These are protected by network isolation (Docker internal network) rather than JWT.
        // The X-Internal-Call header provides an additional signal (not a hard security boundary).
        "/api/v1/users/{id}",
        "/api/v1/users",
        "/api/v1/users/role/{role}",
        // Dev / ops
        "/actuator/**",
        "/api-docs/**",
        "/swagger-ui/**",
        "/swagger-ui.html"
    };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
        http
            // Disable CSRF - stateless REST API uses JWT, not sessions/cookies
            .csrf(csrf -> csrf.disable())

            // Stateless session - no HttpSession is created or used
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - JwtFilter will skip these (no header), and
                // AuthorizationFilter will allow them via permitAll()
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                // Every other endpoint requires a valid, authenticated principal
                .anyRequest().authenticated()
            )

            // Register JwtFilter BEFORE UsernamePasswordAuthenticationFilter so it
            // runs early in the chain and populates SecurityContextHolder in time
            // for the AuthorizationFilter that comes after it.
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

