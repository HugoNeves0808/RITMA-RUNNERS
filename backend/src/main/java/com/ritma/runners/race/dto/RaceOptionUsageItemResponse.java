package com.ritma.runners.race.dto;

import java.time.LocalDate;
import java.util.UUID;

public record RaceOptionUsageItemResponse(
        UUID raceId,
        String raceName,
        LocalDate raceDate,
        String contextLabel
) {
}
