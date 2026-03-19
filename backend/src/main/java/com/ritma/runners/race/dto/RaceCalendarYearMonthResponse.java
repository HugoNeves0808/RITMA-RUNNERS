package com.ritma.runners.race.dto;

import java.util.List;

public record RaceCalendarYearMonthResponse(
        int month,
        List<RaceCalendarDayResponse> days
) {
}
