package com.jobportal.job.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ExceptionTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void resourceNotFoundException_hasMessage() {
        ResourceNotFoundException ex = new ResourceNotFoundException("missing");
        assertThat(ex.getMessage()).isEqualTo("missing");
    }

    @Test
    void unauthorizedException_hasMessage() {
        UnauthorizedException ex = new UnauthorizedException("forbidden");
        assertThat(ex.getMessage()).isEqualTo("forbidden");
    }

    @Test
    void handleNotFound_returns404WithBody() {
        ResponseEntity<Map<String,Object>> response = handler.handleNotFound(new ResourceNotFoundException("missing"));
        assertThat(response.getStatusCode().value()).isEqualTo(404);
        assertThat(response.getBody()).containsEntry("message", "missing");
    }
}
