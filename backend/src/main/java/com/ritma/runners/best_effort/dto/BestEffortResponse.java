package com.ritma.runners.best_effort.dto;

import java.util.List;

public record BestEffortResponse(
        List<BestEffortCategoryResponse> categories
) {
}
