package com.ritma.runners.auth.dto;

import java.util.UUID;

public record JwtAuthenticatedUser(
        UUID id,
        String email,
        String role,
        boolean forcePasswordChange
) {
}
