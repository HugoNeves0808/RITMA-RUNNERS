package com.ritma.runners.race.dto;

import java.util.List;

public record RaceOptionUsageResponse(
        String optionType,
        int usageCount,
        List<RaceOptionUsageItemResponse> records
) {
}
