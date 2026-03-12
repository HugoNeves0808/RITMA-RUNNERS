package com.ritma.runners.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        String secret,
        long expirationMinutes
) {
    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            secret = "RitmaRunnersJwtSecretKeyForLocalDevelopment1234567890";
        }
        if (expirationMinutes <= 0) {
            expirationMinutes = 120;
        }
    }
}
