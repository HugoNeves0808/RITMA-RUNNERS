package com.ritma.runners.race.dto;

import java.util.List;

public record RaceTableYearResponse(
        int year,
        List<RaceTableItemResponse> races
) {
}
