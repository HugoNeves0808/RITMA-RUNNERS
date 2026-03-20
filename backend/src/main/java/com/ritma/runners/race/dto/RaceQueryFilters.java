package com.ritma.runners.race.dto;

import java.util.List;
import java.util.UUID;

public record RaceQueryFilters(
        String search,
        List<String> statuses,
        List<Integer> years,
        List<UUID> raceTypeIds
) {
    public RaceQueryFilters {
        statuses = statuses == null ? List.of() : List.copyOf(statuses);
        years = years == null ? List.of() : List.copyOf(years);
        raceTypeIds = raceTypeIds == null ? List.of() : List.copyOf(raceTypeIds);
    }

    public static RaceQueryFilters empty() {
        return new RaceQueryFilters(null, List.of(), List.of(), List.of());
    }
}
