package com.ritma.runners.race.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RaceTableItemResponse(
        UUID id,
        int raceNumber,
        LocalDate raceDate,
        LocalTime raceTime,
        String raceStatus,
        String name,
        String location,
        UUID circuitId,
        String circuitName,
        UUID raceTypeId,
        String raceTypeName,
        Integer elevation,
        Integer officialTimeSeconds,
        Integer chipTimeSeconds,
        Integer pacePerKmSeconds
) {
}
