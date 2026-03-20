package com.ritma.runners.race.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateRaceTableItemRequest(
        LocalDate raceDate,
        String name,
        String location,
        UUID raceTypeId,
        Integer officialTimeSeconds,
        Integer chipTimeSeconds,
        Integer pacePerKmSeconds
) {
}
