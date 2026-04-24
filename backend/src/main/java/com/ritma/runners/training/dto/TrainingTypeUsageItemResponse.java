package com.ritma.runners.training.dto;

import java.time.LocalDate;
import java.util.UUID;

public record TrainingTypeUsageItemResponse(
        UUID trainingId,
        String trainingName,
        LocalDate trainingDate
) {
}
