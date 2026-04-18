package com.jobportal.file.dto;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class FileUploadResponseTest {
    @Test
    void builder_setsFields() {
        FileUploadResponse resp = FileUploadResponse.builder()
                .url("u")
                .publicId("pid")
                .resourceType("raw")
                .format("pdf")
                .size(10L)
                .uploadedAt("now")
                .build();
        assertThat(resp.getPublicId()).isEqualTo("pid");
        assertThat(resp.getResourceType()).isEqualTo("raw");
    }
}
