package com.ritma.runners.training.dto;

import java.util.UUID;

public record TrainingTypeOptionResponse(
        UUID id,
        String name,
        boolean archived
) {
}
