package com.ritma.runners.auth.dto;

import java.util.UUID;

public record UserProfileResponse(
        UUID id,
        String email,
        String role,
        boolean forcePasswordChange
) {
}
