package com.payflow.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "PayFlow Payment Engine & Transaction Platform API",
                version = "1.0.0",
                description = "Enterprise-grade Payment Processing, Idempotency Control, and Transaction State Management API.",
                contact = @Contact(name = "PayFlow Engineering Team", email = "engineering@payflow.internal"),
                license = @License(name = "MIT License", url = "https://opensource.org/licenses/MIT")
        )
)
@SecurityScheme(
        name = "BearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "JWT Bearer token authorization header. Enter your token generated from /api/auth/login"
)
public class OpenApiConfig {
}
