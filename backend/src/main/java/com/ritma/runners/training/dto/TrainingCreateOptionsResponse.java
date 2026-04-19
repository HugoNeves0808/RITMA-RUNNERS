package com.ritma.runners.training.dto;

import java.util.List;

public record TrainingCreateOptionsResponse(
        List<TrainingTypeOptionResponse> trainingTypes,
        List<AssociatedRaceOptionResponse> races
) {
}
