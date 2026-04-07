package com.ritma.runners.admin.pendingapproval.dto;

public record ApprovePendingApprovalResponse(
        String email,
        String temporaryPassword
) {
}
