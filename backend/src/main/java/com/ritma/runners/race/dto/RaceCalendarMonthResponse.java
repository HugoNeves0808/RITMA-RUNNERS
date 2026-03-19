package com.ritma.runners.race.dto;

import java.util.List;

public record RaceCalendarMonthResponse(
        int year,
        int month,
        List<RaceCalendarDayResponse> days
) {
}
