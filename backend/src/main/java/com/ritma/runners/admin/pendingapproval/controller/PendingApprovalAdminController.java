package com.ritma.runners.admin.pendingapproval.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.ritma.runners.admin.pendingapproval.dto.PendingApprovalResponse;
import com.ritma.runners.admin.pendingapproval.service.PendingApprovalAdminService;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;

@RestController
@RequestMapping("/api/admin/pending-approvals")
@CrossOrigin(origins = "http://localhost:5173")
public class PendingApprovalAdminController {

    private final PendingApprovalAdminService pendingApprovalAdminService;

    public PendingApprovalAdminController(PendingApprovalAdminService pendingApprovalAdminService) {
        this.pendingApprovalAdminService = pendingApprovalAdminService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PendingApprovalResponse> listPendingApprovals(@RequestParam(required = false) String search,
                                                              @RequestParam(defaultValue = "false") boolean olderThanThreeDays) {
        return pendingApprovalAdminService.listPendingApprovals(search, olderThanThreeDays);
    }

    @PostMapping("/{userId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void approvePendingApproval(@PathVariable UUID userId,
                                       @AuthenticationPrincipal JwtAuthenticatedUser user) {
        pendingApprovalAdminService.approvePendingApproval(userId, user);
    }

    @DeleteMapping("/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void rejectPendingApproval(@PathVariable UUID userId,
                                      @AuthenticationPrincipal JwtAuthenticatedUser user) {
        pendingApprovalAdminService.rejectPendingApproval(userId, user);
    }
}
