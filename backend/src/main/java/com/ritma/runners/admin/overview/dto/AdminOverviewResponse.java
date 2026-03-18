package com.ritma.runners.admin.overview.dto;

public record AdminOverviewResponse(
        long totalUsers,
        long totalAdmins,
        long totalNonAdmins,
        long dailyWebsiteAccesses,
        long activeUsersToday,
        double weeklyAverageWebsiteAccesses,
        long newRegistrationsLast7Days
) {
}
