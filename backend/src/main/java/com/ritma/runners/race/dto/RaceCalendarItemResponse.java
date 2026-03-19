package com.ritma.runners.race.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record RaceCalendarItemResponse(
        UUID id,
        String name,
        String raceTypeName,
        String raceStatus,
        LocalDate raceDate,
        LocalTime raceTime,
        BigDecimal realKm,
        Integer elevation,
        boolean archived,
        boolean isValidForCategoryRanking
) {
}
