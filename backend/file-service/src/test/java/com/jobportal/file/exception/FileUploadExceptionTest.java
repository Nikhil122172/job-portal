package com.jobportal.file.exception;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class FileUploadExceptionTest {
    @Test
    void messageIsStored() {
        FileUploadException ex = new FileUploadException("failed");
        assertThat(ex.getMessage()).isEqualTo("failed");
    }
}
