package com.ritma.runners.common.util;

import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import com.ritma.runners.auth.dto.JwtAuthenticatedUser;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Optional<JwtAuthenticatedUser> currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof JwtAuthenticatedUser user)) {
            return Optional.empty();
        }
        return Optional.of(user);
    }
}
