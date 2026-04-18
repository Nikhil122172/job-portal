package com.jobportal.auth.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

class ExceptionTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void duplicateResource_hasMessage() {
        DuplicateResourceException ex = new DuplicateResourceException("exists");
        assertThat(ex.getMessage()).isEqualTo("exists");
    }

    @Test
    void handleUnauthorized_returns401() {
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = handler.handleUnauthorized(new UnauthorizedException("bad"));
        assertThat(response.getStatusCode().value()).isEqualTo(401);
        assertThat(response.getBody().message()).isEqualTo("bad");
    }
}
