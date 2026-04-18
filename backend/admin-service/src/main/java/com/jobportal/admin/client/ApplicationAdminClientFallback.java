package com.jobportal.admin.client;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Collections;

@Component
public class ApplicationAdminClientFallback implements ApplicationAdminClient {
    @Override
    public Map<String, Object> getAllApplications(String keyword, String status, int page, int size) {
        return Collections.singletonMap("content", Collections.emptyList());
    }
}
