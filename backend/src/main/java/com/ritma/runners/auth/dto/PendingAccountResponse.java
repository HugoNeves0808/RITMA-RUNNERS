package com.ritma.runners.auth.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PendingAccountResponse(
        UUID id,
        String email,
        String accountStatus,
        OffsetDateTime createdAt
) {
}
