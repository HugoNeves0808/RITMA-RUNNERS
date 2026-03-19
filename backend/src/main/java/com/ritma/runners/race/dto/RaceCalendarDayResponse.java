package com.ritma.runners.race.dto;

import java.time.LocalDate;
import java.util.List;

public record RaceCalendarDayResponse(
        LocalDate date,
        List<RaceCalendarItemResponse> races
) {
}
