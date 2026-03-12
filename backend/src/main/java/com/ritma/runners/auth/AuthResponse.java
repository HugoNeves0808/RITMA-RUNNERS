package com.ritma.runners.auth;

public record AuthResponse(
        String token,
        long expiresInMinutes,
        UserProfileResponse user
) {
}
