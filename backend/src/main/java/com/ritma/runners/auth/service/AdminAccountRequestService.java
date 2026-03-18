package com.ritma.runners.auth.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ritma.runners.admin.pendingapproval.dto.PendingApprovalResponse;
import com.ritma.runners.admin.pendingapproval.service.PendingApprovalAdminService;
import com.ritma.runners.auth.dto.JwtAuthenticatedUser;
import com.ritma.runners.auth.dto.PendingAccountResponse;

@Service
public class AdminAccountRequestService {

    private final PendingApprovalAdminService pendingApprovalAdminService;

    public AdminAccountRequestService(PendingApprovalAdminService pendingApprovalAdminService) {
        this.pendingApprovalAdminService = pendingApprovalAdminService;
    }

    public List<PendingAccountResponse> listPendingAccounts(String search, boolean olderThanThreeDays) {
        return pendingApprovalAdminService.listPendingApprovals(search, olderThanThreeDays).stream()
                .map(this::toPendingAccountResponse)
                .toList();
    }

    public void approveAccount(UUID userId, JwtAuthenticatedUser user) {
        pendingApprovalAdminService.approvePendingApproval(userId, user);
    }

    public void rejectAccount(UUID userId, JwtAuthenticatedUser user) {
        pendingApprovalAdminService.rejectPendingApproval(userId, user);
    }

    private PendingAccountResponse toPendingAccountResponse(PendingApprovalResponse approval) {
        return new PendingAccountResponse(
                approval.id(),
                approval.email(),
                approval.accountStatus(),
                approval.requestedAt()
        );
    }
}
