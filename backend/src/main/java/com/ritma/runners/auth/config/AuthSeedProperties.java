package com.ritma.runners.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap.admin")
public record AuthSeedProperties(
        boolean enabled,
        String email,
        String password
) {
    public AuthSeedProperties {
        if (email == null || email.isBlank()) {
            email = "admin@ritmarunners.local";
        }
        if (password == null || password.isBlank()) {
            password = "Admin123!";
        }
    }
}
