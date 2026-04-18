package com.jobportal.job.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String,Object>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404).body(Map.of("status",404,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
    }
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String,Object>> handleUnauth(UnauthorizedException ex) {
        return ResponseEntity.status(403).body(Map.of("status",403,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
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
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<Map<String,Object>> handleMissingHeader(MissingRequestHeaderException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "message", "Missing required header: " + ex.getHeaderName(),
                "timestamp", LocalDateTime.now().toString()
        ));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> handleGeneral(Exception ex) {
        log.error("Error: ", ex);
        return ResponseEntity.status(500).body(Map.of("status",500,"message","Internal server error"));
    }
}
