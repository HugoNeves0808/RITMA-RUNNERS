package com.ritma.runners.race.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RaceDetailResponse(
        UUID id,
        RaceData race,
        RaceResults results,
        RaceAnalysis analysis
) {
    public record RaceData(
            String raceStatus,
            LocalDate raceDate,
            LocalTime raceTime,
            String name,
            String location,
            UUID teamId,
            String teamName,
            UUID circuitId,
            String circuitName,
            UUID raceTypeId,
            String raceTypeName,
            BigDecimal realKm,
            Integer elevation,
            Boolean isValidForCategoryRanking
    ) {
    }

    public record RaceResults(
            Integer officialTimeSeconds,
            Integer chipTimeSeconds,
            Integer pacePerKmSeconds,
            UUID shoeId,
            String shoeName,
            Integer generalClassification,
            Integer ageGroupClassification,
            Integer teamClassification
    ) {
    }

    public record RaceAnalysis(
            String preRaceConfidence,
            String raceDifficulty,
            String finalSatisfaction,
            String painInjuries,
            String analysisNotes
    ) {
    }
}
