package com.ritma.runners.bootstrap;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.bootstrap.admin")
public record AdminBootstrapProperties(
        boolean enabled,
        String email,
        String password
) {
    public AdminBootstrapProperties {
        if (email == null || email.isBlank()) {
            email = "admin@ritmarunners.local";
        }
        if (password == null || password.isBlank()) {
            password = "Admin123!";
        }
    }
}
