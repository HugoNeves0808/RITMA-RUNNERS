package com.ritma.runners.auth.entity;

import java.util.UUID;

public record AppUser(
        UUID id,
        String email,
        String passwordHash,
        String role,
        boolean forcePasswordChange,
        String accountStatus
) {
}
