package com.ritma.runners.profile.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.ritma.runners.profile.dto.ProfileSummaryResponse;
import com.ritma.runners.profile.repository.ProfileRepository;

@Service
public class ProfileService {
    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    public ProfileSummaryResponse getSummary(UUID userId) {
        return new ProfileSummaryResponse(
                profileRepository.countTotalRaces(userId),
                profileRepository.countCompletedRaces(userId),
                profileRepository.findFavoriteRaceType(userId),
                profileRepository.countPodiums(userId),
                profileRepository.findRaceTypeSummaries(userId)
        );
    }
}
