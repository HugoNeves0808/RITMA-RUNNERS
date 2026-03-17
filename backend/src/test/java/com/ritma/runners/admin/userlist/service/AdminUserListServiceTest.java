package com.ritma.runners.admin.userlist.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.ritma.runners.admin.userlist.dto.AdminUserListItemResponse;
import com.ritma.runners.auth.repository.AppUserRepository;

@ExtendWith(MockitoExtension.class)
class AdminUserListServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    private AdminUserListService adminUserListService;

    @BeforeEach
    void setUp() {
        adminUserListService = new AdminUserListService(appUserRepository);
    }

    @Test
    void listUsersReturnsActiveUsersFromRepository() {
        List<AdminUserListItemResponse> expected = List.of(
                new AdminUserListItemResponse(
                        UUID.randomUUID(),
                        "admin@ritma.com",
                        "ADMIN",
                        OffsetDateTime.parse("2026-03-17T14:30:00Z")
                ),
                new AdminUserListItemResponse(
                        UUID.randomUUID(),
                        "user@ritma.com",
                        "USER",
                        null
                )
        );
        when(appUserRepository.findActiveUsersForAdminList()).thenReturn(expected);

        List<AdminUserListItemResponse> result = adminUserListService.listUsers();

        assertEquals(expected, result);
        verify(appUserRepository).findActiveUsersForAdminList();
    }
}
