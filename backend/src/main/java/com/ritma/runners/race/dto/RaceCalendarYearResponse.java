package com.ritma.runners.race.dto;

import java.util.List;

public record RaceCalendarYearResponse(
        int year,
        List<RaceCalendarYearMonthResponse> months
) {
}
