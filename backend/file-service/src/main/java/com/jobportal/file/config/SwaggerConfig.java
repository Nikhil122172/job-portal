package com.jobportal.file.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.*;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
            .info(new Info().title("File Service API").version("1.0").description("CareerBridge File Upload Service"))
            .addSecurityItem(new SecurityRequirement().addList("Bearer Auth"))
            .components(new Components().addSecuritySchemes("Bearer Auth",
                new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
