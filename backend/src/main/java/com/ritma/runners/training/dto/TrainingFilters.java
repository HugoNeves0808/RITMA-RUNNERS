package com.ritma.runners.training.dto;

import java.util.List;
import java.util.UUID;

public record TrainingFilters(
        String search,
        List<String> statuses,
        List<UUID> trainingTypeIds,
        List<String> associations
) {
    public static TrainingFilters empty() {
        return new TrainingFilters(null, List.of(), List.of(), List.of());
    }
}
