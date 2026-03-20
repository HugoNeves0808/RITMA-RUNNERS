package com.ritma.runners.race.dto;

import java.util.List;

public record RaceFilterOptionsResponse(
        List<Integer> years,
        List<RaceTypeOptionResponse> raceTypes
) {
}
