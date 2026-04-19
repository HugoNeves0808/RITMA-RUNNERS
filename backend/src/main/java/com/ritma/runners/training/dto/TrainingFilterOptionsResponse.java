package com.ritma.runners.training.dto;

import java.util.List;

public record TrainingFilterOptionsResponse(
        List<TrainingTypeOptionResponse> trainingTypes
) {
}
