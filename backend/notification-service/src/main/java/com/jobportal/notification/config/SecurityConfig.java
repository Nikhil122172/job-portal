package com.jobportal.notification.config;

import com.jobportal.notification.security.GatewayHeaderFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig for notification-service.
 *
 * - POST /api/v1/notifications/send  → internal only (protected by X-Internal-Call header
 *   check + Docker network isolation; open to any authenticated request or internal call)
 * - GET  /api/v1/notifications/my/** → requires authenticated user (X-User-Id from gateway)
 * - SSE  /api/v1/notifications/my/stream → same
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           GatewayHeaderFilter gatewayHeaderFilter) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Monitoring / docs
                .requestMatchers(
                    "/actuator/**", "/api-docs/**",
                    "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**"
                ).permitAll()
                // Internal send endpoint – rely on network isolation + X-Internal-Call header
                // In production use a service mesh / mTLS instead
                .requestMatchers("/api/v1/notifications/send").permitAll()
                // All user-facing notification endpoints require authentication
                .requestMatchers("/api/v1/notifications/**").authenticated()
                .anyRequest().denyAll()
            )
            .addFilterBefore(gatewayHeaderFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
