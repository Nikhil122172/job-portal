package com.jobportal.admin.config;

import com.jobportal.admin.security.GatewayHeaderFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig for admin-service.
 *
 * Admin-service sits behind the API Gateway which already validates the JWT
 * and injects X-User-Id / X-User-Role headers.  This config:
 *  1. Reads those headers via GatewayHeaderFilter.
 *  2. Restricts ALL /api/v1/admin/** paths to ROLE_ADMIN only.
 *  3. Keeps actuator + Swagger endpoints open for monitoring.
 *
 * IMPORTANT: admin-service MUST NOT be directly internet-reachable.
 * Only the API Gateway should route to it (Docker network isolation enforces this).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           GatewayHeaderFilter gatewayHeaderFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Monitoring and API docs - always open
                .requestMatchers(
                    "/actuator/**",
                    "/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).permitAll()
                // ALL admin endpoints require ROLE_ADMIN
                .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")
                // Deny everything else
                .anyRequest().denyAll()
            )
            // Trust gateway headers to build authentication context
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
