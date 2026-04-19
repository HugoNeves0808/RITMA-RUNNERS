package com.ritma.runners.training.dto;

import java.util.List;

public record TrainingTableResponse(
        List<TrainingTableItemResponse> trainings
) {
}
