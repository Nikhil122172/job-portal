package com.jobportal.auth.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component @Slf4j
public class JwtUtil {

    @Value("${jwt.secret}")            private String secret;
    @Value("${jwt.expiration}")        private long expiration;
    @Value("${jwt.refresh-expiration}") private long refreshExpiration;

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String email, String role) {
        Map<String,Object> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("role",  role);
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(Long userId) {
        return Jwts.builder()
                .setSubject(String.valueOf(userId))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(extractClaims(token).getSubject());
    }

    public boolean isTokenValid(String token) {
        try { extractClaims(token); return true; }
        catch (Exception e) { log.warn("Invalid JWT: {}", e.getMessage()); return false; }
    }

    public long getExpiration() { return expiration; }
}
