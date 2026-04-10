package com.ritma.runners.profile.dto;

import java.util.List;

public record ProfileSummaryResponse(
        int totalRaces,
        int completedRaces,
        String favoriteRaceType,
        int podiums,
        List<RaceTypeSummary> topRaceTypes
) {
    public record RaceTypeSummary(
            String raceTypeName,
            int raceCount,
            int bestEffortsTracked
    ) {
    }
}
