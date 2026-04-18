package com.jobportal.gateway.filter;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;

@Component
@Slf4j
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    @Value("${jwt.secret}")
    private String secret;

    public JwtAuthFilter() { super(Config.class); }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            String token = null;

            // Normal API calls use Authorization header.
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else if ("/api/v1/notifications/my/stream".equals(path)) {
                // SSE path also supports token in query param for EventSource clients.
                String queryToken = exchange.getRequest().getQueryParams().getFirst("token");
                if (queryToken != null && !queryToken.isBlank()) {
                    token = queryToken;
                }
            }

            if (token == null || token.isBlank()) {
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Missing or invalid Authorization header");
            }

            try {
                Key key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
                Claims claims = Jwts.parserBuilder().setSigningKey(key).build()
                        .parseClaimsJws(token).getBody();

                // Forward user identity to downstream services.
                ServerWebExchange mutated = exchange.mutate().request(r -> r
                        .header("X-User-Id",    claims.getSubject())
                        .header("X-User-Email", claims.get("email", String.class))
                        .header("X-User-Role",  claims.get("role",  String.class))
                ).build();
                return chain.filter(mutated);
            } catch (ExpiredJwtException e) {
                log.warn("JWT token expired: {}", e.getMessage());
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Token expired");
            } catch (Exception e) {
                log.warn("JWT validation failed: {}", e.getMessage());
                return onError(exchange, HttpStatus.UNAUTHORIZED, "Invalid token");
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String msg) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        String origin = exchange.getRequest().getHeaders().getOrigin();
        if (origin != null && (
                origin.startsWith("http://localhost") ||
            origin.startsWith("https://localhost"))) {
            response.getHeaders().set("Access-Control-Allow-Origin", origin);
            response.getHeaders().set("Access-Control-Allow-Credentials", "true");
            response.getHeaders().set("Vary", "Origin");
        }
        response.getHeaders().add("Content-Type", "application/json");
        byte[] bytes = ("{\"error\":\"" + msg + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }

    public static class Config {}
}
