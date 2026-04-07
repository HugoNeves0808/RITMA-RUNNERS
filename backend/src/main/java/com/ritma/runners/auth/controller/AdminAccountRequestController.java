package com.ritma.runners.auth.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ritma.runners.auth.dto.PendingAccountResponse;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.auth.service.AdminAccountRequestService;

@RestController
@RequestMapping("/api/admin/account-requests")
public class AdminAccountRequestController {

    private final AdminAccountRequestService adminAccountRequestService;

    public AdminAccountRequestController(AdminAccountRequestService adminAccountRequestService) {
        this.adminAccountRequestService = adminAccountRequestService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PendingAccountResponse> listPendingAccounts(@RequestParam(required = false) String search,
                                                            @RequestParam(defaultValue = "false") boolean olderThanThreeDays) {
        return adminAccountRequestService.listPendingAccounts(search, olderThanThreeDays);
    }

    @PostMapping("/{userId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void approveAccount(@PathVariable UUID userId,
                               @AuthenticationPrincipal JwtAuthenticatedUser user) {
        adminAccountRequestService.approveAccount(userId, user);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void rejectAccount(@PathVariable UUID userId,
                              @AuthenticationPrincipal JwtAuthenticatedUser user) {
        adminAccountRequestService.rejectAccount(userId, user);
    }
}
