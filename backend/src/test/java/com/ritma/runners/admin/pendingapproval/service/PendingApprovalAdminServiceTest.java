package com.ritma.runners.admin.pendingapproval.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.ritma.runners.admin.pendingapproval.dto.PendingApprovalResponse;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.auth.entity.AppUser;
import com.ritma.runners.auth.repository.AppUserRepository;
import com.ritma.runners.mail.service.AccountMailService;

@ExtendWith(MockitoExtension.class)
class PendingApprovalAdminServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AccountMailService accountMailService;

    private PendingApprovalAdminService pendingApprovalAdminService;
    private JwtAuthenticatedUser adminUser;

    @BeforeEach
    void setUp() {
        pendingApprovalAdminService = new PendingApprovalAdminService(
                appUserRepository,
                passwordEncoder,
                accountMailService
        );
        adminUser = new JwtAuthenticatedUser(UUID.randomUUID(), "admin@ritma.com", "ADMIN", false);
    }

    @Test
    void listPendingApprovalsReturnsRepositoryResults() {
        UUID userId = UUID.randomUUID();
        List<PendingApprovalResponse> expected = List.of(new PendingApprovalResponse(
                userId,
                "pending@ritma.com",
                "PENDING",
                OffsetDateTime.parse("2026-03-17T10:15:30Z")
        ));
        when(appUserRepository.findPendingApprovals("pending", true)).thenReturn(expected);

        List<PendingApprovalResponse> result = pendingApprovalAdminService.listPendingApprovals("pending", true);

        assertEquals(expected, result);
    }

    @Test
    void approvePendingApprovalSendsTemporaryPasswordAndActivatesUser() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "pending@ritma.com",
                "placeholder",
                "USER",
                true,
                "PENDING"
        );
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-password");

        pendingApprovalAdminService.approvePendingApproval(userId, adminUser);

        verify(accountMailService).sendTemporaryPassword(eq("pending@ritma.com"), anyString());
        verify(passwordEncoder).encode(anyString());
        verify(appUserRepository).updatePasswordAndStatus(userId, "encoded-password", true, "ACTIVE");
    }

    @Test
    void rejectPendingApprovalDeletesUser() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "pending@ritma.com",
                "placeholder",
                "USER",
                true,
                "PENDING"
        );
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        pendingApprovalAdminService.rejectPendingApproval(userId, adminUser);

        verify(appUserRepository).deleteUser(userId);
    }

    @Test
    void approvePendingApprovalRejectsNonPendingUser() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser(
                userId,
                "active@ritma.com",
                "hash",
                "USER",
                false,
                "ACTIVE"
        );
        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> pendingApprovalAdminService.approvePendingApproval(userId, adminUser)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(accountMailService, never()).sendTemporaryPassword(anyString(), anyString());
        verify(appUserRepository, never()).updatePasswordAndStatus(eq(userId), anyString(), eq(true), eq("ACTIVE"));
    }

    @Test
    void rejectPendingApprovalReturnsNotFoundWhenUserDoesNotExist() {
        UUID userId = UUID.randomUUID();
        when(appUserRepository.findById(userId)).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> pendingApprovalAdminService.rejectPendingApproval(userId, adminUser)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
        verify(appUserRepository, never()).deleteUser(userId);
    }
}
