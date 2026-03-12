package com.ritma.runners.auth.dto;

public record AuthResponse(
        String token,
        long expiresInMinutes,
        UserProfileResponse user
) {
}
