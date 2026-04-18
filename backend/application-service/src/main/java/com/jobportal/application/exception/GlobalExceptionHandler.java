package com.jobportal.application.exception;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String,Object>> notFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("status",404,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
    }
    @ExceptionHandler(DuplicateApplicationException.class)
    public ResponseEntity<Map<String,Object>> duplicate(DuplicateApplicationException ex) {
        return ResponseEntity.status(409).body(Map.of("status",409,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
    }
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String,Object>> handleUnauthorized(UnauthorizedException ex) {
        // Standardized unauthorized response for tests and runtime
        return ResponseEntity.status(403).body(Map.of("status",403,"message",ex.getMessage()));
    }
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String,Object>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(400).body(Map.of("status",400,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String,String> errors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = (error instanceof FieldError fieldError)
                    ? fieldError.getField()
                    : error.getObjectName();
            errors.put(field, error.getDefaultMessage());
        });
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "message", "Validation failed",
                "errors", errors,
                "timestamp", LocalDateTime.now().toString()
        ));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String,Object>> handleBadPayload(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(400).body(Map.of(
                "status", 400,
                "message", "Invalid request payload",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> general(Exception ex) {
        log.error("Error:", ex);
        return ResponseEntity.status(500).body(Map.of("status",500,"message","Internal server error"));
    }
}
