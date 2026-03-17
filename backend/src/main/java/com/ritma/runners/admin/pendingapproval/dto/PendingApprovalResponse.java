package com.ritma.runners.admin.pendingapproval.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PendingApprovalResponse(
        UUID id,
        String email,
        String accountStatus,
        OffsetDateTime requestedAt
) {
}
