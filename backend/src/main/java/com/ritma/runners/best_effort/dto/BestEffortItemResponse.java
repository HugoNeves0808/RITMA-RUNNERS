package com.ritma.runners.best_effort.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BestEffortItemResponse(
        UUID raceId,
        String raceName,
        LocalDate raceDate,
        String raceTypeName,
        BigDecimal realKm,
        Integer chipTimeSeconds,
        Integer officialTimeSeconds,
        Integer pacePerKmSeconds,
        Integer generalClassification,
        Boolean isGeneralClassificationPodium,
        Integer ageGroupClassification,
        Boolean isAgeGroupClassificationPodium,
        Integer teamClassification,
        Boolean isTeamClassificationPodium,
        boolean validForBestEffortRanking,
        String rankingNote,
        boolean classificationPodium,
        boolean classificationGoodPosition,
        int overallRank
) {
}
