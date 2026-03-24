package com.ritma.runners.race.dto;

import java.util.List;

public record RaceCreateOptionsResponse(
        List<RaceTypeOptionResponse> raceTypes,
        List<RaceTypeOptionResponse> teams,
        List<RaceTypeOptionResponse> circuits,
        List<RaceTypeOptionResponse> shoes
) {
}
