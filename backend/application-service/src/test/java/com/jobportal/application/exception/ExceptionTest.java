package com.jobportal.application.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class ExceptionTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void resourceNotFound_hasMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("not found");
        assertThat(ex.getMessage()).isEqualTo("not found");
    }

    @Test
    void handleUnauthorized_returns403() {
        ResponseEntity<java.util.Map<String,Object>> response = handler.handleUnauthorized(new UnauthorizedException("denied"));
        assertThat(response.getStatusCode().value()).isEqualTo(403);
    }
}
