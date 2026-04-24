package com.ritma.runners.training.dto;

import java.util.List;

public record TrainingTypeUsageResponse(
        int usageCount,
        List<TrainingTypeUsageItemResponse> records
) {
}
