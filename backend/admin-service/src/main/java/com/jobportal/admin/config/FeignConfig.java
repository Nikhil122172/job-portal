package com.jobportal.admin.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * FeignConfig – forwards gateway-injected identity headers to downstream
 * Feign calls so that inter-service requests are authenticated.
 *
 * When admin-service calls auth-service or job-service via Feign, it passes:
 *   X-User-Id:   from the original request (admin's userId)
 *   X-User-Role: ROLE_ADMIN  (admin-service only makes admin-level calls)
 *   X-Internal-Call: true  (allows services to whitelist internal traffic)
 */
@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor interServiceRequestInterceptor() {
        return requestTemplate -> {
            // Try to forward the original caller's identity from current request context
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) {
                var req = sra.getRequest();
                String userId = req.getHeader("X-User-Id");
                String role   = req.getHeader("X-User-Role");
                if (userId != null) requestTemplate.header("X-User-Id", userId);
                if (role   != null) requestTemplate.header("X-User-Role", role);
            }
            // Always tag internal calls so downstream can whitelist them
            requestTemplate.header("X-Internal-Call", "true");
        };
    }
}
