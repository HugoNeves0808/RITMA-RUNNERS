package com.ritma.runners.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
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
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.auth.dto.AuthResponse;
import com.ritma.runners.auth.dto.LoginRequest;
import com.ritma.runners.auth.dto.RequestAccountRequest;
import com.ritma.runners.auth.dto.RequestAccountResponse;
import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.auth.repository.AppUserRepository;
import com.ritma.runners.mail.config.MailProperties;
import com.ritma.runners.mail.service.AccountMailService;
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

    @Mock
    private AccountMailService accountMailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                appUserRepository,
                passwordEncoder,
                jwtService,
                mailProperties,
                accountMailService
        );
    }

    @Test
    void loginUpdatesLastLoginAfterSuccessfulAuthentication() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "admin@ritma.com",
                "encoded-password",
                "ADMIN",
                false,
                "ACTIVE"
        );
        when(appUserRepository.findByEmail("admin@ritma.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("pass1234", "encoded-password")).thenReturn(true);
        when(jwtService.generateToken(eq(userId), eq("admin@ritma.com"), eq("ADMIN"), anyMap())).thenReturn("jwt-token");
        when(jwtService.getExpirationMinutes()).thenReturn(120L);

        AuthResponse response = authService.login(new LoginRequest("admin@ritma.com", "pass1234"), "web");

        assertEquals("jwt-token", response.token());
        verify(appUserRepository).updateLastLogin(userId);
        verify(appUserRepository).recordUserAccess(userId, "WEB");
    }

    @Test
    void requestAccountSucceedsEvenWhenNotificationEmailFails() {
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
        doThrow(new ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Unable to send account email"))
                .when(accountMailService)
                .sendAccountRequestNotification("new@ritma.com");

        RequestAccountResponse response = authService.requestAccount(new RequestAccountRequest("new@ritma.com"));

        assertEquals("Your request has been submitted. An admin must approve the account before sign-in.", response.message());
        verify(appUserRepository).createDefaultUserSettings(userId);
        verify(accountMailService).sendAccountRequestNotification("new@ritma.com");
    }
}
