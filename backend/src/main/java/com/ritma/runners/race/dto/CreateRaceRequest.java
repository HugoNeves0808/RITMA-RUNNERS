package com.ritma.runners.race.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateRaceRequest(
        RaceData race,
        RaceResultData results,
        RaceAnalysisData analysis
) {
    public record RaceData(
            String raceStatus,
            LocalDate raceDate,
            LocalTime raceTime,
            String name,
            String location,
            UUID teamId,
            UUID circuitId,
            UUID raceTypeId,
            BigDecimal realKm,
            Integer elevation,
            Boolean isValidForCategoryRanking
    ) {
    }

    public record RaceResultData(
            Integer officialTimeSeconds,
            Integer chipTimeSeconds,
            Integer pacePerKmSeconds,
            UUID shoeId,
            Integer generalClassification,
            Integer ageGroupClassification,
            Integer teamClassification
    ) {
    }

    public record RaceAnalysisData(
            String preRaceConfidence,
            String raceDifficulty,
            String finalSatisfaction,
            String painInjuries,
            String analysisNotes,
            Boolean wouldRepeatThisRace
    ) {
    }
}
