package com.ritma.runners.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.ritma.runners.auth.dto.AuthResponse;
import com.ritma.runners.auth.dto.LoginRequest;
import com.ritma.runners.auth.dto.RequestAccountRequest;
import com.ritma.runners.auth.dto.RequestAccountResponse;
import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.auth.repository.AppUserRepository;
import com.ritma.runners.mail.config.MailProperties;
import com.ritma.runners.security.jwt.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private MailProperties mailProperties;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                appUserRepository,
                passwordEncoder,
                jwtService,
                mailProperties
        );
    }

    @Test
    void loginUpdatesLastLoginAfterSuccessfulAuthentication() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "admin@example.com",
                "encoded-password",
                "ADMIN",
                false,
                "ACTIVE"
        );
        when(appUserRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("StrongPassword123!", "encoded-password")).thenReturn(true);
        when(jwtService.generateToken(eq(userId), eq("admin@example.com"), eq("ADMIN"), anyMap())).thenReturn("jwt-token");
        when(jwtService.getExpirationMinutes()).thenReturn(120L);

        AuthResponse response = authService.login(new LoginRequest("admin@example.com", "StrongPassword123!"), "web");

        assertEquals("jwt-token", response.token());
        verify(appUserRepository).updateLastLogin(userId);
        verify(appUserRepository).recordUserAccess(userId, "WEB");
    }

    @Test
    void requestAccountCreatesPendingUserWithoutSendingEmail() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "new@ritma.com",
                "encoded-password",
                "USER",
                true,
                "PENDING"
        );
        when(appUserRepository.findByEmail("new@ritma.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(org.mockito.ArgumentMatchers.anyString())).thenReturn("encoded-password");
        when(appUserRepository.createUser("new@ritma.com", "encoded-password", "USER", true, "PENDING")).thenReturn(user);

        RequestAccountResponse response = authService.requestAccount(new RequestAccountRequest("new@ritma.com"));

        assertEquals("Your request has been submitted. An admin must approve the account before sign-in.", response.message());
        verify(appUserRepository).createDefaultUserSettings(userId);
    }
}
