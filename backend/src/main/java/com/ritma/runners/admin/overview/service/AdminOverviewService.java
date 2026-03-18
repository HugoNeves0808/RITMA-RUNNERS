package com.ritma.runners.admin.overview.service;

import org.springframework.stereotype.Service;

import com.ritma.runners.admin.overview.dto.AdminOverviewResponse;
import com.ritma.runners.auth.repository.AppUserRepository;

@Service
public class AdminOverviewService {

    private static final String PLATFORM_WEB = "WEB";

    private final AppUserRepository appUserRepository;

    public AdminOverviewService(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    public AdminOverviewResponse getOverview() {
        long activeUsersToday = appUserRepository.countDistinctDailyAccesses(PLATFORM_WEB);

        return new AdminOverviewResponse(
                appUserRepository.countActiveUsers(),
                appUserRepository.countActiveAdmins(),
                appUserRepository.countActiveNonAdmins(),
                activeUsersToday,
                activeUsersToday,
                appUserRepository.averageDistinctDailyAccesses(PLATFORM_WEB, 7),
                appUserRepository.countNewRegistrationsLastDays(7)
        );
    }
}
