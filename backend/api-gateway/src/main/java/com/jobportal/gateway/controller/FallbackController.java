package com.jobportal.gateway.controller;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class FallbackController {
    @RequestMapping("/fallback")
    public ResponseEntity<Map<String,String>> fallback() {
        return ResponseEntity.status(503).body(Map.of(
            "status","error",
            "message","Service temporarily unavailable. Please try again later."
        ));
    }
}
