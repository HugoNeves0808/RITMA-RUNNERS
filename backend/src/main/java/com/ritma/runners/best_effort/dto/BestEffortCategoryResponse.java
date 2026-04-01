package com.ritma.runners.best_effort.dto;

import java.math.BigDecimal;
import java.util.List;

public record BestEffortCategoryResponse(
        String categoryKey,
        String categoryName,
        BigDecimal expectedDistanceKm,
        int validEffortCount,
        int totalEffortCount,
        List<BestEffortItemResponse> efforts
) {
}
