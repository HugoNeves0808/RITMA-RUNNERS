package com.ritma.runners.auth;

import java.util.Map;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.ritma.runners.security.JwtService;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(AppUserRepository appUserRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest request) {
        AppUser user = appUserRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.passwordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.id(),
                user.email(),
                user.role(),
                Map.of("forcePasswordChange", user.forcePasswordChange())
        );

        return new AuthResponse(
                token,
                jwtService.getExpirationMinutes(),
                new UserProfileResponse(user.id(), user.email(), user.role(), user.forcePasswordChange())
        );
    }

    public UserProfileResponse me(JwtAuthenticatedUser user) {
        return new UserProfileResponse(user.id(), user.email(), user.role(), user.forcePasswordChange());
    }
}
