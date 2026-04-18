package com.jobportal.file.exception;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.time.LocalDateTime;
import java.util.Map;
@RestControllerAdvice @Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(FileUploadException.class)
    public ResponseEntity<Map<String,Object>> handleUpload(FileUploadException ex) {
        return ResponseEntity.badRequest().body(Map.of("status",400,"message",ex.getMessage(),"timestamp",LocalDateTime.now().toString()));
    }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String,Object>> handleMaxSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.badRequest().body(Map.of(
                "status", 400,
                "message", "File size exceeds the maximum allowed limit of 10 MB.",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> handleGeneral(Exception ex) {
        log.error("File service error:", ex);
        return ResponseEntity.status(500).body(Map.of(
                "status", 500,
                "message", "Unable to complete the file operation. Please try again.",
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
