package com.ritma.runners.admin.userlist.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminUserListItemResponse(
        UUID id,
        String email,
        String role,
        OffsetDateTime lastLoginAt
) {
}
