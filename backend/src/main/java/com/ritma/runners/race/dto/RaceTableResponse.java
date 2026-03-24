package com.ritma.runners.race.dto;

import java.util.List;

public record RaceTableResponse(
        List<RaceTableYearResponse> years,
        List<RaceTableItemResponse> undatedRaces
) {
}
