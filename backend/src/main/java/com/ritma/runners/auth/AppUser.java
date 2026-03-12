package com.ritma.runners.auth;

import java.util.UUID;

public record AppUser(
        UUID id,
        String email,
        String passwordHash,
        String role,
        boolean forcePasswordChange
) {
}
